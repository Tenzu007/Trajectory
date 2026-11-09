from typing import Optional
from pydantic import BaseModel

class AlertResolveRequest(BaseModel):
    isResolved: bool = True
    resolvedNotes: Optional[str] = None

class AlertResponse(BaseModel):
    id: str
    alertId: str
    pillar: str
    title: str
    description: str
    severity: str
    timestamp: str
    isResolved: bool
    actionUrl: Optional[str] = None
    department: Optional[str] = None
    assignedTo: Optional[str] = None

