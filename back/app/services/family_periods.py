"""Data i wymiar świadczeń związanych z urodzeniem lub przyjęciem dziecka."""

from dataclasses import dataclass
from datetime import date

from app.schemas.benefit_calculation import Child, FamilyPlan
from app.services.benefit_amounts import DAY, anniversary

MATERNITY_DAYS = (140, 217, 231, 245, 259)
SUPPLEMENT_EFFECTIVE = date(2025, 3, 19)


class FamilyEventError(ValueError):
    def __init__(self, code: str, message: str, *, missing: bool = False):
        super().__init__(message)
        self.code = code
        self.missing = missing


@dataclass(frozen=True)
class FamilyEvent:
    date: date
    qualifying_date: date
    children: list[Child]
    maternity_start: date
    maternity_stop: date
    parental_stop: date
    parental_days: int


def _birth_event(plan: FamilyPlan, birth: date) -> FamilyEvent:
    if any(child.death_date and child.death_date < birth for child in plan.children):
        raise FamilyEventError("contradictory_death_date", "Data śmierci dziecka poprzedza poród.")

    start = plan.maternity_start or birth
    if start < birth and plan.expected_birth_date is None:
        raise FamilyEventError(
            "missing_due_date",
            "Podaj przewidywaną datę porodu dla okresu przed porodem.",
            missing=True,
        )
    earliest = (plan.expected_birth_date or birth) - DAY * 42
    if start > birth or (start < birth and start < earliest):
        raise FamilyEventError(
            "maternity_start", "Data rozpoczęcia macierzyńskiego jest poza dopuszczalnym okresem."
        )

    count = len(plan.children)
    liveborn = [child for child in plan.children if not child.stillborn]
    survivors = [child for child in liveborn if child.death_date is None]
    deaths = [child.death_date for child in liveborn if child.death_date is not None]
    stop = start + DAY * MATERNITY_DAYS[min(count, 5) - 1]
    if not liveborn:
        stop = birth + DAY * 56
    elif not survivors:
        last_death = max(deaths)
        final_days = last_death + DAY * 7
        stop = min(stop, max(birth + DAY * 56, final_days)) if last_death < stop else stop
    elif len(survivors) < count:
        last_change = max(deaths, default=birth)
        remaining_stop = start + DAY * MATERNITY_DAYS[min(len(survivors), 5) - 1]
        stop = min(stop, max(last_change, remaining_stop))

    parental_stop = date(birth.year + 7, 1, 1)
    if not survivors:
        parental_stop = max(deaths) + DAY * 7 if deaths else birth
    parental_weeks = (41 if len(liveborn) == 1 else 43) + 24 * plan.za_zyciem
    parental_days = parental_weeks * 7 if liveborn else 0
    return FamilyEvent(birth, birth, plan.children, start, stop, parental_stop, parental_days)


def _placement_event(plan: FamilyPlan, placed: date) -> FamilyEvent:
    if plan.maternity_transfer is not None:
        raise FamilyEventError(
            "placement_transfer_requires_review",
            "Podział macierzyńskiego po przyjęciu dziecka wymaga indywidualnej weryfikacji.",
            missing=True,
        )
    if plan.event == "adoption":
        confirmed = plan.adoption_proceeding
        qualifying_date = max(placed, plan.adoption_filing_date or placed)
    else:
        confirmed = plan.non_professional_foster_care
        qualifying_date = placed

    if confirmed is not True:
        raise FamilyEventError(
            "placement_status",
            "Potwierdź wystąpienie o przysposobienie albo niezawodową pieczę zastępczą.",
            missing=confirmed is None,
        )
    if any(child.birth_date is None for child in plan.children):
        raise FamilyEventError(
            "missing_child_age", "Podaj daty urodzenia przyjętych dzieci.", missing=True
        )

    eligible_children = []
    age_limits = []
    for child in plan.children:
        birth = child.birth_date
        if birth is None or birth > placed:
            raise FamilyEventError(
                "child_age", "Data urodzenia dziecka nie może być późniejsza niż dzień przyjęcia."
            )
        age_limit = 14 if plan.event == "adoption" else (10 if child.school_start_deferred else 7)
        limit = anniversary(birth, age_limit)
        if placed < limit:
            eligible_children.append(child)
            age_limits.append(limit)

    if not age_limits:
        raise FamilyEventError(
            "child_age_limit", "Dzieci nie spełniają kryterium wieku w dniu przyjęcia."
        )

    start = plan.maternity_start or qualifying_date
    if not qualifying_date <= start <= qualifying_date + DAY * 21:
        raise FamilyEventError(
            "placement_start",
            "Data rozpoczęcia urlopu po przyjęciu dziecka jest poza dopuszczalnym okresem.",
        )
    age_stop = max(age_limits)
    maternity_days = MATERNITY_DAYS[min(len(eligible_children), 5) - 1]
    maternity_days = max(63, min(maternity_days, (age_stop - start).days))
    parental_weeks = 38 if maternity_days == 63 else (41 if len(eligible_children) == 1 else 43)
    parental_weeks += 24 * plan.za_zyciem
    return FamilyEvent(
        placed,
        qualifying_date,
        eligible_children,
        start,
        start + DAY * maternity_days,
        age_stop,
        parental_weeks * 7,
    )


def family_event(plan: FamilyPlan) -> FamilyEvent:
    event_date = plan.event_date
    if event_date is None and plan.event == "birth":
        event_date = plan.expected_birth_date
    if event_date is None:
        raise FamilyEventError(
            "missing_event_date", "Podaj datę porodu lub przyjęcia dziecka.", missing=True
        )
    return (
        _birth_event(plan, event_date)
        if plan.event == "birth"
        else _placement_event(plan, event_date)
    )


def _hospital_days(child: Child, first_day: date, stop: date) -> set[date]:
    return {
        start + DAY * offset
        for stay in child.hospital_stays or []
        if (start := max(first_day, stay.start)) <= (end := min(stop - DAY, stay.end))
        for offset in range((end - start).days + 1)
    }


def supplemental_days(plan: FamilyPlan, event: FamilyEvent) -> tuple[int, str]:
    if event.maternity_stop <= SUPPLEMENT_EFFECTIVE:
        return 0, "E6"
    if any(child.hospital_stays is None for child in event.children):
        raise FamilyEventError(
            "missing_hospital_intervals",
            "Potwierdź okresy hospitalizacji dzieci.",
            missing=True,
        )
    if not any(child.hospital_stays for child in event.children):
        return 0, "E1"
    weeks = plan.pregnancy_weeks_at_birth
    weights = [child.birth_weight_g for child in event.children if child.birth_weight_g is not None]
    low_weight = min(weights, default=1001) <= 1000
    if not low_weight and (
        weeks is None or (28 <= weeks < 37 and len(weights) < len(event.children))
    ):
        raise FamilyEventError(
            "missing_hospital_data",
            "Podaj zakończone tygodnie ciąży i masę urodzeniową.",
            missing=True,
        )

    if low_weight or (weeks is not None and weeks < 28):
        window_days, first_offset, rule = 105, 0, "E1"
    elif weeks is not None and weeks < 37:
        window_days, first_offset, rule = 56, 0, "E2"
    else:
        window_days, first_offset, rule = 56, 5, "E3"

    counts = []
    for child in event.children:
        birth = event.date if plan.event == "birth" else child.birth_date
        if birth is None:
            continue
        start = max(event.date, birth + DAY * first_offset)
        days = _hospital_days(child, start, birth + DAY * window_days)
        if rule == "E3" and not any(day <= birth + DAY * 28 and day + DAY in days for day in days):
            continue
        counts.append(len(days))

    longest = max(counts, default=0)
    return ((longest + 6) // 7) * 7, rule
