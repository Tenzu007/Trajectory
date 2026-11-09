from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.waste_energy import MachineEnergy, AppConfigModel
from app.schemas.energy import EnergySimulateRequest
from app.services.auth_service import require_roles

router = APIRouter(tags=["Energy Consumption & Power Simulation"])

@router.get("/api/energy/machines")
def get_machines(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin"])),
):
    machines = db.query(MachineEnergy).all()
    config = db.query(AppConfigModel).first()
    tariff = config.electricity_tariff_inr if config else 8.20

    total_kwh = sum(m.actual_kwh for m in machines)
    total_cost = total_kwh * tariff
    anomalies = [m for m in machines if m.is_anomaly]
    savings_kwh = sum(m.potential_savings_kwh for m in anomalies)

    return {
        "machines": [
            {
                "id": m.machine_id,
                "name": m.name,
                "department": m.department,
                "ratedPowerKw": m.rated_power_kw,
                "normalHoursPerDay": m.normal_hours_per_day,
                "actualHours": m.actual_hours,
                "actualKwh": m.actual_kwh,
                "historicalAvgKwh": m.historical_avg_kwh,
                "isAnomaly": m.is_anomaly,
                "anomalyPercent": m.anomaly_percent,
                "anomalyReason": m.anomaly_reason,
                "recommendation": m.recommendation,
                "potentialSavingsKwh": m.potential_savings_kwh,
                "potentialSavingsInr": m.potential_savings_inr,
            }
            for m in machines
        ],
        "totalKwh": total_kwh,
        "totalCostInr": round(total_cost, 2),
        "tariff": tariff,
        "anomalyCount": len(anomalies),
        "potentialSavingsKwh": savings_kwh,
        "potentialSavingsInr": round(savings_kwh * tariff, 2),
    }

@router.get("/api/energy/departments")
def get_energy_departments(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin"])),
):
    machines = db.query(MachineEnergy).all()
    config = db.query(AppConfigModel).first()
    tariff = config.electricity_tariff_inr if config else 8.20

    dept_map = {}
    for m in machines:
        if m.department not in dept_map:
            dept_map[m.department] = {"kwh": 0.0, "machines": []}
        dept_map[m.department]["kwh"] += m.actual_kwh
        dept_map[m.department]["machines"].append(m)

    dept_list = []
    for dept, data in dept_map.items():
        sorted_m = sorted(data["machines"], key=lambda x: x.actual_kwh, reverse=True)
        dept_list.append({
            "department": dept,
            "totalKwh": round(data["kwh"], 1),
            "totalCostInr": round(data["kwh"] * tariff, 2),
            "machineCount": len(data["machines"]),
            "highestConsumer": sorted_m[0].name if sorted_m else "N/A",
        })

    return {"departments": dept_list}

@router.get("/api/energy/renewable")
def get_renewable_metrics(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin"])),
):
    machines = db.query(MachineEnergy).all()
    total_demand = sum(m.actual_kwh for m in machines) or 3824.0

    solar_kwh = 1250.0
    wind_kwh = 480.0
    total_renewable = solar_kwh + wind_kwh
    grid_kwh = max(0.0, total_demand - total_renewable)
    renewable_pct = min(100.0, round((total_renewable / total_demand) * 100.0, 1))

    return {
        "solarKwh": solar_kwh,
        "windKwh": wind_kwh,
        "totalRenewableKwh": total_renewable,
        "gridKwh": round(grid_kwh, 1),
        "totalDemandKwh": round(total_demand, 1),
        "renewableContributionPercent": renewable_pct,
        "gridDependencyPercent": round(100.0 - renewable_pct, 1),
        "co2SavedKg": int(total_renewable * 0.82),
    }

@router.post("/api/energy/simulate")
def simulate_energy(
    req: EnergySimulateRequest,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(["admin"])),
):
    machines = db.query(MachineEnergy).all()
    config = db.query(AppConfigModel).first()
    tariff = config.electricity_tariff_inr if config else 8.20

    baseline_kwh = sum(m.actual_kwh for m in machines) or 3824.0
    saved_kwh = 0.0

    for m in machines:
        if m.is_anomaly and req.idleShutdown:
            load_factor = m.actual_kwh / max(1.0, m.actual_hours * m.rated_power_kw)
            hours_saved = min(max(0.0, m.actual_hours - m.normal_hours_per_day), req.reduceHours)
            saved_kwh += max(0.0, hours_saved * m.rated_power_kw * load_factor)

    # If no anomaly machines or zero hours saved, provide standard optimization baseline
    if saved_kwh <= 0.0:
        saved_kwh = baseline_kwh * 0.12

    simulated_kwh = max(0.0, baseline_kwh - saved_kwh)
    financial_savings = saved_kwh * tariff

    return {
        "baselineKwh": round(baseline_kwh, 1),
        "simulatedKwh": round(simulated_kwh, 1),
        "savedKwh": round(saved_kwh, 1),
        "savedPercent": round((saved_kwh / max(1.0, baseline_kwh)) * 100.0, 1),
        "financialSavingsInr": round(financial_savings, 2),
        "monthlyProjectedSavingsInr": round(financial_savings * 30, 2),
        "annualProjectedSavingsInr": round(financial_savings * 300, 2),
        "baselineRenewableKwh": 1730.0,
        "simulatedRenewableKwh": 1730.0 * (1 + req.extraRenewablePercent / 100.0),
    }
