import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_otp_email(email: str, otp: str):
    """
    Send OTP verification email via SMTP.
    """
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
    
    msg = MIMEMultipart()
    msg['From'] = settings.SENDER_EMAIL
    msg['To'] = email
    msg['Subject'] = subject
    
    msg.attach(MIMEText(html, 'html'))
    
    try:
        logger.info(f"Attempting to send OTP email to {email} using {settings.SMTP_HOST}:{settings.SMTP_PORT}")
        
        # Use SMTP_SSL for port 465, else SMTP + starttls
        if settings.SMTP_PORT == 465:
            server_class = smtplib.SMTP_SSL
            logger.info("Using SMTP_SSL (Port 465)")
        else:
            server_class = smtplib.SMTP
            logger.info(f"Using standard SMTP (Port {settings.SMTP_PORT})")

        with server_class(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
            if settings.SMTP_PORT != 465:
                logger.info("Starting TLS...")
                server.starttls()
            
            logger.info(f"Attempting login for {settings.SENDER_EMAIL}...")
            server.login(settings.SENDER_EMAIL, settings.SMTP_PASSWORD)
            
            logger.info("Sending message...")
            server.send_message(msg)
            
        logger.info(f"OTP email sent successfully to {email}")
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error(f"SMTP Authentication failed for {settings.SENDER_EMAIL}. Check if App Password is correct.")
        return False
    except smtplib.SMTPConnectError:
        logger.error(f"Failed to connect to SMTP server {settings.SMTP_HOST}. Check port and network.")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending email to {email}: {type(e).__name__}: {e}")
        return False
