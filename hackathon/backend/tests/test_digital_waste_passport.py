from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_token():
    res = client.post("/api/auth/login", json={"username_or_email": "admin@dairypulse.in", "password": "admin123"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_list_digital_passports_from_database():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/passport/list", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "passports" in data
    passports = data["passports"]
    assert len(passports) >= 2

    # Check batch 1
    p1 = next((p for p in passports if "WHEY" in p["batchId"]), None)
    assert p1 is not None
    assert p1["materialName"] == "Sweet Food-Grade Whey Matrix"
    assert p1["wasteType"] == "Dairy Organic"
    assert "3500" in p1["quantity"]

def test_get_digital_passport_full_integration():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/passport/DWP-PASSPORT-IN-WHEY-091", headers=headers)
    assert res.status_code == 200
    p = res.json()["passport"]

    # 1. Waste Batch Info
    assert p["batchId"] == "PASSPORT-IN-WHEY-091"
    assert p["materialName"] == "Sweet Food-Grade Whey Matrix"
    assert p["wasteType"] == "Dairy Organic"
    assert "3500" in p["quantity"]
    assert "Apex Dairy" in p["originFacility"]
    assert p["generationDate"] != "Not Recorded"

    # 2. Quality Readings
    assert p["qcCertificateNumber"] == "QC-CERT-2026-FSSAI-0918"
    assert p["qcStatus"] == "Verified"
    assert p["phLevel"] == "6.45"
    assert p["fatPercent"] == "0.35%"
    assert p["snfPercent"] == "6.80%"
    assert "Food Grade" in p["microbialPurity"]

    # 3. Storage Details
    assert "Chilled" in p["storageCondition"]
    assert "SILO-RAW-01" in p["storageTankOrBay"]
    assert "Tank Farm" in p["storageLocation"]

    # 4. Exchange & Historical Transactions
    assert p["receivingIndustry"] == "Arogya NutraFeed Agro Co-op"
    assert len(p["chainOfCustody"]) >= 3
    assert p["chainOfCustody"][0]["transactionId"] == "TXN-EX-WHEY-001"
    assert p["chainOfCustody"][1]["transactionId"] == "TXN-EX-WHEY-002"

    # 5. QR Code data
    assert p["qrCodeDataUrl"].startswith("data:image/png;base64,")
    assert p["qrPayload"]["passportId"] == "DWP-PASSPORT-IN-WHEY-091"
    assert p["qrPayload"]["batchId"] == "PASSPORT-IN-WHEY-091"

def test_unrecorded_fields_display_not_recorded():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/passport/DWP-PASSPORT-IN-SLUDGE-042", headers=headers)
    assert res.status_code == 200
    p = res.json()["passport"]

    # Fat and SNF are not applicable/recorded for sludge
    assert p["fatPercent"] == "Not Recorded"
    assert p["snfPercent"] == "Not Recorded"

def test_add_exchange_transaction_preserves_history():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Add a new transaction
    txn_res = client.post(
        "/api/marketplace/transaction",
        headers=headers,
        json={
            "batchId": "PASSPORT-IN-WHEY-091",
            "partnerIndustry": "Arogya NutraFeed Agro Co-op",
            "action": "Gate-In Confirmed at Buyer Facility",
            "vehicleNumber": "MH-12-QZ-4091",
            "driverName": "Vijay Shinde",
            "notes": "Verified receipt at buyer silo bay. Laboratory release sample archived.",
        },
    )
    assert txn_res.status_code == 200
    assert txn_res.json()["success"] is True

    # Now fetch passport again and verify history was appended without overwriting
    res = client.get("/api/passport/DWP-PASSPORT-IN-WHEY-091", headers=headers)
    assert res.status_code == 200
    p = res.json()["passport"]
    assert len(p["chainOfCustody"]) >= 4
    latest = p["chainOfCustody"][-1]
    assert latest["step"] == "Gate-In Confirmed at Buyer Facility"
    assert p["chainOfCustodyStatus"] == "Gate-In Confirmed at Buyer Facility"

def test_end_to_end_new_waste_batch_lifecycle_in_passport():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Register a new waste batch in Waste Management
    reg_res = client.post(
        "/api/classification/register",
        headers=headers,
        json={
            "materialName": "Acid Whey By-Product",
            "department": "Fermented Curd Line",
            "productionStage": "Curd Separation",
            "wasteType": "Dairy Acidic By-Product",
            "quantity": 2800.0,
            "unit": "Liters",
            "contaminationStatus": "None - Food Grade",
            "storageCondition": "Chilled Storage (4°C)",
            "shelfLifeHours": 48,
            "reason": "Seasonal Greek yoghurt and curd processing",
        },
    )
    assert reg_res.status_code == 200
    batch_info = reg_res.json()["batch"]
    batch_id = batch_info["id"]
    passport_id = batch_info["passportId"]

    # 2. It immediately appears in Digital Waste Passport list
    list_res = client.get("/api/passport/list", headers=headers)
    assert list_res.status_code == 200
    passports = list_res.json()["passports"]
    matched = next((p for p in passports if p["batchId"] == batch_id), None)
    assert matched is not None
    assert matched["materialName"] == "Acid Whey By-Product"
    assert "2800" in matched["quantity"]

    # 3. Retrieve Digital Waste Passport: unrecorded fields correctly return 'Not Recorded'
    p_res = client.get(f"/api/passport/{passport_id}", headers=headers)
    assert p_res.status_code == 200
    p = p_res.json()["passport"]
    assert p["batchId"] == batch_id
    assert p["fatPercent"] == "Not Recorded"
    assert p["snfPercent"] == "Not Recorded"
    assert p["receivingIndustry"] == "Not Recorded"

    # 4. Perform QC verification in Quality module
    qc_res = client.patch(
        f"/api/classification/{batch_id}/qc-verify",
        headers=headers,
        json={"category": "Reusable", "verifiedBy": "Dr. Sunita Mehta"},
    )
    assert qc_res.status_code == 200

    # 5. Digital Waste Passport immediately reflects updated QC state
    p_updated = client.get(f"/api/passport/{passport_id}", headers=headers).json()["passport"]
    assert p_updated["qcStatus"] == "Verified"
    assert p_updated["category"] == "Reusable"
    assert p_updated["qcCertificateNumber"] != "Not Recorded"

    # 6. Dispatch via Waste Exchange
    txn_res = client.post(
        "/api/marketplace/transaction",
        headers=headers,
        json={
            "batchId": batch_id,
            "partnerIndustry": "BakeCraft Commercial Bakery",
            "receivingFacility": "BakeCraft Plant #2 • Thane",
            "action": "Dispatched from Plant (Gate-Out)",
            "vehicleNumber": "MH-04-AX-9912",
            "driverName": "Sunil Shinde",
            "agreedPriceInr": 3.80,
            "quantity": 2800.0,
            "unit": "Liters",
            "notes": "Food-grade acid whey dispatched for sourdough fermentation.",
        },
    )
    assert txn_res.status_code == 200

    # 7. Passport reflects receiving industry and historical transaction
    p_final = client.get(f"/api/passport/{passport_id}", headers=headers).json()["passport"]
    assert p_final["receivingIndustry"] == "BakeCraft Commercial Bakery"
    assert p_final["transportVehicleNumber"] == "MH-04-AX-9912"
    assert p_final["chainOfCustodyStatus"] == "Dispatched from Plant (Gate-Out)"
    assert len(p_final["chainOfCustody"]) >= 2
    # Verify QR payload links directly to this new batch record
    assert p_final["qrPayload"]["batchId"] == batch_id
    assert p_final["qrPayload"]["receivingIndustry"] == "BakeCraft Commercial Bakery"

