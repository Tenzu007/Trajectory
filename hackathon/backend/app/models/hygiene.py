from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="department_rel")

class WorkerProfile(Base):
    __tablename__ = "worker_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    shift = Column(String(50), default="Shift A")
    assigned_station = Column(String(100), default="Processing Hall Airlock")
    hairnet_verified = Column(Boolean, default=False)
    mask_verified = Column(Boolean, default=False)
    gloves_verified = Column(Boolean, default=False)
    apron_verified = Column(Boolean, default=False)
    safety_boots_verified = Column(Boolean, default=False)
    hands_sanitized = Column(Boolean, default=False)
    compliance_score = Column(Float, default=95.0)
    total_verifications = Column(Integer, default=0)
    violations_count = Column(Integer, default=0)
    last_verification_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="worker_profile")
    verifications = relationship("HygieneVerification", back_populates="worker")

class HygieneChecklist(Base):
    __tablename__ = "hygiene_checklists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    version = Column(String(20), default="v1.0")
    items_json = Column(Text, nullable=False)  # JSON array of required PPE items
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class HygieneVerification(Base):
    __tablename__ = "hygiene_verifications"

    id = Column(Integer, primary_key=True, index=True)
    verification_id = Column(String(100), unique=True, nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("worker_profiles.id"), nullable=False)
    camera_location = Column(String(150), nullable=False)
    status = Column(String(50), nullable=False)  # 'Pending', 'Passed', 'Failed'
    entry_decision = Column(String(50), nullable=False)  # 'Approved', 'Restricted', 'Pending'
    hairnet = Column(Boolean, default=False)
    mask = Column(Boolean, default=False)
    apron = Column(Boolean, default=False)
    gloves = Column(Boolean, default=False)
    safety_shoes = Column(Boolean, default=False)
    hands_sanitized = Column(Boolean, default=False)
    missing_items = Column(String(255), nullable=True)
    confidence_score = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    worker = relationship("WorkerProfile", back_populates="verifications")

