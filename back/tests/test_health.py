from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_ok() -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_benefits_list() -> None:
    response = client.get("/api/benefits")
    assert response.status_code == 200
    codes = {item["code"] for item in response.json()}
    assert {"chorobowy", "macierzynski"} <= codes
