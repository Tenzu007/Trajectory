from datetime import datetime
import re
from typing import Dict, Optional, Tuple
import cv2
import numpy as np
from sqlalchemy.orm import Session
from app.config import settings
from app.models.cv_models import Camera, CameraEvent
from app.services.yolo_service import ppe_engine

def mask_stream_credentials(url: Optional[str]) -> Optional[str]:
    """Masks username:password in rtsp://user:pass@host:port/stream to avoid credential leak."""
    if not url:
        return None
    return re.sub(r"://([^:@]+):([^@]+)@", r"://***:***@", url)

class CCTVStreamWorker:
    def __init__(self, camera_id: str, stream_url: str):
        self.camera_id = camera_id
        self.stream_url = stream_url
        self.is_connected = False
        self.last_frame = None
        self.last_error = None
        self.fps = 25

    def check_connection(self) -> Tuple[bool, Optional[str], Optional[np.ndarray]]:
        """
        Attempts to genuinely connect to RTSP/HTTP stream using OpenCV.
        Crucial: Never claims connection without actually receiving a valid frame.
        """
        if not self.stream_url:
            self.is_connected = False
            self.last_error = "No stream URL configured"
            return False, self.last_error, None

        cap = cv2.VideoCapture(self.stream_url)
        # Set short timeout to avoid blocking backend
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        try:
            if not cap.isOpened():
                self.is_connected = False
                self.last_error = "Could not open RTSP/HTTP stream via cv2.VideoCapture"
                return False, self.last_error, None

            ret, frame = cap.read()
            if not ret or frame is None or frame.size == 0:
                self.is_connected = False
                self.last_error = "Stream opened but received empty/zero frames"
                return False, self.last_error, None

            self.is_connected = True
            self.last_frame = frame
            self.last_error = None
            return True, None, frame
        except Exception as e:
            self.is_connected = False
            self.last_error = str(e)
            return False, str(e), None
        finally:
            cap.release()

class CCTVManager:
    def __init__(self):
        self.workers: Dict[str, CCTVStreamWorker] = {}

    def get_or_create_worker(self, camera_id: str, stream_url: str) -> CCTVStreamWorker:
        if camera_id not in self.workers or self.workers[camera_id].stream_url != stream_url:
            self.workers[camera_id] = CCTVStreamWorker(camera_id, stream_url)
        return self.workers[camera_id]

    def test_and_update_camera_status(self, camera: Camera, db: Session) -> dict:
        """
        Verifies actual stream connectivity and updates database record.
        """
        if not camera.stream_url:
            camera.status = "Disconnected"
            camera.last_error_message = "No RTSP stream URL provided"
            db.commit()
            return {
                "camera_id": camera.camera_id,
                "status": "Disconnected",
                "is_connected": False,
                "error": camera.last_error_message,
                "masked_url": None,
            }

        worker = self.get_or_create_worker(camera.camera_id, camera.stream_url)
        is_conn, err, frame = worker.check_connection()

        if is_conn and frame is not None:
            camera.status = f"Live 1080p ({camera.fps} FPS)"
            camera.last_frame_received_at = datetime.utcnow()
            camera.last_error_message = None

            # Run actual inference on the captured live frame
            detections = ppe_engine.detect_frame(frame)
            violations = [d for d in detections if d.compliance_status != "Compliant"]
            if violations:
                camera.violations_today += len(violations)
                # Record Camera Event
                event = CameraEvent(
                    camera_id=camera.id,
                    event_type="Live Stream PPE Non-Compliance",
                    severity="High",
                    description=f"Automated frame detection identified {len(violations)} non-compliant worker(s) at {camera.location}.",
                    location=camera.location,
                )
                db.add(event)
        else:
            camera.status = "Disconnected"
            camera.last_error_message = err

        db.commit()

        return {
            "camera_id": camera.camera_id,
            "status": camera.status,
            "is_connected": is_conn,
            "error": camera.last_error_message,
            "masked_url": mask_stream_credentials(camera.stream_url),
            "violations_today": camera.violations_today,
        }

cctv_manager = CCTVManager()

