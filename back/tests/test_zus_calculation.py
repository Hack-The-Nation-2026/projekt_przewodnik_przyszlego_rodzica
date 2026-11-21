"""Porównania z lokalnymi danymi ZUS. Pliki z faktami pozostają w PRZYKLADY/."""

import json
from datetime import date, timedelta

import pytest

from app.schemas.benefit_calculation import BenefitSimulation
from app.services.benefit_service import calculate_benefits
from tests.zus_cases import DEFAULT_PATH, load_case_set

INPUTS_PATH = DEFAULT_PATH.with_name("krok-3-symulacje.json")


@pytest.fixture(scope="module")
def local_cases():
    if not DEFAULT_PATH.is_file() or not INPUTS_PATH.is_file():
        pytest.skip("Lokalny zestaw ZUS i odczytane wejścia symulacji są w ignorowanym PRZYKLADY/.")
    reference = {case.id: case for case in load_case_set().cases}
    inputs = json.loads(INPUTS_PATH.read_text(encoding="utf-8"))
    assert inputs.keys() == reference.keys()
    return reference, inputs


@pytest.mark.parametrize("index", [3, 28, 35, 39, 40, 42, 44, 60, 67, 68, 70, 72, 78, 85])
def test_local_reference_case(index, local_cases):
    case_id = f"ZUS-{index:03d}"
    reference_cases, inputs = local_cases
    reference = reference_cases[case_id]
    data = inputs[case_id]
    result = calculate_benefits(BenefitSimulation.model_validate(data["request"]))
    assert len(result.assessments) == len(data["statuses"])
    expected_statuses = [
        reference.expected.status if status == "reference" else status
        for status in data["statuses"]
    ]
    assert [row.status for row in result.assessments] == expected_statuses

    for check in data.get("amount_checks", []):
        row = result.assessments[check]
        assert row.gross_grosze == reference.expected.amount.grosze
        if reference.basis is not None:
            assert row.monthly_basis_grosze == reference.basis.grosze

    for check in data.get("period_checks", []):
        rows = result.assessments[check["assessment"]].periods
        expected = next(p for p in reference.expected.periods if p.kind == check["kind"])
        if check.get("contains"):
            assert rows[0].start <= expected.start and rows[-1].end >= expected.end
        else:
            # Dane porównawcze mogą wskazać rozbieżność między wnioskiem a adnotacją wypłaty.
            difference = check.get("document_difference_days", [0, 0])
            assert (rows[0].start - expected.start, rows[-1].end - expected.end) == tuple(
                timedelta(days=days) for days in difference
            )

    for check in data.get("calendar_checks", []):
        row = result.assessments[check["assessment"]]
        periods = [p for p in row.periods if p.kind == check.get("period_kind", row.benefit)]
        assert (periods[0].start, periods[-1].end) == (
            date.fromisoformat(check["start"]),
            date.fromisoformat(check["end"]),
        )
        if "denied_days" in check:
            assert row.denied_days == check["denied_days"]
