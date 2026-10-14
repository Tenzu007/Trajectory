from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/duration", tags=["duration"])

class DurationPredictionRequest(BaseModel):
    taskType: str = Field(default="study")
    title: str = Field(default="")
    historicalMultiplier: float = Field(default=1.0, ge=0.5, le=3.0)
    difficulty: str = Field(default="medium")

class DurationPredictionResponse(BaseModel):
    predictedMinutes: int
    confidence: float
    reasoning: str

BASE_DURATIONS = {
    "study": 45,
    "assignment": 60,
    "practice": 30,
    "skill": 60,
    "health": 30,
    "other": 30,
}

DIFFICULTY_FACTORS = {
    "easy": 0.8,
    "medium": 1.0,
    "hard": 1.4,
}

@router.post("/predict", response_model=DurationPredictionResponse)
def predict_duration(req: DurationPredictionRequest):
    base = BASE_DURATIONS.get(req.taskType.lower(), 40)
    factor = DIFFICULTY_FACTORS.get(req.difficulty.lower(), 1.0)
    
    # Calculate duration with user's historical personal multiplier
    raw_minutes = base * factor * req.historicalMultiplier
    clamped = max(15, min(180, round(raw_minutes)))
    
    return DurationPredictionResponse(
        predictedMinutes=clamped,
        confidence=0.88,
        reasoning=f"Base {base}m scaled by {req.difficulty} difficulty ({factor}x) and student prior ({req.historicalMultiplier}x)"
    )
