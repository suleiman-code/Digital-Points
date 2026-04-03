from fastapi import APIRouter, status, BackgroundTasks, Depends
from pydantic import BaseModel, EmailStr
from database import db
from config import settings
from fastapi_mail import FastMail, MessageSchema, MessageType, ConnectionConfig
from datetime import datetime, timezone
from auth import get_admin_user
from typing import List

router = APIRouter(prefix="/api/contact", tags=["Contact"])

# Mail config
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

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

async def send_admin_contact_email(form_data: dict):
    admin_recipient = settings.MAIL_FROM or settings.MAIL_USERNAME

    message = MessageSchema(
        subject=f"URGENT: New Inquiry from {form_data['name']} - Digital Point",
        recipients=[admin_recipient],
        reply_to=[form_data['email']],
        body=f"""
        Hello Admin,
        
        A user has sent an inquiry through the Digital Point Contact Form:
        -------------------------------------------------------------
        CLIENT NAME: {form_data['name']}
        CLIENT EMAIL: {form_data['email']}
        SUBJECT: {form_data['subject']}
        
        MESSAGE BODY:
        {form_data['message']}
        -------------------------------------------------------------
        
        (Pro Tip: You can just click 'Reply' to respond directly to this client).
        """,
        subtype=MessageType.plain
    )
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        print(f"Failed to send contact email: {e}")

@router.get("/", response_model=List[dict])
async def get_all_inquiries(admin: dict = Depends(get_admin_user)):
    messages = await db.db["contact_messages"].find().sort("created_at", -1).to_list(1000)
    # Convert ObjectId to string for JSON
    for msg in messages:
        msg["_id"] = str(msg["_id"])
    return messages

@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_contact_form(form: ContactForm, background_tasks: BackgroundTasks):
    form_dict = form.model_dump()
    form_dict["created_at"] = datetime.now(timezone.utc)
    
    # Save to 'contact_messages' collection in MongoDB
    await db.db["contact_messages"].insert_one(form_dict)
    
    # Send email in background
    background_tasks.add_task(send_admin_contact_email, form_dict)
    
    return {"message": "Contact message sent successfully to Admin"}
