from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from backend.app.database import get_db
from backend.app.schemas.donor import (
    DonorCreate,
    DonorUpdate,
    DonorResponse,
    DonationRecordCreate,
    DonationRecordResponse,
    StatusUpdate
)
from backend.app.schemas.common import ApiResponse
from backend.app.services.donor_service import (
    register_donor,
    get_donors,
    get_donor_by_id,
    update_donor,
    soft_delete_donor,
    restore_donor,
    record_donation
)

router = APIRouter(prefix="/api/donors", tags=["Donors"])

@router.get("", response_model=dict)
def list_donors(
    search: Optional[str] = None,
    blood_group: Optional[str] = None,
    screening_status: Optional[str] = None,
    city: Optional[str] = None,
    camp_id: Optional[int] = None,
    include_inactive: bool = False,
    sort_by: str = "registration_date",
    sort_order: str = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    donors, total = get_donors(
        db,
        search=search,
        blood_group=blood_group,
        screening_status=screening_status,
        city=city,
        camp_id=camp_id,
        include_inactive=include_inactive,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )

    items = []
    for d in donors:
        items.append({
            "id": d.id,
            "donor_id": d.donor_id,
            "full_name": d.full_name,
            "date_of_birth": d.date_of_birth.strftime("%Y-%m-%d"),
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
            "last_donation_date": d.last_donation_date.strftime("%Y-%m-%d") if d.last_donation_date else None,
            "total_donations": d.total_donations,
            "preferred_camp_id": d.preferred_camp_id,
            "preferred_camp_name": d.preferred_camp.name if d.preferred_camp else None,
            "emergency_contact_name": d.emergency_contact_name,
            "emergency_contact_phone": d.emergency_contact_phone,
            "screening_status": d.screening_status,
            "deferral_reason": d.deferral_reason,
            "deferral_until": d.deferral_until.strftime("%Y-%m-%d") if d.deferral_until else None,
            "medical_notes": d.medical_notes,
            "has_chronic_illness": d.has_chronic_illness,
            "has_recent_surgery": d.has_recent_surgery,
            "has_medication": d.has_medication,
            "consent_data_storage": d.consent_data_storage,
            "consent_contact": d.consent_contact,
            "is_active": d.is_active,
            "registration_date": d.registration_date.strftime("%Y-%m-%d %H:%M"),
            "updated_at": d.updated_at.strftime("%Y-%m-%d %H:%M")
        })

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def create_donor_endpoint(donor_in: DonorCreate, db: Session = Depends(get_db)):
    donor = register_donor(db, donor_in)
    return ApiResponse(
        success=True,
        message=f"Volunteer {donor.full_name} registered successfully with ID {donor.donor_id}",
        data={"donor_id": donor.donor_id, "id": donor.id, "screening_status": donor.screening_status}
    )

@router.get("/{donor_id_or_int}")
def get_donor_detail(donor_id_or_int: str, db: Session = Depends(get_db)):
    d = get_donor_by_id(db, donor_id_or_int)
    if not d:
        return {"success": False, "message": "Donor not found", "data": None}

    donations = [
        {
            "id": don.id,
            "donation_date": don.donation_date.strftime("%Y-%m-%d"),
            "units_donated": don.units_donated,
            "camp_name": don.camp.name if don.camp else "Direct Center",
            "blood_pressure": don.blood_pressure,
            "hemoglobin_level": don.hemoglobin_level,
            "pulse_rate": don.pulse_rate,
            "phlebotomist_name": don.phlebotomist_name,
            "remarks": don.remarks,
            "created_at": don.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for don in d.donations
    ]

    return {
        "success": True,
        "data": {
            "id": d.id,
            "donor_id": d.donor_id,
            "full_name": d.full_name,
            "date_of_birth": d.date_of_birth.strftime("%Y-%m-%d"),
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
            "last_donation_date": d.last_donation_date.strftime("%Y-%m-%d") if d.last_donation_date else None,
            "total_donations": d.total_donations,
            "preferred_camp_id": d.preferred_camp_id,
            "preferred_camp_name": d.preferred_camp.name if d.preferred_camp else None,
            "emergency_contact_name": d.emergency_contact_name,
            "emergency_contact_phone": d.emergency_contact_phone,
            "screening_status": d.screening_status,
            "deferral_reason": d.deferral_reason,
            "deferral_until": d.deferral_until.strftime("%Y-%m-%d") if d.deferral_until else None,
            "medical_notes": d.medical_notes,
            "has_chronic_illness": d.has_chronic_illness,
            "has_recent_surgery": d.has_recent_surgery,
            "has_medication": d.has_medication,
            "consent_data_storage": d.consent_data_storage,
            "consent_contact": d.consent_contact,
            "is_active": d.is_active,
            "registration_date": d.registration_date.strftime("%Y-%m-%d %H:%M"),
            "updated_at": d.updated_at.strftime("%Y-%m-%d %H:%M"),
            "donations": donations
        }
    }

@router.put("/{donor_id_or_int}", response_model=ApiResponse)
def update_donor_endpoint(donor_id_or_int: str, update_in: DonorUpdate, db: Session = Depends(get_db)):
    updated = update_donor(db, donor_id_or_int, update_in)
    return ApiResponse(
        success=True,
        message=f"Donor {updated.donor_id} updated successfully",
        data={"donor_id": updated.donor_id}
    )

@router.patch("/{donor_id_or_int}/status", response_model=ApiResponse)
def update_donor_status_endpoint(donor_id_or_int: str, status_in: StatusUpdate, db: Session = Depends(get_db)):
    d = get_donor_by_id(db, donor_id_or_int)
    update_data = DonorUpdate(
        screening_status=status_in.screening_status,
        deferral_reason=status_in.deferral_reason,
        deferral_until=status_in.deferral_until,
        medical_notes=status_in.medical_notes
    )
    updated = update_donor(db, donor_id_or_int, update_data)
    return ApiResponse(
        success=True,
        message=f"Donor {updated.donor_id} verification status updated to {updated.screening_status}",
        data={"donor_id": updated.donor_id, "screening_status": updated.screening_status}
    )

@router.delete("/{donor_id_or_int}", response_model=ApiResponse)
def delete_donor_endpoint(donor_id_or_int: str, db: Session = Depends(get_db)):
    soft_delete_donor(db, donor_id_or_int)
    return ApiResponse(success=True, message=f"Donor {donor_id_or_int} has been deactivated (soft-deleted).")

@router.post("/{donor_id_or_int}/restore", response_model=ApiResponse)
def restore_donor_endpoint(donor_id_or_int: str, db: Session = Depends(get_db)):
    restore_donor(db, donor_id_or_int)
    return ApiResponse(success=True, message=f"Donor {donor_id_or_int} has been restored.")

@router.post("/{donor_id_or_int}/donations", response_model=ApiResponse)
def record_donation_endpoint(donor_id_or_int: str, rec_in: DonationRecordCreate, db: Session = Depends(get_db)):
    rec = record_donation(db, donor_id_or_int, rec_in)
    return ApiResponse(
        success=True,
        message="Donation event successfully recorded.",
        data={"donation_id": rec.id, "units": rec.units_donated}
    )
