from fastapi import APIRouter, HTTPException, status, BackgroundTasks, Depends
from bson import ObjectId
from models import BookingCreate, BookingResponse
from database import db
from config import settings
from auth import get_admin_user
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from datetime import datetime, timezone
from typing import List

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

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

async def send_notification_email(booking_data: dict):
    message = MessageSchema(
        subject="New Business Booking Received!",
        recipients=[settings.MAIL_FROM], # Send to Admin
        body=f"""
        Hello Admin,
        
        A new booking inquiry has been received:
        - Customer Name: {booking_data['user_name']}
        - Email: {booking_data['user_email']}
        - Phone: {booking_data['user_phone']}
        - Service: {booking_data['service_name']}
        - Message: {booking_data['message']}
        
        Please log into the dashboard to review.
        """,
        subtype=MessageType.plain
    )
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        print(f"Failed to send email: {e}")

# 1. POST /api/bookings (Public - User submits a booking/inquiry)
@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(booking: BookingCreate, background_tasks: BackgroundTasks):
    booking_dict = booking.model_dump()
    booking_dict["created_at"] = datetime.now(timezone.utc)
    booking_dict["status"] = "pending"
    
    new_booking = await db.db["bookings"].insert_one(booking_dict)
    created_booking = await db.db["bookings"].find_one({"_id": new_booking.inserted_id})
    
    # Send email in background so user doesn't wait
    background_tasks.add_task(send_notification_email, booking_dict)
    
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
