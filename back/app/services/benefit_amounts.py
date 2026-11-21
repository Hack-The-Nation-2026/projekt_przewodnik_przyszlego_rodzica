"""Wspólne operacje na okresach i kwotach świadczeń."""

from calendar import monthrange
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal

from app.schemas.benefit_calculation import BenefitAssessment, Parent, PaymentPeriod, Person

DAY = timedelta(days=1)


def anniversary(day: date, years: int) -> date:
    year = day.year + years
    return day.replace(year=year, day=min(day.day, monthrange(year, day.month)[1]))


def rounded_grosze(value: Decimal) -> int:
    return int(value.quantize(Decimal(1), rounding=ROUND_HALF_UP))


def monthly_basis(person: Person) -> int | None:
    basis = person.monthly_basis_grosze
    if basis is None and person.fixed_monthly_gross_grosze is not None:
        basis = rounded_grosze(Decimal(person.fixed_monthly_gross_grosze) * Decimal("0.8629"))
    if basis is not None and person.post_insurance_basis_cap_grosze is not None:
        basis = min(basis, person.post_insurance_basis_cap_grosze)
    return basis


def payment(
    kind: str, start: date, days: int, rate: Decimal | int, basis: int | None
) -> PaymentPeriod:
    daily = None if basis is None else rounded_grosze(Decimal(basis) * rate / 3000)
    return PaymentPeriod(
        kind=kind,
        start=start,
        end=start + DAY * (days - 1),
        days=days,
        rate_percent=rate,
        daily_grosze=daily,
        gross_grosze=None if daily is None else daily * days,
    )


def outcome(
    benefit: str,
    code: str,
    message: str,
    *rules: str,
    person: Parent = "first_parent",
    missing: bool = False,
    denied: int = 0,
) -> BenefitAssessment:
    return BenefitAssessment(
        benefit=benefit,
        person=person,
        status="missing_data" if missing else "denied",
        reason_code=code,
        reason=message,
        rule_ids=list(rules),
        denied_days=denied,
        gross_grosze=None if missing else 0,
    )


def grant(
    benefit: str,
    basis: int | None,
    periods: list[PaymentPeriod],
    *rules: str,
    person: Parent = "first_parent",
    denied: int = 0,
    reason: str | None = None,
    base_days_used: int | None = None,
) -> BenefitAssessment:
    return BenefitAssessment(
        benefit=benefit,
        person=person,
        status="partially_granted" if denied else "granted",
        reason_code="limit" if denied else "eligible",
        reason=reason
        or (
            "Świadczenie przysługuje w granicach dostępnego wymiaru."
            if denied
            else "Podane warunki uprawnienia są spełnione w symulacji."
        ),
        rule_ids=list(rules),
        days=sum(row.days for row in periods),
        denied_days=denied,
        base_days_used=base_days_used,
        monthly_basis_grosze=basis,
        gross_grosze=None if basis is None else sum(row.gross_grosze or 0 for row in periods),
        periods=periods,
    )


def contribution_issue(person: Person) -> tuple[str, str, bool] | None:
    arrears = person.contribution_arrears_above_threshold
    if (person.employment == "self_employed" or arrears is True) and arrears is not False:
        return (
            (
                "arrears",
                "Zadłużenie składkowe przekracza próg. Sprawdź spłatę i termin w ZUS.",
                False,
            )
            if arrears
            else ("unknown_arrears", "Potwierdź stan zadłużenia składkowego.", True)
        )
    return None


def coverage_issue(person: Person) -> tuple[str, str, bool] | None:
    if person.sickness_insured is False:
        return "no_insurance", "Brak ubezpieczenia chorobowego w wymaganym okresie.", False
    if person.sickness_insured is None:
        return "unknown_insurance", "Potwierdź ubezpieczenie chorobowe w wymaganym okresie.", True
    return None
