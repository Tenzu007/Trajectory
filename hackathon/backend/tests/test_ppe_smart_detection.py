import cv2
import numpy as np
import base64
from fastapi.testclient import TestClient
from app.main import app
from app.services.yolo_service import ppe_engine

client = TestClient(app)

def test_bare_face_detection_fails():
    """Verify that a frame with an exposed bare face (no mask) is BLOCKED with RED bounding boxes."""
    # Create synthetic image with bare face positioned with head inside frame
    img = np.full((480, 640, 3), (120, 120, 120), dtype=np.uint8)
    # Face oval centered at (320, 240)
    cv2.ellipse(img, (320, 240), (80, 100), 0, 0, 360, (140, 175, 225), -1)
    # Dark hair on top (exposed hair, no hairnet)
    cv2.ellipse(img, (320, 170), (85, 40), 0, 180, 360, (20, 20, 25), -1)
    # Mouth/lips
    cv2.ellipse(img, (320, 275), (25, 10), 0, 0, 360, (80, 80, 180), -1)

    result = ppe_engine.inspect_worker_webcam_frame(img)
    assert result["workerDetected"] is True
    # Must NOT be approved
    assert result["isApproved"] is False
    assert "Face Mask" in result["missingItems"]
    assert "Clean Apron" in result["missingItems"]
    assert result["statusTone"] == "red"
    assert result["airlockDoorStatus"] == "INTERLOCKED"

    # Verify bounding boxes contain RED missing items
    boxes = result["boundingBoxes"]
    mask_box = next((b for b in boxes if "Face Mask" in b["label"]), None)
    assert mask_box is not None
    assert mask_box["status"] == "Unhygienic"
    assert mask_box["color"] == "#ef4444"

def test_api_verify_webcam_frame_endpoint():
    """Test POST /api/hygiene/verify-webcam-frame with login token."""
    login_res = client.post(
        "/api/auth/login",
        json={"username_or_email": "admin@dairypulse.in", "password": "admin123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Frame with bare face
    img = np.full((480, 640, 3), (100, 100, 100), dtype=np.uint8)
    cv2.ellipse(img, (320, 240), (80, 100), 0, 0, 360, (140, 175, 225), -1)
    _, buffer = cv2.imencode(".jpg", img)
    b64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode()

    res = client.post(
        "/api/hygiene/verify-webcam-frame",
        headers=headers,
        json={
            "employeeId": "EMP-101",
            "frameBase64": b64,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["isApproved"] is False
    assert data["airlockDoorStatus"] == "INTERLOCKED"
    assert "Face Mask" in data["missingItems"]
    assert len(data["boundingBoxes"]) > 0

def test_api_verify_webcam_frame_with_kiosk_override():
    """Test manual override for kiosk simulation."""
    login_res = client.post(
        "/api/auth/login",
        json={"username_or_email": "admin@dairypulse.in", "password": "admin123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Simulate missing mask via override
    res = client.post(
        "/api/hygiene/verify-webcam-frame",
        headers=headers,
        json={
            "employeeId": "EMP-101",
            "hairnet": True,
            "faceMask": False,
            "apron": True,
            "gloves": True,
            "safetyShoes": True,
            "simulateMissingPpe": ["Face Mask"],
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["isApproved"] is False
    assert data["airlockDoorStatus"] == "INTERLOCKED"
    assert "Face Mask" in data["missingItems"]

    # All approved override
    res_approved = client.post(
        "/api/hygiene/verify-webcam-frame",
        headers=headers,
        json={
            "employeeId": "EMP-101",
            "hairnet": True,
            "faceMask": True,
            "apron": True,
            "gloves": True,
            "safetyShoes": True,
            "simulateMissingPpe": [],
        },
    )
    assert res_approved.status_code == 200
    data_appr = res_approved.json()
    assert data_appr["isApproved"] is True
    assert data_appr["airlockDoorStatus"] == "UNLOCKED"
    assert len(data_appr["missingItems"]) == 0
    assert data_appr["preEntryStatus"] == "GREEN – PRE-ENTRY CLEARED"
