from sqlalchemy import Column, Integer, String, Date, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class DonationCamp(Base):
    __tablename__ = "donation_camps"

    id = Column(Integer, primary_key=True, index=True)
    camp_code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(150), index=True, nullable=False)
    venue = Column(String(200), nullable=False)
    address = Column(Text, nullable=False)
    city = Column(String(50), index=True, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    organizer = Column(String(100), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    contact_email = Column(String(100), nullable=True)
    capacity = Column(Integer, default=100, nullable=False)
    # Status: UPCOMING, ACTIVE, COMPLETED, CANCELLED
    status = Column(String(20), default="UPCOMING", index=True, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    donors = relationship("Donor", back_populates="preferred_camp")
    donations = relationship("DonationRecord", back_populates="camp")
