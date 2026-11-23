from fastapi import APIRouter, Depends, UploadFile, File, Response, Body, Query
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from backend.app.database import get_db
from backend.app.services.import_export_service import (
    parse_and_validate_csv,
    execute_csv_import,
    generate_sample_csv,
    export_donors_csv,
    export_report_markdown,
    export_report_plain_text,
    generate_pdf_report
)

router = APIRouter(prefix="/api", tags=["Import & Export"])

@router.get("/import/template")
def download_template():
    csv_data = generate_sample_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=lifepoint_sample_template.csv"}
    )

@router.post("/import/validate")
async def validate_csv_upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content_bytes = await file.read()
    try:
        csv_text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        csv_text = content_bytes.decode("latin-1")

    result = parse_and_validate_csv(db, csv_text)
    return result

@router.post("/import/execute")
def execute_import(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    valid_rows = payload.get("valid_rows", [])
    if not valid_rows:
        return {"success": False, "message": "No valid rows provided for import.", "imported_count": 0}

    imported_count = execute_csv_import(db, valid_rows)
    return {
        "success": True,
        "message": f"Successfully imported {imported_count} donor records.",
        "imported_count": imported_count
    }

@router.get("/reports/export/csv")
def export_csv(
    blood_group: Optional[str] = None,
    camp_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    csv_text = export_donors_csv(db, blood_group=blood_group, camp_id=camp_id)
    filename = f"lifepoint_donors_{blood_group or 'all'}.csv"
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/reports/export/markdown")
def export_markdown(db: Session = Depends(get_db)):
    md_text = export_report_markdown(db)
    return PlainTextResponse(content=md_text, media_type="text/markdown")

@router.get("/reports/export/text")
def export_plain_text(db: Session = Depends(get_db)):
    txt_text = export_report_plain_text(db)
    return PlainTextResponse(content=txt_text, media_type="text/plain")

@router.get("/reports/export/pdf")
def export_pdf(db: Session = Depends(get_db)):
    pdf_bytes = generate_pdf_report(db)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=lifepoint_executive_report.pdf"}
    )
