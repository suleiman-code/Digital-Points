from fastapi import APIRouter, HTTPException, status, BackgroundTasks, Depends, Request
from bson import ObjectId
from models import BookingCreate, BookingResponse
from database import db
from config import settings
from auth import get_admin_user
from rate_limit import limiter
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from datetime import datetime, timezone
from typing import List

router = APIRouter(prefix="/api/bookings", tags=["Inquiries"])

# Mail Configuration
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_PORT == 587,
    MAIL_SSL_TLS=settings.MAIL_PORT == 465,
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
    VALIDATE_CERTS=settings.VALIDATE_CERTS
)

async def send_listing_owner_inquiry_email(booking_data: dict, recipient_email: str):
    message = MessageSchema(
        subject=f"NEW INQUIRY: {booking_data['user_name']} is interested in '{booking_data['service_name']}'",
        recipients=[recipient_email],
        reply_to=[booking_data['user_email']],
        body=f"""
        Hello,
        
        A client has sent an inquiry regarding a listing on Digital Point:
        -------------------------------------------------------------
        BUSINESS/SERVICE: {booking_data['service_name']}
        CLIENT NAME: {booking_data['user_name']}
        CLIENT EMAIL: {booking_data['user_email']}
        CLIENT PHONE: {booking_data['user_phone']}
        -------------------------------------------------------------
        
        MESSAGE BODY:
        {booking_data['message']}
        
        Note: You can reply directly to this email to contact the client.
        """,
        subtype=MessageType.plain
    )
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        print(f"Failed to send listing inquiry email: {e}")

# 1. POST /api/bookings (Public - User submits a booking/inquiry)
@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_BOOKING)
async def create_booking(request: Request, booking: BookingCreate, background_tasks: BackgroundTasks):
    if not ObjectId.is_valid(booking.service_id):
        raise HTTPException(status_code=400, detail="Invalid Service ID")

    service_doc = await db.db["services"].find_one({"_id": ObjectId(booking.service_id)})
    if not service_doc:
        raise HTTPException(status_code=404, detail="Service not found")

    recipient_email = service_doc.get("contact_email")
    if not recipient_email:
        raise HTTPException(
            status_code=400,
            detail="Listing owner email is missing. Please update service contact email first."
        )

    booking_dict = booking.model_dump()
    booking_dict["created_at"] = datetime.now(timezone.utc)
    booking_dict["status"] = "pending"
    
    new_booking = await db.db["bookings"].insert_one(booking_dict)
    created_booking = await db.db["bookings"].find_one({"_id": new_booking.inserted_id})
    
    # Send email in background so user doesn't wait
    background_tasks.add_task(send_listing_owner_inquiry_email, booking_dict, recipient_email)
    
    return created_booking

# 2. GET /api/bookings (Admin Only)
@router.get("/", response_model=List[BookingResponse])
async def get_all_bookings(admin: dict = Depends(get_admin_user)):
    bookings = await db.db["bookings"].find().to_list(100)
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
    return updated_booking

# 4. DELETE /api/bookings/{id} (Admin Only)
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_booking(id: str, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Booking ID")
    
    result = await db.db["bookings"].delete_one({"_id": ObjectId(id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return None
