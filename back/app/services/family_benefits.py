"""Podział urlopów w rodzinie i okresy rozliczenia zasiłku macierzyńskiego."""

from bisect import bisect_right
from datetime import date
from decimal import Decimal

from app.schemas.benefit_calculation import (
    BenefitAssessment,
    FamilyClaim,
    FamilyPlan,
    FamilyPool,
    Parent,
    PaymentPeriod,
    Person,
    SimulationResult,
)
from app.services.benefit_amounts import (
    DAY,
    anniversary,
    contribution_issue,
    coverage_issue,
    grant,
    monthly_basis,
    outcome,
    payment,
)
from app.services.family_periods import (
    FamilyEvent,
    FamilyEventError,
    family_event,
    supplemental_days,
)

EXCLUSIVE_DAYS = 63
AVERAGED_RATE = Decimal("81.5")
PARENTS: tuple[Parent, ...] = ("first_parent", "second_parent")
MATERNITY_PROTECTED_TERMINATIONS = {"death", "bankruptcy", "liquidation", "unlawful_court_ruling"}


class ParentalPool:
    def __init__(self, total: int, previous: dict[Parent, int], parts: int):
        self.total = total
        self.shared = max(0, total - EXCLUSIVE_DAYS * len(PARENTS))
        self.exclusive = {parent: min(total, EXCLUSIVE_DAYS) for parent in PARENTS}
        self.parts = parts
        for parent, days in previous.items():
            self.use(parent, days, count_part=False)

    def available(self, parent: Parent) -> int:
        return self.exclusive[parent] + self.shared

    def use(self, parent: Parent, days: int, *, count_part: bool = True) -> None:
        if days > self.available(parent):
            raise FamilyEventError(
                "invalid_parental_history",
                "Użyty urlop rodzicielski przekracza pulę rodziny lub rodzica.",
            )
        exclusive = min(self.exclusive[parent], days)
        self.exclusive[parent] -= exclusive
        self.shared -= days - exclusive
        self.parts += count_part

    def result(self) -> FamilyPool:
        return FamilyPool(
            total_days=self.total,
            exclusive_days_per_parent=min(self.total, EXCLUSIVE_DAYS),
            remaining_shared_days=self.shared,
            remaining_days_by_parent={parent: self.available(parent) for parent in PARENTS},
        )


def _work_days(claim: FamilyClaim, days: int) -> int:
    return min(claim.work_days or days, days) if claim.work_percent else 0


def _extended_duration(claim: FamilyClaim, work_days: int) -> int:
    # Art. 182¹f § 7. Przy pracy podczas wydłużenia dzielimy przez niewykonywaną część etatu.
    return int(work_days * claim.work_percent / (100 - claim.extension_work_percent))


def _parental_payments(
    claim: FamilyClaim,
    person: Person,
    start: date,
    days: int,
    exclusive: int,
    shared_rate: Decimal | int,
) -> list[PaymentPeriod]:
    basis = monthly_basis(person)
    work_days = _work_days(claim, days)
    stop_points = sorted({0, exclusive, work_days, days})
    segments = []
    extensions = []
    for left, right in zip(stop_points, stop_points[1:], strict=False):
        rate = 70 if left < exclusive else shared_rate
        if left < work_days:
            segments.append((right - left, rate, claim.work_percent))
            extended = _extended_duration(claim, right) - _extended_duration(claim, left)
            if extended:
                extensions.append((extended, rate, claim.extension_work_percent))
        else:
            segments.append((right - left, rate, Decimal(0)))

    # Jeżeli tylko pierwsza część wniosku obejmuje pracę, wydłużenie następuje po tej części.
    first_unworked = next((i for i, row in enumerate(segments) if not row[2]), len(segments))
    segments[first_unworked:first_unworked] = extensions
    periods = []
    for length, rate, percent in segments:
        effective_rate = rate * (1 - percent / person.contractual_work_percent)
        periods.append(payment(claim.benefit, start, length, effective_rate, basis))
        start += DAY * length
    return periods


def _averaged_rate_applies(plan: FamilyPlan, event: FamilyEvent) -> bool:
    filed = plan.averaged_rate_application
    return (
        filed is not None
        and event.qualifying_date <= filed <= event.qualifying_date + DAY * 21
        and plan.averaged_rate_full_period
        and event.parental_days > 0
        and (plan.event != "birth" or plan.averaged_rate_applicant == "first_parent")
    )


class FamilyCalculator:
    def __init__(self, plan: FamilyPlan):
        self.plan = plan
        self.event: FamilyEvent | None = None
        self.event_error: FamilyEventError | None = None
        self.pool: ParentalPool | None = None
        self.used_paternity = plan.paternity_days_already_used
        self.averaged_parental_used = plan.averaged_parental_used_in_first_year is True
        self.accepted: dict[Parent, list[BenefitAssessment]] = {parent: [] for parent in PARENTS}
        try:
            self.event = family_event(plan)
            self.pool = ParentalPool(
                self.event.parental_days,
                plan.parental_days_already_used,
                plan.parental_parts_already_used,
            )
        except FamilyEventError as error:
            self.event_error = error

    def _reject(
        self, claim: FamilyClaim, code: str, message: str, *rules: str, missing: bool = False
    ) -> BenefitAssessment:
        return outcome(
            claim.benefit,
            code,
            message,
            *rules,
            person=claim.person,
            missing=missing,
            denied=0 if missing else claim.days or 0,
        )

    def _coverage(self, claim: FamilyClaim, person: Person) -> BenefitAssessment | None:
        plan = self.plan
        issue = contribution_issue(person)
        birth_exception = (
            plan.event == "birth"
            and claim.person == "first_parent"
            and claim.benefit != "ojcowski"
            and person.employment == "employee"
            and (
                person.employment_extended_to_birth
                or (
                    person.employment_ended_during_pregnancy
                    and person.employment_end_reason in MATERNITY_PROTECTED_TERMINATIONS
                )
            )
        )
        childcare_exception = person.on_childcare_leave and claim.benefit != "ojcowski"
        if issue is None and not (birth_exception or childcare_exception):
            issue = coverage_issue(person)
        if issue:
            code, message, missing = issue
            return self._reject(claim, code, message, "K1", "K3", missing=missing)
        return None

    def _overlaps(self, claim: FamilyClaim, periods: list[PaymentPeriod]) -> bool:
        return any(
            a.start <= b.end and b.start <= a.end
            for accepted in self.accepted[claim.person]
            for a in accepted.periods
            for b in periods
        )

    def _maternity(
        self, claim: FamilyClaim, person: Person, event: FamilyEvent
    ) -> BenefitAssessment:
        plan = self.plan
        start, stop = event.maternity_start, event.maternity_stop
        transfer = plan.maternity_transfer
        if transfer is not None:
            minimum = 56 if plan.shortened_transfer_eligible else 98
            if not event.date + DAY * minimum <= transfer < stop:
                return self._reject(
                    claim,
                    "maternity_transfer_date",
                    "Przejęcie macierzyńskiego wypada poza dopuszczalnym okresem.",
                    "D4",
                    "D5",
                )
            if plan.second_parent is None or plan.transfer_care_confirmed is not True:
                return self._reject(
                    claim,
                    "transfer_requires_care",
                    "Potwierdź przejęcie opieki przez drugiego rodzica.",
                    "D4",
                    "D5",
                    missing=plan.transfer_care_confirmed is not False,
                )
            receiving_claim = FamilyClaim(person="second_parent", benefit="macierzynski")
            receiving_issue = self._coverage(receiving_claim, plan.second_parent)
            if receiving_issue:
                return self._reject(
                    claim,
                    "transfer_requires_coverage",
                    receiving_issue.reason,
                    "D4",
                    "D5",
                    missing=receiving_issue.status == "missing_data",
                )
            if claim.person == "second_parent":
                start = transfer
            else:
                stop = transfer
        elif claim.person == "second_parent":
            return self._reject(
                claim,
                "no_maternity_transfer",
                "Podaj warunki i datę przejęcia macierzyńskiego.",
                "D4",
                "D5",
                missing=True,
            )

        if claim.start is not None and claim.start != start:
            return self._reject(
                claim,
                "maternity_start_mismatch",
                "Początek musi odpowiadać dacie rozpoczęcia lub przejęcia macierzyńskiego.",
                "D1",
                "D4",
                "F9",
            )
        days = min(claim.days or (stop - start).days, (stop - start).days)
        rate = AVERAGED_RATE if _averaged_rate_applies(plan, event) else 100
        basis = monthly_basis(person)
        rule = "F1" if plan.event != "birth" else "D1"
        return grant(
            claim.benefit,
            basis,
            [payment(claim.benefit, start, days, rate, basis)],
            rule,
            "I3" if rate == AVERAGED_RATE else "I1",
            person=claim.person,
            denied=(claim.days or days) - days,
        )

    def _supplement(
        self, claim: FamilyClaim, person: Person, event: FamilyEvent
    ) -> BenefitAssessment:
        if any(
            a.benefit == claim.benefit
            for assessments in self.accepted.values()
            for a in assessments
        ):
            return self._reject(
                claim,
                "supplement_already_used",
                "Uzupełniający jest jednorazowy dla rodziny.",
                "E6",
            )
        try:
            days, rule = supplemental_days(self.plan, event)
        except FamilyEventError as exc:
            return self._reject(claim, exc.code, str(exc), "E1", "E2", "E3", missing=exc.missing)
        if not days:
            return self._reject(
                claim,
                "no_qualifying_hospitalization",
                "Brak hospitalizacji spełniającej warunki.",
                rule,
            )
        if claim.start is not None and claim.start != event.maternity_stop:
            return self._reject(
                claim,
                "supplement_start",
                "Uzupełniający zaczyna się bezpośrednio po macierzyńskim.",
                "E6",
            )
        if claim.days is not None and claim.days < days:
            return self._reject(
                claim,
                "supplement_indivisible",
                "Uzupełniającego macierzyńskiego nie dzieli się na części.",
                "E6",
            )
        basis = monthly_basis(person)
        return grant(
            claim.benefit,
            basis,
            [payment(claim.benefit, event.maternity_stop, days, 100, basis)],
            rule,
            "E5",
            "E6",
            "I1",
            person=claim.person,
            denied=(claim.days or days) - days,
        )

    def _paternity(
        self, claim: FamilyClaim, person: Person, event: FamilyEvent
    ) -> BenefitAssessment:
        plan = self.plan
        if claim.person != plan.paternity_eligible_parent or plan.event == "foster_care":
            return self._reject(
                claim,
                "paternity_role",
                "Ojcowski przysługuje ojcu biologicznemu albo adopcyjnemu.",
                "H1",
            )
        since = event.date
        if plan.event == "adoption":
            if plan.adoption_order_date is None:
                return self._reject(
                    claim,
                    "missing_adoption_order",
                    "Podaj dzień uprawomocnienia przysposobienia.",
                    "H1",
                    missing=True,
                )
            since = plan.adoption_order_date
        stop = anniversary(since, 1)
        if plan.event == "adoption":
            stop = min(stop, event.parental_stop)
        already_accepted = [a for a in self.accepted[claim.person] if a.benefit == claim.benefit]
        used = self.used_paternity + sum(a.days for a in already_accepted)
        start = claim.start or max(
            (a.periods[-1].end + DAY for a in already_accepted), default=since
        )
        days = claim.days or max(7, 14 - used)
        if days not in {7, 14} or days > 14 - used:
            return self._reject(
                claim,
                "paternity_duration",
                "Ojcowski można wykorzystać w 1 albo 2 częściach po co najmniej 7 dni.",
                "H2",
            )
        if start < since or start + DAY * days > stop:
            return self._reject(
                claim,
                "paternity_deadline",
                "Wnioskowany okres wykracza poza termin wykorzystania ojcowskiego.",
                "H1",
            )
        if not any(
            not child.stillborn
            and (child.death_date is None or child.death_date >= start + DAY * days)
            for child in event.children
        ):
            return self._reject(
                claim,
                "paternity_care",
                "Warunek sprawowania opieki nad dzieckiem nie jest spełniony przez cały okres.",
                "H1",
            )
        basis = monthly_basis(person)
        return grant(
            claim.benefit,
            basis,
            [payment(claim.benefit, start, days, 100, basis)],
            "H1",
            "H2",
            "I1",
            person=claim.person,
        )

    def _parental(
        self, claim: FamilyClaim, person: Person, event: FamilyEvent, pool: ParentalPool
    ) -> BenefitAssessment:
        if pool.parts >= 5:
            return self._reject(
                claim,
                "parental_parts_limit",
                "Wykorzystano maksymalnie 5 części urlopu rodzicielskiego.",
                "G6",
            )
        if claim.work_percent:
            if person.employment is None:
                return self._reject(
                    claim,
                    "missing_employment",
                    "Potwierdź zatrudnienie na umowę o pracę.",
                    "G8",
                    missing=True,
                )
            if (
                person.employment != "employee"
                or max(claim.work_percent, claim.extension_work_percent)
                >= person.contractual_work_percent
            ):
                return self._reject(
                    claim,
                    "parental_work_requirements",
                    "Łączenie wymaga umowy o pracę i wymiaru pracy niższego od wymiaru z umowy.",
                    "G8",
                )

        previous = self.accepted[claim.person]
        last_day = max(
            (period.end for a in previous if a.benefit != "ojcowski" for period in a.periods),
            default=None,
        )
        default_start = max(
            event.maternity_stop, last_day + DAY if last_day else event.maternity_stop
        )
        start = claim.start or default_start
        if start < event.qualifying_date:
            return self._reject(
                claim,
                "parental_start",
                "Rodzicielski zaczyna się po powstaniu prawa do zasiłku.",
                "G6",
            )
        if claim.person == "first_parent" and start < event.maternity_stop:
            return self._reject(
                claim,
                "parental_during_maternity",
                "Wnioskowany okres pierwszego rodzica pokrywa się z macierzyńskim.",
                "D1",
                "G6",
            )

        requested = claim.days or pool.available(claim.person)
        available = min(requested, pool.available(claim.person))
        calendar_days = (event.parental_stop - start).days
        days = bisect_right(
            range(1, available + 1),
            calendar_days,
            key=lambda base_days: (
                base_days + _extended_duration(claim, _work_days(claim, base_days))
            ),
        )
        if not days:
            return self._reject(
                claim,
                "parental_pool_or_deadline",
                "Wyczerpano pulę rodzica lub upłynął termin urlopu rodzicielskiego.",
                "G4",
                "G6",
            )

        plan = self.plan
        exclusive = min(days, pool.exclusive[claim.person])
        averaged = (
            _averaged_rate_applies(plan, event)
            and (
                claim.person == plan.averaged_rate_applicant
                or plan.averaged_shared_transfer_confirmed
            )
            and plan.averaged_parental_used_in_first_year is not False
            and (self.averaged_parental_used or start < anniversary(event.date, 1))
        )
        reduced_days = 0 if claim.person == plan.averaged_rate_applicant else exclusive
        periods = _parental_payments(
            claim, person, start, days, reduced_days, AVERAGED_RATE if averaged else 70
        )
        if self._overlaps(claim, periods):
            return self._reject(
                claim, "overlapping_periods", "Okresy jednego rodzica nie mogą się pokrywać.", "G6"
            )

        pool.use(claim.person, days)
        if averaged and days > reduced_days and start < anniversary(event.date, 1):
            self.averaged_parental_used = True
        rules = ["F4" if plan.event == "foster_care" else "F5"] if plan.event != "birth" else ["G1"]
        if plan.za_zyciem:
            rules.append("G2" if plan.event == "birth" else "F6")
        rules.extend(["G4", "G6", "I2"])
        if averaged:
            rules += ["I3", "I4"]
        if claim.work_percent:
            rules += ["G8", "G9", "G11"]
            if plan.za_zyciem:
                rules += ["G10"]
        return grant(
            claim.benefit,
            monthly_basis(person),
            periods,
            *rules,
            person=claim.person,
            denied=requested - days,
            base_days_used=days,
        )

    def assess(self, claim: FamilyClaim) -> BenefitAssessment:
        person = (
            self.plan.first_parent if claim.person == "first_parent" else self.plan.second_parent
        )
        if person is None:
            return self._reject(
                claim, "missing_parent", "Uzupełnij dane wybranego rodzica.", "G3", missing=True
            )
        issue = self._coverage(claim, person)
        if issue:
            return issue
        if self.event_error:
            error = self.event_error
            return self._reject(claim, error.code, str(error), missing=error.missing)
        assert self.event is not None and self.pool is not None

        if claim.benefit == "rodzicielski":
            result = self._parental(claim, person, self.event, self.pool)
        elif claim.benefit == "macierzynski":
            result = self._maternity(claim, person, self.event)
        elif claim.benefit == "ojcowski":
            result = self._paternity(claim, person, self.event)
        else:
            result = self._supplement(claim, person, self.event)

        if result.periods:
            if claim.benefit != "rodzicielski" and self._overlaps(claim, result.periods):
                return self._reject(
                    claim, "overlapping_periods", "Okresy jednego rodzica nie mogą się pokrywać."
                )
            self.accepted[claim.person].append(result)
        return result


def calculate_family(plan: FamilyPlan) -> SimulationResult:
    calculator = FamilyCalculator(plan)
    assessments = [calculator.assess(claim) for claim in plan.claims]
    return SimulationResult(
        assessments=assessments,
        parental_pool=calculator.pool.result() if calculator.pool else None,
    )
