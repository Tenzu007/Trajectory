from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/mastery", tags=["mastery"])

class MasteryUpdateRequest(BaseModel):
    studentId: str
    topic: str
    outcome: bool
    priorMastery: float = Field(default=0.5, ge=0.0, le=1.0)

class MasteryUpdateResponse(BaseModel):
    topic: str
    updatedMastery: float
    delta: float
    status: str

@router.post("/update", response_model=MasteryUpdateResponse)
def update_mastery(req: MasteryUpdateRequest):
    # Bayesian Knowledge Tracing update rule
    prior = req.priorMastery
    if req.outcome:
        # Success: increases mastery by remaining fraction
        new_mastery = prior + (1.0 - prior) * 0.25
    else:
        # Mistake: degrades mastery proportionally
        new_mastery = prior * 0.75
        
    clamped = round(max(0.05, min(0.99, new_mastery)), 3)
    delta = round(clamped - prior, 3)
    
    status = "mastered" if clamped >= 0.85 else "in_progress" if clamped >= 0.5 else "foundational"

    return MasteryUpdateResponse(
        topic=req.topic,
        updatedMastery=clamped,
        delta=delta,
        status=status
    )
