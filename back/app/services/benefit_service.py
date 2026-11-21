"""Symulacja świadczeń w okresie ciąży i rodzicielstwa."""

from calendar import monthrange
from datetime import date
from decimal import Decimal

from app.schemas.benefit_calculation import (
    BenefitAssessment,
    BenefitSimulation,
    MaternityTopUp,
    PostEmployment,
    PregnancySickness,
    Rehabilitation,
    SimulationResult,
)
from app.schemas.settings import AppSettings, default_settings
from app.services.benefit_amounts import (
    DAY,
    contribution_issue,
    coverage_issue,
    grant,
    monthly_basis,
    outcome,
    payment,
    rounded_grosze,
)
from app.services.family_benefits import calculate_family

PREGNANCY_END_REASONS = {"death", "bankruptcy", "liquidation"}


def calculate_pregnancy_sickness(claim: PregnancySickness) -> BenefitAssessment:
    benefit = "chorobowy_w_ciazy"
    person = claim.person
    start, end = claim.incapacity.start, claim.incapacity.end
    total_days = (end - start).days + 1
    insurance_end = claim.insurance_ended_on
    starts_after_insurance = insurance_end is not None and start > insurance_end

    issue = contribution_issue(person)
    if issue is None and not starts_after_insurance:
        issue = coverage_issue(person)
    if issue:
        code, reason, missing = issue
        return outcome(benefit, code, reason, "A1", missing=missing)

    if insurance_end is not None and end > insurance_end:
        if starts_after_insurance and ((start - insurance_end).days > 14 or total_days < 30):
            return outcome(
                benefit,
                "post_insurance_onset",
                "Niezdolność po ustaniu ubezpieczenia zaczęła się za późno lub trwała za krótko.",
                "C4",
                denied=total_days,
            )
        if claim.post_insurance_exclusion_applies is None:
            return outcome(
                benefit,
                "missing_post_insurance_conditions",
                "Potwierdź warunki wypłaty po ustaniu ubezpieczenia.",
                "C4",
                missing=True,
            )
        if claim.post_insurance_exclusion_applies:
            end = min(end, insurance_end)

    if claim.waiting_period_exempt is not True:
        compulsory = claim.compulsory_insurance
        if compulsory is None and person.employment in {"employee", "contractor", "self_employed"}:
            compulsory = person.employment == "employee"
        prior_days = claim.covered_days_before_incapacity
        if compulsory is None or prior_days is None:
            return outcome(
                benefit,
                "missing_waiting_period",
                "Podaj rodzaj i okres ubezpieczenia.",
                "A1",
                missing=True,
            )
        waiting_days = max(0, (30 if compulsory else 90) - prior_days)
        if waiting_days and claim.waiting_period_exempt is None:
            return outcome(
                benefit,
                "unknown_waiting_exception",
                "Potwierdź, czy przysługuje wyjątek od wyczekiwania.",
                "A3",
                missing=True,
            )
        start += DAY * waiting_days
        if waiting_days and insurance_end is not None and start > insurance_end:
            return outcome(
                benefit,
                "waiting_period_after_insurance",
                "Okres wyczekiwania nie upłynął przed końcem ubezpieczenia.",
                "A1",
                denied=total_days,
            )

    if end < start:
        return outcome(
            benefit,
            "no_covered_days",
            "W tym okresie nie ma dni objętych świadczeniem.",
            "A1",
            "C4",
            denied=total_days,
        )
    if claim.sickness_days_used is None:
        return outcome(
            benefit,
            "missing_sickness_history",
            "Podaj wykorzystane dni okresu zasiłkowego.",
            "C5",
            missing=True,
        )

    days = min((end - start).days + 1, 270 - claim.sickness_days_used)
    if not days:
        return outcome(
            benefit,
            "sickness_pool_exhausted",
            "Wykorzystano 270 dni okresu zasiłkowego.",
            "C3",
            denied=total_days,
        )

    basis = monthly_basis(person)
    periods = []
    stop = start + DAY * days
    if person.employment is None and not starts_after_insurance:
        return outcome(
            benefit, "unknown_employment", "Podaj rodzaj zatrudnienia.", "B1", missing=True
        )

    while start < stop:
        year_stop = min(stop, date(start.year + 1, 1, 1))
        in_employment = insurance_end is None or start <= insurance_end
        if in_employment and insurance_end is not None:
            year_stop = min(year_stop, insurance_end + DAY)
        period_days = (year_stop - start).days
        employer_days = 0
        if person.employment == "employee" and in_employment:
            annual_history = claim.employer_paid_days_by_year or {}
            limit = claim.employer_annual_limits_by_year.get(start.year)
            if limit is None and claim.birthday is not None:
                limit = 14 if start.year > claim.birthday.year + 50 else 33
            if limit is None or start.year not in annual_history:
                return outcome(
                    benefit,
                    "missing_employer_pay_data",
                    "Podaj limit roczny lub datę urodzenia oraz wykorzystane dni chorobowego.",
                    "B1",
                    missing=True,
                )
            employer_days = min(period_days, max(0, limit - annual_history[start.year]))
        if employer_days:
            periods.append(payment("wynagrodzenie_chorobowe", start, employer_days, 100, basis))
        if period_days > employer_days:
            periods.append(
                payment(
                    "zasilek_chorobowy",
                    start + DAY * employer_days,
                    period_days - employer_days,
                    100,
                    basis,
                )
            )
        start = year_stop

    return grant(benefit, basis, periods, "A1", "B1", "B2", "C2", "C3", denied=total_days - days)


def calculate_rehabilitation(claim: Rehabilitation) -> BenefitAssessment:
    benefit = "rehabilitacyjne"
    if claim.eligible_after_insurance_ended is not True:
        issue = coverage_issue(claim.person)
        if issue and claim.eligible_after_insurance_ended is None and not issue[2]:
            return outcome(
                benefit,
                "unknown_post_insurance",
                "Potwierdź prawo po ustaniu ubezpieczenia.",
                "J1",
                missing=True,
            )
        if issue:
            code, reason, missing = issue
            return outcome(benefit, code, reason, "J1", missing=missing)

    issue = contribution_issue(claim.person)
    if issue:
        code, reason, missing = issue
        return outcome(benefit, code, reason, "J1", missing=missing)

    prerequisites = (
        claim.sickness_pool_exhausted,
        claim.still_unable_to_work,
        claim.favourable_medical_ruling,
        None if claim.exclusion_applies is None else not claim.exclusion_applies,
    )
    if False in prerequisites:
        return outcome(
            benefit,
            "rehabilitation_requirements",
            "Nie spełniono warunków świadczenia rehabilitacyjnego.",
            "J1",
            "J4",
            denied=claim.days,
        )
    if None in prerequisites:
        return outcome(
            benefit,
            "missing_rehabilitation_data",
            "Potwierdź okres zasiłkowy, orzeczenie i przesłanki wyłączenia.",
            "J1",
            "J4",
            missing=True,
        )

    basis = monthly_basis(claim.person)
    factor = claim.indexation_factor
    basis = None if basis is None or factor is None else rounded_grosze(Decimal(basis) * factor)
    days = min(claim.days, 360)
    first_days = days if claim.incapacity_during_pregnancy else min(days, 90)
    rate = 100 if claim.incapacity_during_pregnancy else 90
    periods = [payment(benefit, claim.start, first_days, rate, basis)]
    if days > first_days:
        periods.append(
            payment(
                benefit,
                claim.start + DAY * first_days,
                days - first_days,
                75,
                basis,
            )
        )
    reason = "Do wyliczenia kwoty podaj podstawę i wskaźnik waloryzacji." if basis is None else None
    return grant(
        benefit, basis, periods, "J1", "J2", "J3", "J5", denied=claim.days - days, reason=reason
    )


def calculate_post_employment(claim: PostEmployment) -> BenefitAssessment:
    benefit = "w_wysokosci_macierzynskiego"
    person = claim.person
    if person.employment is None or person.employment_end_reason is None:
        return outcome(
            benefit,
            "missing_employment_end",
            "Uzupełnij przyczynę i tytuł ustania zatrudnienia.",
            "K2",
            missing=True,
        )
    if (
        person.employment != "employee"
        or not person.employment_ended_during_pregnancy
        or person.employment_end_reason not in PREGNANCY_END_REASONS
        or claim.replacement_employment_provided is True
    ):
        return outcome(
            benefit,
            "post_employment_requirements",
            "Przesłanki świadczenia po ustaniu zatrudnienia nie są spełnione.",
            "K2",
        )
    if (
        claim.replacement_employment_provided is None
        or claim.last_employment_day is None
        or claim.birth_date is None
    ):
        return outcome(
            benefit,
            "missing_post_employment_data",
            "Podaj datę końca zatrudnienia, datę porodu i informację o innym zatrudnieniu.",
            "K2",
            missing=True,
        )

    start = claim.last_employment_day + DAY
    days = (claim.birth_date - start).days
    if days <= 0:
        return outcome(
            benefit,
            "no_post_employment_period",
            "Nie ma okresu pomiędzy ustaniem zatrudnienia a porodem.",
            "K2",
        )
    basis = monthly_basis(person)
    return grant(benefit, basis, [payment(benefit, start, days, 100, basis)], "K2", "I1")


def calculate_maternity_top_up(claim: MaternityTopUp) -> BenefitAssessment:
    benefit = "podwyzszenie_macierzynskiego"
    if claim.eligible_benefit_confirmed is False:
        return outcome(
            benefit,
            "top_up_excluded",
            "Podwyższenie nie dotyczy tego rodzaju świadczenia.",
            "I6",
            person=claim.person,
        )
    if claim.eligible_benefit_confirmed is None or claim.combined_net_grosze is None:
        return outcome(
            benefit,
            "missing_net_amount",
            "Potwierdź prawo i łączną kwotę po zaliczkach PIT.",
            "I6",
            person=claim.person,
            missing=True,
        )

    start, end = claim.period.start, claim.period.end
    days = (end - start).days + 1
    month_days = monthrange(start.year, start.month)[1]
    threshold = 100_000
    if days < month_days:
        prorated = rounded_grosze(Decimal(threshold) / month_days) * days
        threshold = ((prorated + 9) // 10) * 10
    difference = max(0, threshold - claim.combined_net_grosze)
    if not difference:
        assessment = outcome(
            benefit,
            "net_amount_at_threshold",
            "Kwota zasiłku osiągnęła próg podwyższenia.",
            "I6",
            person=claim.person,
        )
        return assessment.model_copy(update={"net_top_up_grosze": 0})
    return BenefitAssessment(
        benefit=benefit,
        person=claim.person,
        status="granted",
        reason_code="eligible",
        reason="Podwyższenie ustalono od podanej łącznej kwoty po zaliczkach PIT.",
        rule_ids=["I6"],
        days=days,
        net_top_up_grosze=difference,
    )


def calculate_benefits(
    request: BenefitSimulation, settings: AppSettings | None = None
) -> SimulationResult:
    params = settings or default_settings()
    result = (
        calculate_family(request.family, params)
        if request.family
        else SimulationResult(assessments=[])
    )
    if request.pregnancy_sickness:
        result.assessments.append(calculate_pregnancy_sickness(request.pregnancy_sickness))
    if request.rehabilitation:
        result.assessments.append(calculate_rehabilitation(request.rehabilitation))
    if request.post_employment:
        result.assessments.append(calculate_post_employment(request.post_employment))
    result.assessments.extend(
        calculate_maternity_top_up(claim) for claim in request.maternity_top_ups
    )
    return result
