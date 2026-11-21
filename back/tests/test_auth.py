from fastapi.testclient import TestClient

from app.main import app
from app.services.mobywatel_service import DEMO_PASSWORD

client = TestClient(app)


def test_login_returns_citizen() -> None:
    response = client.post(
        "/api/auth/mobywatel",
        json={"identifier": "justyna.t", "password": DEMO_PASSWORD},
    )
    assert response.status_code == 200
    citizen = response.json()
    assert citizen["first_name"] == "Justyna"
    assert citizen["case_code"] == "ZAS-MAC-BLIZNIAKI"


def test_login_accepts_pesel_as_identifier() -> None:
    response = client.post(
        "/api/auth/mobywatel",
        json={"identifier": "90010112345", "password": DEMO_PASSWORD},
    )
    assert response.status_code == 200
    assert response.json()["first_name"] == "Anna"


def test_login_is_case_insensitive() -> None:
    response = client.post(
        "/api/auth/mobywatel",
        json={"identifier": "  Anna.K ", "password": DEMO_PASSWORD},
    )
    assert response.status_code == 200
    assert response.json()["first_name"] == "Anna"


def test_login_rejects_wrong_password() -> None:
    response = client.post(
        "/api/auth/mobywatel",
        json={"identifier": "anna.k", "password": "zle-haslo"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Nieprawidłowy login lub hasło."


def test_login_rejects_unknown_identifier() -> None:
    response = client.post(
        "/api/auth/mobywatel",
        json={"identifier": "nie.ma.takiego", "password": DEMO_PASSWORD},
    )
    assert response.status_code == 401


def test_demo_accounts_are_available_in_dev() -> None:
    response = client.get("/api/auth/mobywatel/demo-accounts")
    assert response.status_code == 200
    identifiers = {account["identifier"] for account in response.json()}
    assert {"anna.k", "justyna.t"} <= identifiers
