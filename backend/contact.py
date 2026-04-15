from fastapi import APIRouter, status, BackgroundTasks, Depends, Request, HTTPException
from pydantic import BaseModel, EmailStr
from database import db
from config import settings
from rate_limit import limiter
import resend
from datetime import datetime, timezone, timedelta
from auth import get_admin_user
from typing import List, Optional
import logging

from mail_utils import send_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/contact", tags=["Contact"])

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

async def send_admin_contact_email(form_data: dict):
    """Send contact form submission to admin using the unified mail utility"""
    try:
        admin_recipient = settings.ADMIN_CONTACT_EMAIL or settings.MAIL_FROM or "noreply@digitalpoints.com"
        sender_name = form_data.get("name", "Unknown")
        sender_email = form_data.get("email", "unknown@example.com")
        inquiry_subject = form_data.get("subject", "No subject")
        inquiry_message = form_data.get("message", "")
        
        email_body = f"""
Hello Admin,

You have received a new contact form inquiry from Digital Point.

Inquiry details:
- Name: {sender_name}
- Email: {sender_email}
- Subject: {inquiry_subject}

Message:
{inquiry_message}

Tip: Use Reply in your email client to respond directly to this user.
"""

        html_body = f"""
<div style=\"font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#0f172a;max-width:680px;margin:0 auto;\">
    <h2 style=\"margin:0 0 12px;\">New Contact Form Inquiry</h2>
    <p style=\"margin:0 0 16px;\">A new inquiry has been submitted on <strong>Digital Point</strong>.</p>

    <table style=\"width:100%;border-collapse:collapse;margin:0 0 16px;\">
        <tr>
            <td style=\"padding:8px;border:1px solid #e2e8f0;background:#f8fafc;width:35%;\"><strong>Name</strong></td>
            <td style=\"padding:8px;border:1px solid #e2e8f0;\">{sender_name}</td>
        </tr>
        <tr>
            <td style=\"padding:8px;border:1px solid #e2e8f0;background:#f8fafc;\"><strong>Email</strong></td>
            <td style=\"padding:8px;border:1px solid #e2e8f0;\">{sender_email}</td>
        </tr>
        <tr>
            <td style=\"padding:8px;border:1px solid #e2e8f0;background:#f8fafc;\"><strong>Subject</strong></td>
            <td style=\"padding:8px;border:1px solid #e2e8f0;\">{inquiry_subject}</td>
        </tr>
    </table>

    <div style=\"border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#ffffff;\">
        <p style=\"margin:0 0 8px;\"><strong>Message</strong></p>
        <p style=\"margin:0;white-space:pre-wrap;\">{inquiry_message}</p>
    </div>

    <p style=\"margin:16px 0 0;color:#475569;\">Tip: Use your email client's Reply button to respond directly to this user.</p>
</div>
"""
        await send_email(
            to=[admin_recipient],
            subject=f"New Contact Inquiry: {inquiry_subject} ({sender_name})",
            html_content=html_body,
            text_content=email_body,
            reply_to=sender_email
        )
        
    except Exception as e:
        logger.error(f"Failed to trigger contact email: {e}", exc_info=True)

@router.get("/", response_model=List[dict])
async def get_all_inquiries(
    days: Optional[int] = None,
    admin: dict = Depends(get_admin_user)
):
    query = {}
    if days and days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        # Support both BSON Date and ISO Strings
        query["$or"] = [
            {"created_at": {"$gte": cutoff}},
            {"created_at": {"$gte": cutoff.isoformat().replace("+00:00", "Z")}}
        ]

    messages = await db.db["contact_messages"].find(query).sort("created_at", -1).to_list(1000)
    # Convert ObjectId to string for JSON
    for msg in messages:
        msg["_id"] = str(msg["_id"])
    return messages

@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_contact_form(request: Request, form: ContactForm, background_tasks: BackgroundTasks):
    form_dict = form.model_dump()
    form_dict["created_at"] = datetime.now(timezone.utc)
    
    # Save to 'contact_messages' collection in MongoDB
    await db.db["contact_messages"].insert_one(form_dict)
    
    # Send email in background
    background_tasks.add_task(send_admin_contact_email, form_dict)
    
    return {"message": "Contact message sent successfully to Admin"}

# 4. PUT /api/contact/{id}/view (Admin Only)
@router.put("/{id}/view", status_code=status.HTTP_200_OK)
async def mark_contact_viewed(id: str, admin: dict = Depends(get_admin_user)):
    from bson import ObjectId
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Contact ID")
    
    await db.db["contact_messages"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"viewed": True}}
    )
    return {"message": "Inquiry marked as viewed"}

# 5. POST /api/contact/{id}/reply (Admin Only)
@router.post("/{id}/reply")
async def reply_to_contact_message(id: str, reply_msg: str, admin: dict = Depends(get_admin_user)):
    from bson import ObjectId
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Contact ID")
    
    msg = await db.db["contact_messages"].find_one({"_id": ObjectId(id)})
    if not msg:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    client_email = msg.get("email")
    if not client_email:
        raise HTTPException(status_code=400, detail="User email not found")

    subject = f"Re: {msg.get('subject', 'Website Inquiry')}"
    
    try:
        await send_email(
            to=[client_email],
            subject=subject,
            html_content=f"<div style='font-family:sans-serif;white-space:pre-wrap;'>{reply_msg}</div>",
            text_content=reply_msg
        )
        
        # Mark as read/responded
        await db.db["contact_messages"].update_one(
            {"_id": ObjectId(id)},
            {"$set": {"viewed": True, "replied_at": datetime.now(timezone.utc)}}
        )
        
        return {"message": "Reply sent successfully"}
    except Exception as e:
        logger.error(f"Failed to send contact reply: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
