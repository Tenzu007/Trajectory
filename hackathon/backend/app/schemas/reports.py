from typing import List, Optional
from pydantic import BaseModel

class DashboardStatsResponse(BaseModel):
    totalWorkers: int
    compliantWorkers: int
    complianceRate: float
    totalMilkIntakeLiters: float
    totalUnexplainedLossLiters: float
    totalFinancialLossInr: float
    totalEnergyKwh: float
    renewablePercent: float
    equipmentCleanlinessPercent: float
    activeAlertsCount: int
    criticalAlertsCount: int

class MetricAuditRow(BaseModel):
    metric: str
    value: str
    unit: str
    benchmarkStatus: str

class AuditReportResponse(BaseModel):
    reportPeriod: str
    plantName: str
    fssaiLicense: str
    generatedAt: str
    rows: List[MetricAuditRow]

