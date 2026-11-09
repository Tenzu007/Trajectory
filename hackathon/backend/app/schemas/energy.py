from typing import Optional
from pydantic import BaseModel

class EnergySimulateRequest(BaseModel):
    reduceHours: float = 2.0
    idleShutdown: bool = True
    extraRenewablePercent: float = 20.0

class EnergyMachineResponse(BaseModel):
    id: str
    name: str
    department: str
    ratedPowerKw: float
    normalHoursPerDay: float
    actualHours: float
    actualKwh: float
    historicalAvgKwh: float
    isAnomaly: bool
    anomalyPercent: float
    anomalyReason: Optional[str] = None
    recommendation: Optional[str] = None
    potentialSavingsKwh: Optional[float] = 0.0
    potentialSavingsInr: Optional[float] = 0.0

