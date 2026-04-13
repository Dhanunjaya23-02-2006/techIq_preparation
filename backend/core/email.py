import smtplib
import logging
from email.message import EmailMessage
from core.config import settings

def send_otp_email(to_email: str, otp: str) -> bool:
    sender_email = settings.SENDER_EMAIL
    password = settings.SMTP_PASSWORD
    
    if not password:
        logging.error("SMTP_PASSWORD is not set in .env file. Cannot send OTP emails.")
        # If no password is provided, returning False would block user registration. 
        # You can fallback to returning True or logging the OTP in console depending on environment.
        return False

    msg = EmailMessage()
    msg['Subject'] = 'Railway Preparation - One-Time Password (OTP)'
    msg['From'] = f"Railway Preparation <{sender_email}>"
    msg['To'] = to_email
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <div style="background-color: #0d6efd; color: white; padding: 20px; border-radius: 5px;">
          <h2 style="margin: 0;">Railway Preparation</h2>
          <p>You received this email because you requested an OTP.</p>
        </div>
        <div style="margin-top: 30px;">
          <p>Your One-Time Password (OTP) is:</p>
          <h1 style="color: #0d6efd; letter-spacing: 5px; font-size: 32px;">{otp}</h1>
        </div>
      </body>
    </html>
    """
    msg.add_alternative(html_content, subtype='html')

    try:
        # Using SMTP_SSL for port 465
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, password)
            server.send_message(msg)
        logging.info(f"OTP email sent successfully to {to_email}")
        return True
    except smtplib.SMTPAuthenticationError:
        logging.error("SMTP Authentication failed. Check SENDER_EMAIL and SMTP_PASSWORD (App Password).")
        return False
    except smtplib.SMTPConnectError:
        logging.error("Failed to connect to SMTP server. Check network or port 465.")
        return False
    except Exception as e:
        logging.error(f"Unexpected error sending email to {to_email}: {e}")
        return False
