"""Panel administracyjny: parametry kalkulatora zmieniane bez wdrożenia."""

from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

BIRTH = date(2026, 5, 4)
EMPLOYEE = {
    "employment": "employee",
    "sickness_insured": True,
    "monthly_basis_grosze": 600_000,
}


@pytest.fixture(autouse=True)
def settings_file(tmp_path, monkeypatch):
    """Każdy test dostaje własny plik, więc zmiany nie wyciekają między testami."""
    monkeypatch.setenv("ADMIN_SETTINGS_FILE", str(tmp_path / "settings.json"))
    return tmp_path / "settings.json"


def simulation(claims, **changes):
    return {
        "family": {
            "event_date": BIRTH.isoformat(),
            "first_parent": EMPLOYEE,
            "claims": claims,
            **changes,
        }
    }


def test_settings_start_from_defaults_and_survive_a_round_trip(settings_file):
    defaults = client.get("/api/settings").json()
    assert Decimal(str(defaults["rates"]["averaged"])) == Decimal("81.5")
    assert defaults["leave"]["parental_weeks_single"] == 41
    assert {flag["key"] for flag in defaults["features"]} >= {"zus_simulations", "parental_plan"}

    payload = defaults | {"rates": {**defaults["rates"], "parental": 60}}
    saved = client.put("/api/admin/settings", json=payload)
    assert saved.status_code == 200
    assert saved.json()["updated_at"] is not None
    assert settings_file.exists()
    assert Decimal(str(client.get("/api/settings").json()["rates"]["parental"])) == Decimal("60")


def test_changed_parental_rate_changes_the_calculator_result(settings_file):
    body = simulation([{"benefit": "rodzicielski", "days": 70}])
    before = client.post("/api/benefits/simulate", json=body).json()["assessments"][0]

    settings = client.get("/api/settings").json()
    settings["rates"]["parental"] = 50
    assert client.put("/api/admin/settings", json=settings).status_code == 200

    after = client.post("/api/benefits/simulate", json=body).json()["assessments"][0]
    assert before["gross_grosze"] == 70 * 14_000
    assert after["gross_grosze"] == 70 * 10_000
    assert Decimal(str(after["periods"][0]["rate_percent"])) == Decimal("50")


def test_maternity_weeks_parameter_shortens_the_leave(settings_file):
    settings = client.get("/api/settings").json()
    settings["leave"]["maternity_weeks_by_child_count"][0] = 18
    client.put("/api/admin/settings", json=settings)

    response = client.post("/api/benefits/simulate", json=simulation([{"benefit": "macierzynski"}]))
    row = response.json()["assessments"][0]
    assert (row["status"], row["days"]) == ("granted", 18 * 7)


def test_parental_weeks_and_exclusive_share_rebuild_the_pool(settings_file):
    settings = client.get("/api/settings").json()
    settings["leave"]["parental_weeks_single"] = 45
    settings["leave"]["exclusive_weeks"] = 6
    client.put("/api/admin/settings", json=settings)

    response = client.post(
        "/api/benefits/simulate",
        json=simulation([{"benefit": "rodzicielski", "days": 45 * 7}]),
    )
    pool = response.json()["parental_pool"]
    assert pool["total_days"] == 45 * 7
    assert pool["exclusive_days_per_parent"] == 42


def test_feature_flag_can_be_switched_off_without_touching_code(settings_file):
    settings = client.get("/api/settings").json()
    for flag in settings["features"]:
        if flag["key"] == "zus_simulations":
            flag["enabled"] = False
    client.put("/api/admin/settings", json=settings)

    features = client.get("/api/settings").json()["features"]
    flags = {flag["key"]: flag["enabled"] for flag in features}
    assert flags["zus_simulations"] is False
    assert flags["risk_warnings"] is True


def test_reset_brings_back_the_defaults(settings_file):
    settings = client.get("/api/settings").json()
    settings["rates"]["maternity"] = 90
    client.put("/api/admin/settings", json=settings)

    reset = client.post("/api/admin/settings/reset")
    assert reset.status_code == 200
    assert Decimal(str(reset.json()["rates"]["maternity"])) == Decimal("100")


def test_invalid_parameters_are_rejected(settings_file):
    settings = client.get("/api/settings").json()
    broken = {
        **settings,
        "leave": {**settings["leave"], "maternity_weeks_by_child_count": [20, 31]},
    }
    assert client.put("/api/admin/settings", json=broken).status_code == 422

    broken = {**settings, "rates": {**settings["rates"], "parental": 300}}
    assert client.put("/api/admin/settings", json=broken).status_code == 422


def test_corrupted_file_falls_back_to_defaults(settings_file):
    settings_file.write_text("{nie json", encoding="utf-8")
    response = client.get("/api/settings")
    assert response.status_code == 200
    assert response.json()["leave"]["parental_weeks_single"] == 41