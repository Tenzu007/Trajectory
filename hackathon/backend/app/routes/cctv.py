from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cv_models import Camera, CameraEvent
from app.schemas.cv import CameraCreate, CameraUpdate
from app.services.auth_service import require_roles
from app.services.cctv_service import cctv_manager, mask_stream_credentials

router = APIRouter(tags=["CCTV Camera Integration"])

@router.get("/api/hygiene/cctv-cameras")
def get_cctv_cameras(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "staff"])),
):
    """Retrieves all registered CCTV plant cameras with genuine connection statuses."""
    cameras = db.query(Camera).filter(Camera.is_active == True).all()
    return {
        "cameras": [
            {
                "id": c.camera_id,
                "name": c.name,
                "location": c.location,
                "status": c.status,
                "violationsToday": c.violations_today,
                "previewImg": c.preview_img,
                "streamUrl": mask_stream_credentials(c.stream_url),
                "fps": c.fps,
                "lastConnected": c.last_frame_received_at.strftime("%Y-%m-%d %H:%M") if c.last_frame_received_at else None,
            }
            for c in cameras
        ]
    }

@router.post("/api/hygiene/cctv-cameras")
def create_cctv_camera(
    req: CameraCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin"])),
):
    """Registers a new plant CCTV camera and validates stream URL (Admin clearance required)."""
    existing = db.query(Camera).filter(Camera.camera_id == req.camera_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Camera ID '{req.camera_id}' already exists.")

    camera = Camera(
        camera_id=req.camera_id,
        name=req.name,
        location=req.location,
        department=req.department,
        stream_url=req.stream_url,
        fps=req.fps,
        status="Connecting",
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)

    # Immediately test stream connection if stream_url provided
    if req.stream_url:
        cctv_manager.test_and_update_camera_status(camera, db)

    return {
        "success": True,
        "camera": {
            "id": camera.camera_id,
            "name": camera.name,
            "location": camera.location,
            "status": camera.status,
            "violationsToday": camera.violations_today,
            "previewImg": camera.preview_img,
        },
    }

@router.post("/api/hygiene/cctv-cameras/{camera_id}/test-connection")
def test_camera_connection(
    camera_id: str,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin"])),
):
    """
    Actively probes the camera's RTSP/HTTP stream using OpenCV VideoCapture.
    Never claims connected without receiving an actual valid image frame.
    """
    camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found.")

    res = cctv_manager.test_and_update_camera_status(camera, db)
    return res

