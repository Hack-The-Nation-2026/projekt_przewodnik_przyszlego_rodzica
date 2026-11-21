"""Sprawy demonstracyjne: lista, weryfikacja ubezpieczenia i porównanie z decyzją."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.case_service import load_cases

client = TestClient(app)


def test_case_list_has_unique_ids_and_summaries():
    response = client.get("/api/cases")
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) >= 8
    assert len({row["id"] for row in cases}) == len(cases)
    first = cases[0]
    assert first["title"] and first["facts"] and first["expected"]


@pytest.mark.parametrize("case", load_cases(), ids=lambda case: case.id)
def test_every_demo_case_matches_its_expected_decision(case):
    response = client.post("/api/cases/simulate", json=case.model_dump(mode="json"))
    assert response.status_code == 200
    result = response.json()
    assert result["matches"] is True, result["comparison"]
    assert all(row["matches"] for row in result["comparison"])


def test_case_endpoint_returns_the_same_result_as_simulation():
    listed = client.get("/api/cases").json()[0]["id"]
    direct = client.get(f"/api/cases/{listed}")
    simulated = client.post(
        "/api/cases/simulate",
        json=next(case.model_dump(mode="json") for case in load_cases() if case.id == listed),
    )
    assert direct.status_code == 200
    assert direct.json() == simulated.json()


def test_unknown_case_is_a_404():
    assert client.get("/api/cases/NIE-MA").status_code == 404


def test_invalid_application_is_rejected():
    broken = {
        "id": "x",
        "title": "",
        "facts": "",
        "applicant": {"label": "", "employment": "nonsense"},
        "request": {},
    }
    assert client.post("/api/cases/simulate", json=broken).status_code == 422


def test_insurance_check_flags_missing_and_short_coverage():
    by_id = {case.id: case for case in load_cases()}

    uncovered = client.post(
        "/api/cases/simulate", json=by_id["DEMO-09"].model_dump(mode="json")
    ).json()
    assert uncovered["insurance"]["covered"] is False
    assert "nie podlega ubezpieczeniu" in uncovered["insurance"]["reason"]
    assert uncovered["comparison"][0]["status"] == "denied"

    short = by_id["DEMO-01"].model_copy(deep=True)
    short.applicant.insured_days = 12
    check = client.post("/api/cases/simulate", json=short.model_dump(mode="json")).json()
    assert check["insurance"]["covered"] is False
    assert check["insurance"]["rule_ids"] == ["A1", "A2"]

    unknown = by_id["DEMO-01"].model_copy(deep=True)
    unknown.applicant.insured = None
    check = client.post("/api/cases/simulate", json=unknown.model_dump(mode="json")).json()
    assert check["insurance"]["covered"] is None


def test_insurance_check_accepts_termination_protected_by_law():
    case = next(case for case in load_cases() if case.id == "DEMO-04")
    check = client.post("/api/cases/simulate", json=case.model_dump(mode="json")).json()
    assert check["insurance"]["covered"] is True
    assert check["insurance"]["rule_ids"] == ["K1", "K2"]


def test_maternity_and_supplement_days_come_from_the_rules():
    rows = {
        case.id: {
            (row["benefit"], row["person"]): row
            for row in client.post(
                "/api/cases/simulate", json=case.model_dump(mode="json")
            ).json()["assessments"]
        }
        for case in load_cases()
    }
    assert rows["DEMO-01"][("macierzynski", "first_parent")]["days"] == 140
    assert rows["DEMO-02"][("rodzicielski", "second_parent")]["days"] == 63
    assert rows["DEMO-03"][("uzupelniajacy", "first_parent")]["days"] == 56
    assert rows["DEMO-08"][("macierzynski", "first_parent")]["days"] == 56

def test_application_download_round_trips_through_simulation():
    case_id = load_cases()[0].id
    application = client.get(f"/api/cases/{case_id}/application")
    assert application.status_code == 200
    payload = application.json()
    assert payload["id"] == case_id
    replayed = client.post("/api/cases/simulate", json=payload)
    assert replayed.status_code == 200
    assert replayed.json()["matches"] is True
    assert client.get("/api/cases/NIE-MA/application").status_code == 404
