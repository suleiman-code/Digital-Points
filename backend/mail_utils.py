import logging
import asyncio
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

    BUG #16 FIX: resend.Emails.send() is a blocking sync HTTP call.
    We run it in a thread pool via run_in_executor() to avoid blocking
    the entire async event loop while waiting for the HTTP response.
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

        # Run the blocking SDK call in a thread so the event loop stays free
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, resend.Emails.send, email_params)
        logger.info(f"Email sent successfully via Resend. Response: {response}")
        return True
    except Exception as e:
        logger.error(f"Resend failed: {e}")
        return False
