from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from backend.app.database import engine, Base, SessionLocal
from backend.app.routers import (
    donors,
    camps,
    analytics,
    import_export,
    audit,
    backup,
    warnings,
    settings
)
from scripts.seed_data import seed_database

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("lifepoint")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Safe schema initialization
    logger.info("[LIFEPOINT] Creating database tables if missing...")
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed if brand new database
    db = SessionLocal()
    try:
        from backend.app.models.donor import Donor
        if db.query(Donor).count() == 0:
            logger.info("[LIFEPOINT] Empty database detected. Seeding initial demonstration data...")
            seed_database(db)
    except Exception as e:
        logger.error(f"[LIFEPOINT] Error initializing database: {e}")
    finally:
        db.close()

    logger.info("[LIFEPOINT] Application initialized successfully.")
    yield
    logger.info("[LIFEPOINT] Shutting down application.")

app = FastAPI(
    title="LIFEPOINT API",
    description="Intelligent Local-First Blood Donation Camp Register & Management System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(donors.router)
app.include_router(camps.router)
app.include_router(analytics.router)
app.include_router(import_export.router)
app.include_router(audit.router)
app.include_router(backup.router)
app.include_router(warnings.router)
app.include_router(settings.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "LIFEPOINT Blood Donation Camp Register & Management System",
        "database": "connected",
        "version": "1.0.0"
    }

# Safe global exception handling without exposing stack traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An internal server error occurred. Please check application logs.",
            "error_detail": str(exc)
        }
    )
