import os
import sys
import json
from pathlib import Path
from datetime import date, datetime, timedelta

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.database import SessionLocal, engine, Base
from backend.app.models.donor import Donor, DonationRecord
from backend.app.models.camp import DonationCamp
from backend.app.models.audit import AuditLog
from backend.app.utils.validators import calculate_age

def seed_database(db=None):
    close_db = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_db = True

    try:
        # Check if already seeded
        existing_donors = db.query(Donor).count()
        if existing_donors >= 40:
            print(f"[LIFEPOINT] Database already contains {existing_donors} donors. Skipping seed.")
            return existing_donors

        print("[LIFEPOINT] Initializing demonstration database...")

        # 1. Seed Camps
        camps_data = [
            {
                "camp_code": "CAMP-2026-01",
                "name": "Apex City Hospital Blood Camp",
                "venue": "Apex Hospital Auditorium, Bannerghatta Rd",
                "address": "45/2 Bannerghatta Road, JP Nagar",
                "city": "Bengaluru",
                "start_date": date.today() - timedelta(days=2),
                "end_date": date.today() + timedelta(days=3),
                "organizer": "Apex Healthcare Trust & Red Cross",
                "contact_phone": "+919844011223",
                "contact_email": "bloodcamp@apexhospital.org",
                "capacity": 120,
                "status": "ACTIVE",
                "notes": "State-of-the-art mobile blood bank stationed outside auditorium."
            },
            {
                "camp_code": "CAMP-2026-02",
                "name": "Red Cross Youth Drive 2026",
                "venue": "Bandra Cultural Centre Hall",
                "address": "Opposite Bandra Lake, Bandra West",
                "city": "Mumbai",
                "start_date": date.today() + timedelta(days=4),
                "end_date": date.today() + timedelta(days=5),
                "organizer": "Indian Red Cross Society Maharashtra",
                "contact_phone": "+919820033445",
                "contact_email": "mumbai.drive@redcross.org",
                "capacity": 150,
                "status": "UPCOMING",
                "notes": "College student & volunteer focus with refreshments."
            },
            {
                "camp_code": "CAMP-2026-03",
                "name": "Rotary Metro Lifeline Camp",
                "venue": "India Habitat Centre, Lodhi Road",
                "address": "Lodhi Road, Institutional Area",
                "city": "New Delhi",
                "start_date": date.today() + timedelta(days=12),
                "end_date": date.today() + timedelta(days=13),
                "organizer": "Rotary Club of Delhi Midtown",
                "contact_phone": "+919811055667",
                "contact_email": "rotarydelhi@lifeline.org",
                "capacity": 90,
                "status": "UPCOMING",
                "notes": "Corporate donor drive focusing on rare blood groups."
            },
            {
                "camp_code": "CAMP-2026-04",
                "name": "Civic Community Health Camp",
                "venue": "NTR Community Hall, Banjara Hills",
                "address": "Road No 12, Banjara Hills",
                "city": "Hyderabad",
                "start_date": date.today() - timedelta(days=30),
                "end_date": date.today() - timedelta(days=28),
                "organizer": "Telangana Health Directorate",
                "contact_phone": "+919849077889",
                "contact_email": "communitycamp@telanganahealth.org",
                "capacity": 80,
                "status": "COMPLETED",
                "notes": "Successfully concluded camp with 74 units collected."
            }
        ]

        camp_objs = []
        for c in camps_data:
            existing = db.query(DonationCamp).filter(DonationCamp.camp_code == c["camp_code"]).first()
            if not existing:
                camp = DonationCamp(**c)
                db.add(camp)
                camp_objs.append(camp)
            else:
                camp_objs.append(existing)
        db.commit()

        # Load sample donors
        sample_file = BASE_DIR / "sample_data" / "sample_donors.json"
        with open(sample_file, "r", encoding="utf-8") as f:
            donors_data = json.load(f)

        year = datetime.utcnow().year
        added_count = 0
        for i, d in enumerate(donors_data, 1):
            phone = d["phone"]
            if db.query(Donor).filter(Donor.phone == phone).first():
                continue

            dob = datetime.strptime(d["date_of_birth"], "%Y-%m-%d").date()
            age = calculate_age(dob)
            last_don = datetime.strptime(d["last_donation_date"], "%Y-%m-%d").date() if d.get("last_donation_date") else None
            
            # Map camp preference
            preferred_camp = camp_objs[i % len(camp_objs)] if camp_objs else None

            donor_id = f"LP-{year}-{i:04d}"
            # Reg date staggered over last 30 days
            reg_date = datetime.utcnow() - timedelta(days=(40 - i) % 25, hours=(i * 3) % 20)

            donor = Donor(
                donor_id=donor_id,
                full_name=d["full_name"],
                date_of_birth=dob,
                age=age,
                gender=d.get("gender"),
                phone=phone,
                email=d.get("email"),
                address=d["address"],
                city=d["city"],
                state=d["state"],
                pin_code=d["pin_code"],
                blood_group=d["blood_group"],
                weight_kg=d["weight_kg"],
                last_donation_date=last_don,
                total_donations=d.get("total_donations", 0),
                preferred_camp_id=preferred_camp.id if preferred_camp else None,
                emergency_contact_name=f"Family of {d['full_name'].split()[0]}",
                emergency_contact_phone="+919811099999",
                screening_status=d.get("screening_status", "PRELIMINARY_ELIGIBLE"),
                deferral_reason=d.get("deferral_reason"),
                deferral_until=(date.today() + timedelta(days=90)) if d.get("screening_status") == "TEMPORARILY_DEFERRED" else None,
                medical_notes="Seeded demonstration record for hackathon evaluation.",
                has_chronic_illness=d.get("has_chronic_illness", False),
                has_recent_surgery=d.get("has_recent_surgery", False),
                has_medication=d.get("has_medication", False),
                consent_data_storage=True,
                consent_contact=True,
                is_active=True,
                registration_date=reg_date,
                updated_at=reg_date
            )
            db.add(donor)
            db.flush()
            added_count += 1

            # If donor has total donations > 0, generate historical donation records
            if d.get("total_donations", 0) > 0 and last_don:
                record = DonationRecord(
                    donor_id=donor.id,
                    camp_id=preferred_camp.id if preferred_camp else None,
                    donation_date=last_don,
                    units_donated=1.0,
                    hemoglobin_level=14.2,
                    blood_pressure="120/80",
                    pulse_rate=72,
                    phlebotomist_name="Dr. S. Nair",
                    remarks="Standard successful donation.",
                    created_at=datetime(last_don.year, last_don.month, last_don.day, 11, 30)
                )
                db.add(record)

        # Audit log for seed
        audit = AuditLog(
            action="DATA_SEEDED",
            entity_type="SYSTEM",
            entity_id="SAMPLE_DATA",
            description=f"Initialized database with {added_count} demonstration volunteer records and {len(camp_objs)} camps.",
            timestamp=datetime.utcnow()
        )
        db.add(audit)
        db.commit()

        print(f"[LIFEPOINT] Successfully seeded {added_count} realistic donor records!")
        return added_count
    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    seed_database()
