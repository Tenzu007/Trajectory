# DairyPulse Production Backend

Production-oriented backend for **DairyPulse – Intelligent Energy, Waste & Hygiene OS**. Built using **Python FastAPI**, **SQLAlchemy 2.0**, **SQLite Relational Database**, **OpenCV**, and **Ultralytics YOLOv8**.

---

## 1. Architecture Overview

```
hackathon/backend/
├── app/
│   ├── main.py                  # FastAPI Application Entrypoint & Lifespan
│   ├── config.py                # Environment & Settings
│   ├── database.py              # SQLAlchemy 2.0 Engine & Session
│   ├── models/                  # 17 Normalized Relational ORM Models
│   │   ├── auth.py              # User, Role, AuditLog
│   │   ├── hygiene.py           # Department, WorkerProfile, HygieneVerification
│   │   ├── cv_models.py         # Camera, CameraEvent, VideoUpload, PPEDetection
│   │   ├── equipment.py         # Equipment, EquipmentInspection
│   │   ├── waste_energy.py      # DailyLedger, WasteBatch, LeakSpillReport, Changeover, MachineEnergy
│   │   └── alert.py             # SystemAlert, Notification
│   ├── schemas/                 # Pydantic Schemas for Validation
│   ├── services/                # Business Logic Services
│   │   ├── auth_service.py      # JWT Generation, Bcrypt Hashing, RBAC Guard
│   │   ├── yolo_service.py      # Genuine OpenCV / YOLOv8 Detection Engine
│   │   ├── cctv_service.py      # OpenCV VideoCapture RTSP Stream Handler
│   │   ├── video_service.py     # Frame-by-frame Video Processor & Violations Logger
│   │   ├── audit_service.py     # Immutable Security Audit Logging
│   │   └── reports_service.py   # Live Telemetry Aggregator & CSV Generator
│   └── routes/                  # Modular REST Routers
│       ├── auth.py              # /api/auth/login, /api/auth/register, /api/config
│       ├── hygiene.py           # /api/hygiene/employees, /api/hygiene/verify-pre-entry
│       ├── ppe_detection.py     # /api/hygiene/scan-video, /api/hygiene/model-status
│       ├── cctv.py              # /api/hygiene/cctv-cameras
│       ├── equipment.py         # /api/equipment
│       ├── waste.py             # /api/waste/ledger, /api/leaks, /api/classification
│       ├── energy.py            # /api/energy/machines, /api/energy/simulate
│       ├── alerts.py            # /api/alerts
│       ├── reports.py           # /api/reports/stats, /api/reports/export-csv
│       └── demo.py              # /api/demo/reset (Pristine Scenarios 1-6)
├── tests/                       # 20 Automated Pytest Tests
│   └── test_all_services.py
├── uploads/                     # Uploaded & annotated video storage
├── models/                      # Trained YOLO weights (.pt) location
├── requirements.txt
├── .env.example
└── README.md
```

---

## 2. Interactive API Documentation

Once the backend is running, open the interactive Swagger OpenAPI docs:
- **Swagger UI:** [http://localhost:5050/docs](http://localhost:5050/docs)
- **ReDoc:** [http://localhost:5050/redoc](http://localhost:5050/redoc)

---

## 3. Database Schema

All 17 normalized tables maintain strict foreign key relationships, indexes, unique constraints, and timestamps:
1. `roles`: Role definitions (`admin`, `staff`, `worker`)
2. `users`: Credentials, bcrypt password hash, active status
3. `audit_logs`: Immutable tracking of user logins and administrative changes
4. `departments`: Facility production halls and processing units
5. `worker_profiles`: Worker shifts, stations, compliance scores, PPE verification states
6. `hygiene_checklists`: Mandatory PPE checklist rules
7. `hygiene_verifications`: Immutable pre-entry audit logs with pass/fail decisions
8. `cameras`: Plant CCTV streams, RTSP URLs, connection health
9. `camera_events`: Live stream violations and stream disconnect events
10. `video_uploads`: Uploaded video audit files with progress and metrics
11. `ppe_detections`: Exact frame coordinates, confidence scores, and violations
12. `equipment`: Plant machinery, status (`Clean`, `Needs Cleaning`), cleaning rosters
13. `equipment_inspections`: Cleaning verification history and supervisor remarks
14. `daily_ledgers`: Milk mass-balance records (unexplained loss, financial loss)
15. `waste_batches`: 3-tier classification batches (Reusable, Treatable, Disposal)
16. `leak_spill_reports`: Recurring leak tracking (Tank 3 valve 5x scenario)
17. `machine_energy`: Machine-wise power telemetry and chiller compressor anomalies
18. `alerts`: Centralized triage alert lifecycle (New, In Progress, Resolved)
19. `app_configuration`: Dynamic plant operating thresholds and FSSAI parameters

---

## 4. Running the Automated Test Suite

Run the 20 automated tests:
```bash
cd backend
PYTHONPATH=. ../venv/bin/pytest tests/test_all_services.py -v
```

All 20 tests verify:
- User registration, login, and JWT token issuance
- Role-based authorization restrictions
- Worker pre-entry approval and restriction rules
- Actual OpenCV / YOLO bounding box coordinate generation
- Real frame-level PPE compliance evaluation
- CCTV connection handling and disconnection errors
- Equipment cleanliness status mutation
- Milk mass-balance calculations & unexplained loss alert triggers
- Energy anomaly savings projection
- Dashboard telemetry aggregation and CSV export

---

## 5. Startup & Deployment

### Development Mode:
```bash
# In hackathon root directory:
npm run dev
# Starts both Python FastAPI (port 5050) and Vite React Frontend (port 5174)
```

### Production Mode:
```bash
cd backend
source ../venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 5050 --workers 4
```

---

## 6. AI Model Weights Integration

Place custom trained YOLOv8 weights at:
`backend/models/ppe_yolov8n.pt`

Supported classes expected by the custom model:
- `person`
- `hairnet`
- `face_mask`
- `apron`
- `protective_gloves`

When custom weights are placed, the engine automatically detects them and runs full deep neural network inference. When absent, the engine genuinely falls back to OpenCV HOG person detection + HSV color region segmentation, reporting the exact model status at `/api/hygiene/model-status` without fabricating predictions.

