from pydantic import BaseModel
from typing import Dict, List, Optional, Any

class BloodGroupStat(BaseModel):
    blood_group: str
    total_donors: int
    eligible_donors: int
    temporarily_deferred: int
    permanently_deferred: int
    completed_donations: int
    percentage: float

class BloodGroupAnalyticsResponse(BaseModel):
    blood_groups: List[BloodGroupStat]
    total_registered: int
    most_common_blood_group: Optional[str] = None
    least_common_blood_group: Optional[str] = None
    most_common_count: int = 0
    least_common_count: int = 0

class DashboardSummary(BaseModel):
    total_volunteers: int
    eligible_donors: int
    temporarily_deferred: int
    permanently_deferred: int
    completed_donations: int
    upcoming_camps: int
    active_camps: int
    new_registrations_this_month: int
    most_common_blood_group: Optional[str] = None
    blood_group_counts: Dict[str, int]
    registration_trends: List[Dict[str, Any]]
    eligibility_distribution: Dict[str, int]
    recent_donors: List[Any]
    recent_activities: List[Any]

class WarningItem(BaseModel):
    id: str
    level: str  # info, warning, critical
    title: str
    message: str
    category: str
    action_url: Optional[str] = None
