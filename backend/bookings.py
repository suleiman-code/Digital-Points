from fastapi import APIRouter, HTTPException, status, BackgroundTasks, Depends, Request
from bson import ObjectId
from models import BookingCreate, BookingResponse
from database import db
from config import settings
from auth import get_admin_user
from rate_limit import limiter
import resend
from datetime import datetime, timezone
from typing import List
import logging
import re

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/bookings", tags=["Inquiries"])

# Set Resend API key if available
if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def _safe_text(value, fallback: str) -> str:
    text = str(value).strip() if value is not None else ""
    return text or fallback

def _safe_email(value) -> str:
    text = _safe_text(value, "unknown@example.com")
    return text if EMAIL_RE.match(text) else "unknown@example.com"

def _safe_status(value) -> str:
    text = _safe_text(value, "pending").lower()
    return text if text in {"pending", "contacted", "completed", "cancelled"} else "pending"

def _ensure_min_len(value: str, minimum: int, fallback: str) -> str:
    text = value.strip()
    return text if len(text) >= minimum else fallback

def _safe_created_at(value):
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return datetime.now(timezone.utc)
    return datetime.now(timezone.utc)

def _safe_optional_datetime(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None

def normalize_booking_document(booking_doc: dict) -> dict:
    """Backfill legacy booking fields so admin endpoints stay stable for old records."""
    if not booking_doc:
        return booking_doc

    booking_doc["service_id"] = _ensure_min_len(_safe_text(booking_doc.get("service_id"), "legacy-service")[:64], 1, "legacy-service")
    booking_doc["service_name"] = _ensure_min_len(_safe_text(booking_doc.get("service_name"), "Unknown Service")[:160], 2, "Unknown Service")
    booking_doc["user_name"] = _ensure_min_len(_safe_text(booking_doc.get("user_name"), "Unknown User")[:120], 2, "Unknown User")
    booking_doc["user_email"] = _safe_email(booking_doc.get("user_email"))
    booking_doc["user_phone"] = _ensure_min_len(_safe_text(booking_doc.get("user_phone"), "0000000")[:30], 7, "0000000")
    booking_doc["user_city"] = _ensure_min_len(_safe_text(booking_doc.get("user_city"), "Unknown")[:120], 1, "Unknown")
    booking_doc["user_postal_code"] = _ensure_min_len(_safe_text(booking_doc.get("user_postal_code"), "00000")[:20], 2, "00000")
    booking_doc["message"] = _ensure_min_len(_safe_text(booking_doc.get("message"), "No message provided")[:3000], 10, "No message provided")
    booking_doc["status"] = _safe_status(booking_doc.get("status"))
    booking_doc["created_at"] = _safe_created_at(booking_doc.get("created_at"))
    booking_doc["booking_date"] = _safe_optional_datetime(booking_doc.get("booking_date"))

    return booking_doc

def send_listing_owner_inquiry_email(booking_data: dict, recipient_email: str):
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return
    
    try:
        email_body = f"""Hello,

A client has sent an inquiry regarding a listing on Digital Point:
-------------------------------------------------------------
BUSINESS/SERVICE: {booking_data['service_name']}
CLIENT NAME: {booking_data['user_name']}
CLIENT EMAIL: {booking_data['user_email']}
CLIENT PHONE: {booking_data['user_phone']}
CLIENT POSTAL CODE: {booking_data.get('user_postal_code', 'N/A')}
-------------------------------------------------------------

MESSAGE BODY:
{booking_data['message']}

Note: You can reply directly to this email to contact the client."""
        
        email_params = {
            "from": f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>",
            "to": [recipient_email],
            "reply_to": booking_data['user_email'],
            "subject": f"NEW INQUIRY: {booking_data['user_name']} is interested in '{booking_data['service_name']}'",
            "text": email_body,
        }
        
        response = resend.Emails.send(email_params)
        logger.info(f"Booking inquiry email sent to {recipient_email}. Response: {response}")
    except Exception as e:
        logger.error(f"Failed to send listing inquiry email: {e}", exc_info=True)

# 1. POST /api/bookings (Public - User submits a booking/inquiry)
@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_BOOKING)
async def create_booking(request: Request, booking: BookingCreate, background_tasks: BackgroundTasks):
    if not ObjectId.is_valid(booking.service_id):
        raise HTTPException(status_code=400, detail="Invalid Service ID")

    service_doc = await db.db["services"].find_one({"_id": ObjectId(booking.service_id)})
    if not service_doc:
        raise HTTPException(status_code=404, detail="Service not found")

    recipient_email = service_doc.get("contact_email") or settings.ADMIN_CONTACT_EMAIL
    if not recipient_email:
        raise HTTPException(
            status_code=400,
            detail="No recipient email found for this inquiry. Please contact support."
        )

    booking_dict = booking.model_dump()
    booking_dict["created_at"] = datetime.now(timezone.utc)
    booking_dict["status"] = "pending"
    
    new_booking = await db.db["bookings"].insert_one(booking_dict)
    created_booking = await db.db["bookings"].find_one({"_id": new_booking.inserted_id})
    
    # Send email in background so user doesn't wait
    background_tasks.add_task(send_listing_owner_inquiry_email, booking_dict, recipient_email)
    
    return normalize_booking_document(created_booking)

# 2. GET /api/bookings (Admin Only)
@router.get("/", response_model=List[BookingResponse])
async def get_all_bookings(admin: dict = Depends(get_admin_user)):
    bookings = await db.db["bookings"].find().to_list(100)
    bookings = [normalize_booking_document(item) for item in bookings]
    return bookings

# 3. PUT /api/bookings/{id}/status (Admin Only)
@router.put("/{id}/status", response_model=BookingResponse)
async def update_booking_status(id: str, new_status: str, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Booking ID")
    
    valid_statuses = ["pending", "contacted", "completed", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {valid_statuses}")

    result = await db.db["bookings"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": new_status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    updated_booking = await db.db["bookings"].find_one({"_id": ObjectId(id)})
    return normalize_booking_document(updated_booking)

# 4. DELETE /api/bookings/{id} (Admin Only)
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_booking(id: str, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Booking ID")
    
    result = await db.db["bookings"].delete_one({"_id": ObjectId(id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return None
