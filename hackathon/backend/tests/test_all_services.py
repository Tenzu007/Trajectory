import os
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.yolo_service import ppe_engine
from app.services.cctv_service import cctv_manager

client = TestClient(app)

# ─── 1. User Registration ───────────────────────────────────────────────────
def test_01_user_registration():
    res = client.post(
        "/api/auth/register",
        headers={"x-user-role": "admin"},
        json={
            "username": "test_operator",
            "email": "test_operator@dairypulse.in",
            "password": "Password123!",
            "full_name": "Test Operator",
            "role": "worker",
            "department": "Airlock Unit 2",
        },
    )
    assert res.status_code in (200, 400)  # 200 created or 400 already exists

# ─── 2. Login & Token Generation ────────────────────────────────────────────
def test_02_login_and_token():
    res = client.post(
        "/api/auth/login",
        json={"username_or_email": "admin@dairypulse.in", "password": "admin123"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "admin"

# ─── 3. Role-Based Access Restrictions ──────────────────────────────────────
def test_03_role_based_restrictions():
    # Worker attempting to access Admin energy management
    res = client.get("/api/energy/machines", headers={"x-user-role": "worker"})
    assert res.status_code == 403

# ─── 4. Worker Pre-Entry Verification ───────────────────────────────────────
def test_04_worker_pre_entry_retrieval():
    res = client.get("/api/hygiene/employees", headers={"x-user-role": "worker"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["employees"]) > 0

# ─── 5. Failed Hygiene Verification (Missing Mask & Gloves) ────────────────
def test_05_failed_hygiene_verification():
    res = client.post(
        "/api/hygiene/verify-pre-entry",
        headers={"x-user-role": "worker"},
        json={
            "employee_id": "DP-2041",
            "simulate_missing_ppe": ["Face Mask", "Gloves"],
            "camera_location": "Gate A - Processing Hall Airlock",
        },
    )
    assert res.status_code == 200
    verif = res.json()["verification"]
    assert verif["status"] == "Failed"
    assert verif["entryDecision"] == "Restricted"
    assert "Face Mask" in verif["missingItems"]

# ─── 6. Successful Hygiene Verification (All PPE Present) ───────────────────
def test_06_successful_hygiene_verification():
    res = client.post(
        "/api/hygiene/verify-pre-entry",
        headers={"x-user-role": "worker"},
        json={
            "employee_id": "DP-2041",
            "simulate_missing_ppe": [],
            "hairnet": True,
            "face_mask": True,
            "apron": True,
            "gloves": True,
            "safety_shoes": True,
            "hands_sanitized": True,
        },
    )
    assert res.status_code == 200
    verif = res.json()["verification"]
    assert verif["status"] == "Passed"
    assert verif["entryDecision"] == "Approved"
    assert len(verif["missingItems"]) == 0

# ─── 7. Database Persistence ────────────────────────────────────────────────
def test_07_database_persistence():
    res = client.get("/api/hygiene/pre-entries", headers={"x-user-role": "admin"})
    assert res.status_code == 200
    entries = res.json()["preEntries"]
    assert len(entries) >= 2

# ─── 8. Video Upload & File Validation ──────────────────────────────────────
def test_08_video_upload_and_cv():
    res = client.post(
        "/api/hygiene/scan-video",
        headers={"x-user-role": "admin"},
        json={"videoFileName": "CCTV_Packaging_Line4_ShiftB.mp4"},
    )
    assert res.status_code == 200
    report = res.json()["report"]
    assert "complianceScorePercent" in report
    assert "detectedViolations" in report

# ─── 9. Actual YOLO / CV Inference ──────────────────────────────────────────
def test_09_actual_yolo_inference():
    # Create test synthetic frame
    frame = np.full((480, 640, 3), 200, dtype=np.uint8)
    cv2.circle(frame, (320, 160), 30, (255, 255, 255), -1)  # Head
    cv2.rectangle(frame, (280, 190), (360, 360), (255, 255, 255), -1)  # Apron

    detections = ppe_engine.detect_frame(frame)
    assert isinstance(detections, list)

# ─── 10. Bounding Box Coordinate Generation ─────────────────────────────────
def test_10_bounding_box_coordinates():
    frame = np.full((480, 640, 3), 180, dtype=np.uint8)
    # Draw clear person profile
    cv2.circle(frame, (200, 100), 20, (255, 255, 255), -1)
    cv2.rectangle(frame, (170, 120), (230, 260), (255, 255, 255), -1)

    annotated = ppe_engine.annotate_frame(frame, ppe_engine.detect_frame(frame))
    assert annotated.shape == frame.shape

# ─── 11. PPE Compliance Evaluation Logic ────────────────────────────────────
def test_11_ppe_compliance_evaluation():
    crop = np.full((200, 100, 3), 255, dtype=np.uint8)  # Clean white apron
    detected, violations = ppe_engine._evaluate_ppe_on_crop(crop)
    assert isinstance(detected, dict)
    assert isinstance(violations, list)

# ─── 12. CCTV Connection ────────────────────────────────────────────────────
def test_12_cctv_camera_list():
    res = client.get("/api/hygiene/cctv-cameras", headers={"x-user-role": "admin"})
    assert res.status_code == 200
    cameras = res.json()["cameras"]
    assert len(cameras) >= 4

# ─── 13. CCTV Disconnection Handling ────────────────────────────────────────
def test_13_cctv_disconnection_handling():
    res = client.post(
        "/api/hygiene/cctv-cameras/CAM-01/test-connection",
        headers={"x-user-role": "admin"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "is_connected" in data

# ─── 14. Violation Alert Generation ─────────────────────────────────────────
def test_14_violation_alert_generation():
    res = client.get("/api/alerts", headers={"x-user-role": "worker"})
    assert res.status_code == 200
    alerts = res.json()["alerts"]
    assert len(alerts) > 0

# ─── 15. Equipment Cleanliness Status Update ────────────────────────────────
def test_15_equipment_inspections():
    res = client.patch(
        "/api/equipment/SILO-RAW-01/status",
        headers={"x-user-role": "worker"},
        json={"status": "Clean", "remarks": "Sanitized via automatic CIP spray head"},
    )
    assert res.status_code == 200
    eq = res.json()["equipment"]
    assert eq["currentStatus"] == "Clean"

# ─── 16. Waste & Mass Balance Calculations ──────────────────────────────────
def test_16_waste_mass_balance():
    # Input 50000, Products accounted 45000, Losses 300 -> Unexplained = 4700 L
    res = client.post(
        "/api/waste/ledger",
        headers={"x-user-role": "staff"},
        json={
            "shift": "Shift C",
            "milkReceivedLiters": 50000,
            "fatPercent": 4.5,
            "snfPercent": 8.5,
            "pouchMilkLiters": 30000,
            "curdKg": 8000,
            "gheeKg": 200,
            "paneerKg": 300,
            "rinseRecovered": 300,
            "milkSentDrain": 150,
            "spills": 50,
            "rejected": 0,
        },
    )
    assert res.status_code == 200
    entry = res.json()["entry"]
    assert entry["unexplainedLossLiters"] >= 0
    assert "financialLossInr" in entry

# ─── 17. Energy Anomaly & Power Simulation ──────────────────────────────────
def test_17_energy_calculations():
    res = client.post(
        "/api/energy/simulate",
        headers={"x-user-role": "admin"},
        json={"reduceHours": 2.5, "idleShutdown": True, "extraRenewablePercent": 25},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["savedKwh"] > 0
    assert data["financialSavingsInr"] > 0

# ─── 18. Dashboard Analytics Telemetry ──────────────────────────────────────
def test_18_dashboard_analytics():
    res = client.get("/api/reports/stats", headers={"x-user-role": "admin"})
    assert res.status_code == 200
    stats = res.json()
    assert "totalWorkers" in stats
    assert "totalMilkIntakeLiters" in stats
    assert "complianceRate" in stats

# ─── 19. Report Generation & CSV Export ─────────────────────────────────────
def test_19_report_generation_csv():
    res = client.get("/api/reports/export-csv", headers={"x-user-role": "admin"})
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "Apex Dairy Cooperative" in res.text

# ─── 20. Unauthorized API Requests (403 Forbidden) ──────────────────────────
def test_20_unauthorized_api_requests():
    # Staff attempting to POST demo reset (Admin only)
    res = client.post("/api/demo/reset", headers={"x-user-role": "staff"})
    assert res.status_code == 403

    # Worker attempting to access Financial Summary (Admin only)
    res2 = client.get("/api/financial/summary", headers={"x-user-role": "worker"})
    assert res2.status_code == 403

