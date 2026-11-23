from collections import Counter
from datetime import date, datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.donor import Donor, DonationRecord
from backend.app.models.camp import DonationCamp
from backend.app.models.audit import AuditLog
from backend.app.config import ALLOWED_BLOOD_GROUPS
from backend.app.schemas.analytics import BloodGroupStat, BloodGroupAnalyticsResponse, DashboardSummary

def compute_blood_group_analytics(
    db: Session,
    camp_id: Optional[int] = None,
    city: Optional[str] = None,
    screening_status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> BloodGroupAnalyticsResponse:
    """
    Computes comprehensive blood group analytics using Python collections.Counter.
    Accurately accounts for all 8 blood groups (handles zero-count groups cleanly).
    """
    query = db.query(Donor).filter(Donor.is_active == True)

    if camp_id is not None:
        query = query.filter(Donor.preferred_camp_id == camp_id)
    if city:
        query = query.filter(func.lower(Donor.city) == city.strip().lower())
    if screening_status:
        query = query.filter(Donor.screening_status == screening_status)
    if start_date:
        query = query.filter(func.date(Donor.registration_date) >= start_date)
    if end_date:
        query = query.filter(func.date(Donor.registration_date) <= end_date)

    donors: List[Donor] = query.all()

    # Python collections.Counter for accurate aggregation
    total_counter = Counter()
    eligible_counter = Counter()
    temp_deferred_counter = Counter()
    perm_deferred_counter = Counter()
    completed_donations_counter = Counter()

    for d in donors:
        bg = d.blood_group
        total_counter[bg] += 1
        if d.screening_status in ("PRELIMINARY_ELIGIBLE", "VERIFIED_ELIGIBLE"):
            eligible_counter[bg] += 1
        elif d.screening_status == "TEMPORARILY_DEFERRED":
            temp_deferred_counter[bg] += 1
        elif d.screening_status == "PERMANENTLY_DEFERRED":
            perm_deferred_counter[bg] += 1
        
        # Accumulate completed donations
        completed_donations_counter[bg] += (d.total_donations or 0)

    total_donors_count = len(donors)

    blood_group_stats: List[BloodGroupStat] = []
    for bg in ALLOWED_BLOOD_GROUPS:
        count = total_counter[bg]
        pct = round((count / total_donors_count * 100), 2) if total_donors_count > 0 else 0.0
        blood_group_stats.append(
            BloodGroupStat(
                blood_group=bg,
                total_donors=count,
                eligible_donors=eligible_counter[bg],
                temporarily_deferred=temp_deferred_counter[bg],
                permanently_deferred=perm_deferred_counter[bg],
                completed_donations=completed_donations_counter[bg],
                percentage=pct
            )
        )

    # Determine most and least common blood groups
    most_common_bg = None
    least_common_bg = None
    most_count = 0
    least_count = 0

    if total_donors_count > 0:
        most_common_tuple = total_counter.most_common(1)
        if most_common_tuple:
            most_common_bg = most_common_tuple[0][0]
            most_count = most_common_tuple[0][1]

        # Filter to allowed blood groups with their counts for least common
        ordered = sorted(ALLOWED_BLOOD_GROUPS, key=lambda g: total_counter[g])
        least_common_bg = ordered[0]
        least_count = total_counter[least_common_bg]

    return BloodGroupAnalyticsResponse(
        blood_groups=blood_group_stats,
        total_registered=total_donors_count,
        most_common_blood_group=most_common_bg,
        least_common_blood_group=least_common_bg,
        most_common_count=most_count,
        least_common_count=least_count
    )

def compute_dashboard_summary(db: Session) -> DashboardSummary:
    """
    Computes real-time executive dashboard KPIs and charts directly from database.
    Never hardcoded.
    """
    active_donors = db.query(Donor).filter(Donor.is_active == True).all()
    total_volunteers = len(active_donors)

    eligible_count = sum(1 for d in active_donors if d.screening_status in ("PRELIMINARY_ELIGIBLE", "VERIFIED_ELIGIBLE"))
    temp_deferred = sum(1 for d in active_donors if d.screening_status == "TEMPORARILY_DEFERRED")
    perm_deferred = sum(1 for d in active_donors if d.screening_status == "PERMANENTLY_DEFERRED")
    completed_donations = sum(d.total_donations or 0 for d in active_donors)

    # Camp counts
    upcoming_camps = db.query(DonationCamp).filter(DonationCamp.status == "UPCOMING").count()
    active_camps = db.query(DonationCamp).filter(DonationCamp.status == "ACTIVE").count()

    # New registrations this month
    today = date.today()
    first_of_month = datetime(today.year, today.month, 1)
    new_this_month = sum(1 for d in active_donors if d.registration_date >= first_of_month)

    # Blood group counts using Counter
    bg_counter = Counter(d.blood_group for d in active_donors)
    blood_group_counts = {bg: bg_counter[bg] for bg in ALLOWED_BLOOD_GROUPS}
    most_common_bg = bg_counter.most_common(1)[0][0] if active_donors else None

    # Registration trends (e.g. past 14 days or by month)
    date_counter = Counter()
    for d in active_donors:
        reg_d = d.registration_date.strftime("%Y-%m-%d")
        date_counter[reg_d] += 1

    # Last 14 days trend
    trend_dates = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(13, -1, -1)]
    registration_trends = [{"date": d_str, "count": date_counter.get(d_str, 0)} for d_str in trend_dates]

    # Eligibility distribution
    eligibility_distribution = {
        "Eligible": eligible_count,
        "Temporarily Deferred": temp_deferred,
        "Permanently Deferred": perm_deferred
    }

    # Recent donors (last 6)
    recent_donors = (
        db.query(Donor)
        .filter(Donor.is_active == True)
        .order_by(Donor.registration_date.desc())
        .limit(6)
        .all()
    )
    recent_donors_data = [
        {
            "id": d.id,
            "donor_id": d.donor_id,
            "full_name": d.full_name,
            "blood_group": d.blood_group,
            "phone": d.phone,
            "city": d.city,
            "screening_status": d.screening_status,
            "registration_date": d.registration_date.strftime("%Y-%m-%d %H:%M")
        }
        for d in recent_donors
    ]

    # Recent activity logs (last 8)
    recent_logs = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .limit(8)
        .all()
    )
    recent_activities_data = [
        {
            "id": log.id,
            "activity_id": log.activity_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "description": log.description
        }
        for log in recent_logs
    ]

    return DashboardSummary(
        total_volunteers=total_volunteers,
        eligible_donors=eligible_count,
        temporarily_deferred=temp_deferred,
        permanently_deferred=perm_deferred,
        completed_donations=completed_donations,
        upcoming_camps=upcoming_camps,
        active_camps=active_camps,
        new_registrations_this_month=new_this_month,
        most_common_blood_group=most_common_bg,
        blood_group_counts=blood_group_counts,
        registration_trends=registration_trends,
        eligibility_distribution=eligibility_distribution,
        recent_donors=recent_donors_data,
        recent_activities=recent_activities_data
    )
