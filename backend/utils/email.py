import logging
import resend
from core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

# Initialize Resend
if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY

def send_otp_email(email: str, otp: str):
    """
    Send OTP verification email via Resend API.
    Used as an alternative to SMTP which is blocked on Railway Hobby plans.
    """
    if not settings.RESEND_API_KEY:
        logger.error("RESEND_API_KEY is not set. Cannot send email.")
        # Fallback to console log for development
        logger.warning(f"DEV FALLBACK - OTP FOR {email}: {otp}")
        return False

    subject = f"{otp} is your verification code for {settings.PROJECT_NAME}"
    
    # Create the HTML body
    html = f"""
    <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background-color: #ff9933; padding: 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0;">{settings.PROJECT_NAME}</h1>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <h2 style="color: #333333;">Verification Code</h2>
                    <p style="color: #666666; font-size: 16px;">Please use the following 6-digit code to complete your registration.</p>
                    <div style="background-color: #f0f4f8; padding: 15px; border-radius: 8px; display: inline-block; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ff9933;">{otp}</span>
                    </div>
                    <p style="color: #999999; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                </div>
                <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #eeeeee;">
                    <p style="color: #aaaaaa; font-size: 12px; margin: 0;">&copy; 2026 {settings.PROJECT_NAME}. All rights reserved.</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    try:
        # 1. Try sauravhathi/otp-service fallback if URL is provided
        if settings.OTP_SERVICE_URL:
            import httpx
            logger.info(f"Attempting to send OTP to {email} via OTP Service...")
            
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

        # 2. Resend API (Primary/Fallback)
        if settings.RESEND_API_KEY:
            from_email = settings.SENDER_EMAIL
            if not from_email or "gmail.com" in from_email or "yahoo.com" in from_email:
                 from_email = "onboarding@resend.dev"
            
            params = {
                "from": f"{settings.PROJECT_NAME} <{from_email}>",
                "to": [email],
                "subject": subject,
                "html": html,
            }

            logger.info(f"Sending OTP email to {email} via Resend...")
            resend.Emails.send(params)
            logger.info(f"OTP email sent successfully to {email}")
            return True

        # If we reach here, no service was configured
        logger.error("No email service (Resend or OTP Service) is configured.")
        logger.warning(f"DEV FALLBACK - OTP FOR {email}: {otp}")
        return False

    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        # Final fallback for local testing if all APIs fail
        logger.warning(f"DEV FALLBACK - OTP FOR {email}: {otp}")
        return False


