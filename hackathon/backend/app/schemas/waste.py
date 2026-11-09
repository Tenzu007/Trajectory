from typing import Optional
from pydantic import BaseModel

class LedgerCreate(BaseModel):
    shift: str = "Shift A"
    milkReceivedLiters: float = 50000.0
    fatPercent: float = 4.5
    snfPercent: float = 8.5
    pouchMilkLiters: float = 30000.0
    curdKg: float = 8000.0
    gheeKg: float = 200.0
    paneerKg: float = 300.0
    rinseRecovered: float = 300.0
    milkSentDrain: float = 150.0
    spills: float = 50.0
    rejected: float = 0.0

class WasteBatchRegister(BaseModel):
    department: str = "Processing Hall"
    productionStage: str = "Centrifugal Separation"
    materialName: str = "Sweet Whey Matrix"
    wasteType: str = "Dairy Organic"
    quantity: float = 1500.0
    unit: str = "Liters"
    reason: str = "Surplus daily production"
    contaminationStatus: str = "None - Food Grade"
    shelfLifeHours: int = 24
    storageCondition: str = "Chilled (4°C)"

class WasteQCVerify(BaseModel):
    category: str  # 'Reusable', 'Treatable', 'Disposal'
    verifiedBy: Optional[str] = "Dr. Sunita Mehta (QC Lead)"

class LeakCreate(BaseModel):
    location: str
    tankOrMachine: str
    type: str = "Milk Leak"
    quantity: str
    shift: str = "Shift A"
    reportedBy: str
    assignedTo: str

class LeakStatusUpdate(BaseModel):
    status: str

class RinseRecoveryCreate(BaseModel):
    lineName: str
    productName: str
    shift: Optional[str] = "Shift A"
    recoverableEstimateLiters: float
    actualRecoveredLiters: float
    temperatureCelsius: Optional[float] = None
    phLevel: Optional[float] = None
    fatPercent: Optional[float] = None
    snfPercent: Optional[float] = None
    operatorName: Optional[str] = "Operator"
    date: Optional[str] = None
    time: Optional[str] = None

class RinseQCVerifyRequest(BaseModel):
    temperatureCelsius: Optional[float] = None
    phLevel: Optional[float] = None
    fatPercent: Optional[float] = None
    snfPercent: Optional[float] = None
    microbiologicalStatus: Optional[str] = "Pass (< 10 CFU/ml)"
    qcStatus: Optional[str] = None  # 'Verified', 'Rejected', 'Pending', or None for auto
    qcRemarks: Optional[str] = None
    verifiedBy: Optional[str] = "Dr. Sunita Mehta (QC Lead)"

class RinseThresholdsUpdate(BaseModel):
    costPerLiterInr: Optional[float] = None
    minPh: Optional[float] = None
    maxPh: Optional[float] = None
    maxTemp: Optional[float] = None
    minSnf: Optional[float] = None
    minFat: Optional[float] = None


