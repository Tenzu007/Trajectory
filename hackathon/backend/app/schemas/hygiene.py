from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

class PreEntryVerificationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    employee_id: Optional[str] = Field(default="EMP-101", alias="employeeId")
    camera_location: Optional[str] = Field(default="Gate A - Processing Hall Airlock", alias="cameraLocation")
    frame_base64: Optional[str] = Field(default=None, alias="frameBase64")
    simulate_missing_ppe: Optional[List[str]] = Field(default_factory=list, alias="simulateMissingPpe")
    hairnet: Optional[bool] = None
    face_mask: Optional[bool] = Field(default=None, alias="faceMask")
    apron: Optional[bool] = None
    gloves: Optional[bool] = None
    safety_shoes: Optional[bool] = Field(default=None, alias="safetyShoes")
    hands_sanitized: Optional[bool] = Field(default=None, alias="handsSanitized")

class WebcamVerificationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    employee_id: Optional[str] = Field(default="EMP-101", alias="employeeId")
    frame_base64: Optional[str] = Field(default=None, alias="frameBase64")
    camera_location: Optional[str] = Field(default="Airlock Pre-Entry Station", alias="cameraLocation")
    simulate_missing_ppe: Optional[List[str]] = Field(default_factory=list, alias="simulateMissingPpe")
    hairnet: Optional[bool] = None
    face_mask: Optional[bool] = Field(default=None, alias="faceMask")
    apron: Optional[bool] = None
    gloves: Optional[bool] = None
    safety_shoes: Optional[bool] = Field(default=None, alias="safetyShoes")
    hands_sanitized: Optional[bool] = Field(default=None, alias="handsSanitized")

class PreEntryVerificationResponse(BaseModel):
    id: str
    verification_id: str
    employee_id: str
    employee_name: str
    department: str
    timestamp: str
    status: str
    entry_decision: str
    ppe_checks: dict
    missing_items: List[str]
    confidence_score: float
    message: str

class WorkerProfileResponse(BaseModel):
    id: int
    employee_id: str
    name: str
    shift: str
    assigned_station: str
    hairnet: bool
    face_mask: bool
    gloves: bool
    apron: bool
    safety_boots: bool
    hands_sanitized: bool
    compliance_score: float
    total_verifications: int
    violations_count: int

