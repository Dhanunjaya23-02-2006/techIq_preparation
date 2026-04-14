import logging
import httpx
from core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

def send_otp_email(email: str, otp: str):
    """
    Send OTP verification email via sauravhathi/otp-service.
    This service on Railway Hobby plans because it uses HTTPS.
    """
    if not settings.OTP_SERVICE_URL:
        logger.error("OTP_SERVICE_URL is not set.")
        logger.warning(f"LOG FALLBACK - OTP FOR {email}: {otp}")
        return False

    base_url = settings.OTP_SERVICE_URL.rstrip('/')
    if "/api/otp/generate" in base_url:
        api_url = base_url
    else:
        api_url = f"{base_url}/api/otp/generate"
    
    payload = {
        "email": email,
        "type": "numeric",
        "organization": settings.PROJECT_NAME,
        "subject": "Verification Code"
    }

    try:
        logger.info(f"Triggering real-time OTP for {email} via {api_url}")
        with httpx.Client(timeout=10) as client:
            resp = client.post(api_url, json=payload)
            if resp.status_code in [200, 201]:
                logger.info(f"OTP Service successfully triggered for {email}")
                # We also log our local code just in case, though external service 
                # will likely send its own.
                logger.info(f"INTERNAL SYNC - Local Code: {otp}")
                return True
            else:
                logger.error(f"OTP Service error {resp.status_code}: {resp.text}")
                logger.warning(f"LOG FALLBACK - OTP FOR {email}: {otp}")
                return False
    except Exception as e:
        logger.error(f"Failed to call OTP Service: {e}")
        logger.warning(f"LOG FALLBACK - OTP FOR {email}: {otp}")
        return False


