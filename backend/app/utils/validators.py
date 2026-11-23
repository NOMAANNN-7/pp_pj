import re
from datetime import date
from typing import Tuple, Optional
from backend.app.config import (
    ALLOWED_BLOOD_GROUPS,
    DEFAULT_MIN_AGE,
    DEFAULT_MAX_AGE,
    DEFAULT_MIN_WEIGHT_KG,
    DEFAULT_MAX_WEIGHT_KG,
)

def calculate_age(birth_date: date) -> int:
    today = date.today()
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    return age

def sanitize_string(val: Optional[str]) -> str:
    if not val:
        return ""
    return re.sub(r"\s+", " ", val.strip())

def evaluate_preliminary_screening(
    age: int,
    weight_kg: float,
    has_chronic_illness: bool,
    has_recent_surgery: bool,
    has_medication: bool,
    last_donation_date: Optional[date] = None,
    min_age: int = DEFAULT_MIN_AGE,
    max_age: int = DEFAULT_MAX_AGE,
    min_weight: float = DEFAULT_MIN_WEIGHT_KG
) -> Tuple[str, Optional[str]]:
    """
    Evaluates preliminary screening checklist without claiming medical certification.
    Returns: (screening_status, reason)
    Statuses: PRELIMINARY_ELIGIBLE, TEMPORARILY_DEFERRED, PERMANENTLY_DEFERRED
    """
    if has_chronic_illness:
        return "PERMANENTLY_DEFERRED", "Chronic medical condition reported. Medical clearance required."
    
    if has_recent_surgery:
        return "TEMPORARILY_DEFERRED", "Recent surgical procedure reported. Deferral period recommended."

    if has_medication:
        return "TEMPORARILY_DEFERRED", "Active medication reported. Requires camp physician review."

    if age < min_age:
        return "TEMPORARILY_DEFERRED", f"Age below minimum required donation age of {min_age}."

    if age > max_age:
        return "TEMPORARILY_DEFERRED", f"Age above standard donation age limit of {max_age}. Special clearance needed."

    if weight_kg < min_weight:
        return "TEMPORARILY_DEFERRED", f"Weight is below minimum threshold of {min_weight} kg."

    if last_donation_date:
        days_since = (date.today() - last_donation_date).days
        if days_since < 90:
            return "TEMPORARILY_DEFERRED", f"Donated {days_since} days ago. Mandatory 90-day recovery interval."

    return "PRELIMINARY_ELIGIBLE", None
