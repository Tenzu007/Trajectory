from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/procrastination", tags=["procrastination"])

class ProcrastinationRiskRequest(BaseModel):
    studentId: str
    taskId: str
    daysUntilDeadline: int = Field(default=3, ge=0)
    priorityScore: float = Field(default=50.0, ge=0, le=100)
    historicalCompletionRate: float = Field(default=0.8, ge=0.0, le=1.0)
    hasTwoMinuteTrigger: bool = Field(default=True)

class ProcrastinationRiskResponse(BaseModel):
    riskScore: float  # 0 to 100
    riskLevel: str    # "low" | "medium" | "high"
    antiProcrastinationTrigger: str

@router.post("/risk", response_model=ProcrastinationRiskResponse)
def compute_procrastination_risk(req: ProcrastinationRiskRequest):
    # Urgency penalty: tasks due within 2 days with high stakes create avoidance paralysis
    urgency_risk = max(0, 10 - req.daysUntilDeadline) * 4.0
    
    # Priority stakes weight
    stakes_risk = (req.priorityScore / 100.0) * 30.0
    
    # Completion history penalty
    incompletion_risk = (1.0 - req.historicalCompletionRate) * 35.0
    
    raw_risk = urgency_risk + stakes_risk + incompletion_risk
    
    # 2-minute trigger mitigates cognitive startup cost
    if req.hasTwoMinuteTrigger:
        raw_risk *= 0.75
        
    final_score = round(max(5.0, min(95.0, raw_risk)), 1)
    
    if final_score >= 65.0:
        level = "high"
        trigger = "High activation resistance detected! Do not start the full task — trigger the 2-Minute Launch step only."
    elif final_score >= 35.0:
        level = "medium"
        trigger = "Moderate inertia. Review your 2-Minute Launch step before opening lecture slides."
    else:
        level = "low"
        trigger = "Clear trajectory. Standard Pomodoro focus recommended."

    return ProcrastinationRiskResponse(
        riskScore=final_score,
        riskLevel=level,
        antiProcrastinationTrigger=trigger
    )
