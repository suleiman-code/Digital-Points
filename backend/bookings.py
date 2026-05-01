from fastapi import APIRouter, HTTPException, status, BackgroundTasks, Depends, Request
from pydantic import BaseModel, Field
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

    if "_id" in booking_doc:
        booking_doc["_id"] = str(booking_doc["_id"])
        booking_doc["id"] = booking_doc["_id"]

    booking_doc["service_id"] = _ensure_min_len(_safe_text(booking_doc.get("service_id"), "legacy-service")[:64], 1, "legacy-service")
    booking_doc["service_name"] = _ensure_min_len(_safe_text(booking_doc.get("service_name"), "Unknown Service")[:160], 2, "Unknown Service")
    booking_doc["user_name"] = _ensure_min_len(_safe_text(booking_doc.get("user_name"), "Unknown User")[:120], 2, "Unknown User")
    booking_doc["user_email"] = _safe_email(booking_doc.get("user_email"))
    booking_doc["user_phone"] = _ensure_min_len(_safe_text(booking_doc.get("user_phone"), "0000000")[:30], 7, "0000000")
    booking_doc["user_city"] = _ensure_min_len(_safe_text(booking_doc.get("user_city"), "Unknown")[:120], 1, "Unknown")
    # BUG #15 FIX: don't backfill optional postal code with fake "00000" — keep None/empty
    raw_postal = _safe_text(booking_doc.get("user_postal_code"), "").strip()
    booking_doc["user_postal_code"] = raw_postal[:20] if raw_postal else None
    booking_doc["message"] = _ensure_min_len(_safe_text(booking_doc.get("message"), "No message provided")[:3000], 1, "No message provided")
    booking_doc["status"] = _safe_status(booking_doc.get("status"))
    booking_doc["created_at"] = _safe_created_at(booking_doc.get("created_at"))
    booking_doc["booking_date"] = _safe_optional_datetime(booking_doc.get("booking_date"))

    return booking_doc

async def get_admin_notification_email():
    """Find the best email address for admin notifications"""
    if settings.ADMIN_CONTACT_EMAIL:
        return settings.ADMIN_CONTACT_EMAIL
    try:
        admin_user = await db.db["users"].find_one({"is_admin": True})
        if admin_user and admin_user.get("email"):
            return admin_user["email"]
    except:
        pass
    return settings.MAIL_FROM or "noreply@digitalpoints.com"

async def send_listing_owner_inquiry_email(booking_data: dict, recipient_email: str):
    try:
        html_body = f"""
        <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;">
                <div style="background-color: #1e40af; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">New Inquiry Received</h1>
                </div>
                <div style="padding: 30px;">
                    <p style="font-size: 16px; color: #374151;">Hello,</p>
                    <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">A new lead is interested in: <strong>{booking_data['service_name']}</strong></p>
                    
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                        <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; color: #1e40af; text-transform: uppercase;">Customer Info</p>
                        <table style="width: 100%; font-size: 14px; color: #1e293b; border-collapse: collapse;">
                            <tr><td style="padding: 4px 0;"><strong>Name:</strong></td><td>{booking_data['user_name']}</td></tr>
                            <tr><td style="padding: 4px 0;"><strong>Email:</strong></td><td>{booking_data['user_email']}</td></tr>
                            <tr><td style="padding: 4px 0;"><strong>Phone:</strong></td><td>{booking_data['user_phone']}</td></tr>
                        </table>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; color: #1e40af; text-transform: uppercase;">Client Message</p>
                        <div style="font-size: 14px; color: #334155; line-height: 1.6; background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #f1f5f9;">
                            {booking_data['message']}
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="mailto:{booking_data['user_email']}" style="background-color: #1e40af; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 13px; display: inline-block;">REPLY DIRECTLY TO CLIENT</a>
                    </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 15px; text-align: center;">
                    <p style="font-size: 11px; color: #64748b; margin: 0;">&copy; {datetime.now().year} Digital Points Platform Notification</p>
                </div>
            </div>
        </div>
        """
        
        text_body = f"New inquiry for {booking_data['service_name']}\nFrom: {booking_data['user_name']} ({booking_data['user_email']})"

        await send_email(
            to=[recipient_email],
            subject=f"LEAD NOTIFICATION: Inquiry for '{booking_data['service_name']}'",
            html_content=html_body,
            text_content=text_body,
            reply_to=booking_data['user_email']
        )
    except Exception as e:
        logger.error(f"Failed to trigger listing inquiry email: {e}", exc_info=True)

# 1. POST /api/bookings (Public - User submits a booking/inquiry)
@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_BOOKING)
async def create_booking(request: Request, booking: BookingCreate, background_tasks: BackgroundTasks):
    try:
        service_id_obj = ObjectId(booking.service_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Service ID format")

    service_doc = await db.db["services"].find_one({"_id": service_id_obj})
    if not service_doc:
        raise HTTPException(status_code=404, detail="Service not found")

    booking_dict = booking.model_dump()
    booking_dict["created_at"] = datetime.now(timezone.utc)
    booking_dict["status"] = "received"
    booking_dict["viewed"] = False

    # Save to database first
    new_booking = await db.db["bookings"].insert_one(booking_dict)
    created_booking = await db.db["bookings"].find_one({"_id": new_booking.inserted_id})

    # --- NOTIFICATION LOGIC ---
    # Step 1: Get admin email for oversight copy
    admin_email = await get_admin_notification_email()

    # Step 2: Get the business owner email directly from this listing
    owner_email = (
        service_doc.get("contact_email")
        or service_doc.get("email")
    )

    # Step 2b: If still empty, try looking up via owner_id in users collection
    if not owner_email and service_doc.get("owner_id"):
        try:
            owner_user = await db.db["users"].find_one({"_id": ObjectId(str(service_doc["owner_id"]))})
            if owner_user:
                owner_email = owner_user.get("email")
        except Exception:
            pass

    # --- TERMINAL DEBUG LOG (check your uvicorn console) ---
    logger.info(f"[INQUIRY] Service='{service_doc.get('title')}' | owner_email={owner_email!r} | admin_email={admin_email!r}")
    print(f"\n>>> [INQUIRY EMAIL] owner={owner_email!r}  admin={admin_email!r}  listing='{service_doc.get('title')}'\n")

    # Send primary email directly to the listing owner
    if owner_email:
        background_tasks.add_task(send_listing_owner_inquiry_email, booking_dict, owner_email)
    else:
        logger.warning(f"[INQUIRY] No owner email found for service '{service_doc.get('title')}' — only admin will be notified.")

    # Always send admin a copy (unless owner and admin are the same person)
    if admin_email and admin_email != owner_email:
        background_tasks.add_task(send_listing_owner_inquiry_email, booking_dict, admin_email)

    return normalize_booking_document(created_booking)

# 2. GET /api/bookings (Admin Only)
@router.get("", response_model=List[BookingResponse])
async def get_all_bookings(
    status: Optional[str] = None,
    days: Optional[int] = None,
    admin: dict = Depends(get_admin_user)
):
    query = {}
    if status:
        query["status"] = status.lower()
        
    if days is not None and days > 0:
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=days)
        query["created_at"] = {"$gte": start_date}

    bookings = await db.db["bookings"].find(query).sort("created_at", -1).to_list(1000)
    bookings = [normalize_booking_document(item) for item in bookings]
    return bookings

# BUG #7 FIX: accept reply message in request body (not query param) to prevent
# URL logging exposure and XSS injection into email HTML.
class ReplyRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)

# 6. POST /api/bookings/{id}/reply (Admin Only)
@router.post("/{id}/reply")
async def send_reply(id: str, body: ReplyRequest, admin: dict = Depends(get_admin_user)):
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
            html_content=f"<div style='font-family:sans-serif;white-space:pre-wrap;'>{body.message}</div>",
            text_content=body.message
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
