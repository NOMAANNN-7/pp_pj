from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class Donor(Base):
    __tablename__ = "donors"

    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(String(20), unique=True, index=True, nullable=False)
    full_name = Column(String(100), index=True, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=True)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=False)
    city = Column(String(50), index=True, nullable=False)
    state = Column(String(50), nullable=False)
    pin_code = Column(String(10), nullable=False)
    blood_group = Column(String(5), index=True, nullable=False)
    weight_kg = Column(Float, nullable=False)
    last_donation_date = Column(Date, nullable=True)
    total_donations = Column(Integer, default=0)
    preferred_camp_id = Column(Integer, ForeignKey("donation_camps.id", ondelete="SET NULL"), nullable=True)
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    
    # Screening & Deferral
    # Values: PRELIMINARY_ELIGIBLE, VERIFIED_ELIGIBLE, TEMPORARILY_DEFERRED, PERMANENTLY_DEFERRED
    screening_status = Column(String(30), default="PRELIMINARY_ELIGIBLE", index=True, nullable=False)
    deferral_reason = Column(Text, nullable=True)
    deferral_until = Column(Date, nullable=True)
    medical_notes = Column(Text, nullable=True)
    
    # Health Questionnaire checklist
    has_chronic_illness = Column(Boolean, default=False)
    has_recent_surgery = Column(Boolean, default=False)
    has_medication = Column(Boolean, default=False)
    
    # Consent
    consent_data_storage = Column(Boolean, default=True, nullable=False)
    consent_contact = Column(Boolean, default=True, nullable=False)
    
    # Soft deletion & Timestamps
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    registration_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    preferred_camp = relationship("DonationCamp", back_populates="donors")
    donations = relationship("DonationRecord", back_populates="donor", cascade="all, delete-orphan")

class DonationRecord(Base):
    __tablename__ = "donation_records"

    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("donors.id", ondelete="CASCADE"), nullable=False)
    camp_id = Column(Integer, ForeignKey("donation_camps.id", ondelete="SET NULL"), nullable=True)
    donation_date = Column(Date, default=datetime.utcnow, nullable=False)
    units_donated = Column(Float, default=1.0, nullable=False)
    hemoglobin_level = Column(Float, nullable=True)
    blood_pressure = Column(String(20), nullable=True)
    pulse_rate = Column(Integer, nullable=True)
    phlebotomist_name = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    donor = relationship("Donor", back_populates="donations")
    camp = relationship("DonationCamp", back_populates="donations")
