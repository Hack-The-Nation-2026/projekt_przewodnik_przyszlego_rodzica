"""Sprawy demonstracyjne: lista, weryfikacja ubezpieczenia i porównanie z decyzją.

Zestaw leży w `app/data/demo-cases.json`, więc jedzie z kodem i nie zależy od materiałów
ZUS z `PRZYKLADY/`, których regulamin nie pozwala rozpowszechniać.
"""

import json
from pathlib import Path

from app.schemas.cases import (
    Applicant,
    CaseApplication,
    CaseResult,
    CaseSummary,
    ComparisonRow,
    ExpectedRow,
    InsuranceCheck,
)
from app.schemas.settings import AppSettings
from app.services.benefit_service import calculate_benefits

CASES_PATH = Path(__file__).resolve().parents[1] / "data" / "demo-cases.json"
REQUIRED_INSURANCE_DAYS = {"compulsory": 30, "voluntary": 90}
PREGNANCY_END_REASONS = {"death", "bankruptcy", "liquidation"}


def load_cases() -> list[CaseApplication]:
    raw = json.loads(CASES_PATH.read_text(encoding="utf-8"))
    cases = [CaseApplication.model_validate(item) for item in raw]
    ids = [case.id for case in cases]
    if len(ids) != len(set(ids)):
        raise ValueError("Powtórzony identyfikator sprawy w zestawie demonstracyjnym.")
    return cases


def case_summaries() -> list[CaseSummary]:
    return [
        CaseSummary(
            id=case.id,
            title=case.title,
            facts=case.facts,
            applicant_label=case.applicant.label,
            expected=case.expected,
        )
        for case in load_cases()
    ]


def find_case(case_id: str) -> CaseApplication | None:
    return next((case for case in load_cases() if case.id == case_id), None)


def check_insurance(applicant: Applicant) -> InsuranceCheck:
    """Prawo do zasiłku zależy od tytułu, okresu ubezpieczenia i składek."""
    if applicant.employment == "none":
        return InsuranceCheck(
            covered=False,
            reason="Wniosek nie wskazuje tytułu do ubezpieczenia chorobowego.",
            rule_ids=["A1"],
        )
    if applicant.insured is False:
        return InsuranceCheck(
            covered=False,
            reason="Osoba z wniosku nie podlega ubezpieczeniu chorobowemu.",
            rule_ids=["A1"],
        )
    if applicant.insured is None:
        return InsuranceCheck(
            covered=None,
            reason="Wniosek nie mówi, czy osoba podlega ubezpieczeniu chorobowemu.",
            rule_ids=["A1"],
        )
    if applicant.contribution_arrears is True:
        return InsuranceCheck(
            covered=False,
            reason="Zadłużenie składkowe przekracza próg, więc zasiłek nie przysługuje.",
            rule_ids=["A1"],
        )

    kind = applicant.insurance_kind or "compulsory"
    required = REQUIRED_INSURANCE_DAYS[kind]
    if applicant.first_time_insured:
        return InsuranceCheck(
            covered=True,
            reason=(
                "Osoba jest zwolniona z okresu wyczekiwania, więc prawo działa "
                "od pierwszego dnia."
            ),
            rule_ids=["A3"],
        )
    if applicant.insured_days is None:
        return InsuranceCheck(
            covered=None,
            reason=f"Wniosek nie podaje okresu ubezpieczenia. Wymagane jest {required} dni.",
            rule_ids=["A1", "A2"],
        )
    if applicant.insured_days < required:
        return InsuranceCheck(
            covered=False,
            reason=(
                f"Okres ubezpieczenia to {applicant.insured_days} dni, a wymagane jest {required}. "
                "Sprawdź, czy do okresu wlicza się poprzednie ubezpieczenie."
            ),
            rule_ids=["A1", "A2"],
        )

    protected = (
        applicant.employment_ended_in_pregnancy
        and applicant.employment_end_reason in PREGNANCY_END_REASONS
    )
    if protected:
        return InsuranceCheck(
            covered=True,
            reason=(
                "Ubezpieczenie ustało w ciąży z powodu likwidacji albo śmierci pracodawcy, więc "
                "zasiłek macierzyński przysługuje także po ustaniu zatrudnienia."
            ),
            rule_ids=["K1", "K2"],
        )
    return InsuranceCheck(
        covered=True,
        reason=f"Okres ubezpieczenia ({applicant.insured_days} dni) spełnia wymóg {required} dni.",
        rule_ids=["A1", "A2"],
    )


def _matched(expected: ExpectedRow, status: str, gross_grosze: int | None) -> bool:
    if status != expected.status:
        return False
    return expected.gross_grosze is None or expected.gross_grosze == gross_grosze


def simulate_case(case: CaseApplication, settings: AppSettings | None = None) -> CaseResult:
    result = calculate_benefits(case.request, settings)
    by_key = {(row.benefit, row.person): row for row in result.assessments}
    comparison: list[ComparisonRow] = []
    for expected in case.expected:
        row = by_key.get((expected.benefit, expected.person))
        status = row.status if row else "missing_data"
        gross = row.gross_grosze if row else None
        comparison.append(
            ComparisonRow(
                benefit=expected.benefit,
                person=expected.person,
                status=status,
                gross_grosze=gross,
                expected_status=expected.status,
                expected_gross_grosze=expected.gross_grosze,
                matches=_matched(expected, status, gross),
            )
        )
    return CaseResult(
        case_id=case.id,
        title=case.title,
        facts=case.facts,
        applicant=case.applicant,
        insurance=check_insurance(case.applicant),
        assessments=result.assessments,
        comparison=comparison,
        matches=all(item.matches for item in comparison) if comparison else None,
    )