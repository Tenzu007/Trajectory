from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routes.auth import router as auth_router
from app.routes.hygiene import router as hygiene_router
from app.routes.ppe_detection import router as ppe_router
from app.routes.cctv import router as cctv_router
from app.routes.equipment import router as equipment_router
from app.routes.waste import router as waste_router
from app.routes.energy import router as energy_router
from app.routes.alerts import router as alerts_router
from app.routes.reports import router as reports_router
from app.routes.demo import router as demo_router, seed_database_tables

from sqlalchemy import text

def ensure_schema_migrations(eng):
    """Ensures existing SQLite tables receive newly added columns seamlessly."""
    with eng.connect() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(waste_batches)"))
            cols = {row[1] for row in res.fetchall()}
            needed = {
                "passport_id": "VARCHAR(100)",
                "qc_certificate_number": "VARCHAR(100)",
                "ph_level": "FLOAT",
                "fat_percent": "FLOAT",
                "snf_percent": "FLOAT",
                "microbial_count": "VARCHAR(100)",
                "temperature_celsius": "FLOAT",
                "moisture_percent": "FLOAT",
                "quality_remarks": "TEXT",
                "storage_location": "VARCHAR(150)",
                "storage_tank_or_bay": "VARCHAR(100)",
                "storage_temperature": "VARCHAR(50)",
                "handling_precautions": "VARCHAR(255)",
                "receiving_industry": "VARCHAR(150)",
                "destination_facility": "VARCHAR(200)",
                "transport_vehicle_number": "VARCHAR(50)",
                "driver_name": "VARCHAR(100)",
                "chain_of_custody_status": "VARCHAR(100)",
            }
            for col, col_type in needed.items():
                if col not in cols:
                    conn.execute(text(f"ALTER TABLE waste_batches ADD COLUMN {col} {col_type}"))

            res_cfg = conn.execute(text("PRAGMA table_info(app_configuration)"))
            cols_cfg = {row[1] for row in res_cfg.fetchall()}
            needed_cfg = {
                "rinse_cost_per_liter_inr": "FLOAT DEFAULT 20.0",
                "rinse_qc_min_ph": "FLOAT DEFAULT 6.4",
                "rinse_qc_max_ph": "FLOAT DEFAULT 6.8",
                "rinse_qc_max_temp": "FLOAT DEFAULT 8.0",
                "rinse_qc_min_snf": "FLOAT DEFAULT 8.0",
                "rinse_qc_min_fat": "FLOAT DEFAULT 0.5",
            }
            for col, col_type in needed_cfg.items():
                if col not in cols_cfg:
                    conn.execute(text(f"ALTER TABLE app_configuration ADD COLUMN {col} {col_type}"))

            conn.commit()
        except Exception as e:
            print(f"Migration check: {e}")

# Ensure tables and initial seed exist on import
ensure_schema_migrations(engine)
Base.metadata.create_all(bind=engine)
_init_db = SessionLocal()
try:
    seed_database_tables(_init_db)
finally:
    _init_db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 DairyPulse Relational Database Tables active.")
    yield
    print("🛑 DairyPulse Backend shutting down cleanly.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Unified Dairy Plant Energy, Waste Analytics & AI Hygiene OS Backend",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Uploads Serving ──────────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# ── Health Check ────────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "engine": "FastAPI + SQLAlchemy + OpenCV / YOLOv8",
        "database": "SQLite / Relational Database Active",
        "timestamp": datetime.utcnow().isoformat(),
    }

# ── Mount Modular Routers ───────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(hygiene_router)
app.include_router(ppe_router)
app.include_router(cctv_router)
app.include_router(equipment_router)
app.include_router(waste_router)
app.include_router(energy_router)
app.include_router(alerts_router)
app.include_router(reports_router)
app.include_router(demo_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
