from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from backend.app.models.camp import DonationCamp
from backend.app.models.donor import Donor, DonationRecord
from backend.app.schemas.camp import CampCreate, CampUpdate
from backend.app.services.audit_service import log_activity

def generate_camp_code(db: Session) -> str:
    year = datetime.utcnow().year
    prefix = f"CAMP-{year}-"
    last_camp = (
        db.query(DonationCamp)
        .filter(DonationCamp.camp_code.like(f"{prefix}%"))
        .order_by(DonationCamp.id.desc())
        .first()
    )
    if not last_camp:
        return f"{prefix}01"
    try:
        last_num = int(last_camp.camp_code.split("-")[-1])
        next_num = last_num + 1
    except (ValueError, IndexError):
        next_num = db.query(DonationCamp).count() + 1
    return f"{prefix}{next_num:02d}"

def create_camp(db: Session, camp_in: CampCreate) -> DonationCamp:
    camp_code = generate_camp_code(db)
    camp = DonationCamp(
        camp_code=camp_code,
        name=camp_in.name,
        venue=camp_in.venue,
        address=camp_in.address,
        city=camp_in.city,
        start_date=camp_in.start_date,
        end_date=camp_in.end_date,
        organizer=camp_in.organizer,
        contact_phone=camp_in.contact_phone,
        contact_email=camp_in.contact_email,
        capacity=camp_in.capacity,
        status=camp_in.status,
        notes=camp_in.notes,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(camp)
    db.commit()
    db.refresh(camp)

    log_activity(
        db,
        action="CAMP_CREATED",
        entity_type="CAMP",
        entity_id=camp.camp_code,
        description=f"Created donation camp '{camp.name}' ({camp.camp_code}) at {camp.venue}, {camp.city}.",
        details={"capacity": camp.capacity, "status": camp.status}
    )
    return camp

def get_camps(
    db: Session,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    city: Optional[str] = None
) -> List[Tuple[DonationCamp, int, int]]:
    query = db.query(DonationCamp)
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            (func.lower(DonationCamp.name).like(s)) |
            (func.lower(DonationCamp.camp_code).like(s)) |
            (func.lower(DonationCamp.venue).like(s)) |
            (func.lower(DonationCamp.city).like(s)) |
            (func.lower(DonationCamp.organizer).like(s))
        )
    if status_filter:
        query = query.filter(DonationCamp.status == status_filter.upper())
    if city:
        query = query.filter(func.lower(DonationCamp.city) == city.strip().lower())

    camps = query.order_by(DonationCamp.start_date.desc()).all()
    results = []
    for c in camps:
        donor_count = db.query(Donor).filter(Donor.preferred_camp_id == c.id, Donor.is_active == True).count()
        donation_count = db.query(DonationRecord).filter(DonationRecord.camp_id == c.id).count()
        results.append((c, donor_count, donation_count))
    return results

def get_camp_by_id(db: Session, camp_id_or_code: str) -> Optional[DonationCamp]:
    if camp_id_or_code.isdigit():
        c = db.query(DonationCamp).filter(DonationCamp.id == int(camp_id_or_code)).first()
        if c:
            return c
    return db.query(DonationCamp).filter(DonationCamp.camp_code == camp_id_or_code).first()

def update_camp(db: Session, camp_id_str: str, update_data: CampUpdate) -> DonationCamp:
    camp = get_camp_by_id(db, camp_id_str)
    if not camp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camp not found")

    data = update_data.model_dump(exclude_unset=True)
    if "end_date" in data and "start_date" in data:
        if data["end_date"] < data["start_date"]:
            raise HTTPException(status_code=400, detail="End date cannot be earlier than start date")
    elif "end_date" in data and data["end_date"] < camp.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be earlier than camp start date")

    for k, v in data.items():
        setattr(camp, k, v)
    camp.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(camp)

    log_activity(
        db,
        action="CAMP_UPDATED",
        entity_type="CAMP",
        entity_id=camp.camp_code,
        description=f"Updated camp '{camp.name}' ({camp.camp_code})."
    )
    return camp

def delete_camp(db: Session, camp_id_str: str) -> bool:
    camp = get_camp_by_id(db, camp_id_str)
    if not camp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camp not found")

    camp_code = camp.camp_code
    camp_name = camp.name
    db.delete(camp)
    db.commit()

    log_activity(
        db,
        action="CAMP_DELETED",
        entity_type="CAMP",
        entity_id=camp_code,
        description=f"Deleted camp '{camp_name}' ({camp_code})."
    )
    return True
