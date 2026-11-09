from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import require_roles
from app.services.reports_service import get_dashboard_statistics, generate_audit_csv_export

router = APIRouter(tags=["Reports & Analytics"])

@router.get("/api/reports/stats")
def get_stats(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "staff"])),
):
    """Retrieves real database-driven analytics for the overview dashboard."""
    return get_dashboard_statistics(db)

@router.get("/api/reports/export-csv")
def export_csv(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "staff"])),
):
    """Generates and streams an audited CSV production report."""
    csv_data = generate_audit_csv_export(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=DairyPulse_Audit_Report.csv"},
    )

