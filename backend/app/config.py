import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
BACKUPS_DIR = DATA_DIR / "backups"
EXPORTS_DIR = DATA_DIR / "exports"
SAMPLE_DATA_DIR = BASE_DIR / "sample_data"

DATA_DIR.mkdir(parents=True, exist_ok=True)
BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = DATA_DIR / "lifepoint.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"

ALLOWED_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

DEFAULT_MIN_AGE = 18
DEFAULT_MAX_AGE = 65
DEFAULT_MIN_WEIGHT_KG = 50.0
DEFAULT_MAX_WEIGHT_KG = 160.0
DEFAULT_MIN_DONATION_INTERVAL_DAYS = 90
