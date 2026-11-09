from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.auth import Role, User, AuditLog
from app.models.waste_energy import AppConfigModel
from app.schemas.auth import LoginRequest, TokenResponse, UserCreate, UserResponse, UserUpdate
from app.services.auth_service import (
    create_access_token,
    get_current_user,
    get_password_hash,
    require_roles,
    verify_password,
)
from app.services.audit_service import log_audit_event

router = APIRouter(tags=["Authentication & Users"])

@router.post("/api/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticates user and returns JWT access token."""
    user = (
        db.query(User)
        .filter((User.username == req.username_or_email) | (User.email == req.username_or_email))
        .first()
    )

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact plant administrator.",
        )

    # Optional role check if logging in through role-specific tab
    user_role = user.role.name if user.role else "worker"
    if req.role and req.role.lower() != user_role.lower() and user_role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This account is registered with role '{user_role}', not '{req.role}'.",
        )

    access_token = create_access_token(data={"sub": user.username, "role": user_role, "uid": user.id})

    log_audit_event(
        db,
        action="User Login",
        user=user,
        ip_address=request.client.host if request.client else None,
        details={"role": user_role},
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user_role,
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
    )

@router.post("/api/auth/register", response_model=UserResponse)
def register_user(
    req: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"])),
):
    """Registers a new user (Admin clearance required)."""
    existing = db.query(User).filter((User.username == req.username) | (User.email == req.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    role = db.query(Role).filter(Role.name == req.role.lower()).first()
    if not role:
        role = Role(name=req.role.lower(), description=f"{req.role.capitalize()} Role")
        db.add(role)
        db.commit()
        db.refresh(role)

    user = User(
        username=req.username,
        email=req.email,
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role_id=role.id,
        department=req.department or "Processing Hall",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit_event(
        db,
        action="Register User",
        user=current_user,
        entity_name="User",
        entity_id=str(user.id),
        details={"username": user.username, "role": role.name},
    )

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=role.name,
        department=user.department,
        is_active=user.is_active,
    )

@router.get("/api/auth/me")
def get_current_user_profile(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.name if user.role else "worker",
        "department": user.department,
    }

# ─── Configuration & RBAC Matrix Endpoints ──────────────────────────────────
@router.get("/api/config")
def get_configuration(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin"])),
):
    config = db.query(AppConfigModel).first()
    if not config:
        config = AppConfigModel()
        db.add(config)
        db.commit()
        db.refresh(config)

    users = db.query(User).all()
    user_list = [
        {
            "id": f"USR-{u.id:03d}",
            "name": u.full_name,
            "email": u.email,
            "role": u.role.name if u.role else "worker",
            "department": u.department or "General Plant",
            "status": "Active" if u.is_active else "Inactive",
            "lastActive": "Active Now",
        }
        for u in users
    ]

    return {
        "config": {
            "plantName": config.plant_name,
            "fssaiLicense": config.fssai_license,
            "lossAlertThresholdPercent": config.loss_alert_threshold_percent,
            "electricityTariffInr": config.electricity_tariff_inr,
            "milkBasePriceInr": config.milk_base_price_inr,
            "autoEscalateAlertsMinutes": config.auto_escalate_alerts_minutes,
            "zeroWasteTargetPercent": config.zero_waste_target_percent,
            "users": user_list,
        }
    }

@router.post("/api/config")
def update_configuration(
    req: dict,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin"])),
):
    config = db.query(AppConfigModel).first()
    if not config:
        config = AppConfigModel()
        db.add(config)

    if "plantName" in req:
        config.plant_name = req["plantName"]
    if "fssaiLicense" in req:
        config.fssai_license = req["fssaiLicense"]
    if "lossAlertThresholdPercent" in req:
        config.loss_alert_threshold_percent = float(req["lossAlertThresholdPercent"])
    if "electricityTariffInr" in req:
        config.electricity_tariff_inr = float(req["electricityTariffInr"])
    if "milkBasePriceInr" in req:
        config.milk_base_price_inr = float(req["milkBasePriceInr"])
    if "autoEscalateAlertsMinutes" in req:
        config.auto_escalate_alerts_minutes = int(req["autoEscalateAlertsMinutes"])
    if "zeroWasteTargetPercent" in req:
        config.zero_waste_target_percent = float(req["zeroWasteTargetPercent"])

    db.commit()
    log_audit_event(db, action="Update System Configuration", user=user, details=req)
    return {"success": True, "message": "System configuration updated successfully"}

@router.patch("/api/config/users/{user_id}")
def update_user_status(
    user_id: str,
    req: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"])),
):
    # Parse integer ID from "USR-001" or "1"
    clean_id = int(user_id.replace("USR-", "")) if "USR-" in user_id else int(user_id)
    target_user = db.query(User).filter(User.id == clean_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if "status" in req:
        target_user.is_active = (req["status"].lower() == "active")
    if "role" in req:
        r = db.query(Role).filter(Role.name == req["role"].lower()).first()
        if r:
            target_user.role_id = r.id

    db.commit()
    log_audit_event(
        db,
        action="Update User Status",
        user=current_user,
        entity_name="User",
        entity_id=str(target_user.id),
        details=req,
    )

    return {
        "success": True,
        "user": {
            "id": f"USR-{target_user.id:03d}",
            "name": target_user.full_name,
            "email": target_user.email,
            "role": target_user.role.name if target_user.role else "worker",
            "department": target_user.department,
            "status": "Active" if target_user.is_active else "Inactive",
        },
    }

@router.get("/api/audit-logs")
def get_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(["admin"])),
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return {
        "logs": [
            {
                "id": l.id,
                "user": l.user.username if l.user else "System",
                "action": l.action,
                "entity": l.entity_name,
                "entity_id": l.entity_id,
                "ip": l.ip_address,
                "details": l.details,
                "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC"),
            }
            for l in logs
        ]
    }

