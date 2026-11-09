from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String(50), unique=True, nullable=False, index=True)  # e.g. SILO-RAW-01
    name = Column(String(150), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    department = Column(String(100), nullable=False)
    category = Column(String(100), default="Storage Silo")  # 'Storage Silo', 'Heat Exchanger', 'Packaging Line'
    current_status = Column(String(50), default="Clean")  # 'Clean', 'Needs Cleaning', 'Under Inspection', 'Maintenance Required'
    last_cleaned_timestamp = Column(String(50), default="2026-11-05 06:00")
    inspection_interval_hours = Column(Integer, default=24)
    supervisor_remarks = Column(Text, nullable=True)
    recent_verification_photo_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    department_rel = relationship("Department", back_populates="equipment")
    inspections = relationship("EquipmentInspection", back_populates="equipment")

class EquipmentInspection(Base):
    __tablename__ = "equipment_inspections"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    inspector_name = Column(String(100), nullable=False)
    status_before = Column(String(50), nullable=False)
    status_after = Column(String(50), nullable=False)
    remarks = Column(Text, nullable=True)
    photo_url = Column(String(255), nullable=True)
    inspected_at = Column(DateTime, default=datetime.utcnow, index=True)

    equipment = relationship("Equipment", back_populates="inspections")

