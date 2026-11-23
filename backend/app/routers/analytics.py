from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from backend.app.database import get_db
from backend.app.schemas.analytics import BloodGroupAnalyticsResponse, DashboardSummary
from backend.app.services.analytics_service import (
    compute_blood_group_analytics,
    compute_dashboard_summary
)

router = APIRouter(prefix="/api", tags=["Analytics & Dashboard"])

@router.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    return compute_dashboard_summary(db)

@router.get("/analytics/blood-groups", response_model=BloodGroupAnalyticsResponse)
def get_blood_group_analytics(
    camp_id: Optional[int] = None,
    city: Optional[str] = None,
    screening_status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    return compute_blood_group_analytics(
        db,
        camp_id=camp_id,
        city=city,
        screening_status=screening_status,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/analytics/trends")
def get_analytics_trends(db: Session = Depends(get_db)):
    summary = compute_dashboard_summary(db)
    return {
        "registration_trends": summary.registration_trends,
        "eligibility_distribution": summary.eligibility_distribution
    }
