from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import require_roles, get_password_hash
from app.models.auth import Role, User
from app.models.hygiene import Department, WorkerProfile, HygieneVerification
from app.models.cv_models import Camera, VideoUpload, PPEDetection
from app.models.equipment import Equipment
from app.models.waste_energy import (
    DailyLedger,
    WasteBatch,
    WasteExchangeTransaction,
    LeakSpillReport,
    Changeover,
    MachineEnergy,
    AppConfigModel,
    RinseMilkRecovery,
)
from app.models.alert import SystemAlert

router = APIRouter(tags=["Demo Data Seeding & Scenario Reset"])

def seed_database_tables(db: Session):
    """Populates all 17 normalized relational tables with pristine production data for Scenarios 1-6."""
    # 1. Roles
    role_admin = db.query(Role).filter(Role.name == "admin").first()
    if not role_admin:
        role_admin = Role(name="admin", description="Full System Administrator")
        role_staff = Role(name="staff", description="Operational Staff")
        role_worker = Role(name="worker", description="Floor Production Worker")
        db.add_all([role_admin, role_staff, role_worker])
        db.commit()
    else:
        role_staff = db.query(Role).filter(Role.name == "staff").first()
        role_worker = db.query(Role).filter(Role.name == "worker").first()

    # 2. Users & Worker Profiles
    if db.query(User).count() == 0:
        admin_user = User(
            username="admin@dairypulse.in",
            email="admin@dairypulse.in",
            hashed_password=get_password_hash("admin123"),
            full_name="Dr. Sunita Mehta",
            role_id=role_admin.id,
            department="Executive Operations & Quality Assurance",
            is_active=True,
        )
        staff_user = User(
            username="staff@dairypulse.in",
            email="staff@dairypulse.in",
            hashed_password=get_password_hash("staff123"),
            full_name="Ramesh Kumar",
            role_id=role_staff.id,
            department="Processing Hall Floor Operations",
            is_active=True,
        )
        worker_user = User(
            username="worker@dairypulse.in",
            email="worker@dairypulse.in",
            hashed_password=get_password_hash("worker123"),
            full_name="Suresh Patil",
            role_id=role_worker.id,
            department="Packaging & Finished Goods Airlock",
            is_active=True,
        )
        worker_user2 = User(
            username="amit.verma@dairypulse.in",
            email="amit.verma@dairypulse.in",
            hashed_password=get_password_hash("worker123"),
            full_name="Amit Verma",
            role_id=role_worker.id,
            department="Pasteurization Unit 1",
            is_active=True,
        )
        db.add_all([admin_user, staff_user, worker_user, worker_user2])
        db.commit()

        # Worker Profiles
        wp1 = WorkerProfile(
            user_id=worker_user.id,
            employee_id="DP-2041",
            shift="Shift A",
            assigned_station="Packaging Hall Line 4",
            hairnet_verified=True,
            mask_verified=True,
            gloves_verified=True,
            apron_verified=True,
            safety_boots_verified=True,
            hands_sanitized=True,
            compliance_score=98.5,
            total_verifications=142,
            violations_count=2,
        )
        wp2 = WorkerProfile(
            user_id=worker_user2.id,
            employee_id="DP-1088",
            shift="Shift B",
            assigned_station="Pasteurization Channel 2",
            hairnet_verified=True,
            mask_verified=False,
            gloves_verified=True,
            apron_verified=True,
            safety_boots_verified=True,
            hands_sanitized=False,
            compliance_score=86.2,
            total_verifications=98,
            violations_count=13,
        )
        db.add_all([wp1, wp2])
        db.commit()

        # Historical Pre-Entry
        verif1 = HygieneVerification(
            verification_id="VERIF-1730800000",
            worker_id=wp1.id,
            camera_location="Gate A - Processing Hall Airlock",
            status="Passed",
            entry_decision="Approved",
            hairnet=True,
            mask=True,
            apron=True,
            gloves=True,
            safety_shoes=True,
            hands_sanitized=True,
            confidence_score=0.98,
        )
        verif2 = HygieneVerification(
            verification_id="VERIF-1730790000",
            worker_id=wp2.id,
            camera_location="Gate B - Pasteurization Channel",
            status="Failed",
            entry_decision="Restricted",
            hairnet=True,
            mask=False,
            apron=True,
            gloves=True,
            safety_shoes=True,
            hands_sanitized=False,
            missing_items="Face Mask, Hands Sanitized",
            confidence_score=0.89,
        )
        db.add_all([verif1, verif2])
        db.commit()

    # 3. Cameras
    if db.query(Camera).count() == 0:
        cams = [
            Camera(camera_id="CAM-01", name="Raw Milk Silo Bay 1", location="Receiving Dock", status="Live 1080p (25 FPS)", violations_today=0, preview_img="silo", fps=25),
            Camera(camera_id="CAM-02", name="Pasteurizer Flow Channel", location="Processing Room Alpha", status="Live 1080p (30 FPS)", violations_today=1, preview_img="pasteurizer", fps=30),
            Camera(camera_id="CAM-03", name="Packaging Hall South Angle", location="Pouch Line 4", status="Live 1080p (30 FPS)", violations_today=2, preview_img="packaging", fps=30),
            Camera(camera_id="CAM-04", name="Cold Storage Loading Bay", location="Finished Goods Airlock", status="Live 1080p (20 FPS)", violations_today=0, preview_img="coldstorage", fps=20),
        ]
        db.add_all(cams)
        db.commit()

    # 4. Equipment
    if db.query(Equipment).count() == 0:
        eqs = [
            Equipment(equipment_id="SILO-RAW-01", name="30,000L Insulated Raw Milk Silo 1", department="Milk Reception", current_status="Clean", last_cleaned_timestamp="2026-11-05 06:00", inspection_interval_hours=24, supervisor_remarks="CIP completed with 1.5% NaOH wash"),
            Equipment(equipment_id="PAST-PLATE-02", name="HTST Plate Pasteurizer (5000 L/h)", department="Processing Alpha", current_status="Needs Cleaning", last_cleaned_timestamp="2026-11-04 18:30", inspection_interval_hours=12, supervisor_remarks="Organic milk stone buildup detected on section 3 plates"),
            Equipment(equipment_id="PACK-POUCH-04", name="High-Speed Pouch Packaging Machine 4", department="Packaging Unit B", current_status="Under Inspection", last_cleaned_timestamp="2026-11-05 02:15", inspection_interval_hours=8, supervisor_remarks="Sealing jaw residue accumulation. Overdue for 4-hour wipe down"),
            Equipment(equipment_id="TANK-CURD-03", name="Curd Fermentation Vat 3", department="Fermented Products", current_status="Clean", last_cleaned_timestamp="2026-11-05 08:00", inspection_interval_hours=24, supervisor_remarks="Sanitized and sealed ready for batch inoculation"),
        ]
        db.add_all(eqs)
        db.commit()

    # 5. Energy Machines (Scenario 1 Anomaly: Chiller Compressor 2)
    if db.query(MachineEnergy).count() == 0:
        me = [
            MachineEnergy(machine_id="MCH-CHILL-02", name="Glycol Chiller Compressor 2", department="Refrigeration", rated_power_kw=90.0, normal_hours_per_day=14.0, actual_hours=22.5, actual_kwh=1620.0, historical_avg_kwh=1080.0, is_anomaly=True, anomaly_percent=50.0, anomaly_reason="Continuous unloading valve failure causing zero-load bypass cycling", recommendation="Schedule unloader valve replacement and calibrate suction pressure sensors", potential_savings_kwh=540.0, potential_savings_inr=4428.0),
            MachineEnergy(machine_id="MCH-HOMO-01", name="Aseptic Homogenizer 1", department="Processing Alpha", rated_power_kw=75.0, normal_hours_per_day=12.0, actual_hours=12.0, actual_kwh=810.0, historical_avg_kwh=790.0, is_anomaly=False, anomaly_percent=2.5),
            MachineEnergy(machine_id="MCH-BLR-01", name="Biomass Steam Boiler Pump", department="Utilities", rated_power_kw=45.0, normal_hours_per_day=20.0, actual_hours=21.0, actual_kwh=850.5, historical_avg_kwh=830.0, is_anomaly=False, anomaly_percent=2.4),
            MachineEnergy(machine_id="MCH-CIP-03", name="High-Pressure CIP Circulation Pump 3", department="Sanitation", rated_power_kw=30.0, normal_hours_per_day=6.0, actual_hours=9.5, actual_kwh=256.5, historical_avg_kwh=162.0, is_anomaly=True, anomaly_percent=58.3, anomaly_reason="Operator failed to terminate rinse cycle after reaching 20 NTU turbidity", recommendation="Implement auto-conductivity cut-off valves on CIP return line", potential_savings_kwh=94.5, potential_savings_inr=774.9),
            MachineEnergy(machine_id="MCH-PACK-04", name="Pouch Packaging Machine 4 Drive", department="Packaging Unit B", rated_power_kw=25.0, normal_hours_per_day=16.0, actual_hours=16.5, actual_kwh=288.75, historical_avg_kwh=280.0, is_anomaly=False, anomaly_percent=3.1),
        ]
        db.add_all(me)
        db.commit()

    # 6. Waste Ledgers & Scenarios (Scenario 2: Mass balance spike)
    if db.query(DailyLedger).count() == 0:
        ledgers = [
            DailyLedger(
                ledger_id="LEDGER-2026-11-05",
                date="2026-11-05",
                shift="Shift A (Morning)",
                milk_received_liters=50000.0,
                fat_percent_received=4.5,
                snf_percent_received=8.5,
                milk_allocated_production=50000.0,
                pouch_milk_liters_eq=30000.0,
                curd_liters_eq=8400.0,
                ghee_liters_eq=4500.0,
                paneer_liters_eq=2400.0,
                total_product_output_liters_eq=45300.0,
                rinse_milk_recovered_liters=300.0,
                milk_sent_to_drain_liters=180.0,
                recorded_spills_liters=120.0,
                rejected_liters=0.0,
                total_recorded_losses_liters=300.0,
                unexplained_loss_liters=1000.0,
                loss_percent=2.0,
                threshold_percent=1.5,
                is_threshold_exceeded=True,
                fat_loss_kg=45.0,
                snf_loss_kg=85.0,
                financial_loss_inr=45000.0,
                investigation_status="Alert",
            ),
            DailyLedger(
                ledger_id="LEDGER-2026-11-04",
                date="2026-11-04",
                shift="Shift B (Evening)",
                milk_received_liters=48000.0,
                fat_percent_received=4.4,
                snf_percent_received=8.6,
                milk_allocated_production=48000.0,
                pouch_milk_liters_eq=32000.0,
                curd_liters_eq=7350.0,
                ghee_liters_eq=3600.0,
                paneer_liters_eq=2400.0,
                total_product_output_liters_eq=45350.0,
                rinse_milk_recovered_liters=350.0,
                milk_sent_to_drain_liters=120.0,
                recorded_spills_liters=80.0,
                rejected_liters=0.0,
                total_recorded_losses_liters=200.0,
                unexplained_loss_liters=400.0,
                loss_percent=0.83,
                threshold_percent=1.5,
                is_threshold_exceeded=False,
                fat_loss_kg=17.6,
                snf_loss_kg=34.4,
                financial_loss_inr=18000.0,
                investigation_status="Normal",
            ),
        ]
        db.add_all(ledgers)
        db.commit()

    # 7. Waste Batches & Leaks (Scenario 3 & 4: Tank 3 Valve Leak 5x)
    if db.query(WasteBatch).count() == 0:
        wb1 = WasteBatch(
            batch_id="PASSPORT-IN-WHEY-091",
            passport_id="DWP-PASSPORT-IN-WHEY-091",
            department="Cheese & Paneer Hall",
            production_stage="Coagulation & Whey Draining",
            material_name="Sweet Food-Grade Whey Matrix",
            waste_type="Dairy Organic",
            quantity=3500.0,
            unit="Liters",
            reason="Surplus paneer whey separated during morning batch",
            contamination_status="None - Food Grade",
            shelf_life_hours=36,
            storage_condition="Chilled SS Tank (4°C)",
            ai_suggested_category="Reusable",
            ai_confidence=0.96,
            ai_reasoning="Rich in alpha-lactalbumin and lactose; zero heavy metal or chemical wash contamination",
            recommended_destination="Animal Feed Co-ops & Bakeries",
            qc_verified_category="Reusable",
            qc_status="Verified",
            qc_verified_by="Dr. Sunita Mehta (QC Lead)",
            # Quality Management Integration Readings
            qc_certificate_number="QC-CERT-2026-FSSAI-0918",
            ph_level=6.45,
            fat_percent=0.35,
            snf_percent=6.80,
            microbial_count="< 10 CFU/ml (Food Grade Standard Pass)",
            temperature_celsius=4.2,
            moisture_percent=93.4,
            quality_remarks="Alpha-lactalbumin and lactose purity verified by HPLC. Zero heavy metal or chemical rinse residue.",
            # Storage Management Integration Details
            storage_location="Tank Farm North - Bay 2",
            storage_tank_or_bay="SS Insulated Silo SILO-RAW-01",
            storage_temperature="3.8°C to 4.2°C Continuous Refrigeration",
            handling_precautions="Sanitary positive displacement pump transfer only. CIP sanitized line prior to connection.",
            # Waste Exchange & Logistics Integration
            receiving_industry="Arogya NutraFeed Agro Co-op",
            destination_facility="Arogya NutraFeed Processing Plant • Pune Industrial Corridor",
            transport_vehicle_number="MH-12-QZ-4091 (Insulated Tanker)",
            driver_name="Vijay Shinde (Certified Food Transport Driver)",
            chain_of_custody_status="Dispatched • In-Transit GPS Verified",
        )
        wb2 = WasteBatch(
            batch_id="PASSPORT-IN-SLUDGE-042",
            passport_id="DWP-PASSPORT-IN-SLUDGE-042",
            department="Effluent Treatment Plant (ETP)",
            production_stage="Biological Aerobic Digestion",
            material_name="Dewatered Bio-Sludge Cake",
            waste_type="Industrial Sludge",
            quantity=1200.0,
            unit="kg",
            reason="Secondary clarifier settled biomass",
            contamination_status="Organic Non-Pathogenic",
            shelf_life_hours=120,
            storage_condition="Dry Shaded Compost Bay",
            ai_suggested_category="Treatable",
            ai_confidence=0.91,
            ai_reasoning="High N-P-K mineral content suitable for vermicomposting enrichment",
            recommended_destination="Enriched Organic Agro-Fertilizers",
            qc_verified_category="Treatable",
            qc_status="Verified",
            qc_verified_by="Dr. Sunita Mehta (QC Lead)",
            # Quality Management Integration Readings
            qc_certificate_number="QC-CERT-2026-ETP-0421",
            ph_level=7.10,
            fat_percent=None,  # Not Recorded
            snf_percent=None,  # Not Recorded
            microbial_count="Non-Pathogenic Aerobic Biomass",
            temperature_celsius=28.0,
            moisture_percent=68.5,
            quality_remarks="High N-P-K mineral content suitable for vermicomposting enrichment.",
            # Storage Management Integration Details
            storage_location="ETP Dewatering Yard - Bay 3",
            storage_tank_or_bay="Covered Dewatered Sludge Bay 3",
            storage_temperature="Ambient (Shaded)",
            handling_precautions="Standard PPE gloves and dust mask during mechanical loader transfer.",
            # Waste Exchange & Logistics Integration
            receiving_industry="GreenGrow Organics Ltd",
            destination_facility="GreenGrow Bio-Fertilizer Plant • Baramati Hub",
            transport_vehicle_number="MH-12-TC-8821 (Covered Tipper)",
            driver_name="Ganesh Jadhav",
            chain_of_custody_status="Contract Finalized • Awaiting Dispatch",
        )
        db.add_all([wb1, wb2])
        db.commit()
    else:
        # Enrich any existing batches with passport IDs and quality/storage fields if missing
        existing_w1 = db.query(WasteBatch).filter(WasteBatch.batch_id == "PASSPORT-IN-WHEY-091").first()
        if existing_w1 and not existing_w1.passport_id:
            existing_w1.passport_id = "DWP-PASSPORT-IN-WHEY-091"
            existing_w1.qc_certificate_number = "QC-CERT-2026-FSSAI-0918"
            existing_w1.ph_level = 6.45
            existing_w1.fat_percent = 0.35
            existing_w1.snf_percent = 6.80
            existing_w1.microbial_count = "< 10 CFU/ml (Food Grade Standard Pass)"
            existing_w1.temperature_celsius = 4.2
            existing_w1.moisture_percent = 93.4
            existing_w1.quality_remarks = "Alpha-lactalbumin and lactose purity verified by HPLC. Zero heavy metal or chemical rinse residue."
            existing_w1.storage_location = "Tank Farm North - Bay 2"
            existing_w1.storage_tank_or_bay = "SS Insulated Silo SILO-RAW-01"
            existing_w1.storage_temperature = "3.8°C to 4.2°C Continuous Refrigeration"
            existing_w1.handling_precautions = "Sanitary positive displacement pump transfer only. CIP sanitized line prior to connection."
            existing_w1.receiving_industry = "Arogya NutraFeed Agro Co-op"
            existing_w1.destination_facility = "Arogya NutraFeed Processing Plant • Pune Industrial Corridor"
            existing_w1.transport_vehicle_number = "MH-12-QZ-4091 (Insulated Tanker)"
            existing_w1.driver_name = "Vijay Shinde (Certified Food Transport Driver)"
            existing_w1.chain_of_custody_status = "Dispatched • In-Transit GPS Verified"
            db.commit()

        existing_w2 = db.query(WasteBatch).filter(WasteBatch.batch_id == "PASSPORT-IN-SLUDGE-042").first()
        if existing_w2 and not existing_w2.passport_id:
            existing_w2.passport_id = "DWP-PASSPORT-IN-SLUDGE-042"
            existing_w2.qc_certificate_number = "QC-CERT-2026-ETP-0421"
            existing_w2.ph_level = 7.10
            existing_w2.microbial_count = "Non-Pathogenic Aerobic Biomass"
            existing_w2.temperature_celsius = 28.0
            existing_w2.moisture_percent = 68.5
            existing_w2.quality_remarks = "High N-P-K mineral content suitable for vermicomposting enrichment."
            existing_w2.storage_location = "ETP Dewatering Yard - Bay 3"
            existing_w2.storage_tank_or_bay = "Covered Dewatered Sludge Bay 3"
            existing_w2.storage_temperature = "Ambient (Shaded)"
            existing_w2.handling_precautions = "Standard PPE gloves and dust mask during mechanical loader transfer."
            existing_w2.receiving_industry = "GreenGrow Organics Ltd"
            existing_w2.destination_facility = "GreenGrow Bio-Fertilizer Plant • Baramati Hub"
            existing_w2.transport_vehicle_number = "MH-12-TC-8821 (Covered Tipper)"
            existing_w2.driver_name = "Ganesh Jadhav"
            existing_w2.chain_of_custody_status = "Contract Finalized • Awaiting Dispatch"
            db.commit()

    # Historical Waste Exchange Transactions
    if db.query(WasteExchangeTransaction).count() == 0:
        txns = [
            WasteExchangeTransaction(
                transaction_id="TXN-EX-WHEY-001",
                batch_id="PASSPORT-IN-WHEY-091",
                partner_industry="Arogya NutraFeed Agro Co-op",
                receiving_facility="Arogya NutraFeed Processing Plant • Pune Industrial Corridor",
                action="Reverse Match Identified",
                transport_vehicle_number="MH-12-QZ-4091",
                driver_name="Vijay Shinde",
                agreed_price_inr=4.50,
                quantity_exchanged=3500.0,
                unit="Liters",
                signed_by="AI Marketplace Engine",
                notes="AI-assisted circular match: 94% compatibility score. Cattle nutrition valorization.",
            ),
            WasteExchangeTransaction(
                transaction_id="TXN-EX-WHEY-002",
                batch_id="PASSPORT-IN-WHEY-091",
                partner_industry="Arogya NutraFeed Agro Co-op",
                receiving_facility="Arogya NutraFeed Processing Plant • Pune Industrial Corridor",
                action="QC & Commercial Contract Finalized",
                transport_vehicle_number="MH-12-QZ-4091",
                driver_name="Vijay Shinde",
                agreed_price_inr=4.50,
                quantity_exchanged=3500.0,
                unit="Liters",
                signed_by="Dr. Sunita Mehta (QC Lead)",
                notes="QC microbial Certificate QC-CERT-2026-FSSAI-0918 countersigned. Offtake agreed at ₹4.50/L.",
            ),
            WasteExchangeTransaction(
                transaction_id="TXN-EX-WHEY-003",
                batch_id="PASSPORT-IN-WHEY-091",
                partner_industry="Arogya NutraFeed Agro Co-op",
                receiving_facility="Arogya NutraFeed Processing Plant • Pune Industrial Corridor",
                action="Dispatched from Plant (Gate-Out)",
                transport_vehicle_number="MH-12-QZ-4091",
                driver_name="Vijay Shinde",
                agreed_price_inr=4.50,
                quantity_exchanged=3500.0,
                unit="Liters",
                signed_by="Ramesh Kumar (Logistics Supervisor)",
                notes="Insulated tanker loaded at 4.2°C. Digital Seal #DS-9182 applied. In-transit GPS active.",
            ),
            WasteExchangeTransaction(
                transaction_id="TXN-EX-SLUDGE-001",
                batch_id="PASSPORT-IN-SLUDGE-042",
                partner_industry="GreenGrow Organics Ltd",
                receiving_facility="GreenGrow Bio-Fertilizer Plant • Baramati Hub",
                action="Reverse Match Identified",
                transport_vehicle_number="MH-12-TC-8821",
                driver_name="Ganesh Jadhav",
                agreed_price_inr=1.20,
                quantity_exchanged=1200.0,
                unit="kg",
                signed_by="AI Marketplace Engine",
                notes="Secondary clarifier biomass matched with soil amendment processor at 91% compatibility.",
            ),
            WasteExchangeTransaction(
                transaction_id="TXN-EX-SLUDGE-002",
                batch_id="PASSPORT-IN-SLUDGE-042",
                partner_industry="GreenGrow Organics Ltd",
                receiving_facility="GreenGrow Bio-Fertilizer Plant • Baramati Hub",
                action="Agreement Finalized & Staging Logged",
                transport_vehicle_number="MH-12-TC-8821",
                driver_name="Ganesh Jadhav",
                agreed_price_inr=1.20,
                quantity_exchanged=1200.0,
                unit="kg",
                signed_by="Dr. Sunita Mehta (QC Lead)",
                notes="Offtake agreement approved at ₹1.20/kg. Pickup scheduled from ETP Compost Bay 3.",
            ),
        ]
        db.add_all(txns)
        db.commit()

    if db.query(LeakSpillReport).count() == 0:
        leaks = [
            LeakSpillReport(leak_id="LEAK-01", location="Processing Hall - Tank 3 Outlet", tank_or_machine="Storage Tank 3 Discharge Valve", type="Milk Leak", quantity="70 Liters / shift", financial_impact_inr=3150.0, shift="Shift A", reported_by="Suresh Patil", assigned_to="Maintenance Lead (P. Rao)", status="Logged", repeat_count=5, is_recurring=True),
            LeakSpillReport(leak_id="LEAK-02", location="Packaging Line 2 Infeed", tank_or_machine="Pneumatic Balance Tank Valve", type="Milk Leak", quantity="25 Liters / shift", financial_impact_inr=1125.0, shift="Shift B", reported_by="Ramesh Kumar", assigned_to="Mechanic Team", status="Work Order Issued", repeat_count=1, is_recurring=False),
        ]
        db.add_all(leaks)
        db.commit()

    # 8. Changeovers
    if db.query(Changeover).count() == 0:
        cos = [
            Changeover(line_name="Pasteurizer 1 Line", from_product="Chocolate Flavoured Milk", to_product="Standard Cow Milk (White)", cip_type="Full 5-Step Hot Caustic CIP", actual_rinse_liters=650.0, benchmark_liters=450.0, excess_liters=180.0, excess_percent=38.2, estimated_loss_inr=8100.0, chemical_cost_inr=4200.0, operator="Ramesh Kumar", timestamp="2026-11-05 07:15"),
            Changeover(line_name="Pouch Filler 2", from_product="Full Cream Milk", to_product="Toned Milk", cip_type="Short Warm Water Flush", actual_rinse_liters=120.0, benchmark_liters=110.0, excess_liters=10.0, excess_percent=9.1, estimated_loss_inr=450.0, chemical_cost_inr=0.0, operator="Anil Deshmukh", timestamp="2026-11-05 11:30"),
        ]
        db.add_all(cos)
        db.commit()

    # 9. Initial Alerts
    if db.query(SystemAlert).count() == 0:
        alerts = [
            SystemAlert(alert_id="ALERT-ENERGY-001", pillar="Energy & Power", title="Chiller Compressor 2: 50% Energy Anomaly", description="Consuming 1,620 kWh vs 1,080 kWh benchmark. Potential unloader valve failure identified.", severity="Critical", department="Refrigeration", action_url="/energy", assigned_to="Energy Engineer", is_resolved=False),
            SystemAlert(alert_id="ALERT-LOSS-002", pillar="Waste & Loss", title="Unexplained Milk Loss Spike: 2.0% on Shift A", description="Mass balance deficit of 1,000 L exceeded 1.5% threshold. INR 45,000 loss.", severity="Critical", department="Processing Hall", action_url="/ledger", assigned_to="Dr. Sunita Mehta", is_resolved=False),
            SystemAlert(alert_id="ALERT-LEAK-003", pillar="Equipment", title="Recurring Leak Detected (5x): Tank 3 Valve", description="Chronic mechanical seal failure identified at Storage Tank 3 discharge valve.", severity="Critical", department="Processing Hall", action_url="/leaks", assigned_to="Maintenance Lead", is_resolved=False),
            SystemAlert(alert_id="ALERT-HYGIENE-004", pillar="AI Hygiene", title="CCTV Camera 3: 2 PPE Violations on Line 4", description="Operator adjusted mask below nose while operating pouch sealing head.", severity="High", department="Packaging Unit B", action_url="/cctv", assigned_to="Dr. Sunita Mehta", is_resolved=False),
            SystemAlert(alert_id="ALERT-EQUIP-005", pillar="Equipment", title="CIP Sanitation Overdue: Pouch Filler 4", description="Pouch Machine 4 overdue for 8-hour sanitation wipe. Scrap yield currently at 94.6%.", severity="Medium", department="Packaging Unit B", action_url="/equipment", assigned_to="Shift Supervisor", is_resolved=False),
        ]
        db.add_all(alerts)
        db.commit()

    # 10. Config
    cfg = db.query(AppConfigModel).first()
    if not cfg:
        cfg = AppConfigModel(
            plant_name="Apex Dairy Cooperative • Plant #4 (Central Processing Hub)",
            fssai_license="FSSAI-MH-2024-00918-B4",
            loss_alert_threshold_percent=1.5,
            electricity_tariff_inr=8.20,
            milk_base_price_inr=35.0,
            auto_escalate_alerts_minutes=30,
            zero_waste_target_percent=95.0,
            rinse_cost_per_liter_inr=20.0,
            rinse_qc_min_ph=6.4,
            rinse_qc_max_ph=6.8,
            rinse_qc_max_temp=8.0,
            rinse_qc_min_snf=8.0,
            rinse_qc_min_fat=0.5,
        )
        db.add(cfg)
        db.commit()
    else:
        if cfg.rinse_cost_per_liter_inr is None:
            cfg.rinse_cost_per_liter_inr = 20.0
            cfg.rinse_qc_min_ph = 6.4
            cfg.rinse_qc_max_ph = 6.8
            cfg.rinse_qc_max_temp = 8.0
            cfg.rinse_qc_min_snf = 8.0
            cfg.rinse_qc_min_fat = 0.5
            db.commit()

    # 11. Pre-Rinse Milk Recovery Tracking Records
    if db.query(RinseMilkRecovery).count() == 0:
        recoveries = [
            RinseMilkRecovery(
                record_id="RINSE-REC-001",
                line_name="Line 01",
                product_name="Skimmed Milk",
                date="2026-11-05",
                time="06:30",
                shift="Shift A",
                recoverable_estimate_liters=120.0,
                actual_recovered_liters=108.0,
                unrecovered_liters=12.0,
                recovery_percent=90.0,
                cost_per_liter_inr=20.0,
                unrecovered_loss_inr=240.0,
                temperature_celsius=4.2,
                ph_level=6.65,
                fat_percent=0.52,
                snf_percent=8.60,
                microbiological_status="Pass (< 10 CFU/ml)",
                qc_status="Verified",
                qc_remarks="High purity pre-rinse milk. Standard microbiological pass.",
                qc_verified_by="Dr. Sunita Mehta (QC Lead)",
                qc_verified_at=datetime(2026, 11, 5, 7, 0),
                production_ready=True,
                is_demo=True,
                operator_name="Ramesh Kumar",
            ),
            RinseMilkRecovery(
                record_id="RINSE-REC-002",
                line_name="Line 02",
                product_name="Full Cream Milk",
                date="2026-11-05",
                time="08:15",
                shift="Shift A",
                recoverable_estimate_liters=150.0,
                actual_recovered_liters=135.0,
                unrecovered_liters=15.0,
                recovery_percent=90.0,
                cost_per_liter_inr=20.0,
                unrecovered_loss_inr=300.0,
                temperature_celsius=4.5,
                ph_level=6.60,
                fat_percent=6.20,
                snf_percent=9.00,
                microbiological_status="Pass (< 10 CFU/ml)",
                qc_status="Verified",
                qc_remarks="Clean burst flush. Cleared for standardization blending.",
                qc_verified_by="Dr. Sunita Mehta (QC Lead)",
                qc_verified_at=datetime(2026, 11, 5, 8, 45),
                production_ready=True,
                is_demo=True,
                operator_name="Anil Deshmukh",
            ),
            RinseMilkRecovery(
                record_id="RINSE-REC-003",
                line_name="Line 03",
                product_name="Flavoured Milk",
                date="2026-11-05",
                time="11:45",
                shift="Shift A",
                recoverable_estimate_liters=100.0,
                actual_recovered_liters=72.0,
                unrecovered_liters=28.0,
                recovery_percent=72.0,
                cost_per_liter_inr=20.0,
                unrecovered_loss_inr=560.0,
                temperature_celsius=6.8,
                ph_level=6.50,
                fat_percent=3.20,
                snf_percent=8.40,
                microbiological_status="Pending Culture Incubation (12h)",
                qc_status="Pending",
                qc_remarks="Organoleptic clear; awaiting automated microbial plate readout.",
                qc_verified_by=None,
                qc_verified_at=None,
                production_ready=False,
                is_demo=True,
                operator_name="Suresh Patil",
            ),
            RinseMilkRecovery(
                record_id="RINSE-REC-004",
                line_name="Line 04",
                product_name="Skimmed Milk",
                date="2026-11-05",
                time="14:20",
                shift="Shift B",
                recoverable_estimate_liters=90.0,
                actual_recovered_liters=54.0,
                unrecovered_liters=36.0,
                recovery_percent=60.0,
                cost_per_liter_inr=20.0,
                unrecovered_loss_inr=720.0,
                temperature_celsius=11.4,
                ph_level=6.15,
                fat_percent=0.45,
                snf_percent=7.60,
                microbiological_status="Failed (Acidic fermentation detected)",
                qc_status="Rejected",
                qc_remarks="Temperature abuse and pH drop below 6.4 threshold during extended hold. Diverted to non-food anaerobic digester.",
                qc_verified_by="Dr. Sunita Mehta (QC Lead)",
                qc_verified_at=datetime(2026, 11, 5, 14, 50),
                production_ready=False,
                is_demo=True,
                operator_name="Mahesh Shinde",
            ),
            RinseMilkRecovery(
                record_id="RINSE-REC-005",
                line_name="Line 05",
                product_name="Full Cream Milk",
                date="2026-11-05",
                time="16:50",
                shift="Shift B",
                recoverable_estimate_liters=180.0,
                actual_recovered_liters=162.0,
                unrecovered_liters=18.0,
                recovery_percent=90.0,
                cost_per_liter_inr=20.0,
                unrecovered_loss_inr=360.0,
                temperature_celsius=4.1,
                ph_level=6.68,
                fat_percent=6.05,
                snf_percent=9.10,
                microbiological_status="Pass (< 10 CFU/ml)",
                qc_status="Verified",
                qc_remarks="Optimal recovery profile with rapid chilling verified.",
                qc_verified_by="Dr. Sunita Mehta (QC Lead)",
                qc_verified_at=datetime(2026, 11, 5, 17, 15),
                production_ready=True,
                is_demo=True,
                operator_name="Ramesh Kumar",
            ),
        ]
        db.add_all(recoveries)
        db.commit()

@router.post("/api/demo/reset")
def reset_demo(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin"])),
):
    """Restores pristine demo scenarios (Scenario 1-6) and resets database records."""
    # Clear tables
    db.query(RinseMilkRecovery).delete()
    db.query(SystemAlert).delete()
    db.query(Changeover).delete()
    db.query(LeakSpillReport).delete()
    db.query(WasteExchangeTransaction).delete()
    db.query(WasteBatch).delete()
    db.query(DailyLedger).delete()
    db.query(MachineEnergy).delete()
    db.query(Equipment).delete()
    db.query(Camera).delete()
    db.query(HygieneVerification).delete()
    db.query(WorkerProfile).delete()
    db.query(User).delete()
    db.query(Role).delete()
    db.commit()

    # Re-seed
    seed_database_tables(db)

    return {
        "success": True,
        "message": "All demo datasets, scenarios (1-6) and relational database state successfully restored!",
    }

