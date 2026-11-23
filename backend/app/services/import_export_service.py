import csv
import io
import json
from datetime import date, datetime
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from backend.app.models.donor import Donor
from backend.app.models.camp import DonationCamp
from backend.app.models.audit import AuditLog
from backend.app.services.donor_service import register_donor, generate_donor_id
from backend.app.schemas.donor import DonorCreate
from backend.app.services.audit_service import log_activity
from backend.app.services.analytics_service import compute_blood_group_analytics
from backend.app.config import ALLOWED_BLOOD_GROUPS, EXPORTS_DIR
from backend.app.utils.validators import calculate_age, evaluate_preliminary_screening

EXPECTED_CSV_HEADERS = [
    "full_name",
    "date_of_birth",
    "gender",
    "phone",
    "email",
    "address",
    "city",
    "state",
    "pin_code",
    "blood_group",
    "weight_kg",
    "last_donation_date",
    "has_chronic_illness",
    "has_recent_surgery",
    "has_medication"
]

def parse_and_validate_csv(db: Session, csv_content: str) -> Dict[str, Any]:
    """
    Validates CSV content line by line without silent discarding.
    Detects duplicate phones, invalid blood groups, missing fields, malformed dates.
    """
    f = io.StringIO(csv_content.strip())
    reader = csv.reader(f)
    
    try:
        raw_headers = next(reader)
    except StopIteration:
        return {
            "success": False,
            "error": "The uploaded CSV file is empty.",
            "total_rows": 0,
            "valid_rows": [],
            "invalid_rows": [],
            "error_csv": ""
        }

    headers = [h.strip().lower().replace(" ", "_") for h in raw_headers]
    missing_mandatory_headers = []
    required_cols = ["full_name", "date_of_birth", "phone", "address", "city", "state", "pin_code", "blood_group", "weight_kg"]
    for req in required_cols:
        if req not in headers:
            missing_mandatory_headers.append(req)

    if missing_mandatory_headers:
        return {
            "success": False,
            "error": f"Missing mandatory CSV columns: {', '.join(missing_mandatory_headers)}. Expected template headers: {', '.join(EXPECTED_CSV_HEADERS)}",
            "total_rows": 0,
            "valid_rows": [],
            "invalid_rows": [],
            "error_csv": ""
        }

    header_indices = {h: idx for idx, h in enumerate(headers)}

    existing_phones = set(p[0] for p in db.query(Donor.phone).all())
    seen_in_csv_phones = set()

    valid_rows = []
    invalid_rows = []

    row_number = 1
    for row in reader:
        row_number += 1
        if not row or all(c.strip() == "" for c in row):
            continue

        errors = []
        def get_val(col_name: str) -> str:
            idx = header_indices.get(col_name)
            if idx is not None and idx < len(row):
                return row[idx].strip()
            return ""

        full_name = get_val("full_name")
        dob_str = get_val("date_of_birth")
        phone = get_val("phone")
        blood_group = get_val("blood_group").upper()
        weight_str = get_val("weight_kg")
        city = get_val("city")
        state = get_val("state")
        address = get_val("address")
        pin_code = get_val("pin_code")
        email = get_val("email")
        gender = get_val("gender")
        last_donation_str = get_val("last_donation_date")
        chronic_str = get_val("has_chronic_illness").lower()
        surgery_str = get_val("has_recent_surgery").lower()
        med_str = get_val("has_medication").lower()

        # Validation checks
        if not full_name:
            errors.append("Full name is mandatory and cannot be empty.")

        # Phone
        clean_phone = "".join(filter(lambda c: c.isdigit() or c == "+", phone))
        if len(clean_phone) < 10:
            errors.append(f"Invalid phone number '{phone}' (must have at least 10 digits).")
        elif clean_phone in existing_phones:
            errors.append(f"Duplicate phone '{clean_phone}' already registered in database.")
        elif clean_phone in seen_in_csv_phones:
            errors.append(f"Duplicate phone '{clean_phone}' appears multiple times in this CSV.")
        else:
            seen_in_csv_phones.add(clean_phone)

        # DOB
        dob = None
        if not dob_str:
            errors.append("Date of birth is mandatory.")
        else:
            try:
                dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
                if dob > date.today():
                    errors.append("Date of birth cannot be in the future.")
            except ValueError:
                errors.append(f"Invalid date of birth format '{dob_str}'. Expected YYYY-MM-DD.")

        # Blood group
        if blood_group not in ALLOWED_BLOOD_GROUPS:
            errors.append(f"Invalid blood group '{blood_group}'. Allowed: {', '.join(ALLOWED_BLOOD_GROUPS)}.")

        # Weight
        weight_kg = None
        try:
            weight_kg = float(weight_str)
            if weight_kg < 30 or weight_kg > 250:
                errors.append(f"Weight '{weight_str}' kg is outside acceptable range (30-250 kg).")
        except (ValueError, TypeError):
            errors.append(f"Invalid weight '{weight_str}'. Must be a valid number.")

        # Mandatory fields
        if not address:
            errors.append("Address is mandatory.")
        if not city:
            errors.append("City is mandatory.")
        if not state:
            errors.append("State is mandatory.")
        if not pin_code:
            errors.append("PIN code is mandatory.")

        # Last donation date
        last_donation = None
        if last_donation_str:
            try:
                last_donation = datetime.strptime(last_donation_str, "%Y-%m-%d").date()
                if last_donation > date.today():
                    errors.append("Last donation date cannot be in the future.")
            except ValueError:
                errors.append(f"Invalid last donation date format '{last_donation_str}'. Expected YYYY-MM-DD.")

        row_dict = {
            "row_number": row_number,
            "full_name": full_name,
            "date_of_birth": dob_str,
            "phone": clean_phone or phone,
            "email": email or None,
            "gender": gender or None,
            "address": address,
            "city": city,
            "state": state,
            "pin_code": pin_code,
            "blood_group": blood_group,
            "weight_kg": weight_kg,
            "last_donation_date": last_donation_str or None,
            "has_chronic_illness": chronic_str in ("true", "1", "yes", "y"),
            "has_recent_surgery": surgery_str in ("true", "1", "yes", "y"),
            "has_medication": med_str in ("true", "1", "yes", "y")
        }

        if errors:
            row_dict["errors"] = errors
            invalid_rows.append(row_dict)
        else:
            row_dict["parsed_dob"] = dob
            row_dict["parsed_last_donation"] = last_donation
            valid_rows.append(row_dict)

    # Generate error CSV for invalid rows
    error_csv_io = io.StringIO()
    error_writer = csv.writer(error_csv_io)
    error_writer.writerow(["row_number"] + headers + ["validation_errors"])
    for inv in invalid_rows:
        orig_row = [inv.get(h, "") for h in headers]
        error_writer.writerow([inv["row_number"]] + orig_row + ["; ".join(inv["errors"])])

    return {
        "success": True,
        "total_rows": len(valid_rows) + len(invalid_rows),
        "valid_count": len(valid_rows),
        "invalid_count": len(invalid_rows),
        "valid_rows": valid_rows,
        "invalid_rows": invalid_rows,
        "error_csv": error_csv_io.getvalue()
    }

def execute_csv_import(db: Session, valid_rows: List[Dict[str, Any]]) -> int:
    imported_count = 0
    for r in valid_rows:
        dob = r["parsed_dob"] if isinstance(r.get("parsed_dob"), date) else datetime.strptime(r["date_of_birth"], "%Y-%m-%d").date()
        last_donation = None
        if r.get("last_donation_date"):
            last_donation = r["parsed_last_donation"] if isinstance(r.get("parsed_last_donation"), date) else datetime.strptime(r["last_donation_date"], "%Y-%m-%d").date()

        donor_create = DonorCreate(
            full_name=r["full_name"],
            date_of_birth=dob,
            gender=r.get("gender"),
            phone=r["phone"],
            email=r.get("email"),
            address=r["address"],
            city=r["city"],
            state=r["state"],
            pin_code=r["pin_code"],
            blood_group=r["blood_group"],
            weight_kg=float(r["weight_kg"]),
            last_donation_date=last_donation,
            has_chronic_illness=bool(r.get("has_chronic_illness", False)),
            has_recent_surgery=bool(r.get("has_recent_surgery", False)),
            has_medication=bool(r.get("has_medication", False)),
            consent_data_storage=True,
            consent_contact=True
        )
        register_donor(db, donor_create)
        imported_count += 1

    log_activity(
        db,
        action="DATA_IMPORTED",
        entity_type="IMPORT",
        entity_id=None,
        description=f"Bulk imported {imported_count} donor records via CSV import module.",
        details={"imported_records": imported_count}
    )
    return imported_count

def generate_sample_csv() -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(EXPECTED_CSV_HEADERS)
    writer.writerow(["John Doe", "1994-05-15", "Male", "+1987654321", "john.doe@example.com", "123 Main St", "Metropolis", "NY", "10001", "O+", "72.5", "2024-01-10", "false", "false", "false"])
    writer.writerow(["Jane Smith", "1998-11-22", "Female", "+1987654322", "jane.smith@example.com", "456 Oak Ave", "Gotham", "NJ", "07001", "A+", "58.0", "", "false", "false", "false"])
    writer.writerow(["Alex Johnson", "2001-08-30", "Other", "+1987654323", "alex.j@example.com", "789 Pine Rd", "Star City", "CA", "90210", "B-", "64.0", "2023-11-05", "false", "false", "false"])
    return output.getvalue()

def export_donors_csv(db: Session, blood_group: Optional[str] = None, camp_id: Optional[int] = None) -> str:
    query = db.query(Donor).filter(Donor.is_active == True)
    if blood_group:
        query = query.filter(Donor.blood_group == blood_group.upper())
    if camp_id:
        query = query.filter(Donor.preferred_camp_id == camp_id)

    donors = query.all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Donor ID", "Full Name", "Blood Group", "Age", "Date of Birth",
        "Phone", "Email", "City", "State", "PIN Code", "Weight (kg)",
        "Screening Status", "Total Donations", "Last Donation Date", "Registration Date"
    ])
    for d in donors:
        writer.writerow([
            d.donor_id, d.full_name, d.blood_group, d.age, d.date_of_birth.strftime("%Y-%m-%d"),
            d.phone, d.email or "", d.city, d.state, d.pin_code, d.weight_kg,
            d.screening_status, d.total_donations,
            d.last_donation_date.strftime("%Y-%m-%d") if d.last_donation_date else "",
            d.registration_date.strftime("%Y-%m-%d %H:%M")
        ])
    return output.getvalue()

def export_report_markdown(db: Session) -> str:
    analytics = compute_blood_group_analytics(db)
    active_donors = db.query(Donor).filter(Donor.is_active == True).all()
    camps = db.query(DonationCamp).all()

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    md = []
    md.append("# LIFEPOINT — Blood Donation Camp Register & Management Report")
    md.append(f"**Generated at:** {now_str}\n")
    md.append("## Executive Summary")
    md.append(f"- **Total Registered Volunteers:** {analytics.total_registered}")
    md.append(f"- **Most Common Blood Group:** {analytics.most_common_blood_group} ({analytics.most_common_count} donors)")
    md.append(f"- **Least Common Blood Group:** {analytics.least_common_blood_group} ({analytics.least_common_count} donors)")
    md.append(f"- **Total Camps Registered:** {len(camps)}\n")

    md.append("## Blood Group Distribution")
    md.append("| Blood Group | Total Donors | Eligible | Temporarily Deferred | Permanently Deferred | Completed Donations | Share (%) |")
    md.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
    for bg in analytics.blood_groups:
        md.append(f"| {bg.blood_group} | {bg.total_donors} | {bg.eligible_donors} | {bg.temporarily_deferred} | {bg.permanently_deferred} | {bg.completed_donations} | {bg.percentage}% |")

    md.append("\n## Donation Camps Summary")
    md.append("| Camp Code | Camp Name | Venue | City | Status | Capacity |")
    md.append("| :--- | :--- | :--- | :--- | :--- | :--- |")
    for c in camps:
        md.append(f"| {c.camp_code} | {c.name} | {c.venue} | {c.city} | {c.status} | {c.capacity} |")

    md.append("\n## Active Donors Directory")
    md.append("| Donor ID | Name | Blood Group | Phone | City | Status |")
    md.append("| :--- | :--- | :--- | :--- | :--- | :--- |")
    for d in active_donors[:30]:
        md.append(f"| {d.donor_id} | {d.full_name} | {d.blood_group} | {d.phone} | {d.city} | {d.screening_status} |")

    return "\n".join(md)

def export_report_plain_text(db: Session) -> str:
    analytics = compute_blood_group_analytics(db)
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    lines = [
        "================================================================================",
        "             LIFEPOINT - BLOOD DONATION MANAGEMENT SYSTEM REPORT                ",
        "================================================================================",
        f"Generated At: {now_str}",
        f"Total Registered Volunteers: {analytics.total_registered}",
        f"Most Common Blood Group:     {analytics.most_common_blood_group} ({analytics.most_common_count})",
        f"Least Common Blood Group:    {analytics.least_common_blood_group} ({analytics.least_common_count})",
        "--------------------------------------------------------------------------------",
        "BLOOD GROUP BREAKDOWN:",
        f"{'Group':<8}{'Total':<8}{'Eligible':<12}{'Temp Def':<12}{'Perm Def':<12}{'Donations':<12}{'Share (%)':<10}",
        "-" * 80
    ]
    for bg in analytics.blood_groups:
        lines.append(f"{bg.blood_group:<8}{bg.total_donors:<8}{bg.eligible_donors:<12}{bg.temporarily_deferred:<12}{bg.permanently_deferred:<12}{bg.completed_donations:<12}{bg.percentage}%")

    lines.append("================================================================================")
    return "\n".join(lines)

def generate_pdf_report(db: Session) -> bytes:
    """
    Generates a professional PDF report using reportlab.
    """
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#B91C1C"),
        alignment=1
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#64748B"),
        alignment=1
    )
    section_style = ParagraphStyle(
        "ReportSection",
        parent=styles["Heading2"],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#7F1D1D")
    )

    story = []
    story.append(Paragraph("LIFEPOINT — Blood Donation Camp System", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"Executive Report • Generated on {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}", subtitle_style))
    story.append(Spacer(1, 15))

    analytics = compute_blood_group_analytics(db)
    
    # Executive Summary Box
    summary_data = [
        ["Total Registered Donors", str(analytics.total_registered), "Most Common Group", str(analytics.most_common_blood_group)],
        ["Least Common Group", str(analytics.least_common_blood_group), "Active Groups Tracked", str(len(analytics.blood_groups))]
    ]
    summary_table = Table(summary_data, colWidths=[150, 120, 150, 120])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#E2E8F0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor("#111827")),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 15))

    story.append(Paragraph("Blood Group Analytics & Distribution", section_style))
    story.append(Spacer(1, 8))

    # Blood Group Table
    bg_table_data = [["Blood Group", "Total Donors", "Eligible", "Temp Deferred", "Perm Deferred", "Donations", "Distribution %"]]
    for bg in analytics.blood_groups:
        bg_table_data.append([
            bg.blood_group,
            str(bg.total_donors),
            str(bg.eligible_donors),
            str(bg.temporarily_deferred),
            str(bg.permanently_deferred),
            str(bg.completed_donations),
            f"{bg.percentage}%"
        ])

    bg_table = Table(bg_table_data, colWidths=[80, 75, 75, 80, 80, 75, 75])
    bg_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#B91C1C")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(bg_table)
    story.append(Spacer(1, 15))

    # Camps Table
    camps = db.query(DonationCamp).all()
    if camps:
        story.append(Paragraph("Donation Camps Status", section_style))
        story.append(Spacer(1, 8))
        camp_data = [["Code", "Camp Name", "Venue", "City", "Capacity", "Status"]]
        for c in camps:
            camp_data.append([c.camp_code, c.name, c.venue[:20], c.city, str(c.capacity), c.status])
        camp_table = Table(camp_data, colWidths=[70, 150, 120, 80, 50, 70])
        camp_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#7F1D1D")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ]))
        story.append(camp_table)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
