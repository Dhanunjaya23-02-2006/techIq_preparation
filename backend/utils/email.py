import logging
from core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

def send_otp_email(email: str, otp: str):
    """
    Send OTP verification email via sauravhathi/otp-service.
    Used as a reliable delivery method on Railway.
    """
    if not settings.OTP_SERVICE_URL:
        logger.error("OTP_SERVICE_URL is not set. Cannot send email.")
        # Fallback to console log for development
        logger.warning(f"DEV FALLBACK - OTP FOR {email}: {otp}")
        return False

    try:
        import httpx
        logger.info(f"Attempting to send OTP to {email} via OTP Service...")
        
        # Request format for sauravhathi/otp-service
        payload = {
            "email": email,
            "type": "numeric",
            "organization": settings.PROJECT_NAME,
            "subject": "Verification Code",
            "otp": otp # Some versions allow passing our own OTP
        }
        
        with httpx.Client(timeout=10) as client:
            resp = client.post(settings.OTP_SERVICE_URL, json=payload)
            if resp.status_code in [200, 201]:
                logger.info(f"OTP email sent successfully via OTP Service to {email}")
                return True
            else:
                logger.warning(f"OTP Service failed with status {resp.status_code}: {resp.text}")
                # Fallback for visibility
                logger.warning(f"DEV FALLBACK - OTP FOR {email}: {otp}")
                return False

    except Exception as e:
        logger.error(f"Failed to send email via OTP Service: {e}")
        # Final fallback for local testing if all APIs fail
        logger.warning(f"DEV FALLBACK - OTP FOR {email}: {otp}")
        return False


