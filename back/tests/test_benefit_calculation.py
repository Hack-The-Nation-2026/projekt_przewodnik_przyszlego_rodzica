from datetime import date, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.benefit_calculation import BenefitSimulation
from app.services.benefit_service import calculate_benefits

BIRTH = date(2026, 5, 4)
EMPLOYEE = {
    "employment": "employee",
    "sickness_insured": True,
    "monthly_basis_grosze": 600_000,
}


def family(claims, **changes):
    return {
        "family": {
            "event_date": BIRTH,
            "first_parent": EMPLOYEE,
            "second_parent": {**EMPLOYEE, "monthly_basis_grosze": 300_000},
            "claims": claims,
            **changes,
        }
    }


def simulate(data):
    return calculate_benefits(BenefitSimulation.model_validate(data))


def test_simulate_via_fastapi_and_reject_invalid_input():
    client = TestClient(app)
    response = client.post(
        "/api/benefits/simulate",
        json={
            "family": {
                "event_date": BIRTH.isoformat(),
                "first_parent": EMPLOYEE,
                "claims": [{"benefit": "macierzynski"}],
            }
        },
    )
    assert response.status_code == 200
    row = response.json()["assessments"][0]
    assert (row["status"], row["days"], row["gross_grosze"]) == ("granted", 140, 2_800_000)
    assert "/api/benefits/simulate" in client.get("/openapi.json").json()["paths"]
    assert client.post("/api/benefits/simulate", json={}).status_code == 422
    assert client.get("/api/benefits").status_code == 200


def test_parental_pool_and_two_bases_with_averaged_maternity_rate():
    result = simulate(
        family(
            [
                {"benefit": "macierzynski"},
                {"benefit": "rodzicielski", "days": 224},
                {"benefit": "rodzicielski", "person": "second_parent", "days": 70},
            ],
            averaged_rate_application=BIRTH + timedelta(days=21),
            averaged_rate_full_period=True,
        )
    )
    maternity, first, second = result.assessments
    assert maternity.periods[0].rate_percent == Decimal("81.5")
    assert first.gross_grosze == 224 * 16_300
    assert (second.days, second.denied_days, second.status) == (63, 7, "partially_granted")
    assert second.periods[0].rate_percent == 70
    assert second.gross_grosze == 63 * 7_000
    assert result.parental_pool.remaining_days_by_parent == {"first_parent": 0, "second_parent": 0}


def test_late_averaged_request_uses_standard_rates_and_za_zyciem_extends_pool():
    result = simulate(
        family(
            [
                {"benefit": "macierzynski"},
                {"benefit": "rodzicielski", "days": 400},
            ],
            children=[{}, {}],
            za_zyciem=True,
            averaged_rate_application=BIRTH + timedelta(days=22),
            averaged_rate_full_period=True,
        )
    )
    maternity, parental = result.assessments
    assert (maternity.days, maternity.periods[0].rate_percent) == (217, 100)
    assert result.parental_pool.total_days == 67 * 7
    assert parental.periods[0].rate_percent == 70


def test_parental_work_reduces_benefit_and_extends_duration():
    claims = [{"benefit": "rodzicielski", "days": 42, "work_percent": 50}]
    result = simulate(family(claims))
    row = result.assessments[0]
    assert [(p.days, p.rate_percent) for p in row.periods] == [(42, 35), (21, 70)]
    assert row.gross_grosze == 588_000
    assert result.parental_pool.remaining_days_by_parent["first_parent"] == 224 - 42

    extended = simulate(family([{**claims[0], "extension_work_percent": 50}])).assessments[0]
    assert [(p.days, p.rate_percent) for p in extended.periods] == [(42, 35), (42, 35)]
    assert extended.gross_grosze == row.gross_grosze


def test_parental_part_limit_and_out_of_bounds_with_already_used_days():
    result = simulate(
        family(
            [
                {"benefit": "rodzicielski", "days": 8},
                {"benefit": "rodzicielski", "person": "second_parent", "days": 7},
            ],
            parental_parts_already_used=4,
            parental_days_already_used={"first_parent": 217},
        )
    )
    first, second = result.assessments
    assert (first.days, first.denied_days) == (7, 1)
    assert second.reason_code == "parental_parts_limit"


def test_overlapping_plan_does_not_consume_family_pool():
    start = BIRTH + timedelta(days=140)
    result = simulate(
        family(
            [
                {"benefit": "rodzicielski", "start": start, "days": 28},
                {"benefit": "rodzicielski", "start": start, "days": 7},
                {"benefit": "rodzicielski", "start": start, "days": 7, "person": "second_parent"},
            ]
        )
    )
    one, two, other_parent = result.assessments
    assert (one.days, two.reason_code, other_parent.days) == (28, "overlapping_periods", 7)
    assert result.parental_pool.remaining_days_by_parent["first_parent"] == 196


@pytest.mark.parametrize(
    ("event", "confirmation", "limit"),
    [
        ("adoption", {"adoption_proceeding": True}, 14),
        ("foster_care", {"non_professional_foster_care": True}, 7),
        ("foster_care", {"non_professional_foster_care": True}, 10),
    ],
)
def test_placement_age_and_placement_near_the_age_limit(event, confirmation, limit):
    child_birth = date(BIRTH.year - limit, BIRTH.month, BIRTH.day + 10)
    child = {"birth_date": child_birth, "school_start_deferred": limit == 10}
    shown = simulate(
        family([{"benefit": "macierzynski"}], event=event, children=[child], **confirmation)
    )
    assert shown.assessments[0].days == 63
    assert shown.parental_pool.total_days == 38 * 7
    too_old = simulate(
        family(
            [{"benefit": "macierzynski"}],
            event_date=BIRTH + timedelta(days=10),
            event=event,
            children=[child],
            **confirmation,
        )
    )
    assert too_old.assessments[0].reason_code == "child_age_limit"


def test_insurance_and_arrears_not_assumed():
    claims = [{"benefit": "macierzynski"}]
    uninsured = family(claims, first_parent={"employment": "contractor", "sickness_insured": False})
    assert simulate(uninsured).assessments[0].status == "denied"
    unknown = family(claims, first_parent={"employment": "contractor"})
    assert simulate(unknown).assessments[0].status == "missing_data"
    debt = family(
        claims,
        first_parent={
            "employment": "self_employed",
            "sickness_insured": True,
            "contribution_arrears_above_threshold": True,
        },
    )
    assert simulate(debt).assessments[0].reason_code == "arrears"


def test_maternity_transfer_and_supplemental_hospital_days():
    result = simulate(
        family(
            [
                {"benefit": "macierzynski"},
                {"benefit": "macierzynski", "person": "second_parent"},
                {"benefit": "uzupelniajacy", "person": "second_parent"},
            ],
            maternity_transfer=BIRTH + timedelta(days=98),
            transfer_care_confirmed=True,
            pregnancy_weeks_at_birth=29,
            children=[
                {
                    "birth_weight_g": 980,
                    "hospital_stays": [
                        {"start": BIRTH, "end": BIRTH + timedelta(days=13)},
                        {"start": BIRTH + timedelta(days=9), "end": BIRTH + timedelta(days=16)},
                    ],
                },
                {
                    "birth_weight_g": 1300,
                    "hospital_stays": [
                        {"start": BIRTH, "end": BIRTH + timedelta(days=22)},
                    ],
                },
            ],
        )
    )
    mother, father, supplement = result.assessments
    assert (mother.days, father.days, supplement.days) == (98, 119, 28)
    assert supplement.periods[0].start == BIRTH + timedelta(days=217)
    assert supplement.periods[0].rate_percent == 100
    assert "E1" in supplement.rule_ids


def test_term_child_supplement_requires_two_days_before_boundary():
    claims = [{"benefit": "uzupelniajacy"}]
    for offset, expected in [(28, "granted"), (29, "denied")]:
        result = simulate(
            family(
                claims,
                pregnancy_weeks_at_birth=39,
                children=[
                    {
                        "birth_weight_g": 3500,
                        "hospital_stays": [
                            {
                                "start": BIRTH + timedelta(days=offset),
                                "end": BIRTH + timedelta(days=offset + 1),
                            },
                        ],
                    }
                ],
            )
        )
        assert result.assessments[0].status == expected


def test_paternity_duration_and_age_limit():
    claims = [
        {"benefit": "ojcowski", "person": "second_parent", "days": 7},
        {"benefit": "ojcowski", "person": "second_parent", "days": 7},
        {"benefit": "ojcowski", "person": "second_parent", "days": 7},
    ]
    result = simulate(family(claims))
    assert [item.status for item in result.assessments] == ["granted", "granted", "denied"]
    late = simulate(family([{**claims[0], "start": date(2027, 5, 4)}]))
    assert late.assessments[0].reason_code == "paternity_deadline"


def test_pregnancy_sickness_pay_changes_in_the_new_year_and_has_a_limit():
    result = simulate(
        {
            "pregnancy_sickness": {
                "person": EMPLOYEE,
                "incapacity": {"start": "2025-12-28", "end": "2026-01-28"},
                "birthday": "1975-12-01",
                "covered_days_before_incapacity": 40,
                "sickness_days_used": 250,
                "employer_paid_days_by_year": {2025: 31, 2026: 0},
            }
        }
    )
    row = result.assessments[0]
    assert (row.status, row.days, row.denied_days) == ("partially_granted", 20, 12)
    assert [(p.kind, p.days) for p in row.periods] == [
        ("wynagrodzenie_chorobowe", 2),
        ("zasilek_chorobowy", 2),
        ("wynagrodzenie_chorobowe", 14),
        ("zasilek_chorobowy", 2),
    ]


def test_rehabilitation_requires_ruling_and_applies_indexation_and_360_day_limit():
    request = {
        "person": EMPLOYEE,
        "start": "2026-07-01",
        "days": 361,
        "sickness_pool_exhausted": True,
        "still_unable_to_work": True,
        "favourable_medical_ruling": True,
        "exclusion_applies": False,
        "incapacity_during_pregnancy": False,
        "indexation_factor": "1.1",
    }
    row = simulate({"rehabilitation": request}).assessments[0]
    assert row.monthly_basis_grosze == 660_000
    assert [(p.days, p.rate_percent) for p in row.periods] == [(90, 90), (270, 75)]
    assert row.denied_days == 1
    unknown = simulate({"rehabilitation": {**request, "favourable_medical_ruling": None}})
    assert unknown.assessments[0].status == "missing_data"


def test_liquidation_entitlement_before_birth_and_maternity_after_birth():
    person = {
        **EMPLOYEE,
        "sickness_insured": False,
        "employment_ended_during_pregnancy": True,
        "employment_end_reason": "liquidation",
    }
    request = family([{"benefit": "macierzynski"}], first_parent=person)
    request["post_employment"] = {
        "person": person,
        "last_employment_day": "2026-04-29",
        "birth_date": BIRTH,
        "replacement_employment_provided": False,
    }
    maternity, post_employment = simulate(request).assessments
    assert maternity.periods[0].start == BIRTH
    assert post_employment.periods[0].end == BIRTH - timedelta(days=1)
    assert post_employment.gross_grosze == 80_000


def test_top_up_needs_confirmed_net_and_rounds_partial_month():
    month = {
        "eligible_benefit_confirmed": True,
        "period": {"start": "2026-01-02", "end": "2026-01-11"},
    }
    row = simulate({"maternity_top_ups": [{**month, "combined_net_grosze": 20_000}]}).assessments[0]
    assert (row.status, row.net_top_up_grosze) == ("granted", 12_260)
    assert simulate({"maternity_top_ups": [month]}).assessments[0].status == "missing_data"


def test_supplement_distinguishes_no_hospitalization_from_unknown_intervals():
    claims = [{"benefit": "uzupelniajacy"}]
    assert simulate(family(claims)).assessments[0].status == "missing_data"
    confirmed = simulate(family(claims, children=[{"hospital_stays": []}]))
    assert confirmed.assessments[0].status == "denied"


def test_confirmed_transfer_keeps_exclusive_days_at_seventy_percent():
    result = simulate(
        family(
            [{"benefit": "rodzicielski", "person": "second_parent", "days": 70}],
            averaged_rate_application=BIRTH,
            averaged_rate_full_period=True,
            averaged_shared_transfer_confirmed=True,
        )
    )
    assert [(p.days, p.rate_percent) for p in result.assessments[0].periods] == [
        (63, 70),
        (7, Decimal("81.5")),
    ]
