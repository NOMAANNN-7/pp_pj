import pytest
from datetime import date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models.donor import Donor
from backend.app.models.camp import DonationCamp
from backend.app.services.donor_service import register_donor, soft_delete_donor, restore_donor
from backend.app.schemas.donor import DonorCreate
from backend.app.services.analytics_service import compute_blood_group_analytics
from backend.app.services.import_export_service import parse_and_validate_csv, execute_csv_import
from backend.app.services.backup_service import create_json_backup, restore_json_backup

# In-memory SQLite with StaticPool for multi-threaded testing
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_donor_registration_and_duplicate_detection():
    db = TestingSessionLocal()
    d_in = DonorCreate(
        full_name="Test Donor",
        date_of_birth=date(1995, 5, 10),
        gender="Male",
        phone="+919999900001",
        email="test@example.com",
        address="123 Test Street",
        city="Bengaluru",
        state="Karnataka",
        pin_code="560001",
        blood_group="O+",
        weight_kg=68.5,
        consent_data_storage=True,
        consent_contact=True
    )
    donor = register_donor(db, d_in)
    assert donor.donor_id.startswith("LP-")
    assert donor.age == (date.today().year - 1995 - ((date.today().month, date.today().day) < (5, 10)))
    assert donor.screening_status == "PRELIMINARY_ELIGIBLE"

    # Duplicate phone must raise error
    with pytest.raises(Exception):
        register_donor(db, d_in)
    db.close()

def test_blood_group_counting_accuracy():
    db = TestingSessionLocal()
    # Register 3 O+, 2 A-, 1 AB+
    groups = ["O+", "O+", "O+", "A-", "A-", "AB+"]
    for i, bg in enumerate(groups, 1):
        d_in = DonorCreate(
            full_name=f"Donor {i}",
            date_of_birth=date(1990, 1, 1),
            phone=f"+91999991000{i}",
            address="Addr",
            city="Pune",
            state="Maharashtra",
            pin_code="411001",
            blood_group=bg,
            weight_kg=70.0
        )
        register_donor(db, d_in)

    analytics = compute_blood_group_analytics(db)
    assert analytics.total_registered == 6
    assert analytics.most_common_blood_group == "O+"
    assert analytics.most_common_count == 3

    bg_map = {item.blood_group: item.total_donors for item in analytics.blood_groups}
    assert bg_map["O+"] == 3
    assert bg_map["A-"] == 2
    assert bg_map["AB+"] == 1
    assert bg_map["B+"] == 0
    assert bg_map["B-"] == 0
    db.close()

def test_csv_import_validation():
    db = TestingSessionLocal()
    # 1 valid row, 1 with duplicate phone, 1 with invalid blood group
    csv_data = (
        "full_name,date_of_birth,phone,address,city,state,pin_code,blood_group,weight_kg\n"
        "Valid One,1992-04-10,+919999920001,Main Rd,Delhi,Delhi,110001,A+,65\n"
        "Valid Two,1994-08-15,+919999920002,Park Rd,Mumbai,Maharashtra,400001,B+,72\n"
        "Invalid Blood,1990-01-01,+919999920003,St,Kolkata,WB,700001,XYZ,70\n"
        "Duplicate Phone,1991-02-02,+919999920001,St,Goa,Goa,403001,O+,60\n"
    )
    result = parse_and_validate_csv(db, csv_data)
    assert result["success"] == True
    assert result["valid_count"] == 2
    assert result["invalid_count"] == 2

    # Execute import
    imported = execute_csv_import(db, result["valid_rows"])
    assert imported == 2
    assert db.query(Donor).count() == 2
    db.close()

def test_json_backup_and_restore():
    db = TestingSessionLocal()
    d_in = DonorCreate(
        full_name="Backup Donor",
        date_of_birth=date(1993, 3, 3),
        phone="+919999930001",
        address="Backup St",
        city="Jaipur",
        state="Rajasthan",
        pin_code="302001",
        blood_group="B-",
        weight_kg=62.0
    )
    register_donor(db, d_in)

    backup_res = create_json_backup(db, backup_name="test_backup")
    backup_dict = backup_res["backup_content"]
    assert backup_dict["metadata"]["donor_count"] == 1

    # Clear DB and restore
    db.query(Donor).delete()
    db.commit()
    assert db.query(Donor).count() == 0

    restore_res = restore_json_backup(db, backup_dict)
    assert restore_res["donors_added"] == 1
    assert db.query(Donor).count() == 1
    db.close()

def test_api_health_and_summary():
    client = TestClient(app)
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    sum_res = client.get("/api/dashboard/summary")
    assert sum_res.status_code == 200
    assert "blood_group_counts" in sum_res.json()
