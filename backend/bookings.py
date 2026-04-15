from fastapi import APIRouter, HTTPException, status, BackgroundTasks, Depends, Request
from bson import ObjectId
from models import BookingCreate, BookingResponse
from database import db
from config import settings
from auth import get_admin_user
from rate_limit import limiter
from mail_utils import send_email
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import logging
import re

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/bookings", tags=["Inquiries"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def _safe_text(value, fallback: str) -> str:
    text = str(value).strip() if value is not None else ""
    return text or fallback

def _safe_email(value) -> str:
    text = _safe_text(value, "unknown@example.com")
    return text if EMAIL_RE.match(text) else "unknown@example.com"

def _safe_status(value) -> str:
    text = _safe_text(value, "received").lower()
    return text if text in {"received", "contacted", "completed", "cancelled"} else "received"

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
    booking_doc["message"] = _ensure_min_len(_safe_text(booking_doc.get("message"), "No message provided")[:3000], 1, "No message provided")
    booking_doc["status"] = _safe_status(booking_doc.get("status"))
    booking_doc["created_at"] = _safe_created_at(booking_doc.get("created_at"))
    booking_doc["booking_date"] = _safe_optional_datetime(booking_doc.get("booking_date"))

    return booking_doc

async def send_listing_owner_inquiry_email(booking_data: dict, recipient_email: str):
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
        
        await send_email(
            to=[recipient_email],
            subject=f"NEW INQUIRY: {booking_data['user_name']} is interested in '{booking_data['service_name']}'",
            html_content=f"<div style='font-family:sans-serif;white-space:pre-wrap;'>{email_body}</div>",
            text_content=email_body,
            reply_to=booking_data['user_email']
        )
    except Exception as e:
        logger.error(f"Failed to trigger listing inquiry email: {e}", exc_info=True)

# 1. POST /api/bookings (Public - User submits a booking/inquiry)
@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(request: Request, booking: BookingCreate, background_tasks: BackgroundTasks):
    try:
        service_id_obj = ObjectId(booking.service_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Service ID format")

    service_doc = await db.db["services"].find_one({"_id": service_id_obj})
    if not service_doc:
        raise HTTPException(status_code=404, detail="Service not found")

    business_email = service_doc.get("contact_email") or service_doc.get("email")
    admin_email = settings.ADMIN_CONTACT_EMAIL
    
    booking_dict = booking.model_dump()
    booking_dict["created_at"] = datetime.now(timezone.utc)
    booking_dict["status"] = "received"
    
    # Save to history first
    new_booking = await db.db["bookings"].insert_one(booking_dict)
    created_booking = await db.db["bookings"].find_one({"_id": new_booking.inserted_id})
    
    # DETERMINE RECIPIENT
    # 1. Primary: The Business Owner of this listing
    # 2. Fallback: Site Admin
    target_recipient = business_email if business_email else admin_email

    if target_recipient:
        # Send the inquiry email to the target recipient (Business Owner OR Admin fallback)
        background_tasks.add_task(send_listing_owner_inquiry_email, booking_dict, target_recipient)
    
    # NOTE: Inquiries are always saved to the DB so Admin can view them in the Admin Panel
    # but we no longer send a duplicate 'Platform Notification' email to Admin 
    # to avoid cluttering their inbox when a business owner receives it directly.

    return normalize_booking_document(created_booking)

# 2. GET /api/bookings (Admin Only)
@router.get("/", response_model=List[BookingResponse])
async def get_all_bookings(
    status: Optional[str] = None,
    days: Optional[int] = None,
    admin: dict = Depends(get_admin_user)
):
    query = {}
    if status:
        query["status"] = status.lower()
        
    if days and days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        # Use $or to support both BSON Date objects and ISO strings from legacy data
        query["$or"] = [
            {"created_at": {"$gte": cutoff}},
            {"created_at": {"$gte": cutoff.isoformat().replace("+00:00", "Z")}}
        ]

    bookings = await db.db["bookings"].find(query).sort("created_at", -1).to_list(1000)
    bookings = [normalize_booking_document(item) for item in bookings]
    return bookings

# 6. POST /api/bookings/{id}/reply (Admin Only)
@router.post("/{id}/reply")
async def send_reply(id: str, reply_msg: str, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Booking ID")
    
    booking = await db.db["bookings"].find_one({"_id": ObjectId(id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    client_email = booking.get("user_email")
    if not client_email:
        raise HTTPException(status_code=400, detail="Client email address not found")

    subject = f"Re: Inquiry for {booking.get('service_name', 'Digital Points')}"
    
    try:
        await send_email(
            to=[client_email],
            subject=subject,
            html_content=f"<div style='font-family:sans-serif;white-space:pre-wrap;'>{reply_msg}</div>",
            text_content=reply_msg
        )
        
        # Mark as contacted/read
        await db.db["bookings"].update_one(
            {"_id": ObjectId(id)},
            {"$set": {"status": "contacted", "viewed": True, "replied_at": datetime.now(timezone.utc)}}
        )
        
        return {"message": "Reply sent successfully"}
    except Exception as e:
        logger.error(f"Failed to send reply email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email reply")

# 3. PUT /api/bookings/{id}/status (Admin Only)
@router.put("/{id}/status", response_model=BookingResponse)
async def update_booking_status(id: str, new_status: str, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Booking ID")
    
    valid_statuses = ["received", "contacted", "completed", "cancelled"]
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

# 5. MARK BOOKING AS VIEWED (Admin Only)
@router.put("/{id}/view", status_code=status.HTTP_200_OK)
async def mark_booking_viewed(id: str, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Booking ID")
    
    await db.db["bookings"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"viewed": True}}
    )
    return {"message": "Booking marked as viewed"}
