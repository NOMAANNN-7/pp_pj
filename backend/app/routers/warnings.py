from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List
from backend.app.database import get_db
from backend.app.models.camp import DonationCamp
from backend.app.models.donor import Donor
from backend.app.schemas.analytics import WarningItem

router = APIRouter(prefix="/api/warnings", tags=["Warnings & Alerts"])

@router.get("", response_model=List[WarningItem])
def get_system_warnings(db: Session = Depends(get_db)):
    warnings: List[WarningItem] = []
    today = date.today()

    # 1. Upcoming camps approaching in next 7 days
    seven_days = today + timedelta(days=7)
    upcoming_soon = (
        db.query(DonationCamp)
        .filter(
            DonationCamp.status == "UPCOMING",
            DonationCamp.start_date >= today,
            DonationCamp.start_date <= seven_days
        )
        .all()
    )
    for c in upcoming_soon:
        days_left = (c.start_date - today).days
        warnings.append(
            WarningItem(
                id=f"camp-approaching-{c.id}",
                level="warning" if days_left > 2 else "critical",
                title=f"Camp Approaching: {c.name}",
                message=f"Camp begins in {days_left} day(s) on {c.start_date.strftime('%b %d, %Y')} at {c.venue}, {c.city}. Ensure volunteer roster is verified.",
                category="Camp Logistics",
                action_url="/camps"
            )
        )

    # 2. Camps near capacity or capacity reached
    active_or_upcoming = db.query(DonationCamp).filter(DonationCamp.status.in_(["UPCOMING", "ACTIVE"])).all()
    for c in active_or_upcoming:
        registered_count = db.query(Donor).filter(Donor.preferred_camp_id == c.id, Donor.is_active == True).count()
        if c.capacity > 0:
            fill_pct = (registered_count / c.capacity) * 100
            if fill_pct >= 100:
                warnings.append(
                    WarningItem(
                        id=f"camp-capacity-full-{c.id}",
                        level="critical",
                        title=f"Camp Capacity Reached: {c.name}",
                        message=f"{c.name} has reached {registered_count}/{c.capacity} volunteers (100% capacity). Additional registrations may require extra slots.",
                        category="Capacity Alert",
                        action_url="/camps"
                    )
                )
            elif fill_pct >= 85:
                warnings.append(
                    WarningItem(
                        id=f"camp-capacity-near-{c.id}",
                        level="warning",
                        title=f"Camp Approaching Capacity: {c.name}",
                        message=f"{c.name} is at {registered_count}/{c.capacity} capacity ({fill_pct:.0f}%).",
                        category="Capacity Alert",
                        action_url="/camps"
                    )
                )

    # 3. Critical Low Stock / Rare Blood Groups (e.g. AB-, B-, O-)
    donors = db.query(Donor).filter(Donor.is_active == True).all()
    eligible_donors = [d for d in donors if d.screening_status in ("PRELIMINARY_ELIGIBLE", "VERIFIED_ELIGIBLE")]
    from collections import Counter
    bg_counts = Counter(d.blood_group for d in eligible_donors)
    for rare_group in ["AB-", "B-", "O-", "A-"]:
        count = bg_counts.get(rare_group, 0)
        if count < 2:
            warnings.append(
                WarningItem(
                    id=f"low-stock-{rare_group}",
                    level="info",
                    title=f"Low Volunteer Pool: {rare_group}",
                    message=f"Only {count} eligible donor(s) registered with rare group {rare_group}. Consider targeted volunteer outreach.",
                    category="Blood Group Inventory",
                    action_url="/analytics"
                )
            )

    # 4. Donors ready for re-donation follow-up (> 90 days since last donation)
    followup_candidates = 0
    for d in eligible_donors:
        if d.last_donation_date:
            days_since = (today - d.last_donation_date).days
            if days_since >= 90:
                followup_candidates += 1
    if followup_candidates > 0:
        warnings.append(
            WarningItem(
                id="overdue-followups",
                level="info",
                title="Donors Ready For New Cycle",
                message=f"{followup_candidates} previously active donors have completed their 90-day recovery window and are eligible for upcoming camps.",
                category="Follow-up Reminder",
                action_url="/donors"
            )
        )

    # 5. Pending Medical Screening Clearances
    pending_screening = sum(1 for d in donors if d.screening_status == "PRELIMINARY_ELIGIBLE")
    if pending_screening > 0:
        warnings.append(
            WarningItem(
                id="pending-screenings",
                level="info",
                title="Preliminary Screenings Awaiting Camp Doctor Verification",
                message=f"{pending_screening} volunteer record(s) have passed preliminary screening and require physical physician verification during camp attendance.",
                category="Medical Protocol",
                action_url="/donors"
            )
        )

    return warnings
