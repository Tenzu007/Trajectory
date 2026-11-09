from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(String(50), unique=True, nullable=False, index=True)  # e.g. CAM-01
    name = Column(String(100), nullable=False)
    location = Column(String(150), nullable=False)
    department = Column(String(100), default="Processing Hall Alpha")
    stream_url = Column(String(255), nullable=True)  # RTSP or HTTP URL
    status = Column(String(50), default="Disconnected")  # 'Connected', 'Disconnected', 'Connecting', 'Error'
    fps = Column(Integer, default=25)
    violations_today = Column(Integer, default=0)
    preview_img = Column(String(50), default="silo")
    is_active = Column(Boolean, default=True)
    last_frame_received_at = Column(DateTime, nullable=True)
    last_error_message = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    events = relationship("CameraEvent", back_populates="camera")

class CameraEvent(Base):
    __tablename__ = "camera_events"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    event_type = Column(String(100), nullable=False)  # 'PPE Violation', 'Stream Disconnect', 'Unsanitized Touch'
    severity = Column(String(50), default="Medium")  # 'Low', 'Medium', 'High', 'Critical'
    description = Column(Text, nullable=False)
    location = Column(String(150), nullable=True)
    snapshot_path = Column(String(255), nullable=True)
    is_resolved = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    camera = relationship("Camera", back_populates="events")

class VideoUpload(Base):
    __tablename__ = "video_uploads"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    original_file_name = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    processed_video_path = Column(String(255), nullable=True)
    file_size_bytes = Column(Integer, default=0)
    duration_sec = Column(Float, default=0.0)
    total_frames = Column(Integer, default=0)
    analyzed_frames = Column(Integer, default=0)
    fps = Column(Float, default=30.0)
    status = Column(String(50), default="uploaded")  # 'uploaded', 'processing', 'completed', 'failed'
    progress_percent = Column(Float, default=0.0)
    compliance_score_percent = Column(Float, default=0.0)
    detected_violations_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    detections = relationship("PPEDetection", back_populates="video")

class PPEDetection(Base):
    __tablename__ = "ppe_detections"

    id = Column(Integer, primary_key=True, index=True)
    video_upload_id = Column(Integer, ForeignKey("video_uploads.id"), nullable=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    frame_number = Column(Integer, nullable=False)
    timestamp_formatted = Column(String(20), default="00:00")
    timestamp_sec = Column(Float, default=0.0)
    person_track_id = Column(Integer, nullable=True)
    category = Column(String(100), nullable=False)  # 'Missing Face Mask', 'Missing Hairnet', 'Compliant Person'
    confidence = Column(Float, nullable=False)
    location = Column(String(150), nullable=True)
    severity = Column(String(50), default="Medium")
    evidence_note = Column(Text, nullable=True)
    compliance_status = Column(String(50), default="Compliant")  # 'Compliant', 'Non-Compliant', 'Uncertain'
    # Bounding Box stored as normalized or pixel coords: [x1, y1, x2, y2]
    bounding_box_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    video = relationship("VideoUpload", back_populates="detections")

