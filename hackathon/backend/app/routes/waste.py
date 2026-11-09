import base64
import io
import json
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
import qrcode
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.waste_energy import (
    DailyLedger,
    WasteBatch,
    WasteExchangeTransaction,
    LeakSpillReport,
    Changeover,
    AppConfigModel,
    RinseMilkRecovery,
)
from app.models.alert import SystemAlert
from app.schemas.waste import (
    LedgerCreate,
    WasteBatchRegister,
    WasteQCVerify,
    LeakCreate,
    LeakStatusUpdate,
    RinseRecoveryCreate,
    RinseQCVerifyRequest,
    RinseThresholdsUpdate,
)
from app.services.auth_service import require_roles

router = APIRouter(tags=["Waste Tracking & Mass Balance Analytics"])

@router.get("/api/waste/ledger")
def get_ledgers(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "staff"])),
):
    ledgers = db.query(DailyLedger).order_by(DailyLedger.date.desc(), DailyLedger.id.desc()).all()
    return {
        "ledgers": [
            {
                "id": l.ledger_id,
                "date": l.date,
                "shift": l.shift,
                "milkReceivedLiters": l.milk_received_liters,
                "fatPercentReceived": l.fat_percent_received,
                "snfPercentReceived": l.snf_percent_received,
                "milkAllocatedProduction": l.milk_allocated_production,
                "pouchMilkLitersEq": l.pouch_milk_liters_eq,
                "curdLitersEq": l.curd_liters_eq,
                "gheeLitersEq": l.ghee_liters_eq,
                "paneerLitersEq": l.paneer_liters_eq,
                "totalProductOutputLitersEq": l.total_product_output_liters_eq,
                "rinseMilkRecoveredLiters": l.rinse_milk_recovered_liters,
                "milkSentToDrainLiters": l.milk_sent_to_drain_liters,
                "recordedSpillsLiters": l.recorded_spills_liters,
                "rejectedLiters": l.rejected_liters,
                "totalRecordedLossesLiters": l.total_recorded_losses_liters,
                "unexplainedLossLiters": l.unexplained_loss_liters,
                "lossPercent": l.loss_percent,
                "thresholdPercent": l.threshold_percent,
                "isThresholdExceeded": l.is_threshold_exceeded,
                "fatLossKg": l.fat_loss_kg,
                "snfLossKg": l.snf_loss_kg,
                "financialLossInr": l.financial_loss_inr,
                "investigationStatus": l.investigation_status,
            }
            for l in ledgers
        ]
    }

@router.post("/api/waste/ledger")
def create_ledger_entry(
    req: LedgerCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "staff"])),
):
    """
    Mass-Balance Law:
    Unexplained Loss = Input - Accounted Products - Recovered Rinse - Recorded Losses
    Financial Loss = Unexplained Loss * Base Procurement Price
    """
    config = db.query(AppConfigModel).first()
    threshold = config.loss_alert_threshold_percent if config else 1.5
    price_per_l = config.milk_base_price_inr if config else 35.0

    curd_liters_eq = req.curdKg * 1.05
    ghee_liters_eq = req.gheeKg * 22.5
    paneer_liters_eq = req.paneerKg * 8.0
    total_products = req.pouchMilkLiters + curd_liters_eq + ghee_liters_eq + paneer_liters_eq
    recorded_losses = req.milkSentDrain + req.spills + req.rejected

    unexplained_loss = max(0.0, req.milkReceivedLiters - total_products - req.rinseRecovered - recorded_losses)
    loss_pct = round((unexplained_loss / max(1.0, req.milkReceivedLiters)) * 100.0, 2)
    is_exceeded = loss_pct > threshold
    fin_loss = round(unexplained_loss * price_per_l, 2)

    ledger_id = f"LEDGER-{int(datetime.utcnow().timestamp() * 1000)}"
    entry = DailyLedger(
        ledger_id=ledger_id,
        date=datetime.utcnow().strftime("%Y-%m-%d"),
        shift=req.shift,
        milk_received_liters=req.milkReceivedLiters,
        fat_percent_received=req.fatPercent,
        snf_percent_received=req.snfPercent,
        milk_allocated_production=req.milkReceivedLiters,
        pouch_milk_liters_eq=req.pouchMilkLiters,
        curd_liters_eq=curd_liters_eq,
        ghee_liters_eq=ghee_liters_eq,
        paneer_liters_eq=paneer_liters_eq,
        total_product_output_liters_eq=total_products,
        rinse_milk_recovered_liters=req.rinseRecovered,
        milk_sent_to_drain_liters=req.milkSentDrain,
        recorded_spills_liters=req.spills,
        rejected_liters=req.rejected,
        total_recorded_losses_liters=recorded_losses,
        unexplained_loss_liters=unexplained_loss,
        loss_percent=loss_pct,
        threshold_percent=threshold,
        is_threshold_exceeded=is_exceeded,
        fat_loss_kg=round((unexplained_loss * req.fatPercent) / 100.0, 1),
        snf_loss_kg=round((unexplained_loss * req.snfPercent) / 100.0, 1),
        financial_loss_inr=fin_loss,
        investigation_status="Alert" if is_exceeded else "Normal",
    )
    db.add(entry)

    # If exceeded threshold, trigger critical alert
    if is_exceeded:
        alert = SystemAlert(
            alert_id=f"ALERT-LOSS-{ledger_id}",
            pillar="Waste & Loss",
            title=f"Unexplained Milk Loss Spike: {loss_pct}% on {req.shift}",
            description=f"Mass balance deficit of {unexplained_loss:,.0f} L exceeds tolerance {threshold}%. Estimated cost impact: INR {fin_loss:,.0f}.",
            severity="Critical",
            department="Processing Hall",
            action_url="/ledger",
            assigned_to="Dr. Sunita Mehta (QC Lead)",
        )
        db.add(alert)

    db.commit()

    return {
        "entry": {
            "id": entry.ledger_id,
            "date": entry.date,
            "shift": entry.shift,
            "milkReceivedLiters": entry.milk_received_liters,
            "unexplainedLossLiters": entry.unexplained_loss_liters,
            "lossPercent": entry.loss_percent,
            "thresholdPercent": entry.threshold_percent,
            "financialLossInr": entry.financial_loss_inr,
            "isThresholdExceeded": entry.is_threshold_exceeded,
        }
    }

@router.get("/api/waste/hotspots")
def get_hotspots(_user=Depends(require_roles(["admin", "staff"]))):
    return {
        "hotspots": [
            {"stage": "Product Changeovers", "totalLossLiters": 1250, "lossPercent": 32.5, "financialLossInr": 56250, "incidents": 14, "severity": "High"},
            {"stage": "Airlock & Tank Leaks", "totalLossLiters": 890, "lossPercent": 23.1, "financialLossInr": 40050, "incidents": 18, "severity": "Critical"},
            {"stage": "Pouch Packaging & Scrap", "totalLossLiters": 710, "lossPercent": 18.4, "financialLossInr": 31950, "incidents": 22, "severity": "Medium"},
            {"stage": "Unrecovered CIP Rinse", "totalLossLiters": 580, "lossPercent": 15.1, "financialLossInr": 26100, "incidents": 10, "severity": "Medium"},
            {"stage": "Receiving Bay Spills", "totalLossLiters": 420, "lossPercent": 10.9, "financialLossInr": 18900, "incidents": 7, "severity": "Low"},
        ]
    }

@router.get("/api/waste/changeovers")
def get_changeovers(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "staff"])),
):
    cos = db.query(Changeover).all()
    return {
        "changeovers": [
            {
                "id": f"CIP-CHG-{c.id:03d}",
                "line": c.line_name,
                "machine": c.cip_type,
                "lineName": c.line_name,
                "previousProduct": c.from_product,
                "nextProduct": c.to_product,
                "fromProduct": c.from_product,
                "toProduct": c.to_product,
                "cipType": c.cip_type,
                "quantityDrainedLiters": c.actual_rinse_liters,
                "actualRinseLiters": c.actual_rinse_liters,
                "historicalBaselineLiters": c.benchmark_liters,
                "benchmarkLiters": c.benchmark_liters,
                "excessWastedLiters": c.excess_liters,
                "excessLiters": c.excess_liters,
                "excessPercent": c.excess_percent,
                "isAbnormal": c.excess_liters > 0,
                "estimatedLossInr": c.estimated_loss_inr,
                "chemicalCostInr": c.chemical_cost_inr,
                "recommendation": f"Excess transition rinse detected ({c.excess_percent}% above benchmark). Verify conductivity cut-off sensor." if c.excess_liters > 0 else "Normal transition within baseline limits.",
                "shift": "Shift A",
                "operator": c.operator,
                "timestamp": c.timestamp,
            }
            for c in cos
        ]
    }

# ─── Pre-Rinse Milk Recovery Tracking ─────────────────────────────────────────

def _format_rinse_recovery(rec: RinseMilkRecovery):
    return {
        "id": rec.id,
        "recordId": rec.record_id,
        "line": rec.line_name,
        "lineName": rec.line_name,
        "product": rec.product_name,
        "productName": rec.product_name,
        "dateTime": f"{rec.date} {rec.time}",
        "date": rec.date,
        "time": rec.time,
        "shift": rec.shift,
        "recoverableEstimateLiters": round(rec.recoverable_estimate_liters, 2),
        "actualRecoveredLiters": round(rec.actual_recovered_liters, 2),
        "unrecoveredLiters": round(rec.unrecovered_liters, 2),
        "recoveryPercent": round(rec.recovery_percent, 1),
        "costPerLiterInr": round(rec.cost_per_liter_inr, 2),
        "unrecoveredLossInr": round(rec.unrecovered_loss_inr, 2),
        "financialValueUnrecoveredInr": round(rec.unrecovered_loss_inr, 2),
        "temperatureCelsius": rec.temperature_celsius,
        "phLevel": rec.ph_level,
        "fatPercent": rec.fat_percent,
        "snfPercent": rec.snf_percent,
        "microbiologicalStatus": rec.microbiological_status or "Pending Verification",
        "qcStatus": rec.qc_status,
        "qcApprovalStatus": rec.qc_status,
        "qcRemarks": rec.qc_remarks,
        "qcVerifiedBy": rec.qc_verified_by,
        "qcVerifiedAt": rec.qc_verified_at.strftime("%Y-%m-%d %H:%M") if rec.qc_verified_at else None,
        "productionReady": rec.production_ready,
        "isDemo": rec.is_demo,
        "operatorName": rec.operator_name,
    }

@router.get("/api/waste/rinse-recovery")
def get_rinse_recovery(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "staff", "worker"])),
):
    """Fetches all pre-rinse milk recovery records, seeds demo records if empty, and returns summary metrics."""
    if db.query(RinseMilkRecovery).count() == 0:
        from app.routes.demo import seed_database_tables
        seed_database_tables(db)

    recoveries = db.query(RinseMilkRecovery).order_by(RinseMilkRecovery.id.asc()).all()

    cfg = db.query(AppConfigModel).first()
    cost_per_l = cfg.rinse_cost_per_liter_inr if (cfg and cfg.rinse_cost_per_liter_inr is not None) else 20.0
    min_ph = cfg.rinse_qc_min_ph if (cfg and cfg.rinse_qc_min_ph is not None) else 6.4
    max_ph = cfg.rinse_qc_max_ph if (cfg and cfg.rinse_qc_max_ph is not None) else 6.8
    max_temp = cfg.rinse_qc_max_temp if (cfg and cfg.rinse_qc_max_temp is not None) else 8.0
    min_snf = cfg.rinse_qc_min_snf if (cfg and cfg.rinse_qc_min_snf is not None) else 8.0
    min_fat = cfg.rinse_qc_min_fat if (cfg and cfg.rinse_qc_min_fat is not None) else 0.5

    records_formatted = [_format_rinse_recovery(r) for r in recoveries]

    total_est = sum(r.recoverable_estimate_liters for r in recoveries)
    total_act = sum(r.actual_recovered_liters for r in recoveries)
    total_unrec = sum(r.unrecovered_liters for r in recoveries)
    total_loss = sum(r.unrecovered_loss_inr for r in recoveries)
    overall_pct = round((total_act / total_est * 100.0), 1) if total_est > 0 else 0.0

    verified_cnt = sum(1 for r in recoveries if r.qc_status == "Verified")
    pending_cnt = sum(1 for r in recoveries if r.qc_status == "Pending")
    rejected_cnt = sum(1 for r in recoveries if r.qc_status == "Rejected")

    summary = {
        "totalRecoverableEstimatedL": round(total_est, 1),
        "totalActualRecoveredL": round(total_act, 1),
        "totalUnrecoveredL": round(total_unrec, 1),
        "overallRecoveryPercent": overall_pct,
        "totalUnrecoveredLossInr": round(total_loss, 2),
        "verifiedCount": verified_cnt,
        "pendingCount": pending_cnt,
        "rejectedCount": rejected_cnt,
        "totalRecords": len(recoveries),
    }

    thresholds = {
        "costPerLiterInr": cost_per_l,
        "minPh": min_ph,
        "maxPh": max_ph,
        "maxTemp": max_temp,
        "minSnf": min_snf,
        "minFat": min_fat,
    }

    return {
        "rinseRecords": records_formatted,
        "records": records_formatted,
        "summary": summary,
        "thresholds": thresholds,
    }

@router.post("/api/waste/rinse-recovery")
def create_rinse_recovery(
    req: RinseRecoveryCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(["admin", "staff"])),
):
    """Logs a new recovery measurement with automated loss and recovery % calculations."""
    cfg = db.query(AppConfigModel).first()
    cost_per_l = cfg.rinse_cost_per_liter_inr if (cfg and cfg.rinse_cost_per_liter_inr is not None) else 20.0

    now = datetime.now()
    cur_date = req.date or now.strftime("%Y-%m-%d")
    cur_time = req.time or now.strftime("%H:%M")

    unrec = max(0.0, req.recoverableEstimateLiters - req.actualRecoveredLiters)
    rec_pct = (req.actualRecoveredLiters / req.recoverableEstimateLiters * 100.0) if req.recoverableEstimateLiters > 0 else 0.0
    loss_inr = unrec * cost_per_l

    count = db.query(RinseMilkRecovery).count() + 1
    record_id = f"RINSE-REC-{count:03d}"

    recovery = RinseMilkRecovery(
        record_id=record_id,
        line_name=req.lineName,
        product_name=req.productName,
        date=cur_date,
        time=cur_time,
        shift=req.shift or "Shift A",
        recoverable_estimate_liters=round(req.recoverableEstimateLiters, 2),
        actual_recovered_liters=round(req.actualRecoveredLiters, 2),
        unrecovered_liters=round(unrec, 2),
        recovery_percent=round(rec_pct, 1),
        cost_per_liter_inr=round(cost_per_l, 2),
        unrecovered_loss_inr=round(loss_inr, 2),
        temperature_celsius=req.temperatureCelsius,
        ph_level=req.phLevel,
        fat_percent=req.fatPercent,
        snf_percent=req.snfPercent,
        microbiological_status="Pending Verification",
        qc_status="Pending",
        qc_remarks="New recovery entry logged. Awaiting QC laboratory verification.",
        qc_verified_by=None,
        qc_verified_at=None,
        production_ready=False,
        is_demo=False,
        operator_name=req.operatorName or user.get("full_name", "Staff Operator"),
    )
    db.add(recovery)
    db.commit()
    db.refresh(recovery)

    return {
        "success": True,
        "message": f"Pre-rinse milk recovery record {record_id} saved successfully.",
        "record": _format_rinse_recovery(recovery),
    }

@router.patch("/api/waste/rinse-recovery/{record_id}/qc-verify")
def verify_rinse_qc(
    record_id: str,
    req: RinseQCVerifyRequest,
    db: Session = Depends(get_db),
    user=Depends(require_roles(["admin", "staff"])),
):
    """Executes QC verification against configured food-safety thresholds."""
    rec = db.query(RinseMilkRecovery).filter(
        (RinseMilkRecovery.record_id == record_id) | (RinseMilkRecovery.id == (int(record_id) if record_id.isdigit() else -1))
    ).first()

    if not rec:
        raise HTTPException(status_code=404, detail=f"Recovery record {record_id} not found")

    cfg = db.query(AppConfigModel).first()
    min_ph = cfg.rinse_qc_min_ph if (cfg and cfg.rinse_qc_min_ph is not None) else 6.4
    max_ph = cfg.rinse_qc_max_ph if (cfg and cfg.rinse_qc_max_ph is not None) else 6.8
    max_temp = cfg.rinse_qc_max_temp if (cfg and cfg.rinse_qc_max_temp is not None) else 8.0
    min_snf = cfg.rinse_qc_min_snf if (cfg and cfg.rinse_qc_min_snf is not None) else 8.0
    min_fat = cfg.rinse_qc_min_fat if (cfg and cfg.rinse_qc_min_fat is not None) else 0.5

    # Update parameters if passed
    if req.temperatureCelsius is not None:
        rec.temperature_celsius = req.temperatureCelsius
    if req.phLevel is not None:
        rec.ph_level = req.phLevel
    if req.fatPercent is not None:
        rec.fat_percent = req.fatPercent
    if req.snfPercent is not None:
        rec.snf_percent = req.snfPercent
    if req.microbiologicalStatus is not None:
        rec.microbiological_status = req.microbiologicalStatus

    # Check against thresholds
    violations = []
    if rec.ph_level is not None and (rec.ph_level < min_ph or rec.ph_level > max_ph):
        violations.append(f"pH {rec.ph_level} outside safe threshold [{min_ph} - {max_ph}]")
    if rec.temperature_celsius is not None and rec.temperature_celsius > max_temp:
        violations.append(f"Temperature {rec.temperature_celsius}°C exceeds max limit {max_temp}°C")
    if rec.snf_percent is not None and rec.snf_percent < min_snf:
        violations.append(f"SNF {rec.snf_percent}% below minimum {min_snf}%")
    if rec.fat_percent is not None and rec.fat_percent < min_fat:
        violations.append(f"Fat {rec.fat_percent}% below minimum {min_fat}%")
    if rec.microbiological_status and "fail" in rec.microbiological_status.lower():
        violations.append(f"Microbiological check failed: {rec.microbiological_status}")

    # Determine status
    if req.qcStatus in ["Verified", "Approved"]:
        if violations:
            rec.qc_status = "Rejected"
            rec.production_ready = False
            violation_str = f"Rejected due to quality threshold violations: {'; '.join(violations)}"
            rec.qc_remarks = f"{violation_str}. (Note: {req.qcRemarks})" if req.qcRemarks else violation_str
        else:
            rec.qc_status = "Verified"
            rec.production_ready = True
            rec.qc_remarks = req.qcRemarks or "All physicochemical and microbiological parameters verified. Approved for production."
    elif req.qcStatus in ["Rejected", "Not Suitable"]:
        rec.qc_status = "Rejected"
        rec.production_ready = False
        rejection_str = f"Rejected by QC personnel. Violations: {'; '.join(violations)}" if violations else "Rejected by QC personnel."
        rec.qc_remarks = f"{rejection_str}. (Note: {req.qcRemarks})" if req.qcRemarks else rejection_str
    elif req.qcStatus in ["Pending"]:
        rec.qc_status = "Pending"
        rec.production_ready = False
        rec.qc_remarks = req.qcRemarks or "Pending laboratory verification."
    else:
        # Automatic determination based on readings
        if violations:
            rec.qc_status = "Rejected"
            rec.production_ready = False
            rec.qc_remarks = f"Rejected: {'; '.join(violations)}"
        elif rec.ph_level is not None and rec.temperature_celsius is not None:
            rec.qc_status = "Verified"
            rec.production_ready = True
            rec.qc_remarks = req.qcRemarks or "Parameters passed automated food-safety verification."
        else:
            rec.qc_status = "Pending"
            rec.production_ready = False
            rec.qc_remarks = req.qcRemarks or "Awaiting complete lab readings."

    rec.qc_verified_by = req.verifiedBy or user.get("full_name", "Dr. Sunita Mehta (QC Lead)")
    rec.qc_verified_at = datetime.utcnow()
    db.commit()
    db.refresh(rec)

    return {
        "success": True,
        "message": f"Record {rec.record_id} verification updated to {rec.qc_status}.",
        "record": _format_rinse_recovery(rec),
    }

@router.get("/api/waste/rinse-recovery/thresholds")
def get_rinse_thresholds(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "staff"])),
):
    """Returns administrator configurable quality thresholds and cost valuation."""
    cfg = db.query(AppConfigModel).first()
    return {
        "costPerLiterInr": cfg.rinse_cost_per_liter_inr if (cfg and cfg.rinse_cost_per_liter_inr is not None) else 20.0,
        "minPh": cfg.rinse_qc_min_ph if (cfg and cfg.rinse_qc_min_ph is not None) else 6.4,
        "maxPh": cfg.rinse_qc_max_ph if (cfg and cfg.rinse_qc_max_ph is not None) else 6.8,
        "maxTemp": cfg.rinse_qc_max_temp if (cfg and cfg.rinse_qc_max_temp is not None) else 8.0,
        "minSnf": cfg.rinse_qc_min_snf if (cfg and cfg.rinse_qc_min_snf is not None) else 8.0,
        "minFat": cfg.rinse_qc_min_fat if (cfg and cfg.rinse_qc_min_fat is not None) else 0.5,
    }

@router.put("/api/waste/rinse-recovery/thresholds")
def update_rinse_thresholds(
    req: RinseThresholdsUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin"])),
):
    """Updates administrator quality thresholds and cost per liter for rinse recovery."""
    cfg = db.query(AppConfigModel).first()
    if not cfg:
        cfg = AppConfigModel()
        db.add(cfg)

    if req.costPerLiterInr is not None:
        cfg.rinse_cost_per_liter_inr = req.costPerLiterInr
    if req.minPh is not None:
        cfg.rinse_qc_min_ph = req.minPh
    if req.maxPh is not None:
        cfg.rinse_qc_max_ph = req.maxPh
    if req.maxTemp is not None:
        cfg.rinse_qc_max_temp = req.maxTemp
    if req.minSnf is not None:
        cfg.rinse_qc_min_snf = req.minSnf
    if req.minFat is not None:
        cfg.rinse_qc_min_fat = req.minFat

    db.commit()
    db.refresh(cfg)

    return {
        "success": True,
        "message": "Quality thresholds updated successfully.",
        "thresholds": {
            "costPerLiterInr": cfg.rinse_cost_per_liter_inr,
            "minPh": cfg.rinse_qc_min_ph,
            "maxPh": cfg.rinse_qc_max_ph,
            "maxTemp": cfg.rinse_qc_max_temp,
            "minSnf": cfg.rinse_qc_min_snf,
            "minFat": cfg.rinse_qc_min_fat,
        },
    }

@router.get("/api/resources/packaging")
def get_packaging_resources(_user=Depends(require_roles(["admin", "staff"]))):
    return {
        "packaging": [
            {"lineId": "Line 1 - 500ml Pouch", "filmRollBatch": "FLM-2026-88A", "filmConsumedMeters": 4200, "pouchesProduced": 27800, "leakersDetected": 85, "scrapKg": 3.2, "yieldPercent": 99.1, "status": "Normal"},
            {"lineId": "Line 2 - 1000ml Pouch", "filmRollBatch": "FLM-2026-89B", "filmConsumedMeters": 3800, "pouchesProduced": 18900, "leakersDetected": 72, "scrapKg": 2.8, "yieldPercent": 99.2, "status": "Normal"},
            {"lineId": "Line 4 - 500ml Standard", "filmRollBatch": "FLM-2026-92D", "filmConsumedMeters": 4600, "pouchesProduced": 26100, "leakersDetected": 412, "scrapKg": 14.8, "yieldPercent": 94.6, "status": "Anomaly"},
        ]
    }

@router.get("/api/resources/consumption")
def get_resource_consumption(_user=Depends(require_roles(["admin", "staff"]))):
    return {
        "resources": [
            {"resource": "Water Consumption", "currentPerLiterMilk": 1.70, "benchmarkPerLiterMilk": 1.30, "totalConsumedUnit": "85,000 Liters", "excessPercent": 30.8, "excessCostInr": 4500, "status": "High"},
            {"resource": "CIP Caustic Soda (NaOH)", "currentPerLiterMilk": 0.45, "benchmarkPerLiterMilk": 0.35, "totalConsumedUnit": "22.5 kg", "excessPercent": 28.6, "excessCostInr": 5400, "status": "High"},
            {"resource": "CIP Nitric Acid (HNO3)", "currentPerLiterMilk": 0.28, "benchmarkPerLiterMilk": 0.22, "totalConsumedUnit": "14.0 kg", "excessPercent": 27.3, "excessCostInr": 3800, "status": "High"},
        ]
    }

# ─── Leaks & Spills ─────────────────────────────────────────────────────────
@router.get("/api/leaks")
def get_leaks(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "staff"])),
):
    leaks = db.query(LeakSpillReport).order_by(LeakSpillReport.created_at.desc()).all()
    return {
        "leaks": [
            {
                "id": l.leak_id,
                "location": l.location,
                "tankOrMachine": l.tank_or_machine,
                "type": l.type,
                "quantity": l.quantity,
                "financialImpactInr": l.financial_impact_inr,
                "shift": l.shift,
                "reportedBy": l.reported_by,
                "assignedTo": l.assigned_to,
                "status": l.status,
                "repeatCount": l.repeat_count,
                "isRecurring": l.is_recurring,
                "timestamp": l.created_at.strftime("%Y-%m-%d %H:%M"),
            }
            for l in leaks
        ]
    }

@router.post("/api/leaks")
def create_leak(
    req: LeakCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "staff"])),
):
    existing = db.query(LeakSpillReport).filter(LeakSpillReport.tank_or_machine.ilike(f"%{req.tankOrMachine}%")).count()
    repeat_count = existing + 1
    is_rec = repeat_count >= 3

    leak_id = f"LEAK-{int(datetime.utcnow().timestamp() * 1000)}"
    leak = LeakSpillReport(
        leak_id=leak_id,
        location=req.location,
        tank_or_machine=req.tankOrMachine,
        type=req.type,
        quantity=req.quantity,
        financial_impact_inr=3150.0,
        shift=req.shift,
        reported_by=req.reportedBy,
        assigned_to=req.assignedTo,
        status="Logged",
        repeat_count=repeat_count,
        is_recurring=is_rec,
    )
    db.add(leak)

    if is_rec:
        alert = SystemAlert(
            alert_id=f"ALERT-RECURRING-LEAK-{leak_id}",
            pillar="Equipment",
            title=f"Recurring Leak Detected ({repeat_count}x): {req.tankOrMachine}",
            description=f"Chronic failure identified at {req.location}. Mandatory mechanical seal overhaul recommended.",
            severity="Critical",
            department=req.location,
            action_url="/leaks",
            assigned_to=req.assignedTo,
        )
        db.add(alert)

    db.commit()
    db.refresh(leak)
    return {"leak": {"id": leak.leak_id, "status": leak.status, "repeatCount": leak.repeat_count}}

@router.patch("/api/leaks/{leak_id}/status")
def update_leak_status(
    leak_id: str,
    req: LeakStatusUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "staff"])),
):
    leak = db.query(LeakSpillReport).filter(LeakSpillReport.leak_id == leak_id).first()
    if not leak:
        raise HTTPException(status_code=404, detail="Leak record not found")
    leak.status = req.status
    db.commit()
    return {"leak": {"id": leak.leak_id, "status": leak.status}}

# ─── 3-Tier Waste Classification & QC Verification ──────────────────────────
@router.get("/api/classification/batches")
def get_waste_batches(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "staff"])),
):
    batches = db.query(WasteBatch).order_by(WasteBatch.registered_at.desc()).all()
    return {
        "batches": [
            {
                "id": b.batch_id,
                "department": b.department,
                "productionStage": b.production_stage,
                "materialName": b.material_name,
                "wasteType": b.waste_type,
                "quantity": b.quantity,
                "unit": b.unit,
                "reason": b.reason,
                "contaminationStatus": b.contamination_status,
                "shelfLifeHours": b.shelf_life_hours,
                "storageCondition": b.storage_condition,
                "aiSuggestedCategory": b.ai_suggested_category,
                "aiConfidence": f"{int(b.ai_confidence * 100)}%",
                "aiReasoning": b.ai_reasoning,
                "recommendedDestination": b.recommended_destination,
                "qcVerifiedCategory": b.qc_verified_category,
                "qcStatus": b.qc_status,
                "qcVerifiedBy": b.qc_verified_by,
                "registeredAt": b.registered_at.strftime("%Y-%m-%d %H:%M"),
            }
            for b in batches
        ]
    }

@router.post("/api/classification/register")
def register_waste_batch(
    req: WasteBatchRegister,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "staff"])),
):
    # AI 3-Tier Classification Decision Tree
    ai_cat = "Reusable"
    confidence = 0.94
    reasoning = "Uncontaminated food-grade organic dairy matrix suitable for valorization"
    dest = "Bio-Fermentation & Commercial Bakery Partners"

    if "chemical" in req.materialName.lower() or "acid" in req.materialName.lower() or "wash" in req.materialName.lower():
        ai_cat = "Treatable"
        confidence = 0.96
        reasoning = "High chemical oxygen demand (COD > 4000 mg/L); requires neutralization"
        dest = "On-site Effluent Treatment Plant (ETP)"
    elif "contaminated" in req.contaminationStatus.lower():
        ai_cat = "Disposal"
        confidence = 0.98
        reasoning = "Pathogen or physical particulate contamination detected"
        dest = "Approved Industrial Solid Waste Incineration"

    batch_id = f"BATCH-WST-{int(datetime.utcnow().timestamp() * 1000)}"
    passport_id = f"DWP-{batch_id}"
    batch = WasteBatch(
        batch_id=batch_id,
        passport_id=passport_id,
        department=req.department,
        production_stage=req.productionStage,
        material_name=req.materialName,
        waste_type=req.wasteType,
        quantity=req.quantity,
        unit=req.unit,
        reason=req.reason,
        contamination_status=req.contaminationStatus,
        shelf_life_hours=req.shelfLifeHours,
        storage_condition=req.storageCondition,
        storage_location=f"{req.department} - Staging Area",
        storage_tank_or_bay=f"{req.department} Holding Tank",
        storage_temperature="Standard Chilled 4°C" if "Chilled" in req.storageCondition else "Ambient",
        handling_precautions="Sanitary food-grade handling required." if req.contaminationStatus == "None - Food Grade" else "Use standard industrial PPE.",
        chain_of_custody_status="Logged at Generation Facility",
        ai_suggested_category=ai_cat,
        ai_confidence=confidence,
        ai_reasoning=reasoning,
        recommended_destination=dest,
    )
    db.add(batch)

    # Automatically add initial custody event
    init_txn = WasteExchangeTransaction(
        transaction_id=f"TXN-GEN-{int(datetime.utcnow().timestamp() * 1000)}",
        batch_id=batch_id,
        partner_industry="Apex Dairy Cooperative • Plant #4",
        receiving_facility=req.department,
        action="Batch Registered at Facility",
        quantity_exchanged=req.quantity,
        unit=req.unit,
        signed_by=_user.full_name if _user else "Production Supervisor",
        notes=f"Waste batch generated during {req.productionStage}: {req.reason or 'Normal operation'}",
    )
    db.add(init_txn)
    db.commit()
    db.refresh(batch)

    return {"batch": {"id": batch.batch_id, "passportId": batch.passport_id, "aiSuggestedCategory": batch.ai_suggested_category, "qcStatus": batch.qc_status}}

@router.patch("/api/classification/{batch_id}/qc-verify")
def qc_verify_waste_batch(
    batch_id: str,
    req: WasteQCVerify,
    db: Session = Depends(get_db),
    user=Depends(require_roles(["admin"])),
):
    batch = db.query(WasteBatch).filter(WasteBatch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    batch.qc_verified_category = req.category
    batch.qc_status = "Verified"
    batch.qc_verified_by = req.verifiedBy or user.full_name
    if not batch.qc_certificate_number:
        batch.qc_certificate_number = f"QC-CERT-{datetime.utcnow().year}-{batch.batch_id[-6:]}"

    # Append QC custody event to historical transactions
    qc_txn = WasteExchangeTransaction(
        transaction_id=f"TXN-QC-{int(datetime.utcnow().timestamp() * 1000)}",
        batch_id=batch.batch_id,
        partner_industry="Quality Assurance Department",
        receiving_facility="On-Site Dairy Testing Laboratory",
        action="Laboratory Quality & Purity Clearance",
        quantity_exchanged=batch.quantity,
        unit=batch.unit,
        signed_by=batch.qc_verified_by,
        notes=f"Sample tested. Verified Category: {req.category}. Certificate #{batch.qc_certificate_number} approved.",
    )
    db.add(qc_txn)
    db.commit()
    return {"batch": {"id": batch.batch_id, "qcStatus": batch.qc_status, "qcVerifiedCategory": batch.qc_verified_category}}

# ─── Digital Waste Passport with Dynamic QR Code ───────────────────────────
class MarketplaceTransactionCreate(BaseModel):
    batchId: str
    partnerIndustry: str
    action: str = "Dispatched from Plant (Gate-Out)"
    receivingFacility: Optional[str] = None
    vehicleNumber: Optional[str] = None
    driverName: Optional[str] = None
    agreedPriceInr: Optional[float] = None
    quantity: Optional[float] = None
    unit: Optional[str] = "Liters"
    signedBy: Optional[str] = None
    notes: Optional[str] = None

@router.get("/api/passport/list")
@router.get("/api/passports")
def list_digital_passports(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "staff", "worker"])),
):
    """
    Retrieves all waste batches from the relational database as Digital Waste Passports.
    """
    batches = db.query(WasteBatch).order_by(WasteBatch.registered_at.desc(), WasteBatch.id.desc()).all()
    passports = []
    for b in batches:
        pid = b.passport_id or f"DWP-{b.batch_id}"
        category = (
            b.qc_verified_category
            if b.qc_verified_category and b.qc_verified_category != "Pending Verification"
            else (b.ai_suggested_category or "Not Recorded")
        )
        passports.append({
            "passportId": pid,
            "batchId": b.batch_id,
            "materialName": b.material_name,
            "wasteType": b.waste_type or "Not Recorded",
            "quantity": f"{b.quantity:g} {b.unit}" if b.quantity is not None else "Not Recorded",
            "quantityNum": b.quantity,
            "unit": b.unit or "Liters",
            "category": category,
            "qcStatus": b.qc_status or "Not Recorded",
            "receivingIndustry": b.receiving_industry or "Not Recorded",
            "generationDate": b.registered_at.strftime("%Y-%m-%d %H:%M") if b.registered_at else "Not Recorded",
            "storageCondition": b.storage_condition or "Not Recorded",
            "chainOfCustodyStatus": b.chain_of_custody_status or "Logged at Generation Facility",
            "label": f"{b.material_name} (#{b.batch_id})",
        })
    return {"passports": passports}

@router.get("/api/passport/{passport_id}")
def get_digital_passport(
    passport_id: str,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin", "staff", "worker"])),
):
    """
    Fetches the comprehensive Digital Waste Passport directly from database records.
    Resolves by passport_id, batch_id, or QR hash identifier.
    Returns:
    - Waste Batch details (type, quantity, material, generation date)
    - Quality Management readings (pH, fat, SNF, microbial, temp, cert #)
    - Storage details (tank/bay, temp, condition, precautions)
    - Waste Exchange & Logistics (receiving industry, vehicle, driver, transaction history)
    - Scannable QR code encoding the exact live database record.
    """
    cid = passport_id.strip()
    batch = (
        db.query(WasteBatch)
        .filter(
            (WasteBatch.passport_id == cid)
            | (WasteBatch.batch_id == cid)
            | (WasteBatch.passport_id == f"DWP-{cid}")
            | (WasteBatch.batch_id == cid.replace("DWP-", "", 1))
        )
        .first()
    )

    if not batch:
        # Fallback to the first available batch if not found
        batch = db.query(WasteBatch).first()
        if not batch:
            raise HTTPException(status_code=404, detail="No waste batch found in database")

    resolved_pid = batch.passport_id or f"DWP-{batch.batch_id}"

    # Origin Facility Info
    cfg = db.query(AppConfigModel).first()
    plant_name = cfg.plant_name if cfg and cfg.plant_name else "Apex Dairy Cooperative • Plant #4"
    fssai_license = cfg.fssai_license if cfg and cfg.fssai_license else "FSSAI-MH-2024-00918-B4"

    # Quality category resolution
    category = (
        batch.qc_verified_category
        if batch.qc_verified_category and batch.qc_verified_category != "Pending Verification"
        else (batch.ai_suggested_category or "Not Recorded")
    )

    # Historical Custody Transactions
    txns = (
        db.query(WasteExchangeTransaction)
        .filter(WasteExchangeTransaction.batch_id == batch.batch_id)
        .order_by(WasteExchangeTransaction.created_at.asc(), WasteExchangeTransaction.id.asc())
        .all()
    )

    if txns:
        chain_of_custody = [
            {
                "transactionId": t.transaction_id,
                "step": t.action,
                "partnerIndustry": t.partner_industry or "Not Recorded",
                "destinationFacility": t.receiving_facility or "Not Recorded",
                "timestamp": t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else "Not Recorded",
                "signedBy": t.signed_by or "Authorized Signatory",
                "vehicleNumber": t.transport_vehicle_number or "Not Recorded",
                "driverName": t.driver_name or "Not Recorded",
                "agreedPrice": f"₹{t.agreed_price_inr:.2f}/{t.unit}" if t.agreed_price_inr is not None else "Not Recorded",
                "quantity": f"{t.quantity_exchanged} {t.unit}" if t.quantity_exchanged is not None else "Not Recorded",
                "notes": t.notes or "Not Recorded",
            }
            for t in txns
        ]
    else:
        chain_of_custody = [
            {
                "transactionId": f"GEN-{batch.batch_id}",
                "step": f"Batch Generated at {batch.department}",
                "partnerIndustry": plant_name,
                "destinationFacility": batch.department,
                "timestamp": batch.registered_at.strftime("%Y-%m-%d %H:%M") if batch.registered_at else "Not Recorded",
                "signedBy": batch.qc_verified_by if (batch.qc_status == "Verified" and batch.qc_verified_by != "Awaiting Verification") else "Floor Supervisor",
                "vehicleNumber": "Internal Plant Logistics",
                "driverName": "Not Recorded",
                "agreedPrice": "Not Recorded",
                "quantity": f"{batch.quantity:g} {batch.unit}" if batch.quantity is not None else "Not Recorded",
                "notes": f"Initial waste generation logged. Reason: {batch.reason or 'Normal operation'}. Contamination: {batch.contamination_status}.",
            }
        ]

    # Generate QR Code Payload linking directly to this database batch
    qr_payload = {
        "passportId": resolved_pid,
        "batchId": batch.batch_id,
        "materialName": batch.material_name,
        "wasteType": batch.waste_type or "Not Recorded",
        "quantity": f"{batch.quantity:g} {batch.unit}" if batch.quantity is not None else "Not Recorded",
        "originFacility": plant_name,
        "fssaiLicense": fssai_license,
        "generationDate": batch.registered_at.strftime("%Y-%m-%d %H:%M UTC") if batch.registered_at else "Not Recorded",
        "qcCertificateNumber": batch.qc_certificate_number or "Not Recorded",
        "qcStatus": batch.qc_status or "Not Recorded",
        "qcCategory": category,
        "storageCondition": batch.storage_condition or "Not Recorded",
        "storageTankOrBay": batch.storage_tank_or_bay or "Not Recorded",
        "receivingIndustry": batch.receiving_industry or "Not Recorded",
        "destinationFacility": batch.destination_facility or "Not Recorded",
        "transportVehicleNumber": batch.transport_vehicle_number or "Not Recorded",
        "chainOfCustodyStatus": batch.chain_of_custody_status or "Logged at Generation Facility",
        "verifyUrl": f"/api/passport/{resolved_pid}",
    }

    # Generate genuine scannable QR Code PNG Data URL
    qr = qrcode.QRCode(box_size=5, border=2)
    qr.add_data(json.dumps(qr_payload, indent=2))
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1e3a1e", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"

    return {
        "passport": {
            "passportId": resolved_pid,
            "batchId": batch.batch_id,
            "materialName": batch.material_name,
            "wasteType": batch.waste_type or "Not Recorded",
            "quantity": f"{batch.quantity:g} {batch.unit}" if batch.quantity is not None else "Not Recorded",
            "quantityNum": batch.quantity,
            "unit": batch.unit or "Liters",
            "category": category,
            "aiSuggestedCategory": batch.ai_suggested_category or "Not Recorded",
            "aiConfidence": f"{int(batch.ai_confidence * 100)}%" if batch.ai_confidence else "Not Recorded",
            "aiReasoning": batch.ai_reasoning or "Not Recorded",
            "recommendedDestination": batch.recommended_destination or "Not Recorded",
            "originFacility": plant_name,
            "fssaiLicense": fssai_license,
            "department": batch.department or "Not Recorded",
            "productionStage": batch.production_stage or "Not Recorded",
            "generationDate": batch.registered_at.strftime("%Y-%m-%d %H:%M") if batch.registered_at else "Not Recorded",
            "reason": batch.reason or "Not Recorded",
            "contaminationStatus": batch.contamination_status or "Not Recorded",

            # Quality Management Integration
            "qcCertificateNumber": batch.qc_certificate_number or "Not Recorded",
            "qcStatus": batch.qc_status or "Not Recorded",
            "qcVerifiedBy": batch.qc_verified_by or "Not Recorded",
            "phLevel": f"{batch.ph_level:.2f}" if batch.ph_level is not None else "Not Recorded",
            "fatPercent": f"{batch.fat_percent:.2f}%" if batch.fat_percent is not None else "Not Recorded",
            "snfPercent": f"{batch.snf_percent:.2f}%" if batch.snf_percent is not None else "Not Recorded",
            "microbialPurity": batch.microbial_count or "Not Recorded",
            "temperature": f"{batch.temperature_celsius:.1f}°C" if batch.temperature_celsius is not None else "Not Recorded",
            "moisturePercent": f"{batch.moisture_percent:.1f}%" if batch.moisture_percent is not None else "Not Recorded",
            "qualityRemarks": batch.quality_remarks or "Not Recorded",

            # Storage Management Integration
            "storageCondition": batch.storage_condition or "Not Recorded",
            "storageTankOrBay": batch.storage_tank_or_bay or "Not Recorded",
            "storageLocation": batch.storage_location or "Not Recorded",
            "storageTemperature": batch.storage_temperature or "Not Recorded",
            "shelfLifeHours": f"{batch.shelf_life_hours} Hours" if batch.shelf_life_hours is not None else "Not Recorded",
            "handlingPrecautions": batch.handling_precautions or "Not Recorded",

            # Waste Exchange & Logistics Integration
            "receivingIndustry": batch.receiving_industry or "Not Recorded",
            "destinationFacility": batch.destination_facility or "Not Recorded",
            "transportVehicleNumber": batch.transport_vehicle_number or "Not Recorded",
            "driverName": batch.driver_name or "Not Recorded",
            "chainOfCustodyStatus": batch.chain_of_custody_status or "Logged at Generation Facility",

            # QR Code & Verifiable Data
            "qrCodeDataUrl": qr_b64,
            "qrPayload": qr_payload,
            "chainOfCustody": chain_of_custody,
        }
    }

@router.post("/api/marketplace/transaction")
def create_exchange_transaction(
    req: MarketplaceTransactionCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(["admin", "staff"])),
):
    """
    Appends a new historical transaction to the Waste Exchange log and updates the batch's passport.
    Maintains complete audit history without overwriting previous steps.
    """
    batch = db.query(WasteBatch).filter(WasteBatch.batch_id == req.batchId).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Waste batch {req.batchId} not found")

    txn_id = f"TXN-EX-{int(datetime.utcnow().timestamp() * 1000)}"
    txn = WasteExchangeTransaction(
        transaction_id=txn_id,
        batch_id=batch.batch_id,
        partner_industry=req.partnerIndustry,
        receiving_facility=req.receivingFacility or batch.destination_facility,
        action=req.action,
        transport_vehicle_number=req.vehicleNumber or batch.transport_vehicle_number,
        driver_name=req.driverName or batch.driver_name,
        agreed_price_inr=req.agreedPriceInr,
        quantity_exchanged=req.quantity or batch.quantity,
        unit=req.unit or batch.unit,
        signed_by=req.signedBy or user.full_name,
        notes=req.notes,
    )
    db.add(txn)

    # Update batch latest logistics state
    batch.receiving_industry = req.partnerIndustry
    if req.receivingFacility:
        batch.destination_facility = req.receivingFacility
    if req.vehicleNumber:
        batch.transport_vehicle_number = req.vehicleNumber
    if req.driverName:
        batch.driver_name = req.driverName
    batch.chain_of_custody_status = req.action

    db.commit()

    return {
        "success": True,
        "transactionId": txn_id,
        "batchId": batch.batch_id,
        "passportId": batch.passport_id or f"DWP-{batch.batch_id}",
        "chainOfCustodyStatus": batch.chain_of_custody_status,
    }

@router.get("/api/marketplace/matches")
def get_marketplace_matches(_user=Depends(require_roles(["admin", "staff"]))):
    return {
        "matches": [
            {"id": "MATCH-01", "material": "Sweet Whey Matrix", "quantityLiters": 3500, "partnerName": "Arogya NutraFeed Agro Co-op", "application": "Cattle Nutrient Drink", "distanceKm": 18, "pricePerLiterInr": 4.5, "totalRevenueInr": 15750, "status": "Proposed"},
            {"id": "MATCH-02", "material": "ETP Biosludge Cake", "quantityLiters": 1200, "partnerName": "GreenGrow Organics Ltd", "application": "Enriched Soil Conditioner", "distanceKm": 34, "pricePerLiterInr": 1.2, "totalRevenueInr": 1440, "status": "Under Evaluation"},
        ]
    }

@router.get("/api/marketplace/demand-predictions")
def get_demand_predictions(_user=Depends(require_roles(["admin", "staff"]))):
    return {
        "predictions": [
            {"material": "Sweet Food-Grade Whey", "predictedQuantity": 12000, "unit": "Liters/month", "confidenceScore": "94%", "targetSector": "Nutraceutical & Bakery", "historicalGrowth": "+18% YoY", "estimatedRevenueInr": 54000},
            {"material": "Separated Cream Residue", "predictedQuantity": 1800, "unit": "Liters/month", "confidenceScore": "86%", "targetSector": "Foliar Agrofertilizer", "historicalGrowth": "+12% Seasonal", "estimatedRevenueInr": 9600},
        ]
    }

# ─── Rupee Impact Financial Engine ──────────────────────────────────────────
@router.get("/api/financial/summary")
def get_financial_summary(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin"])),
):
    ledgers = db.query(DailyLedger).all()
    leaks = db.query(LeakSpillReport).all()
    changeovers = db.query(Changeover).all()

    milk_loss_inr = sum(l.financial_loss_inr for l in ledgers) or 45000.0
    leak_loss_inr = sum(l.financial_impact_inr for l in leaks) or 40050.0
    changeover_loss_inr = sum(c.estimated_loss_inr for c in changeovers) or 56250.0
    packaging_loss_inr = 31950.0
    chemical_loss_inr = 9200.0
    water_loss_inr = 4500.0

    total_inr = milk_loss_inr + leak_loss_inr + changeover_loss_inr + packaging_loss_inr + chemical_loss_inr + water_loss_inr

    return {
        "totalDailyFinancialLossInr": total_inr,
        "monthlyProjectedLossInr": total_inr * 30,
        "annualProjectedLossInr": total_inr * 300,
        "breakdown": [
            {"category": "Product Changeovers Excess", "amountInr": changeover_loss_inr, "percent": round((changeover_loss_inr / total_inr) * 100, 1)},
            {"category": "Unexplained Milk Mass Deficit", "amountInr": milk_loss_inr, "percent": round((milk_loss_inr / total_inr) * 100, 1)},
            {"category": "Airlock & Tank Flange Leaks", "amountInr": leak_loss_inr, "percent": round((leak_loss_inr / total_inr) * 100, 1)},
            {"category": "Pouch Packaging Rejects & Scrap", "amountInr": packaging_loss_inr, "percent": round((packaging_loss_inr / total_inr) * 100, 1)},
            {"category": "Chemical & Water CIP Waste", "amountInr": chemical_loss_inr + water_loss_inr, "percent": round(((chemical_loss_inr + water_loss_inr) / total_inr) * 100, 1)},
        ],
    }

@router.post("/api/financial/what-if")
def financial_what_if(req: dict, _user=Depends(require_roles(["admin"]))):
    recover_rinse_pct = float(req.get("recoverRinsePercent", 70))
    optimize_changeover_pct = float(req.get("optimizeChangeoversPercent", 50))
    fix_leaks_pct = float(req.get("fixLeaksPercent", 80))

    savings_rinse = 18000 * (recover_rinse_pct / 100.0)
    savings_changeovers = 56250 * (optimize_changeover_pct / 100.0)
    savings_leaks = 40050 * (fix_leaks_pct / 100.0)
    daily_savings = savings_rinse + savings_changeovers + savings_leaks

    return {
        "dailySavingsInr": round(daily_savings, 2),
        "monthlySavingsInr": round(daily_savings * 30, 2),
        "annualSavingsInr": round(daily_savings * 300, 2),
    }

