from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date, datetime

class CampBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    venue: str = Field(..., min_length=2, max_length=200)
    address: str = Field(..., min_length=3)
    city: str = Field(..., min_length=2, max_length=50)
    start_date: date
    end_date: date
    organizer: str = Field(..., min_length=2, max_length=100)
    contact_phone: str = Field(..., min_length=10, max_length=20)
    contact_email: Optional[str] = None
    capacity: int = Field(default=100, ge=1)
    status: str = "UPCOMING"
    notes: Optional[str] = None

    @field_validator("end_date")
    def validate_dates(cls, v, values):
        if "start_date" in values.data and v < values.data["start_date"]:
            raise ValueError("End date cannot be earlier than start date")
        return v

    @field_validator("status")
    def validate_status(cls, v):
        allowed = ["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"]
        v = v.upper()
        if v not in allowed:
            raise ValueError(f"Status must be one of {', '.join(allowed)}")
        return v

class CampCreate(CampBase):
    pass

class CampUpdate(BaseModel):
    name: Optional[str] = None
    venue: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    organizer: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class CampResponse(CampBase):
    id: int
    camp_code: str
    registered_donors_count: int = 0
    completed_donations_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
