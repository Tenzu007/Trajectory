from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/nudge", tags=["nudge"])

class NudgeSelectRequest(BaseModel):
    studentId: str
    currentHour: int = Field(default=10, ge=0, le=23)
    pendingTasksCount: int = Field(default=2, ge=0)
    streakDays: int = Field(default=3, ge=0)
    peakFocusHour: bool = Field(default=True)

class NudgeSelectResponse(BaseModel):
    nudgeId: str
    message: str
    urgency: str
    suggestedAction: str

@router.post("/select", response_model=NudgeSelectResponse)
def select_contextual_nudge(req: NudgeSelectRequest):
    if req.currentHour < 12 and req.peakFocusHour:
        return NudgeSelectResponse(
            nudgeId="nudge_peak_window",
            message="You are inside your peak cognitive focus window (9 AM - 12 PM). Tackle your Vector B backlog or highest-resistance proof now.",
            urgency="high",
            suggestedAction="start_pomodoro"
        )
    elif req.pendingTasksCount > 3:
        return NudgeSelectResponse(
            nudgeId="nudge_overload_guard",
            message=f"You have {req.pendingTasksCount} pending flight blocks. Remember the Integrity Protocol: consciously release low-yield tasks instead of carrying guilt.",
            urgency="medium",
            suggestedAction="review_flight_plan"
        )
    elif req.streakDays >= 3:
        return NudgeSelectResponse(
            nudgeId="nudge_streak_protect",
            message=f"🔥 {req.streakDays}-day momentum streak active! Complete today's next block to level up your study pet.",
            urgency="low",
            suggestedAction="two_minute_launch"
        )
    else:
        return NudgeSelectResponse(
            nudgeId="nudge_steady_progress",
            message="Small consistent inputs compound exponentially. Open your 2-Minute Launch step to start.",
            urgency="low",
            suggestedAction="open_dashboard"
        )
