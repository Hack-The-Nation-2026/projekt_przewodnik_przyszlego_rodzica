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


def _application(**overrides):
    base = {
        "id": "TEST-01",
        "title": "Wniosek testowy",
        "facts": "Sprawa zbudowana w teście.",
        "applicant": {
            "label": "Matka",
            "employment": "employee",
            "insured": True,
            "insurance_kind": "compulsory",
            "insured_days": 400,
            "contribution_arrears": False,
        },
        "request": {
            "family": {
                "event_date": "2026-05-04",
                "first_parent": {
                    "employment": "employee",
                    "sickness_insured": True,
                    "monthly_basis_grosze": 600_000,
                },
                "claims": [{"benefit": "macierzynski"}],
            }
        },
        "expected": [],
    }
    base.update(overrides)
    return base


def test_split_parental_parts_are_summed_before_the_comparison():
    application = _application(
        request={
            "family": {
                "event_date": "2026-05-04",
                "first_parent": {
                    "employment": "employee",
                    "sickness_insured": True,
                    "monthly_basis_grosze": 600_000,
                },
                "claims": [
                    {"benefit": "macierzynski"},
                    {"benefit": "rodzicielski", "days": 100},
                    {"benefit": "rodzicielski", "days": 82},
                ],
            }
        },
        expected=[
            {
                "benefit": "macierzynski",
                "person": "first_parent",
                "status": "granted",
                "gross_grosze": 2_800_000,
            },
            {
                "benefit": "rodzicielski",
                "person": "first_parent",
                "status": "granted",
                "gross_grosze": 2_548_000,
            },
        ],
    )
    result = client.post("/api/cases/simulate", json=application).json()
    assert len(result["assessments"]) == 3
    assert len(result["comparison"]) == 2
    parental = next(row for row in result["comparison"] if row["benefit"] == "rodzicielski")
    assert parental["gross_grosze"] == 2_548_000
    assert parental["matches"] is True
    assert result["matches"] is True
    assert result["unexpected"] == []


def test_benefit_missing_from_the_decision_is_reported_not_swallowed():
    application = _application(
        request={
            "family": {
                "event_date": "2026-05-04",
                "first_parent": {
                    "employment": "employee",
                    "sickness_insured": True,
                    "monthly_basis_grosze": 600_000,
                },
                "claims": [{"benefit": "macierzynski"}, {"benefit": "rodzicielski", "days": 63}],
            }
        },
        expected=[
            {
                "benefit": "macierzynski",
                "person": "first_parent",
                "status": "granted",
                "gross_grosze": 2_800_000,
            }
        ],
    )
    result = client.post("/api/cases/simulate", json=application).json()
    assert result["comparison"][0]["matches"] is True
    assert [row["benefit"] for row in result["unexpected"]] == ["rodzicielski"]
    assert result["unexpected"][0]["gross_grosze"] == 882_000
    assert result["matches"] is False


def test_insurance_requires_the_threshold_even_for_the_first_period():
    short = _application()
    short["applicant"]["insurance_kind"] = "voluntary"
    short["applicant"]["insured_days"] = 5
    check = client.post("/api/cases/simulate", json=short).json()["insurance"]
    assert check["covered"] is False
    assert check["rule_ids"] == ["A1", "A2"]

    exempt = _application()
    exempt["applicant"]["insured_days"] = 5
    exempt["applicant"]["waiting_period_exempt"] = True
    check = client.post("/api/cases/simulate", json=exempt).json()["insurance"]
    assert check["covered"] is True
    assert check["rule_ids"] == ["A3"]


def test_unknown_insurance_kind_falls_back_to_the_stricter_threshold():
    self_employed = _application()
    self_employed["applicant"] = {
        "label": "Matka",
        "employment": "self_employed",
        "insured": True,
        "insured_days": 45,
        "contribution_arrears": False,
    }
    check = client.post("/api/cases/simulate", json=self_employed).json()["insurance"]
    assert check["covered"] is False
    assert "90" in check["reason"]

    employee = _application()
    employee["applicant"] = {
        "label": "Matka",
        "employment": "employee",
        "insured": True,
        "insured_days": 45,
        "contribution_arrears": False,
    }
    check = client.post("/api/cases/simulate", json=employee).json()["insurance"]
    assert check["covered"] is True


def test_arrears_reason_does_not_invent_a_rule():
    application = _application()
    application["applicant"]["contribution_arrears"] = True
    check = client.post("/api/cases/simulate", json=application).json()["insurance"]
    assert check["covered"] is False
    assert "zaległości" in check["reason"]
    assert check["rule_ids"] == []
