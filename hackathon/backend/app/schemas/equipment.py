from typing import Optional
from pydantic import BaseModel

class EquipmentStatusUpdate(BaseModel):
    status: str  # 'Clean', 'Needs Cleaning', 'Under Inspection', 'Maintenance Required'
    remarks: Optional[str] = None
    photoUrl: Optional[str] = None

class EquipmentResponse(BaseModel):
    id: str
    equipmentId: str
    name: str
    department: str
    currentStatus: str
    lastCleanedTimestamp: str
    inspectionIntervalHours: int
    supervisorRemarks: Optional[str] = None
    recentVerificationPhotoUrl: Optional[str] = None

