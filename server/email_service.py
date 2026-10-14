import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from typing import Tuple, Optional


def is_smtp_configured() -> bool:
    host = os.getenv("SMTP_HOST", "").strip()
    user = os.getenv("SMTP_USER", "").strip()
    pwd = os.getenv("SMTP_PASSWORD", "").strip()
    return bool(host and user and pwd)


def get_email_config_status() -> dict:
    host = os.getenv("SMTP_HOST", "").strip()
    user = os.getenv("SMTP_USER", "").strip()
    from_email = os.getenv("SMTP_FROM_EMAIL", "noreply@drivo.example").strip()
    from_name = os.getenv("SMTP_FROM_NAME", "Drivo Car Rentals").strip()
    port = int(os.getenv("SMTP_PORT", "587"))
    tls = os.getenv("SMTP_TLS", "true").lower() == "true"
    configured = is_smtp_configured()

    return {
        "configured": configured,
        "host": host or None,
        "port": port,
        "fromEmail": from_email,
        "fromName": from_name,
        "tls": tls,
        "mockMode": os.getenv("DRIVO_EMAIL_MOCK", "false").lower() == "true",
        "setupGuide": (
            "To send real emails, set the following environment variables: "
            "SMTP_HOST (e.g. smtp.gmail.com or smtp.sendgrid.net), "
            "SMTP_PORT (e.g. 587), SMTP_USER (your username/email), "
            "and SMTP_PASSWORD (your app password or API key). "
            "When SMTP is unconfigured, Drivo records scheduled reminders and "
            "dispatches in-app notifications without falsely claiming real SMTP delivery."
        ),
    }


def send_email_message(
    to_email: str,
    recipient_name: str,
    subject: str,
    text_content: str,
    html_content: Optional[str] = None,
) -> Tuple[bool, str]:
    """
    Sends an email using standard smtplib.
    Returns (success: bool, status_or_error_message: str).
    Never hardcodes credentials; never falsely claims delivery if SMTP is missing.
    """
    if not to_email or "@" not in to_email:
        return False, f"Invalid recipient email address: '{to_email}'"

    host = os.getenv("SMTP_HOST", "").strip()
    user = os.getenv("SMTP_USER", "").strip()
    pwd = os.getenv("SMTP_PASSWORD", "").strip()
    port = int(os.getenv("SMTP_PORT", "587"))
    from_email = os.getenv("SMTP_FROM_EMAIL", "noreply@drivo.example").strip()
    from_name = os.getenv("SMTP_FROM_NAME", "Drivo Car Rentals").strip()
    tls = os.getenv("SMTP_TLS", "true").lower() == "true"
    mock_mode = os.getenv("DRIVO_EMAIL_MOCK", "false").lower() == "true"

    if not (host and user and pwd):
        if mock_mode:
            # Explicit local simulation requested for testing
            return True, f"[SIMULATED] Mock delivery to {to_email} with subject '{subject}'"
        return (
            False,
            "SMTP credentials not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in environment.",
        )

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = f"{recipient_name} <{to_email}>"
        msg["Date"] = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S +0000")

        # Plaintext fallback
        msg.attach(MIMEText(text_content, "plain", "utf-8"))

        # HTML rich content
        if html_content:
            msg.attach(MIMEText(html_content, "html", "utf-8"))

        server = smtplib.SMTP(host, port, timeout=10)
        if tls:
            server.starttls()
        server.login(user, pwd)
        server.sendmail(from_email, [to_email], msg.as_string())
        server.quit()
        return True, "Email successfully delivered via SMTP"
    except smtplib.SMTPAuthenticationError as e:
        return False, f"SMTP Authentication failed: {str(e)}"
    except smtplib.SMTPConnectError as e:
        return False, f"Could not connect to SMTP server {host}:{port}: {str(e)}"
    except Exception as e:
        return False, f"Email delivery error: {str(e)}"


# ==========================================================
# --- Responsive HTML Templates with Drivo Branding ---
# ==========================================================

def render_email_layout(title: str, preheader: str, body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }}
    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
    .header {{ background-color: #0f172a; padding: 24px 32px; text-align: left; border-bottom: 3px solid #10b981; }}
    .header h1 {{ margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }}
    .header span {{ color: #10b981; }}
    .content {{ padding: 32px; }}
    .badge {{ display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; background-color: #ecfdf5; color: #047857; margin-bottom: 16px; }}
    .card {{ background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }}
    .card-row {{ display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }}
    .label {{ color: #64748b; font-weight: 500; }}
    .value {{ color: #0f172a; font-weight: 700; }}
    .btn {{ display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; text-align: center; margin-top: 16px; }}
    .checklist {{ background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #1e40af; line-height: 1.6; }}
    .footer {{ background-color: #f1f5f9; padding: 20px 32px; text-align: center; font-size: 12px; color: #64748b; }}
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    {preheader}
  </div>
  <div class="container">
    <div class="header">
      <h1>DRIVO<span>.</span></h1>
    </div>
    <div class="content">
      {body_html}
    </div>
    <div class="footer">
      <p style="margin:0 0 6px 0;">Drivo Self-Drive Car Rentals &middot; Verified Handover Hubs across 8 Major Cities</p>
      <p style="margin:0;">24/7 Helpline: +91 98765 43210 &middot; Email: support@drivo.example</p>
    </div>
  </div>
</body>
</html>"""


def build_confirmation_email(booking_data: dict, car_data: dict, customer_name: str) -> Tuple[str, str, str]:
    ref = booking_data.get("ref", "")
    car_name = f"{car_data.get('brand', 'Vehicle')} {car_data.get('model', '')}"
    pickup = booking_data.get("pickup", "Designated Station")
    dropoff = booking_data.get("dropoff", "Designated Station")
    start = booking_data.get("start", "")
    end = booking_data.get("end", "")
    total = booking_data.get("pricing", {}).get("total", 0)

    subject = f"Booking Confirmed: {ref} - {car_name}"
    preheader = f"Your reservation {ref} for {car_name} is confirmed."

    text = f"""Hello {customer_name},

Your reservation with Drivo is confirmed!

Booking Reference: {ref}
Vehicle: {car_name}
Pickup Station: {pickup}
Pickup Time: {start}
Return Station: {dropoff}
Return Time: {end}
Total Rental Amount: INR {total}

Please bring your original Driving License and valid Government ID (Aadhaar or Passport) at pickup.

Manage your booking at: https://www.drivo.example/dashboard

Thank you for choosing Drivo!
"""

    body_html = f"""
      <div class="badge">Booking Confirmed &middot; {ref}</div>
      <h2 style="margin:0 0 12px 0; font-size:20px; color:#0f172a;">Hello {customer_name}, your car is reserved!</h2>
      <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 20px 0;">
        We are delighted to confirm your reservation. Your <strong>{car_name}</strong> is being prepped and will be waiting for you at our dispatch hub.
      </p>

      <div class="card">
        <div class="card-row"><span class="label">Booking Ref:</span><span class="value" style="font-family:monospace; color:#047857;">{ref}</span></div>
        <div class="card-row"><span class="label">Vehicle:</span><span class="value">{car_name}</span></div>
        <div class="card-row"><span class="label">Pickup Location:</span><span class="value">{pickup}</span></div>
        <div class="card-row"><span class="label">Pickup Time:</span><span class="value">{start}</span></div>
        <div class="card-row"><span class="label">Return Location:</span><span class="value">{dropoff}</span></div>
        <div class="card-row"><span class="label">Return Time:</span><span class="value">{end}</span></div>
        <div class="card-row" style="border-top:1px dashed #cbd5e1; padding-top:10px; margin-top:10px;">
          <span class="label" style="font-weight:700; color:#0f172a;">Total Payable:</span>
          <span class="value" style="font-size:16px; color:#047857;">&#8377;{total:,}</span>
        </div>
      </div>

      <div class="checklist">
        <strong>Mandatory Handover Checklist:</strong>
        <ul style="margin:8px 0 0 0; padding-left:18px;">
          <li>Original valid Driver's License</li>
          <li>Government photo ID (Aadhaar Card or Passport)</li>
          <li>Credit / Debit card or UPI for security deposit</li>
        </ul>
      </div>

      <a href="https://www.drivo.example/dashboard" class="btn">View Booking &amp; Download Invoice</a>
    """
    html = render_email_layout(subject, preheader, body_html)
    return subject, text, html


def build_pickup_reminder_email(booking_data: dict, car_data: dict, customer_name: str) -> Tuple[str, str, str]:
    ref = booking_data.get("ref", "")
    car_name = f"{car_data.get('brand', 'Vehicle')} {car_data.get('model', '')}"
    pickup = booking_data.get("pickup", "Designated Station")
    start = booking_data.get("start", "")

    subject = f"Upcoming Trip Reminder: {car_name} pickup scheduled for {start}"
    preheader = f"Your trip with {car_name} starts soon at {pickup}."

    text = f"""Hello {customer_name},

This is a friendly reminder that your Drivo trip starts soon!

Booking Reference: {ref}
Vehicle: {car_name}
Pickup Station: {pickup}
Scheduled Time: {start}

Don't forget to carry:
1. Original Driver's License
2. Government ID proof
3. Digital Vehicle Inspection baseline will be performed with our concierge on-site.

View details: https://www.drivo.example/dashboard
Safe travels!
"""

    body_html = f"""
      <div class="badge" style="background-color:#eff6ff; color:#1d4ed8;">Pickup Reminder &middot; Trip Starts Soon</div>
      <h2 style="margin:0 0 12px 0; font-size:20px; color:#0f172a;">Ready for the road, {customer_name}?</h2>
      <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 20px 0;">
        Your self-drive trip with the <strong>{car_name}</strong> is coming up. Here is everything you need for a smooth, fast handover:
      </p>

      <div class="card">
        <div class="card-row"><span class="label">Booking Ref:</span><span class="value" style="font-family:monospace;">{ref}</span></div>
        <div class="card-row"><span class="label">Vehicle:</span><span class="value">{car_name}</span></div>
        <div class="card-row"><span class="label">Pickup Hub:</span><span class="value">{pickup}</span></div>
        <div class="card-row"><span class="label">Handover Time:</span><span class="value">{start}</span></div>
      </div>

      <div class="checklist">
        <strong>Quick Handover Tips:</strong>
        <ul style="margin:8px 0 0 0; padding-left:18px;">
          <li>Our concierge desk will greet you with the keys and vehicle documents.</li>
          <li>Perform the 2-minute digital inspection with our agent to record baseline odometer and fuel level.</li>
          <li>Free shuttle is available from terminal exit for airport locations.</li>
        </ul>
      </div>

      <a href="https://www.drivo.example/dashboard" class="btn">View Hub Directions &amp; Contact Desk</a>
    """
    html = render_email_layout(subject, preheader, body_html)
    return subject, text, html


def build_return_reminder_email(booking_data: dict, car_data: dict, customer_name: str) -> Tuple[str, str, str]:
    ref = booking_data.get("ref", "")
    car_name = f"{car_data.get('brand', 'Vehicle')} {car_data.get('model', '')}"
    dropoff = booking_data.get("dropoff", "Designated Station")
    end = booking_data.get("end", "")

    subject = f"Return Reminder: {car_name} return scheduled for {end}"
    preheader = f"Your rental return for {ref} is scheduled at {dropoff}."

    text = f"""Hello {customer_name},

Your rental period for {car_name} (Booking {ref}) concludes at {end}.

Return Hub: {dropoff}
Scheduled Return Time: {end}

Checklist before drop-off:
1. Ensure the fuel level matches the starting level.
2. Check for personal items and belongings in the glovebox and boot.
3. Complete the return digital vehicle inspection. Your security deposit will be automatically processed.

Thank you for renting with Drivo!
"""

    body_html = f"""
      <div class="badge" style="background-color:#fef3c7; color:#92400e;">Return Reminder</div>
      <h2 style="margin:0 0 12px 0; font-size:20px; color:#0f172a;">Returning your {car_name} today</h2>
      <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 20px 0;">
        We hope you had a fantastic highway journey! Here are the details for returning your vehicle:
      </p>

      <div class="card">
        <div class="card-row"><span class="label">Booking Ref:</span><span class="value" style="font-family:monospace;">{ref}</span></div>
        <div class="card-row"><span class="label">Return Hub:</span><span class="value">{dropoff}</span></div>
        <div class="card-row"><span class="label">Scheduled Time:</span><span class="value">{end}</span></div>
      </div>

      <div class="checklist" style="background-color:#f0fdf4; border-left-color:#10b981; color:#166534;">
        <strong>Return Checklist:</strong>
        <ul style="margin:8px 0 0 0; padding-left:18px;">
          <li>Refuel vehicle to match starting pickup fuel level.</li>
          <li>Remove all personal items and toll transponders.</li>
          <li>Digital check-in with our representative completes your trip and releases your deposit within 24-48 hours.</li>
        </ul>
      </div>

      <a href="https://www.drivo.example/dashboard" class="btn">View Return Instructions &amp; Hub Map</a>
    """
    html = render_email_layout(subject, preheader, body_html)
    return subject, text, html


def build_cancellation_email(booking_data: dict, car_data: dict, customer_name: str) -> Tuple[str, str, str]:
    ref = booking_data.get("ref", "")
    car_name = f"{car_data.get('brand', 'Vehicle')} {car_data.get('model', '')}"

    subject = f"Booking Cancelled: {ref} - {car_name}"
    preheader = f"Your reservation {ref} has been cancelled."

    text = f"""Hello {customer_name},

Your booking {ref} for {car_name} has been cancelled successfully.

Any prepaid amount will be refunded to your original payment method in accordance with our 24-hour cancellation policy. Any redeemed reward points have been restored to your loyalty balance.

If you have any questions, please contact our support team at support@drivo.example.
"""

    body_html = f"""
      <div class="badge" style="background-color:#fee2e2; color:#b91c1c;">Booking Cancelled</div>
      <h2 style="margin:0 0 12px 0; font-size:20px; color:#0f172a;">Your booking {ref} has been cancelled</h2>
      <p style="color:#475569; font-size:14px; line-height:1.6; margin:0 0 20px 0;">
        We have processed the cancellation of your reservation for the <strong>{car_name}</strong>.
      </p>

      <div class="card">
        <div class="card-row"><span class="label">Booking Ref:</span><span class="value" style="font-family:monospace; color:#dc2626;">{ref}</span></div>
        <div class="card-row"><span class="label">Vehicle:</span><span class="value">{car_name}</span></div>
        <div class="card-row"><span class="label">Status:</span><span class="value" style="color:#dc2626;">Cancelled &amp; Refund Initiated</span></div>
      </div>

      <p style="font-size:13px; color:#64748b; line-height:1.5;">
        Eligible refunds are processed back to your original payment method within 3-5 business days. Any redeemed reward points have been credited back to your Drivo account balance.
      </p>

      <a href="https://www.drivo.example/cars" class="btn">Explore Other Available Cars</a>
    """
    html = render_email_layout(subject, preheader, body_html)
    return subject, text, html
