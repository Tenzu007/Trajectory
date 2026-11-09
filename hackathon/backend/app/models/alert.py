from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.database import Base

class SystemAlert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(100), unique=True, nullable=False, index=True)  # e.g. ALERT-ENERGY-001
    pillar = Column(String(100), nullable=False)  # 'Energy & Power', 'Waste & Loss', 'AI Hygiene', 'Equipment'
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(50), default="Medium")  # 'Low', 'Medium', 'High', 'Critical'
    status = Column(String(50), default="New")  # 'New', 'Acknowledged', 'In Progress', 'Resolved'
    department = Column(String(100), nullable=True)
    related_entity_id = Column(String(100), nullable=True)
    is_resolved = Column(Boolean, default=False)
    action_url = Column(String(255), nullable=True)
    assigned_to = Column(String(100), nullable=True)
    timestamp = Column(String(50), default=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M"))
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="System")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

