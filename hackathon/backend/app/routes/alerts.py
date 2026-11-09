from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.alert import SystemAlert
from app.schemas.alert import AlertResolveRequest
from app.services.auth_service import require_roles

router = APIRouter(tags=["Centralized Alert System"])

@router.get("/api/alerts")
def get_alerts(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "worker", "staff"])),
):
    alerts = db.query(SystemAlert).order_by(SystemAlert.created_at.desc()).all()
    return {
        "alerts": [
            {
                "id": a.alert_id,
                "alertId": a.alert_id,
                "pillar": a.pillar,
                "title": a.title,
                "description": a.description,
                "severity": a.severity,
                "timestamp": a.timestamp,
                "isResolved": a.is_resolved,
                "actionUrl": a.action_url,
                "department": a.department,
                "assignedTo": a.assigned_to,
            }
            for a in alerts
        ]
    }

@router.patch("/api/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_roles(["admin", "worker"])),
):
    alert = db.query(SystemAlert).filter((SystemAlert.alert_id == alert_id) | (SystemAlert.id == (int(alert_id) if alert_id.isdigit() else -1))).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_resolved = True
    alert.status = "Resolved"
    alert.resolved_at = datetime.utcnow()
    db.commit()

    return {
        "alert": {
            "id": alert.alert_id,
            "isResolved": alert.is_resolved,
            "status": alert.status,
            "resolvedAt": alert.resolved_at.strftime("%Y-%m-%d %H:%M"),
        }
    }

