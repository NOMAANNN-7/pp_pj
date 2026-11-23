import json
from datetime import datetime, date
from pathlib import Path
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.donor import Donor, DonationRecord
from backend.app.models.camp import DonationCamp
from backend.app.models.audit import AuditLog
from backend.app.models.settings import AppSetting
from backend.app.services.audit_service import log_activity
from backend.app.config import BACKUPS_DIR

def create_json_backup(db: Session, backup_name: Optional[str] = None) -> Dict[str, Any]:
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"lifepoint_backup_{timestamp_str}.json" if not backup_name else f"{backup_name}.json"
    file_path = BACKUPS_DIR / filename

    donors = db.query(Donor).all()
    camps = db.query(DonationCamp).all()
    donations = db.query(DonationRecord).all()
    settings = db.query(AppSetting).all()

    backup_data = {
        "metadata": {
            "app": "LIFEPOINT",
            "version": "1.0.0",
            "backup_date": datetime.utcnow().isoformat(),
            "donor_count": len(donors),
            "camp_count": len(camps),
            "donation_count": len(donations)
        },
        "donors": [
            {
                "donor_id": d.donor_id,
                "full_name": d.full_name,
                "date_of_birth": d.date_of_birth.isoformat() if d.date_of_birth else None,
                "age": d.age,
                "gender": d.gender,
                "phone": d.phone,
                "email": d.email,
                "address": d.address,
                "city": d.city,
                "state": d.state,
                "pin_code": d.pin_code,
                "blood_group": d.blood_group,
                "weight_kg": d.weight_kg,
                "last_donation_date": d.last_donation_date.isoformat() if d.last_donation_date else None,
                "total_donations": d.total_donations,
                "preferred_camp_id": d.preferred_camp_id,
                "emergency_contact_name": d.emergency_contact_name,
                "emergency_contact_phone": d.emergency_contact_phone,
                "screening_status": d.screening_status,
                "deferral_reason": d.deferral_reason,
                "deferral_until": d.deferral_until.isoformat() if d.deferral_until else None,
                "medical_notes": d.medical_notes,
                "has_chronic_illness": d.has_chronic_illness,
                "has_recent_surgery": d.has_recent_surgery,
                "has_medication": d.has_medication,
                "consent_data_storage": d.consent_data_storage,
                "consent_contact": d.consent_contact,
                "is_active": d.is_active,
                "registration_date": d.registration_date.isoformat() if d.registration_date else None
            }
            for d in donors
        ],
        "camps": [
            {
                "camp_code": c.camp_code,
                "name": c.name,
                "venue": c.venue,
                "address": c.address,
                "city": c.city,
                "start_date": c.start_date.isoformat() if c.start_date else None,
                "end_date": c.end_date.isoformat() if c.end_date else None,
                "organizer": c.organizer,
                "contact_phone": c.contact_phone,
                "contact_email": c.contact_email,
                "capacity": c.capacity,
                "status": c.status,
                "notes": c.notes
            }
            for c in camps
        ],
        "donations": [
            {
                "donor_id_ref": d.donor.donor_id if d.donor else None,
                "camp_code_ref": d.camp.camp_code if d.camp else None,
                "donation_date": d.donation_date.isoformat() if d.donation_date else None,
                "units_donated": d.units_donated,
                "hemoglobin_level": d.hemoglobin_level,
                "blood_pressure": d.blood_pressure,
                "pulse_rate": d.pulse_rate,
                "phlebotomist_name": d.phlebotomist_name,
                "remarks": d.remarks
            }
            for d in donations
        ],
        "settings": [
            {
                "key": s.key,
                "value": s.value,
                "description": s.description
            }
            for s in settings
        ]
    }

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(backup_data, f, indent=2)

    log_activity(
        db,
        action="BACKUP_CREATED",
        entity_type="SYSTEM",
        entity_id=filename,
        description=f"Created full JSON database backup file: {filename}",
        details=backup_data["metadata"]
    )

    return {
        "filename": filename,
        "file_path": str(file_path),
        "metadata": backup_data["metadata"],
        "backup_content": backup_data
    }

def restore_json_backup(db: Session, backup_content_or_dict: Any) -> Dict[str, Any]:
    if isinstance(backup_content_or_dict, str):
        try:
            data = json.loads(backup_content_or_dict)
        except Exception as e:
            raise ValueError(f"Invalid JSON format: {str(e)}")
    else:
        data = backup_content_or_dict

    if "metadata" not in data or data.get("metadata", {}).get("app") != "LIFEPOINT":
        raise ValueError("Invalid backup file: LIFEPOINT application metadata signature missing.")

    # Restoring camps first
    camps_added = 0
    camp_code_map = {}
    for c_data in data.get("camps", []):
        existing_camp = db.query(DonationCamp).filter(DonationCamp.camp_code == c_data["camp_code"]).first()
        if not existing_camp:
            new_camp = DonationCamp(
                camp_code=c_data["camp_code"],
                name=c_data["name"],
                venue=c_data["venue"],
                address=c_data["address"],
                city=c_data["city"],
                start_date=date.fromisoformat(c_data["start_date"]),
                end_date=date.fromisoformat(c_data["end_date"]),
                organizer=c_data["organizer"],
                contact_phone=c_data["contact_phone"],
                contact_email=c_data.get("contact_email"),
                capacity=c_data.get("capacity", 100),
                status=c_data.get("status", "UPCOMING"),
                notes=c_data.get("notes")
            )
            db.add(new_camp)
            db.flush()
            camp_code_map[new_camp.camp_code] = new_camp.id
            camps_added += 1
        else:
            camp_code_map[existing_camp.camp_code] = existing_camp.id

    # Restoring donors
    donors_added = 0
    donor_id_map = {}
    for d_data in data.get("donors", []):
        existing_donor = db.query(Donor).filter(Donor.phone == d_data["phone"]).first()
        if not existing_donor:
            donor = Donor(
                donor_id=d_data["donor_id"],
                full_name=d_data["full_name"],
                date_of_birth=date.fromisoformat(d_data["date_of_birth"]),
                age=d_data["age"],
                gender=d_data.get("gender"),
                phone=d_data["phone"],
                email=d_data.get("email"),
                address=d_data["address"],
                city=d_data["city"],
                state=d_data["state"],
                pin_code=d_data["pin_code"],
                blood_group=d_data["blood_group"],
                weight_kg=d_data["weight_kg"],
                last_donation_date=date.fromisoformat(d_data["last_donation_date"]) if d_data.get("last_donation_date") else None,
                total_donations=d_data.get("total_donations", 0),
                preferred_camp_id=d_data.get("preferred_camp_id"),
                emergency_contact_name=d_data.get("emergency_contact_name"),
                emergency_contact_phone=d_data.get("emergency_contact_phone"),
                screening_status=d_data.get("screening_status", "PRELIMINARY_ELIGIBLE"),
                deferral_reason=d_data.get("deferral_reason"),
                deferral_until=date.fromisoformat(d_data["deferral_until"]) if d_data.get("deferral_until") else None,
                medical_notes=d_data.get("medical_notes"),
                has_chronic_illness=d_data.get("has_chronic_illness", False),
                has_recent_surgery=d_data.get("has_recent_surgery", False),
                has_medication=d_data.get("has_medication", False),
                consent_data_storage=d_data.get("consent_data_storage", True),
                consent_contact=d_data.get("consent_contact", True),
                is_active=d_data.get("is_active", True),
                registration_date=datetime.fromisoformat(d_data["registration_date"]) if d_data.get("registration_date") else datetime.utcnow()
            )
            db.add(donor)
            db.flush()
            donor_id_map[donor.donor_id] = donor.id
            donors_added += 1
        else:
            donor_id_map[existing_donor.donor_id] = existing_donor.id

    db.commit()

    log_activity(
        db,
        action="DATA_RESTORED",
        entity_type="SYSTEM",
        entity_id=None,
        description=f"Restored backup: added {donors_added} donors and {camps_added} camps."
    )

    return {
        "success": True,
        "donors_added": donors_added,
        "camps_added": camps_added
    }
