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


def test_mobywatel_login_marks_the_source() -> None:
    response = client.post(
        "/api/auth/mobywatel",
        json={"identifier": "anna.k", "password": DEMO_PASSWORD},
    )
    assert response.status_code == 200
    assert response.json()["source"] == "mobywatel"


def test_manual_entry_returns_citizen() -> None:
    response = client.post(
        "/api/auth/manual",
        json={
            "first_name": "Katarzyna",
            "last_name": "N.",
            "pesel": "44051401359",
            "case_label": "Ciąża, jeden poród",
        },
    )
    assert response.status_code == 200
    citizen = response.json()
    assert citizen["first_name"] == "Katarzyna"
    assert citizen["case_label"] == "Ciąża, jeden poród"
    assert citizen["source"] == "manual"


def test_manual_entry_without_label_gets_a_default() -> None:
    response = client.post(
        "/api/auth/manual",
        json={"first_name": "Jan", "last_name": "K.", "pesel": "44051401359"},
    )
    assert response.status_code == 200
    citizen = response.json()
    assert citizen["case_code"] == "WPISANE-RECZNIE"
    assert citizen["case_label"] == "Sytuacja opisana ręcznie"


def test_manual_entry_rejects_a_pesel_that_is_not_eleven_digits() -> None:
    response = client.post(
        "/api/auth/manual",
        json={"first_name": "Jan", "last_name": "K.", "pesel": "12345"},
    )
    assert response.status_code == 422


def test_manual_entry_rejects_a_blank_name() -> None:
    response = client.post(
        "/api/auth/manual",
        json={"first_name": "   ", "last_name": "K.", "pesel": "44051401359"},
    )
    assert response.status_code == 422
