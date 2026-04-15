import logging
import resend
from config import settings
from typing import List, Optional

logger = logging.getLogger(__name__)

# Initialize Resend
if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY

async def send_email(
    to: List[str], 
    subject: str, 
    html_content: str, 
    text_content: Optional[str] = None,
    reply_to: Optional[str] = None
):
    """
    Sends an email using Resend API.
    Note: To send more than 3 emails per day, you MUST verify your domain 
    in Resend and change the MAIL_FROM environment variable.
    """
    if not settings.RESEND_API_KEY:
        logger.error("RESEND_API_KEY not configured. Skipping email.")
        return False

    try:
        logger.info(f"Attempting to send email via Resend to {to}")
        email_params = {
            "from": f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>",
            "to": to,
            "subject": subject,
            "html": html_content,
        }
        if text_content:
            email_params["text"] = text_content
        if reply_to:
            email_params["reply_to"] = reply_to

        response = resend.Emails.send(email_params)
        logger.info(f"Email sent successfully via Resend. Response: {response}")
        return True
    except Exception as e:
        logger.error(f"Resend failed: {e}")
        return False
