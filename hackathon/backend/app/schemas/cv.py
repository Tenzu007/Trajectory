from typing import List, Optional
from pydantic import BaseModel

class CameraCreate(BaseModel):
    camera_id: str
    name: str
    location: str
    department: str = "Processing Hall Alpha"
    stream_url: Optional[str] = None
    fps: int = 25

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    stream_url: Optional[str] = None
    is_active: Optional[bool] = None

class CameraResponse(BaseModel):
    id: str
    name: str
    location: str
    status: str
    violationsToday: int
    previewImg: str
    fps: int
    stream_url: Optional[str] = None

class DetectionBox(BaseModel):
    class_name: str
    confidence: float
    x: int
    y: int
    width: int
    height: int
    color_hex: str = "#22c55e"
    compliance: str = "Compliant"  # 'Compliant', 'Non-Compliant', 'Uncertain'

class DetectedViolationItem(BaseModel):
    timestamp: str
    frameNumber: int
    category: str
    confidence: str
    location: str
    severity: str
    evidenceNote: str

class VideoScanResponse(BaseModel):
    fileName: str
    videoDurationSec: float
    analyzedFramesCount: int
    fps: float
    complianceScorePercent: float
    detectedViolations: List[DetectedViolationItem]
    modelUsed: str
    actualYoloInference: bool

class ModelStatusResponse(BaseModel):
    model_name: str
    model_file_exists: bool
    weights_path: str
    supported_classes: List[str]
    missing_classes: List[str]
    engine_ready: bool
    inference_device: str
    recommendation: str

