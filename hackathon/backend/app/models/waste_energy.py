from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class DailyLedger(Base):
    __tablename__ = "daily_ledgers"

    id = Column(Integer, primary_key=True, index=True)
    ledger_id = Column(String(100), unique=True, nullable=False, index=True)
    date = Column(String(20), nullable=False, index=True)
    shift = Column(String(50), default="Shift A")
    milk_received_liters = Column(Float, nullable=False)
    fat_percent_received = Column(Float, default=4.5)
    snf_percent_received = Column(Float, default=8.5)
    milk_allocated_production = Column(Float, nullable=False)
    pouch_milk_liters_eq = Column(Float, default=0.0)
    curd_liters_eq = Column(Float, default=0.0)
    ghee_liters_eq = Column(Float, default=0.0)
    paneer_liters_eq = Column(Float, default=0.0)
    total_product_output_liters_eq = Column(Float, nullable=False)
    rinse_milk_recovered_liters = Column(Float, default=0.0)
    milk_sent_to_drain_liters = Column(Float, default=0.0)
    recorded_spills_liters = Column(Float, default=0.0)
    rejected_liters = Column(Float, default=0.0)
    total_recorded_losses_liters = Column(Float, nullable=False)
    unexplained_loss_liters = Column(Float, nullable=False)
    loss_percent = Column(Float, nullable=False)
    threshold_percent = Column(Float, default=1.5)
    is_threshold_exceeded = Column(Boolean, default=False)
    fat_loss_kg = Column(Float, default=0.0)
    snf_loss_kg = Column(Float, default=0.0)
    financial_loss_inr = Column(Float, default=0.0)
    investigation_status = Column(String(50), default="Normal")
    created_at = Column(DateTime, default=datetime.utcnow)

class WasteBatch(Base):
    __tablename__ = "waste_batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String(100), unique=True, nullable=False, index=True)
    passport_id = Column(String(100), unique=True, nullable=True, index=True)
    department = Column(String(100), nullable=False)
    production_stage = Column(String(100), nullable=False)
    material_name = Column(String(150), nullable=False)
    waste_type = Column(String(100), default="Dairy Organic")
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), default="Liters")
    reason = Column(String(255), nullable=True)
    contamination_status = Column(String(100), default="None - Food Grade")
    shelf_life_hours = Column(Integer, default=24)
    storage_condition = Column(String(100), default="Chilled (4°C)")
    ai_suggested_category = Column(String(50), default="Reusable")  # 'Reusable', 'Treatable', 'Disposal'
    ai_confidence = Column(Float, default=0.92)
    ai_reasoning = Column(Text, nullable=True)
    recommended_destination = Column(String(255), nullable=True)
    qc_verified_category = Column(String(50), default="Pending Verification")
    qc_status = Column(String(50), default="Pending Verification")
    qc_verified_by = Column(String(100), default="Awaiting Verification")
    registered_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Quality Management Integration Fields
    qc_certificate_number = Column(String(100), nullable=True)
    ph_level = Column(Float, nullable=True)
    fat_percent = Column(Float, nullable=True)
    snf_percent = Column(Float, nullable=True)
    microbial_count = Column(String(100), nullable=True)
    temperature_celsius = Column(Float, nullable=True)
    moisture_percent = Column(Float, nullable=True)
    quality_remarks = Column(Text, nullable=True)

    # Storage Management Integration Fields
    storage_location = Column(String(150), nullable=True)
    storage_tank_or_bay = Column(String(100), nullable=True)
    storage_temperature = Column(String(50), nullable=True)
    handling_precautions = Column(String(255), nullable=True)

    # Waste Exchange & Logistics Integration Fields
    receiving_industry = Column(String(150), nullable=True)
    destination_facility = Column(String(200), nullable=True)
    transport_vehicle_number = Column(String(50), nullable=True)
    driver_name = Column(String(100), nullable=True)
    chain_of_custody_status = Column(String(100), default="Logged at Generation Facility")

    # Historical Exchange Transactions
    exchange_transactions = relationship(
        "WasteExchangeTransaction",
        back_populates="batch",
        cascade="all, delete-orphan",
        order_by="WasteExchangeTransaction.created_at.asc()",
    )

class WasteExchangeTransaction(Base):
    __tablename__ = "waste_exchange_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(100), unique=True, nullable=False, index=True)
    batch_id = Column(String(100), ForeignKey("waste_batches.batch_id"), nullable=False, index=True)
    partner_industry = Column(String(150), nullable=False)
    receiving_facility = Column(String(200), nullable=True)
    action = Column(String(100), default="Proposed Match")
    transport_vehicle_number = Column(String(50), nullable=True)
    driver_name = Column(String(100), nullable=True)
    agreed_price_inr = Column(Float, nullable=True)
    quantity_exchanged = Column(Float, nullable=True)
    unit = Column(String(50), default="Liters")
    signed_by = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    batch = relationship("WasteBatch", back_populates="exchange_transactions")

class LeakSpillReport(Base):
    __tablename__ = "leak_spill_reports"

    id = Column(Integer, primary_key=True, index=True)
    leak_id = Column(String(100), unique=True, nullable=False, index=True)
    location = Column(String(150), nullable=False)
    tank_or_machine = Column(String(150), nullable=False)
    type = Column(String(50), default="Milk Leak")  # 'Milk Leak', 'Water Spill', 'Chemical CIP', 'Steam Loss'
    quantity = Column(String(50), nullable=False)
    quantity_liters = Column(Float, default=50.0)
    financial_impact_inr = Column(Float, default=2250.0)
    shift = Column(String(50), default="Shift A")
    reported_by = Column(String(100), nullable=False)
    assigned_to = Column(String(100), nullable=False)
    status = Column(String(50), default="Logged")  # 'Logged', 'Investigating', 'Work Order Issued', 'Repaired', 'Verified Closed'
    repeat_count = Column(Integer, default=1)
    is_recurring = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class Changeover(Base):
    __tablename__ = "changeovers"

    id = Column(Integer, primary_key=True, index=True)
    line_name = Column(String(100), nullable=False)
    from_product = Column(String(100), nullable=False)
    to_product = Column(String(100), nullable=False)
    cip_type = Column(String(50), default="Full 5-Step CIP")
    actual_rinse_liters = Column(Float, nullable=False)
    benchmark_liters = Column(Float, nullable=False)
    excess_liters = Column(Float, default=0.0)
    excess_percent = Column(Float, default=0.0)
    estimated_loss_inr = Column(Float, default=0.0)
    chemical_cost_inr = Column(Float, default=0.0)
    operator = Column(String(100), nullable=False)
    timestamp = Column(String(50), nullable=False)

class MachineEnergy(Base):
    __tablename__ = "machine_energy"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    department = Column(String(100), nullable=False)
    rated_power_kw = Column(Float, nullable=False)
    normal_hours_per_day = Column(Float, nullable=False)
    actual_hours = Column(Float, nullable=False)
    actual_kwh = Column(Float, nullable=False)
    historical_avg_kwh = Column(Float, nullable=False)
    is_anomaly = Column(Boolean, default=False)
    anomaly_percent = Column(Float, default=0.0)
    anomaly_reason = Column(String(255), nullable=True)
    recommendation = Column(String(255), nullable=True)
    potential_savings_kwh = Column(Float, default=0.0)
    potential_savings_inr = Column(Float, default=0.0)
    reading_date = Column(DateTime, default=datetime.utcnow)

class AppConfigModel(Base):
    __tablename__ = "app_configuration"

    id = Column(Integer, primary_key=True, index=True)
    plant_name = Column(String(150), default="Apex Dairy Cooperative • Plant #4")
    fssai_license = Column(String(100), default="FSSAI-MH-2024-00918-B4")
    loss_alert_threshold_percent = Column(Float, default=1.5)
    electricity_tariff_inr = Column(Float, default=8.20)
    milk_base_price_inr = Column(Float, default=35.0)
    rinse_cost_per_liter_inr = Column(Float, default=20.0)
    rinse_qc_min_ph = Column(Float, default=6.4)
    rinse_qc_max_ph = Column(Float, default=6.8)
    rinse_qc_max_temp = Column(Float, default=8.0)
    rinse_qc_min_snf = Column(Float, default=8.0)
    rinse_qc_min_fat = Column(Float, default=0.5)
    auto_escalate_alerts_minutes = Column(Integer, default=30)
    zero_waste_target_percent = Column(Float, default=95.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RinseMilkRecovery(Base):
    __tablename__ = "rinse_milk_recoveries"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(100), unique=True, nullable=False, index=True)
    line_name = Column(String(100), nullable=False)
    product_name = Column(String(100), nullable=False)
    date = Column(String(20), nullable=False)
    time = Column(String(20), nullable=False)
    shift = Column(String(50), default="Shift A")
    recoverable_estimate_liters = Column(Float, nullable=False)
    actual_recovered_liters = Column(Float, nullable=False)
    unrecovered_liters = Column(Float, nullable=False)
    recovery_percent = Column(Float, nullable=False)
    cost_per_liter_inr = Column(Float, default=20.0)
    unrecovered_loss_inr = Column(Float, nullable=False)

    # Quality Verification Metrics
    temperature_celsius = Column(Float, nullable=True)
    ph_level = Column(Float, nullable=True)
    fat_percent = Column(Float, nullable=True)
    snf_percent = Column(Float, nullable=True)
    microbiological_status = Column(String(100), default="Pending Laboratory Test")
    qc_status = Column(String(50), default="Pending")  # 'Verified', 'Pending', 'Rejected'
    qc_remarks = Column(Text, nullable=True)
    qc_verified_by = Column(String(100), nullable=True)
    qc_verified_at = Column(DateTime, nullable=True)
    production_ready = Column(Boolean, default=False)

    is_demo = Column(Boolean, default=False)
    operator_name = Column(String(100), default="Floor Operator")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

