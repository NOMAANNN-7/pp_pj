import re
from datetime import date, datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from fastapi import HTTPException, status
from backend.app.models.donor import Donor, DonationRecord
from backend.app.models.camp import DonationCamp
from backend.app.schemas.donor import DonorCreate, DonorUpdate, DonationRecordCreate
from backend.app.services.audit_service import log_activity
from backend.app.utils.validators import calculate_age, evaluate_preliminary_screening

def generate_donor_id(db: Session) -> str:
    current_year = datetime.utcnow().year
    prefix = f"LP-{current_year}-"
    # Find max existing ID with this prefix
    last_donor = (
        db.query(Donor)
        .filter(Donor.donor_id.like(f"{prefix}%"))
        .order_by(Donor.id.desc())
        .first()
    )
    if not last_donor:
        return f"{prefix}0001"
    try:
        last_num = int(last_donor.donor_id.split("-")[-1])
        next_num = last_num + 1
    except (ValueError, IndexError):
        next_num = db.query(Donor).count() + 1
    return f"{prefix}{next_num:04d}"

def register_donor(db: Session, donor_in: DonorCreate) -> Donor:
    # Check phone uniqueness
    existing_phone = db.query(Donor).filter(Donor.phone == donor_in.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A volunteer with phone number '{donor_in.phone}' is already registered (Donor ID: {existing_phone.donor_id})."
        )

    # Calculate age automatically
    age = calculate_age(donor_in.date_of_birth)

    # Evaluate preliminary screening
    status_eval, reason = evaluate_preliminary_screening(
        age=age,
        weight_kg=donor_in.weight_kg,
        has_chronic_illness=donor_in.has_chronic_illness,
        has_recent_surgery=donor_in.has_recent_surgery,
        has_medication=donor_in.has_medication,
        last_donation_date=donor_in.last_donation_date
    )

    screening_status = donor_in.screening_status
    deferral_reason = donor_in.deferral_reason
    if status_eval != "PRELIMINARY_ELIGIBLE":
        screening_status = status_eval
        if not deferral_reason:
            deferral_reason = reason

    donor_id = generate_donor_id(db)

    donor = Donor(
        donor_id=donor_id,
        full_name=donor_in.full_name,
        date_of_birth=donor_in.date_of_birth,
        age=age,
        gender=donor_in.gender,
        phone=donor_in.phone,
        email=donor_in.email,
        address=donor_in.address,
        city=donor_in.city,
        state=donor_in.state,
        pin_code=donor_in.pin_code,
        blood_group=donor_in.blood_group,
        weight_kg=donor_in.weight_kg,
        last_donation_date=donor_in.last_donation_date,
        total_donations=0,
        preferred_camp_id=donor_in.preferred_camp_id,
        emergency_contact_name=donor_in.emergency_contact_name,
        emergency_contact_phone=donor_in.emergency_contact_phone,
        screening_status=screening_status,
        deferral_reason=deferral_reason,
        deferral_until=donor_in.deferral_until,
        medical_notes=donor_in.medical_notes,
        has_chronic_illness=donor_in.has_chronic_illness,
        has_recent_surgery=donor_in.has_recent_surgery,
        has_medication=donor_in.has_medication,
        consent_data_storage=donor_in.consent_data_storage,
        consent_contact=donor_in.consent_contact,
        is_active=True,
        registration_date=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(donor)
    db.commit()
    db.refresh(donor)

    # Audit log
    log_activity(
        db,
        action="DONOR_REGISTERED",
        entity_type="DONOR",
        entity_id=donor.donor_id,
        description=f"Registered volunteer '{donor.full_name}' with Blood Group {donor.blood_group}. Status: {donor.screening_status}.",
        details={"donor_id": donor.donor_id, "blood_group": donor.blood_group, "city": donor.city}
    )

    return donor

def get_donors(
    db: Session,
    search: Optional[str] = None,
    blood_group: Optional[str] = None,
    screening_status: Optional[str] = None,
    city: Optional[str] = None,
    camp_id: Optional[int] = None,
    include_inactive: bool = False,
    sort_by: str = "registration_date",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 20
) -> Tuple[List[Donor], int]:
    query = db.query(Donor)
    if not include_inactive:
        query = query.filter(Donor.is_active == True)

    if search:
        search_term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Donor.donor_id).like(search_term),
                func.lower(Donor.full_name).like(search_term),
                Donor.phone.like(search_term),
                func.lower(Donor.city).like(search_term),
                func.lower(Donor.email).like(search_term)
            )
        )

    if blood_group:
        query = query.filter(Donor.blood_group == blood_group.strip().upper())

    if screening_status:
        query = query.filter(Donor.screening_status == screening_status)

    if city:
        query = query.filter(func.lower(Donor.city) == city.strip().lower())

    if camp_id is not None:
        query = query.filter(Donor.preferred_camp_id == camp_id)

    total = query.count()

    # Sorting
    sort_column = getattr(Donor, sort_by, Donor.registration_date)
    if sort_order.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    offset = (page - 1) * page_size
    donors = query.offset(offset).limit(page_size).all()
    return donors, total

def get_donor_by_id(db: Session, donor_id_or_int: str) -> Optional[Donor]:
    if donor_id_or_int.isdigit():
        donor = db.query(Donor).filter(Donor.id == int(donor_id_or_int)).first()
        if donor:
            return donor
    return db.query(Donor).filter(Donor.donor_id == donor_id_or_int).first()

def update_donor(db: Session, donor_id_str: str, update_data: DonorUpdate) -> Donor:
    donor = get_donor_by_id(db, donor_id_str)
    if not donor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")

    data_dict = update_data.model_dump(exclude_unset=True)

    # Check phone uniqueness if phone is changing
    if "phone" in data_dict and data_dict["phone"] != donor.phone:
        existing = db.query(Donor).filter(Donor.phone == data_dict["phone"]).first()
        if existing and existing.id != donor.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Phone number {data_dict['phone']} is already used by another donor."
            )

    # Update age if date of birth changed
    if "date_of_birth" in data_dict and data_dict["date_of_birth"]:
        donor.age = calculate_age(data_dict["date_of_birth"])

    for key, value in data_dict.items():
        setattr(donor, key, value)

    donor.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(donor)

    log_activity(
        db,
        action="DONOR_UPDATED",
        entity_type="DONOR",
        entity_id=donor.donor_id,
        description=f"Updated details for donor '{donor.full_name}' ({donor.donor_id}).",
        details=data_dict
    )

    return donor

def soft_delete_donor(db: Session, donor_id_str: str) -> Donor:
    donor = get_donor_by_id(db, donor_id_str)
    if not donor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")

    donor.is_active = False
    donor.updated_at = datetime.utcnow()
    db.commit()

    log_activity(
        db,
        action="DONOR_DELETED",
        entity_type="DONOR",
        entity_id=donor.donor_id,
        description=f"Deactivated (soft-deleted) donor record '{donor.full_name}' ({donor.donor_id})."
    )
    return donor

def restore_donor(db: Session, donor_id_str: str) -> Donor:
    donor = get_donor_by_id(db, donor_id_str)
    if not donor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")

    donor.is_active = True
    donor.updated_at = datetime.utcnow()
    db.commit()

    log_activity(
        db,
        action="DONOR_RESTORED",
        entity_type="DONOR",
        entity_id=donor.donor_id,
        description=f"Restored donor record '{donor.full_name}' ({donor.donor_id})."
    )
    return donor

def record_donation(db: Session, donor_id_str: str, record_in: DonationRecordCreate) -> DonationRecord:
    donor = get_donor_by_id(db, donor_id_str)
    if not donor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")

    donation = DonationRecord(
        donor_id=donor.id,
        camp_id=record_in.camp_id,
        donation_date=record_in.donation_date,
        units_donated=record_in.units_donated,
        hemoglobin_level=record_in.hemoglobin_level,
        blood_pressure=record_in.blood_pressure,
        pulse_rate=record_in.pulse_rate,
        phlebotomist_name=record_in.phlebotomist_name,
        remarks=record_in.remarks,
        created_at=datetime.utcnow()
    )
    db.add(donation)

    # Update donor's last donation date and total donations
    donor.total_donations = (donor.total_donations or 0) + 1
    if not donor.last_donation_date or record_in.donation_date > donor.last_donation_date:
        donor.last_donation_date = record_in.donation_date
    donor.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(donation)

    log_activity(
        db,
        action="DONATION_RECORDED",
        entity_type="DONATION",
        entity_id=str(donation.id),
        description=f"Recorded donation of {donation.units_donated} unit(s) for '{donor.full_name}' ({donor.donor_id})."
    )
    return donation
