from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import date, datetime
import re

class DonationRecordCreate(BaseModel):
    camp_id: Optional[int] = None
    donation_date: date
    units_donated: float = 1.0
    hemoglobin_level: Optional[float] = None
    blood_pressure: Optional[str] = None
    pulse_rate: Optional[int] = None
    phlebotomist_name: Optional[str] = None
    remarks: Optional[str] = None

class DonationRecordResponse(BaseModel):
    id: int
    donor_id: int
    camp_id: Optional[int] = None
    camp_name: Optional[str] = None
    donation_date: date
    units_donated: float
    hemoglobin_level: Optional[float] = None
    blood_pressure: Optional[str] = None
    pulse_rate: Optional[int] = None
    phlebotomist_name: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DonorBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    date_of_birth: date
    gender: Optional[str] = None
    phone: str = Field(..., min_length=10, max_length=20)
    email: Optional[str] = None
    address: str = Field(..., min_length=3)
    city: str = Field(..., min_length=2, max_length=50)
    state: str = Field(..., min_length=2, max_length=50)
    pin_code: str = Field(..., min_length=3, max_length=10)
    blood_group: str
    weight_kg: float = Field(..., ge=30, le=250)
    last_donation_date: Optional[date] = None
    preferred_camp_id: Optional[int] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    
    screening_status: str = "PRELIMINARY_ELIGIBLE"
    deferral_reason: Optional[str] = None
    deferral_until: Optional[date] = None
    medical_notes: Optional[str] = None
    
    has_chronic_illness: bool = False
    has_recent_surgery: bool = False
    has_medication: bool = False
    
    consent_data_storage: bool = True
    consent_contact: bool = True

    @field_validator("full_name")
    def validate_name(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Full name cannot be blank")
        return v

    @field_validator("phone")
    def validate_phone(cls, v):
        clean_phone = re.sub(r"[^\d+]", "", v)
        if len(clean_phone) < 10:
            raise ValueError("Phone number must have at least 10 digits")
        return clean_phone

    @field_validator("blood_group")
    def validate_blood_group(cls, v):
        allowed = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        v = v.strip().upper()
        if v not in allowed:
            raise ValueError(f"Invalid blood group. Allowed: {', '.join(allowed)}")
        return v

    @field_validator("date_of_birth")
    def validate_dob(cls, v):
        if v > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return v

    @field_validator("email")
    def validate_email(cls, v):
        if v:
            v = v.strip().lower()
            if not re.match(r"[^@]+@[^@]+\.[^@]+", v):
                raise ValueError("Invalid email format")
            return v
        return None

class DonorCreate(DonorBase):
    pass

class DonorUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    blood_group: Optional[str] = None
    weight_kg: Optional[float] = None
    last_donation_date: Optional[date] = None
    preferred_camp_id: Optional[int] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    screening_status: Optional[str] = None
    deferral_reason: Optional[str] = None
    deferral_until: Optional[date] = None
    medical_notes: Optional[str] = None
    has_chronic_illness: Optional[bool] = None
    has_recent_surgery: Optional[bool] = None
    has_medication: Optional[bool] = None
    consent_data_storage: Optional[bool] = None
    consent_contact: Optional[bool] = None
    is_active: Optional[bool] = None

class StatusUpdate(BaseModel):
    screening_status: str
    deferral_reason: Optional[str] = None
    deferral_until: Optional[date] = None
    medical_notes: Optional[str] = None

class DonorResponse(DonorBase):
    id: int
    donor_id: str
    age: int
    total_donations: int
    is_active: bool
    registration_date: datetime
    updated_at: datetime
    preferred_camp_name: Optional[str] = None
    donations: List[DonationRecordResponse] = []

    class Config:
        from_attributes = True
