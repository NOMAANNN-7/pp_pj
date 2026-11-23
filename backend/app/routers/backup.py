from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime
from pathlib import Path
import json
from backend.app.database import get_db
from backend.app.services.backup_service import create_json_backup, restore_json_backup
from backend.app.config import BACKUPS_DIR

router = APIRouter(prefix="/api/backup", tags=["Backup & Restore"])

@router.post("")
def trigger_backup(backup_name: Optional[str] = None, db: Session = Depends(get_db)):
    result = create_json_backup(db, backup_name)
    return {
        "success": True,
        "message": f"Database backup saved as {result['filename']}",
        "filename": result["filename"],
        "metadata": result["metadata"]
    }

@router.get("/list")
def list_backups():
    files = []
    if BACKUPS_DIR.exists():
        for f in sorted(BACKUPS_DIR.glob("*.json"), key=lambda x: x.stat().st_mtime, reverse=True):
            try:
                with open(f, "r", encoding="utf-8") as bf:
                    data = json.load(bf)
                    meta = data.get("metadata", {})
            except Exception:
                meta = {}
            files.append({
                "filename": f.name,
                "size_bytes": f.stat().st_size,
                "created_at": datetime.fromtimestamp(f.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S") if 'datetime' in globals() else str(f.stat().st_mtime),
                "metadata": meta
            })
    return {"backups": files}

@router.post("/restore")
async def trigger_restore(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content_bytes = await file.read()
        content_text = content_bytes.decode("utf-8")
        result = restore_json_backup(db, content_text)
        return {
            "success": True,
            "message": f"Database successfully restored: {result['donors_added']} donors and {result['camps_added']} camps imported.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to restore backup: {str(e)}")
