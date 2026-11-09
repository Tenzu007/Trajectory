import base64
from datetime import datetime
from typing import List, Optional
import cv2
import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.hygiene import WorkerProfile, HygieneVerification
from app.models.alert import SystemAlert
from app.schemas.hygiene import PreEntryVerificationRequest, WebcamVerificationRequest
from app.services.auth_service import require_roles
from app.services.yolo_service import ppe_engine

router = APIRouter(tags=["Pre-Entry Hygiene Verification"])

@router.get("/api/hygiene/employees")
def get_employees(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "worker", "staff"])),
):
    """Retrieves all registered plant workers and their compliance states."""
    workers = db.query(WorkerProfile).all()
    return {
        "employees": [
            {
                "employeeId": w.employee_id,
                "name": w.user.full_name if w.user else "Factory Worker",
                "department": w.user.department if w.user else "Processing Hall",
                "shift": w.shift,
                "assignedStation": w.assigned_station,
                "hairnet": w.hairnet_verified,
                "faceMask": w.mask_verified,
                "gloves": w.gloves_verified,
                "apron": w.apron_verified,
                "safetyBoots": w.safety_boots_verified,
                "handsSanitized": w.hands_sanitized,
                "complianceScore": w.compliance_score,
                "totalVerifications": w.total_verifications,
                "violationsCount": w.violations_count,
            }
            for w in workers
        ]
    }

@router.get("/api/hygiene/pre-entries")
def get_pre_entries(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "worker", "staff"])),
):
    """Retrieves immutable pre-entry audit logs."""
    entries = db.query(HygieneVerification).order_by(HygieneVerification.timestamp.desc()).limit(100).all()
    return {
        "preEntries": [
            {
                "id": e.verification_id,
                "timestamp": e.timestamp.strftime("%Y-%m-%d %H:%M"),
                "employeeId": e.worker.employee_id if e.worker else "Unknown",
                "employeeName": e.worker.user.full_name if (e.worker and e.worker.user) else "Unknown",
                "department": e.worker.user.department if (e.worker and e.worker.user) else "Processing",
                "cameraLocation": e.camera_location,
                "status": e.status,
                "entryDecision": e.entry_decision,
                "confidenceScore": f"{int(e.confidence_score * 100)}%",
                "missingItems": e.missing_items.split(", ") if e.missing_items else [],
                "ppeChecks": {
                    "hairnet": e.hairnet,
                    "faceMask": e.mask,
                    "gloves": e.gloves,
                    "apron": e.apron,
                    "safetyFootwear": e.safety_shoes,
                },
            }
            for e in entries
        ]
    }

@router.post("/api/hygiene/verify-pre-entry")
def verify_pre_entry(
    req: PreEntryVerificationRequest,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "worker"])),
):
    """
    Evaluates mandatory PPE compliance before granting production airlock entry.
    Entry rules:
    - ALL mandatory checks passed = Entry Approved (Passed)
    - ANY mandatory check missing/failed = Entry Restricted (Failed)
    """
    worker = db.query(WorkerProfile).filter(WorkerProfile.employee_id == req.employee_id).first()
    if not worker:
        # Fallback to first worker if not matched
        worker = db.query(WorkerProfile).first()

    missing_items: List[str] = list(req.simulate_missing_ppe or [])

    # Evaluate direct toggles if passed
    if req.hairnet is False and "Hairnet" not in missing_items:
        missing_items.append("Hairnet")
    if req.face_mask is False and "Face Mask" not in missing_items:
        missing_items.append("Face Mask")
    if req.apron is False and "Apron" not in missing_items:
        missing_items.append("Apron")
    if req.gloves is False and "Gloves" not in missing_items:
        missing_items.append("Gloves")
    if req.safety_shoes is False and "Safety Shoes" not in missing_items:
        missing_items.append("Safety Shoes")

    is_approved = len(missing_items) == 0
    status_str = "Passed" if is_approved else "Failed"
    decision_str = "Approved" if is_approved else "Restricted"
    confidence = 0.98 if is_approved else 0.88

    verif_id = f"VERIF-{int(datetime.utcnow().timestamp() * 1000)}"
    verification = HygieneVerification(
        verification_id=verif_id,
        worker_id=worker.id if worker else 1,
        camera_location=req.camera_location,
        status=status_str,
        entry_decision=decision_str,
        hairnet="Hairnet" not in missing_items,
        mask="Face Mask" not in missing_items,
        apron="Apron" not in missing_items,
        gloves="Gloves" not in missing_items,
        safety_shoes="Safety Shoes" not in missing_items,
        hands_sanitized=req.hands_sanitized if req.hands_sanitized is not None else is_approved,
        missing_items=", ".join(missing_items) if missing_items else None,
        confidence_score=confidence,
    )
    db.add(verification)

    # Update worker profile records
    if worker:
        worker.total_verifications += 1
        if not is_approved:
            worker.violations_count += 1
        worker.compliance_score = round(
            max(0.0, 100.0 - (worker.violations_count / max(1, worker.total_verifications)) * 100.0),
            1,
        )
        worker.last_verification_at = datetime.utcnow()
        worker.hairnet_verified = "Hairnet" not in missing_items
        worker.mask_verified = "Face Mask" not in missing_items
        worker.apron_verified = "Apron" not in missing_items
        worker.gloves_verified = "Gloves" not in missing_items
        worker.safety_boots_verified = "Safety Shoes" not in missing_items

    # Trigger Alert if verification failed
    if not is_approved:
        alert = SystemAlert(
            alert_id=f"ALERT-PREENTRY-{verif_id}",
            pillar="AI Hygiene",
            title=f"Airlock Entry Restricted: {worker.user.full_name if (worker and worker.user) else req.employee_id}",
            description=f"Worker attempted entry without mandatory PPE: {', '.join(missing_items)}. Airlock door turnstile remains locked.",
            severity="High",
            department=worker.user.department if (worker and worker.user) else "Processing Airlock",
            action_url="/pre-entry",
            assigned_to="Shift Supervisor",
        )
        db.add(alert)

    db.commit()

    return {
        "verification": {
            "id": verif_id,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
            "employeeId": worker.employee_id if worker else req.employee_id,
            "employeeName": worker.user.full_name if (worker and worker.user) else "Worker",
            "department": worker.user.department if (worker and worker.user) else "Processing",
            "cameraLocation": req.camera_location,
            "status": status_str,
            "entryDecision": decision_str,
            "confidenceScore": f"{int(confidence * 100)}%",
            "missingItems": missing_items,
            "ppeChecks": {
                "hairnet": "Hairnet" not in missing_items,
                "faceMask": "Face Mask" not in missing_items,
                "gloves": "Gloves" not in missing_items,
                "apron": "Apron" not in missing_items,
                "safetyFootwear": "Safety Shoes" not in missing_items,
            },
        }
    }

@router.post("/api/hygiene/verify-webcam-frame")
def verify_webcam_frame(
    req: WebcamVerificationRequest,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "worker", "staff"])),
):
    """
    Standalone USB / Laptop Camera Pre-Entry Hygiene & PPE Verification.
    Inspects:
    1. Hairnet (Head area)
    2. Face Mask (Mouth & nose)
    3. Protective Gloves (Hands)
    4. Clean Apron / Uniform (Torso)
    5. Protective Footwear (Floor / boots)
    Returns real-time green & red bounding boxes, instant alerts, and pre-entry status.
    """
    worker = db.query(WorkerProfile).filter(WorkerProfile.employee_id == req.employee_id).first()
    if not worker:
        worker = db.query(WorkerProfile).first()

    frame = None
    bounding_boxes = []
    detected_items = []

    if req.frame_base64:
        try:
            b64_data = req.frame_base64
            if "," in b64_data:
                b64_data = b64_data.split(",", 1)[1]
            img_bytes = base64.b64decode(b64_data)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"Error decoding webcam frame: {e}")

    # Build manual overrides if explicitly supplied
    manual_overrides = None
    has_explicit_overrides = (
        bool(req.simulate_missing_ppe)
        or any(x is not None for x in [req.hairnet, req.face_mask, req.apron, req.gloves, req.safety_shoes])
    )
    if has_explicit_overrides:
        sim = req.simulate_missing_ppe or []
        manual_overrides = {
            "hairnet": req.hairnet if req.hairnet is not None else ("Hairnet" not in sim),
            "face_mask": req.face_mask if req.face_mask is not None else ("Face Mask" not in sim and "Mask" not in sim),
            "apron": req.apron if req.apron is not None else ("Apron" not in sim and "Clean Apron" not in sim),
            "gloves": req.gloves if req.gloves is not None else ("Gloves" not in sim and "Protective Gloves" not in sim),
            "safety_shoes": req.safety_shoes if req.safety_shoes is not None else ("Safety Shoes" not in sim and "Safety Footwear" not in sim),
        }

    # Run actual AI inference using inspect_worker_webcam_frame
    inspection = ppe_engine.inspect_worker_webcam_frame(frame, manual_overrides=manual_overrides)

    is_cleared = inspection.get("isApproved", False)
    pre_entry_status = inspection.get("preEntryStatus", "YELLOW – VERIFICATION REQUIRED")
    status_tone = inspection.get("statusTone", "yellow")
    entry_decision = inspection.get("entryDecision", "Pending Verification")
    airlock_door = inspection.get("airlockDoorStatus", "INTERLOCKED")
    confidence_str = inspection.get("confidencePercent", "95%")
    missing_items = inspection.get("missingItems", [])
    unknown_items = inspection.get("unknownItems", [])
    alerts = inspection.get("alerts", [])
    ppe_checks = inspection.get("ppeChecks", {})
    bounding_boxes = inspection.get("boundingBoxes", [])

    try:
        confidence_val = float(confidence_str.replace("%", "")) / 100.0
    except Exception:
        confidence_val = 0.95

    status_str = "Passed" if is_cleared else ("Failed" if status_tone == "red" else "Pending")

    # DB Persistence
    verif_id = f"VERIF-WEBCAM-{int(datetime.utcnow().timestamp() * 1000)}"
    verification = HygieneVerification(
        verification_id=verif_id,
        worker_id=worker.id if worker else 1,
        camera_location=req.camera_location,
        status=status_str,
        entry_decision=entry_decision,
        hairnet=ppe_checks.get("hairnet", {}).get("verified", False),
        mask=ppe_checks.get("faceMask", {}).get("verified", False),
        apron=ppe_checks.get("apron", {}).get("verified", False),
        gloves=ppe_checks.get("gloves", {}).get("verified", False),
        safety_shoes=ppe_checks.get("safetyFootwear", {}).get("verified", False),
        hands_sanitized=is_cleared,
        missing_items=", ".join(missing_items) if missing_items else None,
        confidence_score=confidence_val,
    )
    db.add(verification)

    # Update worker profile records
    if worker:
        worker.total_verifications += 1
        if not is_cleared:
            worker.violations_count += 1
        worker.compliance_score = round(
            max(0.0, 100.0 - (worker.violations_count / max(1, worker.total_verifications)) * 100.0),
            1,
        )
        worker.last_verification_at = datetime.utcnow()
        worker.hairnet_verified = ppe_checks.get("hairnet", {}).get("verified", False)
        worker.mask_verified = ppe_checks.get("faceMask", {}).get("verified", False)
        worker.apron_verified = ppe_checks.get("apron", {}).get("verified", False)
        worker.gloves_verified = ppe_checks.get("gloves", {}).get("verified", False)
        worker.safety_boots_verified = ppe_checks.get("safetyFootwear", {}).get("verified", False)

    # Trigger system alert in database if violations detected
    if not is_cleared and (missing_items or status_tone == "red"):
        worker_name = worker.user.full_name if (worker and worker.user) else req.employee_id
        alert = SystemAlert(
            alert_id=f"ALERT-PREENTRY-{verif_id}",
            pillar="AI Hygiene",
            title=f"Airlock Entry Restricted: {worker_name}",
            description=f"Worker attempted entry without required PPE: {', '.join(missing_items)}. Turnstile interlocked.",
            severity="High",
            department=worker.user.department if (worker and worker.user) else "Processing Airlock",
            action_url="/pre-entry",
            assigned_to="Shift Supervisor",
        )
        db.add(alert)

    db.commit()

    return {
        "preEntryStatus": pre_entry_status,
        "statusTone": status_tone,
        "entryDecision": entry_decision,
        "airlockDoorStatus": airlock_door,
        "isApproved": is_cleared,
        "confidencePercent": confidence_str,
        "missingItems": missing_items,
        "unknownItems": unknown_items,
        "alerts": alerts,
        "ppeChecks": ppe_checks,
        "boundingBoxes": bounding_boxes,
        "worker": {
            "employeeId": worker.employee_id if worker else req.employee_id,
            "name": worker.user.full_name if (worker and worker.user) else "Worker",
            "department": worker.user.department if (worker and worker.user) else "Processing Hall",
            "complianceScore": worker.compliance_score if worker else 95.0,
        },
        "verification": {
            "id": verif_id,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
            "employeeId": worker.employee_id if worker else req.employee_id,
            "employeeName": worker.user.full_name if (worker and worker.user) else "Worker",
            "department": worker.user.department if (worker and worker.user) else "Processing",
            "cameraLocation": req.camera_location,
            "status": status_str,
            "entryDecision": entry_decision,
            "confidenceScore": confidence_str,
            "missingItems": missing_items,
            "ppeChecks": {
                "hairnet": ppe_checks.get("hairnet", {}).get("verified", False),
                "faceMask": ppe_checks.get("faceMask", {}).get("verified", False),
                "gloves": ppe_checks.get("gloves", {}).get("verified", False),
                "apron": ppe_checks.get("apron", {}).get("verified", False),
                "safetyFootwear": ppe_checks.get("safetyFootwear", {}).get("verified", False),
            },
        },
    }

