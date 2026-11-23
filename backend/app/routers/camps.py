from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import Optional, List
from backend.app.database import get_db
from backend.app.schemas.camp import CampCreate, CampUpdate, CampResponse
from backend.app.schemas.common import ApiResponse
from backend.app.services.camp_service import (
    create_camp,
    get_camps,
    get_camp_by_id,
    update_camp,
    delete_camp
)

router = APIRouter(prefix="/api/camps", tags=["Camps"])

@router.get("", response_model=List[CampResponse])
def list_camps(
    search: Optional[str] = None,
    status: Optional[str] = None,
    city: Optional[str] = None,
    db: Session = Depends(get_db)
):
    camp_results = get_camps(db, search=search, status_filter=status, city=city)
    response_items = []
    for camp, donor_count, donation_count in camp_results:
        response_items.append(
            CampResponse(
                id=camp.id,
                camp_code=camp.camp_code,
                name=camp.name,
                venue=camp.venue,
                address=camp.address,
                city=camp.city,
                start_date=camp.start_date,
                end_date=camp.end_date,
                organizer=camp.organizer,
                contact_phone=camp.contact_phone,
                contact_email=camp.contact_email,
                capacity=camp.capacity,
                status=camp.status,
                notes=camp.notes,
                registered_donors_count=donor_count,
                completed_donations_count=donation_count,
                created_at=camp.created_at,
                updated_at=camp.updated_at
            )
        )
    return response_items

@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def create_camp_endpoint(camp_in: CampCreate, db: Session = Depends(get_db)):
    camp = create_camp(db, camp_in)
    return ApiResponse(
        success=True,
        message=f"Donation Camp '{camp.name}' created with code {camp.camp_code}",
        data={"camp_code": camp.camp_code, "id": camp.id}
    )

@router.get("/{camp_id_or_code}")
def get_camp_endpoint(camp_id_or_code: str, db: Session = Depends(get_db)):
    camp = get_camp_by_id(db, camp_id_or_code)
    if not camp:
        return {"success": False, "message": "Camp not found", "data": None}
    
    donors_count = len(camp.donors)
    donations_count = len(camp.donations)

    return {
        "success": True,
        "data": {
            "id": camp.id,
            "camp_code": camp.camp_code,
            "name": camp.name,
            "venue": camp.venue,
            "address": camp.address,
            "city": camp.city,
            "start_date": camp.start_date.strftime("%Y-%m-%d"),
            "end_date": camp.end_date.strftime("%Y-%m-%d"),
            "organizer": camp.organizer,
            "contact_phone": camp.contact_phone,
            "contact_email": camp.contact_email,
            "capacity": camp.capacity,
            "status": camp.status,
            "notes": camp.notes,
            "registered_donors_count": donors_count,
            "completed_donations_count": donations_count,
            "created_at": camp.created_at.strftime("%Y-%m-%d %H:%M")
        }
    }

@router.put("/{camp_id_or_code}", response_model=ApiResponse)
def update_camp_endpoint(camp_id_or_code: str, update_in: CampUpdate, db: Session = Depends(get_db)):
    camp = update_camp(db, camp_id_or_code, update_in)
    return ApiResponse(
        success=True,
        message=f"Camp '{camp.name}' updated successfully.",
        data={"camp_code": camp.camp_code}
    )

@router.delete("/{camp_id_or_code}", response_model=ApiResponse)
def delete_camp_endpoint(camp_id_or_code: str, db: Session = Depends(get_db)):
    delete_camp(db, camp_id_or_code)
    return ApiResponse(success=True, message=f"Camp {camp_id_or_code} deleted successfully.")
