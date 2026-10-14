from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_predict_duration():
    res = client.post("/duration/predict", json={
        "taskType": "study",
        "title": "Algorithms DP",
        "historicalMultiplier": 1.2,
        "difficulty": "hard"
    })
    assert res.status_code == 200
    data = res.json()
    assert "predictedMinutes" in data
    assert data["predictedMinutes"] >= 15

def test_procrastination_risk():
    res = client.post("/procrastination/risk", json={
        "studentId": "student-123",
        "taskId": "task-456",
        "daysUntilDeadline": 1,
        "priorityScore": 85.0,
        "historicalCompletionRate": 0.5,
        "hasTwoMinuteTrigger": True
    })
    assert res.status_code == 200
    data = res.json()
    assert 0 <= data["riskScore"] <= 100
    assert data["riskLevel"] in ["low", "medium", "high"]

def test_nudge_select():
    res = client.post("/nudge/select", json={
        "studentId": "student-123",
        "currentHour": 10,
        "pendingTasksCount": 3,
        "streakDays": 5,
        "peakFocusHour": True
    })
    assert res.status_code == 200
    data = res.json()
    assert "nudgeId" in data
    assert "message" in data

def test_mastery_update():
    res = client.post("/mastery/update", json={
        "studentId": "student-123",
        "topic": "Virtual Memory",
        "outcome": True,
        "priorMastery": 0.5
    })
    assert res.status_code == 200
    data = res.json()
    assert data["updatedMastery"] > 0.5
    assert data["delta"] > 0
