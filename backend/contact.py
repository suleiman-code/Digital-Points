from fastapi import APIRouter, status, BackgroundTasks, Depends, Request
from pydantic import BaseModel, EmailStr
from database import db
from config import settings
from rate_limit import limiter
import resend
from datetime import datetime, timezone
from auth import get_admin_user
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/contact", tags=["Contact"])

# Set Resend API key if available
if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

def send_admin_contact_email(form_data: dict):
    """Send contact form submission to admin using Resend"""
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return
    
    try:
        admin_recipient = settings.ADMIN_CONTACT_EMAIL or settings.MAIL_FROM or "noreply@digitalpoints.com"
        
        email_body = f"""
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
"""
        
        email_params = {
            "from": f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>",
            "to": [admin_recipient],
            "reply_to": form_data['email'],
            "subject": f"URGENT: New Inquiry from {form_data['name']} - Digital Points",
            "text": email_body,
        }
        
        response = resend.Emails.send(email_params)
        logger.info(f"Contact email sent successfully. Response: {response}")
        
    except Exception as e:
        logger.error(f"Failed to send contact email: {e}", exc_info=True)

@router.get("/", response_model=List[dict])
async def get_all_inquiries(admin: dict = Depends(get_admin_user)):
    messages = await db.db["contact_messages"].find().sort("created_at", -1).to_list(1000)
    # Convert ObjectId to string for JSON
    for msg in messages:
        msg["_id"] = str(msg["_id"])
    return messages

@router.post("/", status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_CONTACT)
async def submit_contact_form(request: Request, form: ContactForm, background_tasks: BackgroundTasks):
    form_dict = form.model_dump()
    form_dict["created_at"] = datetime.now(timezone.utc)
    
    # Save to 'contact_messages' collection in MongoDB
    await db.db["contact_messages"].insert_one(form_dict)
    
    # Send email in background
    background_tasks.add_task(send_admin_contact_email, form_dict)
    
    return {"message": "Contact message sent successfully to Admin"}
