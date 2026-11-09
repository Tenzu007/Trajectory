from app.schemas.auth import LoginRequest, TokenResponse, UserCreate, UserUpdate, UserResponse
from app.schemas.hygiene import PreEntryVerificationRequest, PreEntryVerificationResponse, WorkerProfileResponse
from app.schemas.cv import CameraCreate, CameraUpdate, CameraResponse, VideoScanResponse, ModelStatusResponse
from app.schemas.equipment import EquipmentStatusUpdate, EquipmentResponse
from app.schemas.waste import LedgerCreate, WasteBatchRegister, WasteQCVerify, LeakCreate, LeakStatusUpdate
from app.schemas.energy import EnergySimulateRequest, EnergyMachineResponse
from app.schemas.alert import AlertResolveRequest, AlertResponse
from app.schemas.reports import DashboardStatsResponse, AuditReportResponse

__all__ = [
    "LoginRequest",
    "TokenResponse",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "PreEntryVerificationRequest",
    "PreEntryVerificationResponse",
    "WorkerProfileResponse",
    "CameraCreate",
    "CameraUpdate",
    "CameraResponse",
    "VideoScanResponse",
    "ModelStatusResponse",
    "EquipmentStatusUpdate",
    "EquipmentResponse",
    "LedgerCreate",
    "WasteBatchRegister",
    "WasteQCVerify",
    "LeakCreate",
    "LeakStatusUpdate",
    "EnergySimulateRequest",
    "EnergyMachineResponse",
    "AlertResolveRequest",
    "AlertResponse",
    "DashboardStatsResponse",
    "AuditReportResponse",
]

