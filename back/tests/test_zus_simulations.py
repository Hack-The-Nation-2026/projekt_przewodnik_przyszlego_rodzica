"""Symulacje ZUS: ubezpieczenie, składki, e-ZLA, PUE i akta urodzenia."""

from datetime import date

from fastapi.testclient import TestClient

from app.main import app
from app.services.zus_service import EMPLOYEE_CONTRIBUTION_RATE

client = TestClient(app)

AS_OF = date(2026, 9, 1)


def test_profile_of_insured_person_has_title_and_payer() -> None:
    response = client.post("/api/zus/profile", json={"as_of": AS_OF.isoformat()})
    assert response.status_code == 200
    profile = response.json()
    assert profile["as_of"] == "2026-09-01"
    assert profile["insurance"]["insured"] is True
    assert profile["insurance"]["title_code"] == "0110"
    assert profile["insurance"]["covered_since"] is not None
    assert profile["debt"]["has_debt"] is False


def test_profile_without_insurance_says_so_and_has_no_debt() -> None:
    response = client.post(
        "/api/zus/profile",
        json={"insured": False, "with_debt": True, "as_of": AS_OF.isoformat()},
    )
    assert response.status_code == 200
    profile = response.json()
    assert profile["insurance"]["insured"] is False
    assert profile["insurance"]["covered_since"] is None
    assert profile["debt"]["has_debt"] is False
    assert profile["debt"]["total_grosze"] == 0


def test_debt_is_counted_from_the_monthly_basis() -> None:
    basis = 800_000
    response = client.post(
        "/api/zus/profile",
        json={"with_debt": True, "as_of": AS_OF.isoformat(), "monthly_basis_grosze": basis},
    )
    assert response.status_code == 200
    debt = response.json()["debt"]
    assert debt["has_debt"] is True
    assert len(debt["items"]) == 2
    expected = round(basis * EMPLOYEE_CONTRIBUTION_RATE)
    assert debt["items"][0]["amount_grosze"] == expected
    assert debt["total_grosze"] == expected * 2


def test_ezla_certificates_are_dated_before_the_check_day() -> None:
    response = client.post("/api/zus/ezla", json={"as_of": AS_OF.isoformat()})
    assert response.status_code == 200
    certificates = response.json()
    assert [item["kind"] for item in certificates] == ["chorobowe", "opieka"]
    for certificate in certificates:
        start = date.fromisoformat(certificate["period_from"])
        end = date.fromisoformat(certificate["period_to"])
        assert start <= end <= AS_OF
        assert certificate["days"] == (end - start).days + 1


def test_ezla_is_empty_without_insurance() -> None:
    response = client.post("/api/zus/ezla", json={"insured": False, "as_of": AS_OF.isoformat()})
    assert response.status_code == 200
    assert response.json() == []


def test_pue_session_lists_insurance_periods() -> None:
    response = client.post("/api/zus/pue", json={"person": "Anna Kowalska"})
    assert response.status_code == 200
    session = response.json()
    assert session["person"] == "Anna Kowalska"
    assert session["valid_minutes"] == 15
    assert len(session["periods"]) == 2
    assert session["periods"][0]["to_date"] is None


def test_pue_session_without_insurance_has_no_periods() -> None:
    response = client.post("/api/zus/pue", json={"insured": False})
    assert response.status_code == 200
    session = response.json()
    assert session["periods"] == []
    assert session["document_count"] == 0


def test_birth_certificate_order_gets_a_number_and_date() -> None:
    response = client.post(
        "/api/zus/birth-certificate",
        json={"copy_type": "zupelny", "office": "USC Warszawa", "child_name": "Jan Kowalski"},
    )
    assert response.status_code == 200
    order = response.json()
    assert order["number"].startswith("USC/")
    assert order["copy_type"] == "zupelny"
    assert order["child_name"] == "Jan Kowalski"
    ready = date.fromisoformat(order["ready_from"])
    assert ready > date.today()


def test_birth_certificate_number_is_stable_for_the_same_request() -> None:
    payload = {"copy_type": "skrocony", "office": "USC Kraków", "child_name": "Ewa Nowak"}
    first = client.post("/api/zus/birth-certificate", json=payload).json()["number"]
    second = client.post("/api/zus/birth-certificate", json=payload).json()["number"]
    assert first == second


def test_links_point_to_zus_family_ministry_and_labour_inspectorate() -> None:
    response = client.get("/api/zus/links")
    assert response.status_code == 200
    links = response.json()
    urls = [item["url"] for item in links]
    assert "https://www.zus.pl" in urls
    assert "https://www.gov.pl/web/rodzina" in urls
    assert "https://www.pip.gov.pl" in urls