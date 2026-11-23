# LIFEPOINT — Blood Donation Camp Register & Management System

> **An intelligent, local-first blood donation camp registration and operations platform.**
> Built with a high-performance Python FastAPI backend, SQLite database persistence, interactive React 19 + TypeScript + Tailwind CSS interface, and an independent Rich-powered Python terminal CLI.

---

## 🚀 Key Highlights & Architectural Strengths

- **Local-First & Zero Paid Dependencies:** Fully functional without internet access, cloud subscriptions, or paid API keys.
- **Accurate Blood Group Engine:** Real-time calculation across all 8 standard blood groups ($A^+, A^-, B^+, B^-, AB^+, AB^-, O^+, O^-$) powered by Python `collections.Counter`.
- **Dual Interfaces Sharing One Core:** Interactive web dashboard and full-featured Python CLI terminal application share the exact same business logic and SQLite database.
- **Strict Clinical Validation:** Real-time age calculation, safe weight validation, duplicate contact detection, and multi-tier screening (Preliminary vs. Verified vs. Deferred).
- **Comprehensive Reporting & Export Center:** Instant export in **PDF** (styled via ReportLab), **CSV**, **Markdown**, and **Plain Text**.
- **Data Integrity & Auditing:** Automated audit logging, tamper-evident activity journal, and full JSON snapshot backup & restoration.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy, Pydantic v2, ReportLab, Pytest, Uvicorn |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React |
| **Terminal CLI** | Python 3, Rich Console, Tables, Panels & Prompts |
| **Persistence** | SQLite (`data/lifepoint.db`), JSON Backup/Restore, CSV Import/Export |
| **Testing** | Pytest, FastAPI TestClient, StaticPool SQLite |

---

## 📂 Project Directory Structure

```text
lifepoint/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application, CORS, lifespan, exception handlers
│   │   ├── database.py          # SQLAlchemy SQLite connection and session management
│   │   ├── config.py            # System constants, file paths, blood group lists
│   │   ├── models/              # Normalized SQLAlchemy models (donors, camps, audit, settings)
│   │   ├── schemas/             # Pydantic v2 request/response schemas with validators
│   │   ├── services/            # Business logic: donor, camp, analytics, import/export, backup
│   │   ├── routers/             # REST endpoints (donors, camps, analytics, reports, warnings)
│   │   └── utils/               # Age calculation, screening evaluations, sanitization
│   ├── tests/
│   │   └── test_lifepoint.py    # 100% passing Pytest test suite
│   └── requirements.txt
├── cli/
│   └── main.py                  # Standalone Rich-powered terminal application
├── frontend/
│   ├── src/
│   │   ├── components/          # Sidebar, Navbar, Toast, Modal, ConfirmDialog, KpiCard, BloodGroupCard
│   │   ├── pages/               # 10 fully functional pages (Dashboard, Donors, Camps, Analytics, etc.)
│   │   ├── services/api.ts      # REST API client
│   │   ├── context/ThemeContext # Light and dark theme persistence
│   │   ├── types/               # TypeScript interfaces
│   │   └── App.tsx              # Root router and hotkey handlers
│   ├── package.json
│   └── vite.config.ts
├── data/
│   ├── lifepoint.db             # Local SQLite database
│   ├── backups/                 # JSON database backup snapshots
│   └── exports/                 # Generated PDF and CSV reports
├── sample_data/
│   ├── sample_donors.csv        # 40 realistic synthetic records across all 8 blood groups
│   └── sample_donors.json       # Demonstration dataset
├── scripts/
│   └── seed_data.py             # Automatic non-duplicating database seeder
├── run.bat                      # One-click Windows runner script
├── pytest.ini                   # Pytest configuration
└── README.md
```

---

## ⚡ Quick Start Instructions (Windows)

### Option 1: One-Click Execution (Recommended)

Simply double-click or run from PowerShell/CMD:
```cmd
.\run.bat
```
`run.bat` automatically verifies Python and Node.js, configures the virtual environment, installs dependencies, verifies database tables, seeds demonstration records, and boots both servers!

---

### Option 2: Individual Component Execution

#### 1. Setup Virtual Environment & Dependencies
```powershell
# Create & activate venv
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### 2. Seed Database
```powershell
.\venv\Scripts\python.exe scripts\seed_data.py
```

#### 3. Run Backend (FastAPI)
```powershell
.\venv\Scripts\uvicorn.exe backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Endpoint: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`

#### 4. Run Frontend (React + Vite)
```powershell
cd frontend
npm run dev
```
- Web Application: `http://127.0.0.1:5173`

#### 5. Run Python Terminal CLI
```powershell
.\venv\Scripts\python.exe cli\main.py
```

#### 6. Run Automated Test Suite
```powershell
.\venv\Scripts\pytest.exe -v
```

---

## 🎯 Step-by-Step Hackathon Demonstration Workflow

Follow this 14-step walkthrough for an impressive live presentation:

1. **Launch Application:** Open `http://127.0.0.1:5173` in your browser.
2. **Review Executive KPIs:** Showcase dynamic counts (Total Registered, Eligible Donors, Deferred Donors, Active Camps) pulled live from SQLite.
3. **Inspect Blood Group Analytics:** Point out the 8 standard blood group cards ($A^+, A^-, B^+, B^-, AB^+, AB^-, O^+, O^-$), donut charts, and percentage distributions.
4. **Demonstrate Real-Time Validation:**
   - Click **+ Register Volunteer**.
   - Type a future date of birth or a weight below 45 kg.
   - Show how the form dynamically calculates age and triggers real-time warning feedback.
5. **Register New Volunteer:**
   - Enter name `Dr. Vikram Malhotra`, DOB `1992-05-15`, Phone `+919811099988`, Blood Group `AB-`, Weight `72 kg`.
   - Submit registration.
   - Observe the instant success receipt dialog displaying assigned ID `LP-2026-0041`.
6. **Verify Metrics Update:**
   - Return to the **Dashboard** or **Blood Group Analytics**.
   - Notice that the `AB-` count immediately incremented by 1!
7. **Search for the Volunteer:**
   - Open **Search & Filters** (or press `Ctrl+K`).
   - Search `Vikram` or `LP-2026-0041`.
   - Open the full donor profile card.
8. **Record a Blood Donation Event:**
   - In **Donor Management**, locate the donor and click the droplet icon.
   - Log 1.0 unit collected at `Apex City Hospital Blood Camp`.
   - Observe total donations counter incrementing.
9. **Demonstrate Bulk CSV Ingestion:**
   - Navigate to **Bulk CSV Import**.
   - Download the sample template or upload `sample_data/sample_donors.csv`.
   - Click **Validate CSV Rows** to demonstrate row-by-row pre-ingestion screening (identifying duplicate phone numbers and valid entries without data loss).
10. **Camp Management & Capacity Warnings:**
    - Navigate to **Donation Camps**.
    - Observe capacity meters and visual threshold alerts when registrations exceed 85%.
11. **Generate Official Reports:**
    - Open **Reports & Exports**.
    - Click **Download PDF** to export a publication-ready PDF report generated via ReportLab.
    - Click **Download CSV** to inspect tabular data with column headers.
12. **Audit Trail Verification:**
    - Navigate to **Activity & Audit Logs**.
    - Review the complete chronological log entries for the registration, donation, and query events performed.
13. **Demonstrate Python Terminal CLI:**
    - In your terminal, run `.\venv\Scripts\python.exe cli\main.py`.
    - Select option `6` (Blood Group Count & Analytics) or option `2` (View All Donors).
    - Note that the newly registered donor `Dr. Vikram Malhotra` is present in the CLI as well!
14. **Test Persistence:**
    - Stop and restart the backend server.
    - Refresh the browser; all records remain permanently saved in `data/lifepoint.db`.

---

## 🔒 Security, Privacy & Data Compliance

- **Localhost by Default:** Zero transmission of donor personal information over external networks.
- **SQL Injection Immune:** All database queries utilize SQLAlchemy ORM parameterized statements.
- **Input Sanitization:** Multi-stage Pydantic validators sanitize phone numbers, dates, and text entries.
- **Medical Disclaimer:** Explicitly marks preliminary screening checklist items as awaiting authorized physical examination by a registered camp physician.
- **Soft Deletion & Restore:** Prevents accidental data loss through reversible deactivation.

---

## 👥 Authors
Developed with passion by the **LIFEPOINT Engineering & Product Team** for live hackathon demonstration.
