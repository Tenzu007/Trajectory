from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_token():
    res = client.post("/api/auth/login", json={"username_or_email": "admin@dairypulse.in", "password": "admin123"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_get_rinse_recovery_seeded_records_and_summary():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/waste/rinse-recovery", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "rinseRecords" in data
    assert "summary" in data
    assert "thresholds" in data

    records = data["rinseRecords"]
    assert len(records) >= 5

    # Check Line 01 demo record
    r1 = next((r for r in records if "Line 01" in r["lineName"] or "Line 01" in r.get("line", "")), None)
    assert r1 is not None
    assert "Skimmed" in r1["productName"]
    assert r1["recoverableEstimateLiters"] == 120.0
    assert r1["actualRecoveredLiters"] == 108.0
    assert r1["unrecoveredLiters"] == 12.0
    assert r1["recoveryPercent"] == 90.0
    assert r1["unrecoveredLossInr"] == 240.0
    assert r1["qcStatus"] == "Verified"
    assert r1["productionReady"] is True
    assert r1["isDemo"] is True

    # Check Line 03 Pending demo record
    r3 = next((r for r in records if "Line 03" in r["lineName"]), None)
    assert r3 is not None
    assert r3["recoverableEstimateLiters"] == 100.0
    assert r3["actualRecoveredLiters"] == 72.0
    assert r3["unrecoveredLiters"] == 28.0
    assert r3["recoveryPercent"] == 72.0
    assert r3["unrecoveredLossInr"] == 560.0
    assert r3["qcStatus"] == "Pending"
    assert r3["productionReady"] is False

    # Check Line 04 Rejected demo record
    r4 = next((r for r in records if "Line 04" in r["lineName"]), None)
    assert r4 is not None
    assert r4["recoverableEstimateLiters"] == 90.0
    assert r4["actualRecoveredLiters"] == 54.0
    assert r4["unrecoveredLiters"] == 36.0
    assert r4["recoveryPercent"] == 60.0
    assert r4["unrecoveredLossInr"] == 720.0
    assert r4["qcStatus"] == "Rejected"
    assert r4["productionReady"] is False

    # Check Summary Metrics
    summary = data["summary"]
    assert summary["totalRecoverableEstimatedL"] >= 640.0
    assert summary["totalActualRecoveredL"] >= 531.0
    assert summary["totalUnrecoveredL"] >= 109.0
    assert summary["totalUnrecoveredLossInr"] >= 2180.0
    assert summary["verifiedCount"] >= 3
    assert summary["pendingCount"] >= 1
    assert summary["rejectedCount"] >= 1

def test_post_new_recovery_record_automatic_calculations():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "lineName": "Line 06",
        "productName": "Standardized Toned Milk",
        "shift": "Shift C",
        "recoverableEstimateLiters": 200.0,
        "actualRecoveredLiters": 170.0,
        "operatorName": "QC Inspector Test",
    }

    res = client.post("/api/waste/rinse-recovery", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    rec = data["record"]

    # Verify auto calculations
    assert rec["unrecoveredLiters"] == 30.0  # 200 - 170
    assert rec["recoveryPercent"] == 85.0   # (170 / 200) * 100
    assert rec["unrecoveredLossInr"] == 600.0  # 30 * 20.0
    assert rec["qcStatus"] == "Pending"
    assert rec["productionReady"] is False
    assert rec["isDemo"] is False

def test_qc_verification_workflow():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a pending record
    payload = {
        "lineName": "Line 07",
        "productName": "Organic Whole Milk",
        "shift": "Shift A",
        "recoverableEstimateLiters": 100.0,
        "actualRecoveredLiters": 80.0,
    }
    create_res = client.post("/api/waste/rinse-recovery", json=payload, headers=headers)
    assert create_res.status_code == 200
    rec_id = create_res.json()["record"]["recordId"]

    # 2. Attempt QC verification with temperature abuse (13.5°C > max 8.0°C) and acidified pH (6.0 < 6.4)
    out_of_spec_payload = {
        "temperatureCelsius": 13.5,
        "phLevel": 6.0,
        "fatPercent": 3.8,
        "snfPercent": 8.5,
        "microbiologicalStatus": "Elevated microbial activity",
        "qcStatus": "Verified",  # Attempting to verify out-of-spec milk
        "qcRemarks": "Operator claims it is fine",
        "verifiedBy": "Dr. Sunita Mehta (QC Lead)",
    }
    res_fail = client.patch(f"/api/waste/rinse-recovery/{rec_id}/qc-verify", json=out_of_spec_payload, headers=headers)
    assert res_fail.status_code == 200
    updated_fail = res_fail.json()["record"]
    # Must NOT be marked as Verified or Production Ready
    assert updated_fail["qcStatus"] == "Rejected"
    assert updated_fail["productionReady"] is False
    assert "threshold" in updated_fail["qcRemarks"].lower() or "rejected" in updated_fail["qcRemarks"].lower()

    # 3. Test compliant verification
    in_spec_payload = {
        "temperatureCelsius": 4.2,
        "phLevel": 6.65,
        "fatPercent": 3.8,
        "snfPercent": 8.6,
        "microbiologicalStatus": "Pass (< 10 CFU/ml)",
        "qcStatus": "Verified",
        "qcRemarks": "Retested after rapid plate chiller. Complies fully with FSSAI hygiene standards.",
        "verifiedBy": "Dr. Sunita Mehta (QC Lead)",
    }
    res_pass = client.patch(f"/api/waste/rinse-recovery/{rec_id}/qc-verify", json=in_spec_payload, headers=headers)
    assert res_pass.status_code == 200
    updated_pass = res_pass.json()["record"]
    assert updated_pass["qcStatus"] == "Verified"
    assert updated_pass["productionReady"] is True

def test_admin_quality_thresholds_management():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get current thresholds
    res = client.get("/api/waste/rinse-recovery/thresholds", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "costPerLiterInr" in data
    assert "minPh" in data

    # Update thresholds
    update_payload = {
        "costPerLiterInr": 22.50,
        "minPh": 6.45,
        "maxPh": 6.85,
        "maxTemp": 7.5,
        "minSnf": 8.2,
        "minFat": 0.6,
    }
    put_res = client.put("/api/waste/rinse-recovery/thresholds", json=update_payload, headers=headers)
    assert put_res.status_code == 200
    updated = put_res.json()["thresholds"]
    assert updated["costPerLiterInr"] == 22.50
    assert updated["minPh"] == 6.45
    assert updated["maxTemp"] == 7.5

    # Restore default cost
    client.put("/api/waste/rinse-recovery/thresholds", json={"costPerLiterInr": 20.0, "minPh": 6.4, "maxTemp": 8.0}, headers=headers)

