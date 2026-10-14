import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from locations_data import get_location_by_name

# Color Palette matching Drivo 2027 Brand Style
PRIMARY_INK = colors.HexColor("#0f172a")       # Deep slate ink
ACCENT_EMERALD = colors.HexColor("#059669")    # Luxury Emerald green
ACCENT_LIGHT = colors.HexColor("#ecfdf5")      # Light emerald tint
BORDER_COLOR = colors.HexColor("#e2e8f0")      # Clean neutral border
MUTED_TEXT = colors.HexColor("#64748b")        # Slate 500
BG_NEUTRAL = colors.HexColor("#f8fafc")        # Slate 50 background
STATUS_PAID = colors.HexColor("#15803d")       # Green 700
STATUS_PENDING = colors.HexColor("#b45309")    # Amber 700
STATUS_CANCELLED = colors.HexColor("#b91c1c")  # Red 700

def fmt_curr(amount: float) -> str:
    try:
        val = float(amount or 0)
        return f"Rs. {val:,.2f}"
    except Exception:
        return f"Rs. {amount}"

def _get(obj, key, default=None):
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)

def generate_invoice_pdf(booking, car, pricing: dict) -> bytes:
    """
    Generates a professional, print-ready, authoritative Tax Invoice and Rental Receipt
    for a Drivo vehicle booking.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    header_company_style = ParagraphStyle(
        "CompanyHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=PRIMARY_INK,
    )
    company_sub_style = ParagraphStyle(
        "CompanySub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=MUTED_TEXT,
    )
    invoice_title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        alignment=TA_RIGHT,
        textColor=ACCENT_EMERALD,
    )
    invoice_meta_style = ParagraphStyle(
        "InvoiceMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        alignment=TA_RIGHT,
        textColor=PRIMARY_INK,
    )
    section_title_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=PRIMARY_INK,
    )
    body_bold = ParagraphStyle(
        "BodyBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=PRIMARY_INK,
    )
    body_regular = ParagraphStyle(
        "BodyRegular",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=PRIMARY_INK,
    )
    body_muted = ParagraphStyle(
        "BodyMuted",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=MUTED_TEXT,
    )
    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    )
    table_header_right = ParagraphStyle(
        "TableHeaderRight",
        parent=table_header_style,
        alignment=TA_RIGHT,
    )
    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=PRIMARY_INK,
    )
    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=PRIMARY_INK,
    )
    table_cell_right = ParagraphStyle(
        "TableCellRight",
        parent=table_cell,
        alignment=TA_RIGHT,
    )
    table_cell_right_bold = ParagraphStyle(
        "TableCellRightBold",
        parent=table_cell_bold,
        alignment=TA_RIGHT,
    )

    story = []

    # 1. Header: Company Info (Left) + Invoice Meta (Right)
    company_info = [
        Paragraph("DRIVO CAR RENTAL PRIVATE LIMITED", header_company_style),
        Spacer(1, 2),
        Paragraph("GSTIN: 33AAACD9999Z1Z · PAN: AAACD9999Z", company_sub_style),
        Paragraph("104, West Club Road, RS Puram, Coimbatore, Tamil Nadu - 641002", company_sub_style),
        Paragraph("Email: support@drivo.example · Contact: +91 98765 43210 · www.drivo.example", company_sub_style),
    ]

    created_at = _get(booking, "created_at")
    if created_at and hasattr(created_at, "strftime"):
        issue_date_str = created_at.strftime("%d %b %Y, %I:%M %p")
    elif created_at and isinstance(created_at, str):
        issue_date_str = created_at
    else:
        issue_date_str = datetime.utcnow().strftime("%d %b %Y")

    b_ref = _get(booking, "ref", "REF")
    b_status = _get(booking, "status", "Confirmed")
    b_payment_status = _get(booking, "payment_status", "Pending")
    b_payment_method = _get(booking, "payment_method")

    invoice_meta = [
        Paragraph("TAX INVOICE & RECEIPT", invoice_title_style),
        Spacer(1, 4),
        Paragraph(f"<b>Invoice #:</b> INV-{b_ref}", invoice_meta_style),
        Paragraph(f"<b>Booking Ref:</b> {b_ref}", invoice_meta_style),
        Paragraph(f"<b>Invoice Date:</b> {issue_date_str}", invoice_meta_style),
        Paragraph(f"<b>Booking Status:</b> {b_status}", invoice_meta_style),
    ]

    header_table = Table(
        [[company_info, invoice_meta]],
        colWidths=[310, 230],
    )
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT_EMERALD, spaceBefore=4, spaceAfter=10))

    # 2. Payment Status Banner (Authoritative)
    is_paid = b_payment_status == "Paid"
    payment_method_label = b_payment_method or "Online Payment (Verified Gateway)"
    
    if is_paid:
        status_bg = colors.HexColor("#dcfce7")
        status_border = colors.HexColor("#86efac")
        banner_text = f"<b>PAYMENT STATUS: PAID & VERIFIED</b> · Transaction Ref: TXN-{b_ref} · Method: {payment_method_label}"
        status_style = ParagraphStyle(
            "PaidBanner", parent=styles["Normal"], fontName="Helvetica", fontSize=9, leading=12, textColor=STATUS_PAID, alignment=TA_CENTER
        )
    elif b_status == "Cancelled":
        status_bg = colors.HexColor("#fee2e2")
        status_border = colors.HexColor("#fca5a5")
        refund_note = " (Refund Processed)" if b_payment_status == "Refunded" else ""
        banner_text = f"<b>BOOKING STATUS: CANCELLED</b>{refund_note} · Reference: {b_ref}"
        status_style = ParagraphStyle(
            "CancelledBanner", parent=styles["Normal"], fontName="Helvetica", fontSize=9, leading=12, textColor=STATUS_CANCELLED, alignment=TA_CENTER
        )
    else:
        status_bg = colors.HexColor("#fef3c7")
        status_border = colors.HexColor("#fcd34d")
        banner_text = f"<b>PAYMENT STATUS: PENDING / UNVERIFIED</b> · Payment outstanding. Full receipt validated upon settlement."
        status_style = ParagraphStyle(
            "PendingBanner", parent=styles["Normal"], fontName="Helvetica", fontSize=9, leading=12, textColor=STATUS_PENDING, alignment=TA_CENTER
        )

    banner_table = Table([[Paragraph(banner_text, status_style)]], colWidths=[540])
    banner_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), status_bg),
        ("BOX", (0, 0), (-1, -1), 1, status_border),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 12))

    # 3. Two Columns: Customer Information & Rental Vehicle / Schedule
    raw_cust = _get(booking, "customer")
    customer_data = raw_cust if isinstance(raw_cust, dict) else {}
    cust_name = customer_data.get("fullName") or _get(booking, "customer_name") or "Valued Customer"
    cust_email = customer_data.get("email") or _get(booking, "customer_email") or "Not provided"
    cust_phone = customer_data.get("phone") or _get(booking, "customer_phone") or "Not provided"
    cust_dl = customer_data.get("license") or _get(booking, "customer_license") or "Verified DL on file"

    customer_col = [
        Paragraph("BILLED TO / CUSTOMER DETAILS", section_title_style),
        Spacer(1, 4),
        Paragraph(f"<b>Full Name:</b> {cust_name}", body_regular),
        Paragraph(f"<b>Email Address:</b> {cust_email}", body_regular),
        Paragraph(f"<b>Phone Number:</b> {cust_phone}", body_regular),
        Paragraph(f"<b>Driving Licence #:</b> {cust_dl}", body_regular),
    ]

    car_brand = _get(car, "brand") or _get(car, "name", "Vehicle")
    car_model = _get(car, "model", "")
    car_cat = _get(car, "category", "Rental")
    car_trans = _get(car, "transmission", "Automatic")
    car_fuel = _get(car, "fuel", "Petrol")
    car_seats = _get(car, "seats", 5)
    car_price_per_day = _get(car, "price_per_day") or _get(car, "price", 0)
    car_deposit = _get(car, "deposit", 5000)

    b_pickup = _get(booking, "pickup", "Drivo Center")
    b_dropoff = _get(booking, "dropoff", "Drivo Center")
    b_start = _get(booking, "start_time") or _get(booking, "start", "")
    b_end = _get(booking, "end_time") or _get(booking, "end", "")

    p_loc = get_location_by_name(b_pickup)
    d_loc = get_location_by_name(b_dropoff)

    p_line = f"<b>Pickup Station:</b> {b_pickup} · {b_start}"
    if p_loc and p_loc.get("address"):
        p_line += f"<br/><font color='#64748b' size='7'>{p_loc['address']}</font>"

    d_line = f"<b>Return Station:</b> {b_dropoff} · {b_end}"
    if d_loc and d_loc.get("address"):
        d_line += f"<br/><font color='#64748b' size='7'>{d_loc['address']}</font>"

    schedule_col = [
        Paragraph("VEHICLE & RENTAL ITINERARY", section_title_style),
        Spacer(1, 4),
        Paragraph(f"<b>Vehicle:</b> {car_brand} {car_model} ({car_cat})", body_regular),
        Paragraph(f"<b>Transmission / Fuel:</b> {car_trans} · {car_fuel} · {car_seats} Seats", body_regular),
        Paragraph(p_line, body_regular),
        Paragraph(d_line, body_regular),
    ]

    info_grid = Table(
        [[customer_col, schedule_col]],
        colWidths=[270, 270],
    )
    info_grid.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), BG_NEUTRAL),
        ("BOX", (0, 0), (-1, -1), 1, BORDER_COLOR),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(info_grid)
    story.append(Spacer(1, 14))

    # 4. Itemized Charges Table
    try:
        days_billed = int(pricing.get("days", 1) or 1)
    except (ValueError, TypeError):
        days_billed = 1

    try:
        base_charge = float(pricing.get("base", pricing.get("base_price", 0)) or 0)
    except (ValueError, TypeError):
        base_charge = 0.0

    raw_extras_val = pricing.get("extras", 0)
    if isinstance(raw_extras_val, (int, float)):
        extras_charge = float(raw_extras_val)
    elif isinstance(raw_extras_val, list):
        extras_charge = sum(float(item.get("price", 0)) if isinstance(item, dict) else 0 for item in raw_extras_val)
    else:
        try:
            extras_charge = float(pricing.get("extras_total", 0) or 0)
        except (ValueError, TypeError):
            extras_charge = 0.0

    try:
        discount_val = float(pricing.get("discount", pricing.get("coupon_discount", 0)) or 0)
    except (ValueError, TypeError):
        discount_val = 0.0

    try:
        tax_val = float(pricing.get("tax", pricing.get("gst", 0)) or 0)
    except (ValueError, TypeError):
        tax_val = 0.0

    try:
        cgst_val = float(pricing.get("cgst", round(tax_val / 2, 2)) or 0)
    except (ValueError, TypeError):
        cgst_val = round(tax_val / 2, 2)

    try:
        sgst_val = float(pricing.get("sgst", round(tax_val / 2, 2)) or 0)
    except (ValueError, TypeError):
        sgst_val = round(tax_val / 2, 2)

    try:
        deposit_val = float(pricing.get("deposit", pricing.get("refundable_deposit", car_deposit)) or 0)
    except (ValueError, TypeError):
        deposit_val = float(car_deposit or 5000)

    try:
        total_val = float(pricing.get("total", 0) or 0)
    except (ValueError, TypeError):
        total_val = 0.0

    # Table rows
    table_data = [
        [
            Paragraph("Item Description", table_header_style),
            Paragraph("Unit Rate", table_header_style),
            Paragraph("Qty / Duration", table_header_style),
            Paragraph("Amount (INR)", table_header_right),
        ],
        [
            Paragraph(f"<b>Base Rental Charge:</b> {car_brand} {car_model}", table_cell),
            Paragraph(fmt_curr(car_price_per_day), table_cell),
            Paragraph(f"{days_billed} Day(s)", table_cell),
            Paragraph(fmt_curr(base_charge), table_cell_right),
        ],
    ]

    # Optional Add-ons breakdown
    raw_extras = _get(booking, "extras")
    if isinstance(raw_extras, dict):
        selected_extras = [k.capitalize() for k, v in raw_extras.items() if v]
    elif isinstance(raw_extras, list):
        selected_extras = [item.get("name") if isinstance(item, dict) else str(item) for item in raw_extras]
    else:
        selected_extras = []
    if extras_charge > 0 or selected_extras:
        extras_desc = f"Optional Add-ons ({', '.join(selected_extras)})" if selected_extras else "Optional Add-on Equipment & Services"
        table_data.append([
            Paragraph(extras_desc, table_cell),
            Paragraph("Fixed / Daily", table_cell),
            Paragraph("1 Bundle", table_cell),
            Paragraph(fmt_curr(extras_charge), table_cell_right),
        ])

    # Coupon Discount
    if discount_val > 0:
        coupon_label = f"Special Promotional Discount ({pricing.get('couponCode', 'PROMO')})"
        table_data.append([
            Paragraph(f"<font color='#059669'><b>{coupon_label}</b></font>", table_cell),
            Paragraph("Coupon", table_cell),
            Paragraph("1", table_cell),
            Paragraph(f"<font color='#059669'>-{fmt_curr(discount_val)}</font>", table_cell_right),
        ])

    # Subtotal
    subtotal = base_charge + extras_charge - discount_val
    table_data.append([
        Paragraph("<b>Taxable Subtotal</b>", table_cell_bold),
        Paragraph("", table_cell),
        Paragraph("", table_cell),
        Paragraph(fmt_curr(subtotal), table_cell_right_bold),
    ])

    # Taxes (GST 18% split into CGST 9% and SGST 9%)
    table_data.append([
        Paragraph("Central GST (CGST @ 9.0%)", table_cell),
        Paragraph("9.0%", table_cell),
        Paragraph("—", table_cell),
        Paragraph(fmt_curr(cgst_val), table_cell_right),
    ])
    table_data.append([
        Paragraph("State GST (SGST @ 9.0%)", table_cell),
        Paragraph("9.0%", table_cell),
        Paragraph("—", table_cell),
        Paragraph(fmt_curr(sgst_val), table_cell_right),
    ])

    # Refundable Security Deposit
    table_data.append([
        Paragraph("<b>Refundable Security Deposit</b><br/><font size='7' color='#64748b'>Released upon vehicle handover inspection</font>", table_cell),
        Paragraph("Fixed", table_cell),
        Paragraph("1 Deposit", table_cell),
        Paragraph(fmt_curr(deposit_val), table_cell_right),
    ])

    # Final Total Payable Amount
    table_data.append([
        Paragraph("<font size='10'><b>TOTAL INVOICE AMOUNT</b></font>", table_cell_bold),
        Paragraph("", table_cell),
        Paragraph("", table_cell),
        Paragraph(f"<font size='10' color='#0f172a'><b>{fmt_curr(total_val)}</b></font>", table_cell_right_bold),
    ])

    item_table = Table(table_data, colWidths=[250, 100, 90, 100])
    item_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY_INK),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("BACKGROUND", (0, -1), (-1, -1), ACCENT_LIGHT),
        ("LINEBELOW", (0, -1), (-1, -1), 1.5, ACCENT_EMERALD),
    ]))
    story.append(item_table)
    story.append(Spacer(1, 14))

    # 5. Terms & Policy Notes
    terms_text = (
        "<b>Rental & Booking Conditions:</b><br/>"
        "1. <b>Identity & Age:</b> Driver must present an original valid driving licence and a government-approved photo ID at pickup. Minimum age: 21.<br/>"
        "2. <b>Fuel & Handover:</b> The vehicle must be returned at the same fuel level as recorded during handover.<br/>"
        "3. <b>Cancellation Policy:</b> Free cancellation up to 24 hours prior to scheduled pickup time. Cancellations under 24 hours are billed per contract terms.<br/>"
        "4. <b>Deposit Return:</b> Security deposit is credited to the source account within 24–48 hours post-trip inspection.<br/>"
        "5. <b>System Generated:</b> This is an authentic digital tax invoice issued by Drivo Car Rental Private Limited. No physical signature required."
    )
    terms_table = Table(
        [[Paragraph(terms_text, body_muted)]],
        colWidths=[540],
    )
    terms_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_NEUTRAL),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(terms_table)
    story.append(Spacer(1, 10))

    # 6. Footer Note
    footer_text = Paragraph(
        "Thank you for choosing Drivo. Your Journey. Your Rules. Need assistance? Visit www.drivo.example or call +91 98765 43210.",
        ParagraphStyle("FooterNote", parent=styles["Normal"], fontName="Helvetica", fontSize=7.5, leading=10, textColor=MUTED_TEXT, alignment=TA_CENTER)
    )
    story.append(footer_text)

    doc.build(story)
    return buffer.getvalue()
