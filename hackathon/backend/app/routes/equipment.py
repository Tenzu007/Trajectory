from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.equipment import Equipment, EquipmentInspection
from app.schemas.equipment import EquipmentStatusUpdate
from app.services.auth_service import require_roles

router = APIRouter(tags=["Equipment Cleanliness Monitoring"])

@router.get("/api/equipment")
def get_equipment_list(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "worker", "staff"])),
):
    """Retrieves all registered machinery, CIP status, and inspection schedules."""
    items = db.query(Equipment).all()
    return {
        "equipment": [
            {
                "id": f"EQ-{e.id:02d}",
                "equipmentId": e.equipment_id,
                "name": e.name,
                "department": e.department,
                "currentStatus": e.current_status,
                "lastCleanedTimestamp": e.last_cleaned_timestamp,
                "inspectionIntervalHours": e.inspection_interval_hours,
                "supervisorRemarks": e.supervisor_remarks,
                "recentVerificationPhotoUrl": e.recent_verification_photo_url,
            }
            for e in items
        ]
    }

@router.patch("/api/equipment/{equipment_pk}/status")
def update_equipment_status(
    equipment_pk: str,
    req: EquipmentStatusUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "worker", "staff"])),
):
    """
    Records physical equipment cleaning inspection or changes status to Clean/Needs Cleaning.
    Saves immutable inspection record in equipment_inspections table.
    """
    # Accept either "EQ-01" or numeric "1" or equipmentId "SILO-RAW-01"
    clean_id = equipment_pk.replace("EQ-", "")
    equip = None
    if clean_id.isdigit():
        equip = db.query(Equipment).filter(Equipment.id == int(clean_id)).first()
    if not equip:
        equip = db.query(Equipment).filter(Equipment.equipment_id == equipment_pk).first()

    if not equip:
        raise HTTPException(status_code=404, detail="Equipment record not found.")

    status_before = equip.current_status
    equip.current_status = req.status
    if req.remarks:
        equip.supervisorRemarks = req.remarks
    if req.photoUrl:
        equip.recent_verification_photo_url = req.photoUrl
    if req.status == "Clean":
        equip.last_cleaned_timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M")

    # Record historical inspection
    inspection = EquipmentInspection(
        equipment_id=equip.id,
        inspector_name=_user.full_name if _user else "Floor Inspector",
        status_before=status_before,
        status_after=req.status,
        remarks=req.remarks,
        photo_url=req.photoUrl,
    )
    db.add(inspection)
    db.commit()
    db.refresh(equip)

    return {
        "equipment": {
            "id": f"EQ-{equip.id:02d}",
            "equipmentId": equip.equipment_id,
            "name": equip.name,
            "department": equip.department,
            "currentStatus": equip.current_status,
            "lastCleanedTimestamp": equip.last_cleaned_timestamp,
            "inspectionIntervalHours": equip.inspection_interval_hours,
            "supervisorRemarks": equip.supervisor_remarks,
            "recentVerificationPhotoUrl": equip.recent_verification_photo_url,
        }
    }

