from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import Dict, Any
from backend.app.database import get_db
from backend.app.models.settings import AppSetting
from backend.app.services.audit_service import log_activity
from backend.app.models.donor import Donor, DonationRecord
from backend.app.models.camp import DonationCamp
from backend.app.config import (
    DEFAULT_MIN_AGE,
    DEFAULT_MAX_AGE,
    DEFAULT_MIN_WEIGHT_KG,
    DEFAULT_MAX_WEIGHT_KG,
    DEFAULT_MIN_DONATION_INTERVAL_DAYS
)

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    settings_records = db.query(AppSetting).all()
    settings_dict = {
        "min_age": DEFAULT_MIN_AGE,
        "max_age": DEFAULT_MAX_AGE,
        "min_weight_kg": DEFAULT_MIN_WEIGHT_KG,
        "max_weight_kg": DEFAULT_MAX_WEIGHT_KG,
        "min_donation_interval_days": DEFAULT_MIN_DONATION_INTERVAL_DAYS,
        "theme_mode": "system",
        "camp_capacity_warning_pct": 85
    }
    for s in settings_records:
        try:
            if s.key in ("min_age", "max_age", "min_donation_interval_days", "camp_capacity_warning_pct"):
                settings_dict[s.key] = int(s.value)
            elif s.key in ("min_weight_kg", "max_weight_kg"):
                settings_dict[s.key] = float(s.value)
            else:
                settings_dict[s.key] = s.value
        except ValueError:
            settings_dict[s.key] = s.value

    return {"settings": settings_dict}

@router.post("")
def update_settings(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    for key, value in payload.items():
        record = db.query(AppSetting).filter(AppSetting.key == key).first()
        val_str = str(value)
        if record:
            record.value = val_str
        else:
            record = AppSetting(key=key, value=val_str)
            db.add(record)
    db.commit()

    log_activity(
        db,
        action="SETTINGS_UPDATED",
        entity_type="SYSTEM",
        entity_id=None,
        description="Application operational settings updated.",
        details=payload
    )

    return {"success": True, "message": "Settings updated successfully."}

@router.post("/reset-sample-data")
def reset_database_data(db: Session = Depends(get_db)):
    """
    Cleans all existing donors, camps, donations and re-seeds the standard 40 sample records.
    """
    from scripts.seed_data import seed_database
    # Clear records
    db.query(DonationRecord).delete()
    db.query(Donor).delete()
    db.query(DonationCamp).delete()
    db.commit()

    count = seed_database(db)
    return {
        "success": True,
        "message": f"Database has been cleanly reset and re-seeded with {count} demonstration records."
    }
