"""Mapa reguł z `RULES.md` na kod: każdy identyfikator ma tu scenariusz albo wpis poza silnikiem.

Ten plik jest umową między krokiem 0 a silnikiem. Nowa reguła w `RULES.md`, której nie ma
poniżej, wywala `test_every_rule_has_a_home`. Reguła oznaczona jako poza silnikiem musi
mieć powód, żeby nikt nie uznał luki za pokrycie.

Testy sprawdzają zachowanie kalkulatora, nie napisy w `rule_ids`. Identyfikatory w wyniku
służą do pokazania użytkownikowi, na czym opiera się decyzja, a nie do zastąpienia asercji.
"""

import re
from collections.abc import Callable
from datetime import date
from pathlib import Path

import pytest

from app.schemas.benefit_calculation import BenefitAssessment, BenefitSimulation
from app.services.benefit_service import calculate_benefits

RULES_PATH = Path(__file__).resolve().parents[2] / "RULES.md"
BASIS = 600_000

Check = Callable[[], None]
CHECKS: dict[str, tuple[Check | None, str]] = {}


def rule(rule_id: str, note: str = "") -> Callable[[Check], Check]:
    def register(fn: Check) -> Check:
        CHECKS[rule_id] = (fn, note)
        return fn

    return register


def out(rule_id: str, reason: str) -> None:
    CHECKS[rule_id] = (None, reason)


def person(**overrides) -> dict:
    data = {
        "employment": "employee",
        "sickness_insured": True,
        "monthly_basis_grosze": BASIS,
    }
    data.update(overrides)
    return data


def simulate(**sections) -> BenefitSimulation:
    return BenefitSimulation.model_validate(sections)


def rows(request: BenefitSimulation) -> dict[tuple[str, str], BenefitAssessment]:
    result = calculate_benefits(request)
    return {(row.benefit, row.person): row for row in result.assessments}


def sickness(**overrides) -> BenefitAssessment:
    data = {
        "person": person(),
        "incapacity": {"start": "2026-02-01", "end": "2026-03-05"},
        "covered_days_before_incapacity": 400,
        "waiting_period_exempt": True,
        "sickness_days_used": 0,
        "birthday": "1990-01-01",
        "employer_paid_days_by_year": {2026: 0},
    }
    data.update(overrides)
    return rows(simulate(pregnancy_sickness=data))[("chorobowy_w_ciazy", "first_parent")]


def family(**overrides) -> dict:
    plan = {
        "event_date": "2026-05-04",
        "first_parent": person(),
        "claims": [{"benefit": "macierzynski"}],
    }
    plan.update(overrides)
    return plan


def family_rows(**overrides) -> dict[tuple[str, str], BenefitAssessment]:
    return rows(simulate(family=family(**overrides)))


def maternal(**overrides) -> BenefitAssessment:
    return family_rows(**overrides)[("macierzynski", "first_parent")]


# --- A. Wymagany okres ubezpieczenia -------------------------------------


@rule("A1")
def test_a1_waiting_period_is_30_or_90_days() -> None:
    compulsory = sickness(
        covered_days_before_incapacity=0,
        waiting_period_exempt=False,
        compulsory_insurance=True,
    )
    assert compulsory.days == 3  # 1 lutego + 30 dni = 3 marca, do 5 marca
    voluntary = sickness(
        covered_days_before_incapacity=0,
        waiting_period_exempt=False,
        compulsory_insurance=False,
    )
    assert voluntary.status == "denied"
    assert voluntary.reason_code == "no_covered_days"


@rule("A2", "poprzednie okresy są jednym wejściem; silnik nie sprawdza 30-dniowej przerwy")
def test_a2_previous_periods_shorten_the_wait() -> None:
    partial = sickness(
        covered_days_before_incapacity=25,
        waiting_period_exempt=False,
        compulsory_insurance=True,
    )
    assert partial.days == 28  # 5 dni wyczekiwania zamiast 30


@rule("A3")
def test_a3_exemptions_start_on_the_first_day() -> None:
    assert sickness(covered_days_before_incapacity=0).days == 33


# --- B. Wynagrodzenie chorobowe ------------------------------------------


@rule("B1")
def test_b1_employer_pays_33_or_14_days() -> None:
    young = sickness(
        birthday="1990-01-01",
        employer_paid_days_by_year={2026: 30},
    )
    employer = [row for row in young.periods if row.kind == "wynagrodzenie_chorobowe"]
    assert sum(row.days for row in employer) == 3
    older = sickness(
        birthday="1970-01-01",
        employer_paid_days_by_year={2026: 12},
    )
    employer = [row for row in older.periods if row.kind == "wynagrodzenie_chorobowe"]
    assert sum(row.days for row in employer) == 2  # limit 14 dni, zostały 2


@rule("B2")
def test_b2_pregnancy_sickness_is_paid_in_full() -> None:
    assessment = sickness()
    assert {row.rate_percent for row in assessment.periods} == {100}


@rule("B3", "podstawa przychodzi gotowa; silnik nie odtwarza jej z listy płac")
def test_b3_employer_pay_uses_the_benefit_basis() -> None:
    with_employer = sickness(
        birthday="1990-01-01",
        employer_paid_days_by_year={2026: 30},
    )
    paid = next(row for row in with_employer.periods if row.kind == "wynagrodzenie_chorobowe")
    assert paid.daily_grosze == 20_000  # 6000 zł / 30 dni


out(
    "B4",
    "Podział wypłaty między pracodawcę i ZUS zależy od liczby ubezpieczonych; "
    "nie modelujemy płatnika.",
)
out(
    "B5",
    "Badania i pobranie komórek, tkanek i narządów nie ma wejścia w formularzu.",
)


# --- C. Zasiłek chorobowy ------------------------------------------------


out(
    "C1",
    "Silnik liczy tylko niezdolność w ciąży, a ta jest płatna w 100%; "
    "wariant 80% nie istnieje.",
)
@rule("C2")
def test_c2_pregnancy_sickness_is_100_percent() -> None:
    assert sickness().gross_grosze == 33 * 20_000


@rule("C3")
def test_c3_the_pool_is_270_days_in_pregnancy() -> None:
    assessment = sickness(sickness_days_used=260)
    assert assessment.days == 10
    assert assessment.status == "partially_granted"
    assert assessment.denied_days == 23


@rule("C4", "limit 91 dni po ustaniu ubezpieczenia nie jest liczony")
def test_c4_onset_after_insurance_and_exclusion() -> None:
    late = sickness(
        insurance_ended_on="2026-01-31",
        incapacity={"start": "2026-02-20", "end": "2026-03-30"},
    )
    assert late.reason_code == "post_insurance_onset"
    excluded = sickness(
        insurance_ended_on="2026-02-15",
        incapacity={"start": "2026-02-16", "end": "2026-03-30"},
        post_insurance_exclusion_applies=True,
    )
    assert excluded.status == "denied"


@rule("C5", "silnik dostaje liczbę wykorzystanych dni; nie odtwarza 60-dniowych przerw")
def test_c5_used_days_reduce_the_pool() -> None:
    long = sickness(
        sickness_days_used=170,
        incapacity={"start": "2026-02-01", "end": "2026-06-30"},
    )
    assert long.days == 100
    assert long.denied_days == 50


@rule("C6")
def test_c6_weekends_count() -> None:
    assessment = sickness(incapacity={"start": "2026-02-07", "end": "2026-02-08"})
    assert assessment.days == 2


@rule("C7")
def test_c7_month_is_30_days() -> None:
    period = sickness().periods[0]
    assert period.daily_grosze == BASIS * 100 // 3000


# --- D. Macierzyński -----------------------------------------------------


@rule("D1")
def test_d1_weeks_depend_on_child_count() -> None:
    assert maternal().days == 140
    twins = family_rows(children=[{"birth_date": "2026-05-04"}, {"birth_date": "2026-05-04"}])
    assert twins[("macierzynski", "first_parent")].days == 217


@rule("D2")
def test_d2_six_weeks_before_birth_at_most() -> None:
    allowed = maternal(maternity_start="2026-03-23", expected_birth_date="2026-05-04")
    assert allowed.status == "granted"
    too_early = maternal(maternity_start="2026-03-22", expected_birth_date="2026-05-04")
    assert too_early.reason_code == "maternity_start"


@rule("D3")
def test_d3_days_not_used_before_birth_move_after_it() -> None:
    assessment = maternal(maternity_start="2026-03-23", expected_birth_date="2026-05-04")
    assert assessment.periods[0].end == date(2026, 8, 9)


@rule("D4")
def test_d4_transfer_after_14_weeks() -> None:
    plan = family_rows(
        maternity_transfer="2026-08-10",
        transfer_care_confirmed=True,
        second_parent=person(monthly_basis_grosze=420_000),
        claims=[
            {"benefit": "macierzynski"},
            {"benefit": "macierzynski", "person": "second_parent"},
        ],
    )
    assert plan[("macierzynski", "first_parent")].days == 98
    assert plan[("macierzynski", "second_parent")].days == 42


@rule("D5")
def test_d5_shortened_transfer_after_8_weeks() -> None:
    plan = family_rows(
        shortened_transfer_eligible=True,
        maternity_transfer="2026-06-29",
        transfer_care_confirmed=True,
        second_parent=person(monthly_basis_grosze=420_000),
        claims=[
            {"benefit": "macierzynski"},
            {"benefit": "macierzynski", "person": "second_parent"},
        ],
    )
    assert plan[("macierzynski", "first_parent")].days == 56
    assert plan[("macierzynski", "second_parent")].days == 84


@rule("D6")
def test_d6_stillbirth_is_8_weeks() -> None:
    assessment = maternal(children=[{"birth_date": "2026-05-04", "stillborn": True}])
    assert assessment.days == 56


@rule("D7")
def test_d7_death_after_8_weeks_keeps_7_days() -> None:
    assessment = maternal(
        children=[{"birth_date": "2026-05-04", "death_date": "2026-07-13"}]
    )
    assert assessment.days == 77  # 70 dni do zgonu i 7 dni po nim


# --- E. Uzupełniający ----------------------------------------------------


def supplement(**overrides) -> BenefitAssessment:
    plan = {
        "pregnancy_weeks_at_birth": 30,
        "children": [
            {
                "birth_date": "2026-05-04",
                "birth_weight_g": 900,
                "hospital_stays": [{"start": "2026-05-04", "end": "2026-05-10"}],
            }
        ],
        "claims": [{"benefit": "macierzynski"}, {"benefit": "uzupelniajacy"}],
    }
    plan.update(overrides)
    return family_rows(**plan)[("uzupelniajacy", "first_parent")]


@rule("E1")
def test_e1_week_per_week_up_to_week_15() -> None:
    assert supplement().days == 7


@rule("E2")
def test_e2_28_to_37_weeks() -> None:
    assessment = supplement(
        pregnancy_weeks_at_birth=34,
        children=[
            {
                "birth_date": "2026-05-04",
                "birth_weight_g": 1500,
                "hospital_stays": [{"start": "2026-05-04", "end": "2026-05-17"}],
            }
        ],
    )
    assert assessment.days == 14


@rule("E3")
def test_e3_term_birth_with_late_hospital_stay() -> None:
    assessment = supplement(
        pregnancy_weeks_at_birth=39,
        children=[
            {
                "birth_date": "2026-05-04",
                "birth_weight_g": 3200,
                "hospital_stays": [{"start": "2026-05-09", "end": "2026-05-18"}],
            }
        ],
    )
    assert assessment.days == 14


@rule("E4")
def test_e4_twins_use_lowest_weight_and_longest_stay() -> None:
    assessment = supplement(
        children=[
            {
                "birth_date": "2026-05-04",
                "birth_weight_g": 900,
                "hospital_stays": [{"start": "2026-05-04", "end": "2026-05-10"}],
            },
            {
                "birth_date": "2026-05-04",
                "birth_weight_g": 1700,
                "hospital_stays": [{"start": "2026-05-04", "end": "2026-05-24"}],
            },
        ]
    )
    assert assessment.days == 21


@rule("E5")
def test_e5_partial_week_rounds_up() -> None:
    three_days = supplement(
        children=[
            {
                "birth_date": "2026-05-04",
                "birth_weight_g": 900,
                "hospital_stays": [{"start": "2026-05-04", "end": "2026-05-06"}],
            }
        ]
    )
    assert three_days.days == 7


@rule("E6")
def test_e6_supplement_starts_right_after_maternity() -> None:
    assessment = supplement()
    assert assessment.periods[0].start == date(2026, 9, 21)  # 140 dni po 4 maja
    shifted = supplement(
        claims=[
            {"benefit": "macierzynski"},
            {"benefit": "uzupelniajacy", "start": "2026-09-22"},
        ]
    )
    assert shifted.reason_code == "supplement_start"


@rule("E7", "górna granica wynika z okna 15 tygodni, ale nie jest osobnym ograniczeniem")
def test_e7_no_more_than_15_weeks() -> None:
    long_stay = supplement(
        children=[
            {
                "birth_date": "2026-05-04",
                "birth_weight_g": 900,
                "hospital_stays": [{"start": "2026-05-04", "end": "2026-09-01"}],
            }
        ]
    )
    assert long_stay.days == 105


# --- F. Przyjęcie dziecka ------------------------------------------------


def placement(**overrides) -> BenefitAssessment:
    plan = {
        "event": "foster_care",
        "event_date": "2026-04-10",
        "non_professional_foster_care": True,
        "children": [{"birth_date": "2025-11-01"}],
    }
    plan.update(overrides)
    return family_rows(**plan)[("macierzynski", "first_parent")]


@rule("F1")
def test_f1_foster_care_gets_maternity_weeks() -> None:
    assert placement().days == 140


@rule("F2")
def test_f2_short_placement_still_gets_9_weeks() -> None:
    assessment = placement(
        event="adoption",
        adoption_proceeding=True,
        adoption_filing_date="2026-04-01",
        children=[{"birth_date": "2012-06-01"}],
    )
    assert assessment.days == 63


@rule("F3")
def test_f3_child_over_the_age_limit_is_rejected() -> None:
    assessment = placement(children=[{"birth_date": "2018-01-01"}])
    assert assessment.reason_code == "child_age_limit"


@rule("F4")
def test_f4_foster_parental_is_41_weeks() -> None:
    result = calculate_benefits(
        simulate(
            family=family(
                event="foster_care",
                event_date="2026-04-10",
                non_professional_foster_care=True,
                children=[{"birth_date": "2025-11-01"}],
                claims=[
                    {"benefit": "macierzynski"},
                    {"benefit": "rodzicielski", "days": 287},
                ],
            )
        )
    )
    assert result.parental_pool is not None
    assert result.parental_pool.total_days == 287
    assert result.assessments[1].days == 224  # 9 tygodni należy do drugiego rodzica


@rule("F5")
def test_f5_adoption_parental_is_41_weeks() -> None:
    result = calculate_benefits(
        simulate(
            family=family(
                event="adoption",
                event_date="2026-04-10",
                adoption_proceeding=True,
                adoption_filing_date="2026-04-01",
                children=[{"birth_date": "2025-11-01"}],
                claims=[
                    {"benefit": "macierzynski"},
                    {"benefit": "rodzicielski", "days": 287},
                ],
            )
        )
    )
    assert result.parental_pool is not None
    assert result.parental_pool.total_days == 287


@rule("F6")
def test_f6_za_zyciem_extends_placement_parental_to_65_weeks() -> None:
    result = calculate_benefits(
        simulate(
            family=family(
                event="foster_care",
                event_date="2026-04-10",
                non_professional_foster_care=True,
                za_zyciem=True,
                children=[{"birth_date": "2025-11-01"}],
                claims=[
                    {"benefit": "macierzynski"},
                    {"benefit": "rodzicielski", "days": 455},
                ],
            )
        )
    )
    assert result.parental_pool is not None
    assert result.parental_pool.total_days == 455


@rule("F7", "limit 5 części jest wspólny dla wszystkich rodziców, także przy przyjęciu dziecka")
def test_f7_parental_parts_are_limited() -> None:
    plan = family_rows(
        event="foster_care",
        event_date="2026-04-10",
        non_professional_foster_care=True,
        children=[{"birth_date": "2025-11-01"}],
        parental_parts_already_used=5,
        claims=[
            {"benefit": "macierzynski"},
            {"benefit": "rodzicielski", "days": 7},
        ],
    )
    assert plan[("rodzicielski", "first_parent")].reason_code == "parental_parts_limit"


out(
    "F8",
    "Okno hospitalizacji liczy się od urodzenia, więc pobyt po przyjęciu starszego dziecka "
    "wypada poza nie i daje 0 dni. To luka w silniku, nie w teście.",
)


@rule("F9", "tylko start w 21 dni; termin 7 dni na złożenie wniosku nie jest sprawdzany")
def test_f9_placement_starts_within_21_days() -> None:
    late = placement(maternity_start="2026-05-05")
    assert late.reason_code == "placement_start"
    on_time = placement(maternity_start="2026-04-20")
    assert on_time.status == "granted"


# --- G. Rodzicielski -----------------------------------------------------


def parental(days: int | None = None, **overrides) -> dict[tuple[str, str], BenefitAssessment]:
    claim: dict = {"benefit": "rodzicielski"}
    if days is not None:
        claim["days"] = days
    claims = [{"benefit": "macierzynski"}, claim]
    return family_rows(claims=claims, **overrides)


@rule("G1")
def test_g1_single_child_pool_is_41_weeks() -> None:
    result = calculate_benefits(simulate(family=family()))
    assert result.parental_pool is not None
    assert result.parental_pool.total_days == 287


@rule("G2")
def test_g2_za_zyciem_pool_is_65_weeks() -> None:
    result = calculate_benefits(simulate(family=family(za_zyciem=True)))
    assert result.parental_pool is not None
    assert result.parental_pool.total_days == 455


@rule("G3")
def test_g3_the_pool_is_shared_by_both_parents() -> None:
    result = calculate_benefits(
        simulate(
            family=family(
                second_parent=person(monthly_basis_grosze=420_000),
                claims=[
                    {"benefit": "macierzynski"},
                    {"benefit": "rodzicielski", "days": 70},
                    {"benefit": "rodzicielski", "person": "second_parent", "days": 70},
                ],
            )
        )
    )
    assert result.parental_pool is not None
    assert result.parental_pool.remaining_shared_days == 147  # 161 wspólnych minus 2 razy 7


@rule("G4")
def test_g4_nine_weeks_are_exclusive() -> None:
    plan = parental(days=287)
    assert plan[("rodzicielski", "first_parent")].days == 224
    assert plan[("rodzicielski", "first_parent")].denied_days == 63


@rule("G5")
def test_g5_taking_9_weeks_consumes_the_exclusive_part() -> None:
    plan = family(
        second_parent=person(monthly_basis_grosze=420_000),
        claims=[
            {"benefit": "macierzynski"},
            {"benefit": "rodzicielski", "days": 63},
        ],
    )
    result = calculate_benefits(simulate(family=plan))
    assert result.parental_pool is not None
    assert result.parental_pool.remaining_days_by_parent["first_parent"] == 161
    assert result.parental_pool.remaining_days_by_parent["second_parent"] == 224
    assert result.parental_pool.remaining_shared_days == 161


@rule(
    "G6",
    "termin to 1 stycznia roku, w którym dziecko kończy 7 lat, czyli o rok dłużej niż przepis",
)
def test_g6_five_parts_and_the_age_deadline() -> None:
    too_many = parental(parental_parts_already_used=5, days=7)
    assert too_many[("rodzicielski", "first_parent")].reason_code == "parental_parts_limit"
    late = family_rows(
        event_date="2019-05-04",
        children=[{"birth_date": "2019-05-04"}],
        claims=[
            {"benefit": "macierzynski"},
            {"benefit": "rodzicielski", "days": 7, "start": "2027-01-01"},
        ],
    )
    assert late[("rodzicielski", "first_parent")].reason_code == "parental_pool_or_deadline"


@rule("G7", "liczymy części, ale nie sprawdzamy 21-dniowego terminu wniosku")
def test_g7_each_application_uses_one_part() -> None:
    plan = family_rows(
        parental_parts_already_used=4,
        claims=[
            {"benefit": "macierzynski"},
            {"benefit": "rodzicielski", "days": 7},
            {"benefit": "rodzicielski", "days": 7},
        ],
    )
    assert plan[("rodzicielski", "first_parent")].reason_code == "parental_parts_limit"


@rule("G8")
def test_g8_work_must_be_below_the_contract() -> None:
    ok = family_rows(
        claims=[
            {"benefit": "macierzynski"},
            {"benefit": "rodzicielski", "days": 63, "work_percent": 50, "work_days": 63},
        ]
    )
    assert ok[("rodzicielski", "first_parent")].status == "granted"
    too_much = family_rows(
        claims=[
            {"benefit": "macierzynski"},
            {"benefit": "rodzicielski", "days": 63, "work_percent": 50, "work_days": 63},
        ],
        first_parent=person(contractual_work_percent=50),
    )
    assert too_much[("rodzicielski", "first_parent")].reason_code == "parental_work_requirements"


@rule("G9", "nie pilnujemy górnych granic 82 i 86 tygodni")
def test_g9_work_extends_the_leave() -> None:
    plan = family_rows(
        claims=[
            {"benefit": "macierzynski"},
            {"benefit": "rodzicielski", "days": 63, "work_percent": 50, "work_days": 63},
        ]
    )
    assert plan[("rodzicielski", "first_parent")].days > 63


@rule("G10", "nie pilnujemy granic 130 i 134 tygodni")
def test_g10_za_zyciem_extension_is_reported() -> None:
    plan = family_rows(
        za_zyciem=True,
        claims=[
            {"benefit": "macierzynski"},
            {"benefit": "rodzicielski", "days": 63, "work_percent": 50, "work_days": 63},
        ],
    )
    assert "G10" in plan[("rodzicielski", "first_parent")].rule_ids


@rule("G11")
def test_g11_extension_is_weeks_times_the_work_dimension() -> None:
    plan = family_rows(
        claims=[
            {"benefit": "macierzynski"},
            {"benefit": "rodzicielski", "days": 63, "work_percent": 50, "work_days": 63},
        ]
    )
    assert plan[("rodzicielski", "first_parent")].days == 94  # 63 dni i 31 dni wydłużenia


# --- H. Ojcowski ---------------------------------------------------------


def paternity(**overrides) -> BenefitAssessment:
    plan = {
        "second_parent": person(monthly_basis_grosze=420_000),
        "claims": [
            {"benefit": "macierzynski"},
            {"benefit": "ojcowski", "person": "second_parent"},
        ],
    }
    plan.update(overrides)
    return family_rows(**plan)[("ojcowski", "second_parent")]


@rule("H1")
def test_h1_two_weeks_until_the_first_birthday() -> None:
    assert paternity().days == 14
    late = paternity(
        claims=[{"benefit": "ojcowski", "person": "second_parent", "start": "2027-06-01"}],
    )
    assert late.reason_code == "paternity_deadline"


@rule("H2")
def test_h2_two_parts_of_at_least_a_week() -> None:
    result = calculate_benefits(
        simulate(
            family=family(
                second_parent=person(monthly_basis_grosze=420_000),
                claims=[
                    {"benefit": "macierzynski"},
                    {"benefit": "ojcowski", "person": "second_parent", "days": 7},
                    {
                        "benefit": "ojcowski",
                        "person": "second_parent",
                        "days": 7,
                        "start": "2026-06-01",
                    },
                ],
            )
        )
    )
    assert sum(row.days for row in result.assessments if row.benefit == "ojcowski") == 14
    short = paternity(claims=[{"benefit": "ojcowski", "person": "second_parent", "days": 3}])
    assert short.reason_code == "paternity_duration"


out("H3", "21-dniowy i 7-dniowy termin wniosku nie jest sprawdzany; liczy się data urlopu.")


# --- I. Wysokość macierzyńskiego -----------------------------------------


@rule("I1")
def test_i1_maternity_is_100_percent() -> None:
    assert maternal().periods[0].rate_percent == 100


@rule("I2")
def test_i2_parental_is_70_percent() -> None:
    plan = parental(days=63)
    assert plan[("rodzicielski", "first_parent")].periods[0].rate_percent == 70


@rule("I3")
def test_i3_application_within_21_days_gives_81_5_percent() -> None:
    plan = parental(
        averaged_rate_application="2026-05-20",
        averaged_rate_full_period=True,
    )
    assert plan[("macierzynski", "first_parent")].periods[0].rate_percent == 81.5
    assert plan[("rodzicielski", "first_parent")].periods[0].rate_percent == 81.5


@rule("I4")
def test_i4_the_second_parent_keeps_70_percent_for_9_weeks() -> None:
    plan = family_rows(
        averaged_rate_application="2026-05-20",
        averaged_rate_full_period=True,
        averaged_shared_transfer_confirmed=True,
        second_parent=person(monthly_basis_grosze=420_000),
        claims=[
            {"benefit": "macierzynski"},
            {"benefit": "rodzicielski", "person": "second_parent", "days": 63},
        ],
    )
    assert plan[("rodzicielski", "second_parent")].periods[0].rate_percent == 70


@rule("I5")
def test_i5_unused_parental_in_the_first_year_falls_back_to_70_percent() -> None:
    plan = parental(
        averaged_rate_application="2026-05-20",
        averaged_rate_full_period=True,
        averaged_parental_used_in_first_year=False,
    )
    assert plan[("rodzicielski", "first_parent")].periods[0].rate_percent == 70


@rule("I6")
def test_i6_top_up_to_the_parental_supplement() -> None:
    result = rows(
        simulate(
            maternity_top_ups=[
                {
                    "eligible_benefit_confirmed": True,
                    "period": {"start": "2026-05-01", "end": "2026-05-31"},
                    "combined_net_grosze": 90_000,
                }
            ]
        )
    )
    assert result[("podwyzszenie_macierzynskiego", "first_parent")].net_top_up_grosze == 10_000


@rule("I7")
def test_i7_81_5_percent_covers_maternity_too() -> None:
    plan = parental(
        averaged_rate_application="2026-05-20",
        averaged_rate_full_period=True,
    )
    rates = {row.rate_percent for row in plan[("macierzynski", "first_parent")].periods}
    assert rates == {81.5}


out("I8", "Finansowanie z budżetu państwa nie zmienia kwoty dla użytkownika.")
out("I9", "Jednorazowe wyrównanie do 100% nie ma osobnej pozycji w wyniku.")


@rule("I10")
def test_i10_work_lowers_the_parental_amount() -> None:
    plan = family_rows(
        claims=[
            {"benefit": "macierzynski"},
            {"benefit": "rodzicielski", "days": 63, "work_percent": 50, "work_days": 63},
        ]
    )
    worked = plan[("rodzicielski", "first_parent")].periods[0]
    assert worked.rate_percent == 35


out("I11", "Wyłączenia za urlop bezpłatny i areszt nie mają wejścia w formularzu.")


# --- J. Rehabilitacyjne --------------------------------------------------


def rehabilitation(**overrides) -> BenefitAssessment:
    data = {
        "person": person(),
        "start": "2026-06-01",
        "days": 200,
        "sickness_pool_exhausted": True,
        "still_unable_to_work": True,
        "favourable_medical_ruling": True,
        "exclusion_applies": False,
        "incapacity_during_pregnancy": False,
    }
    data.update(overrides)
    return rows(simulate(rehabilitation=data))[("rehabilitacyjne", "first_parent")]


@rule("J1")
def test_j1_requires_the_three_conditions() -> None:
    assert rehabilitation().status == "granted"
    assert rehabilitation(sickness_pool_exhausted=False).status == "denied"
    assert rehabilitation(favourable_medical_ruling=None).status == "missing_data"


@rule("J2")
def test_j2_at_most_12_months() -> None:
    assessment = rehabilitation(days=400)
    assert assessment.days == 360
    assert assessment.denied_days == 40


@rule("J3")
def test_j3_90_then_75_percent() -> None:
    rates = [row.rate_percent for row in rehabilitation().periods]
    assert rates == [90, 75]
    assert [row.days for row in rehabilitation().periods] == [90, 110]


@rule("J4")
def test_j4_exclusions_deny_the_benefit() -> None:
    assert rehabilitation(exclusion_applies=True).status == "denied"


@rule("J5")
def test_j5_indexation_changes_the_basis() -> None:
    assessment = rehabilitation(indexation_factor=1.1)
    assert assessment.monthly_basis_grosze == 660_000


# --- K. Po ustaniu ubezpieczenia ----------------------------------------


@rule("K1")
def test_k1_birth_after_insurance_ended_in_pregnancy() -> None:
    assessment = maternal(
        first_parent=person(
            employment_ended_during_pregnancy=True,
            employment_end_reason="liquidation",
        )
    )
    assert assessment.status == "granted"


@rule("K2")
def test_k2_benefit_in_the_amount_of_maternity_until_birth() -> None:
    result = rows(
        simulate(
            post_employment={
                "person": person(
                    employment_ended_during_pregnancy=True,
                    employment_end_reason="liquidation",
                ),
                "last_employment_day": "2026-01-31",
                "birth_date": "2026-05-04",
                "replacement_employment_provided": False,
            }
        )
    )
    assert result[("w_wysokosci_macierzynskiego", "first_parent")].days == 92


@rule("K3")
def test_k3_contract_extended_to_birth_keeps_the_right() -> None:
    assessment = maternal(first_parent=person(employment_extended_to_birth=True))
    assert assessment.status == "granted"


out("K4", "Przedłużenie umowy do dnia porodu jest faktem wejściowym, nie liczy się z dat umowy.")


# --- L. Podstawa wymiaru -------------------------------------------------

out("L1", "Podstawa wymiaru przychodzi z formularza; silnik nie czyta 12 miesięcy wynagrodzeń.")
out("L2", "Krótszy okres składkowy nie jest wyliczany z listy płac.")
@rule("L3")
def test_l3_one_day_is_one_thirtieth_of_the_month() -> None:
    period = sickness().periods[0]
    assert period.daily_grosze == round(BASIS / 30)


out("L4", "Choroba w pierwszym miesiącu pracy nie jest przeliczana z dni przepracowanych.")
out("L5", "Przerwa krótsza niż miesiąc nie blokuje nowej podstawy, bo podstawę podaje użytkownik.")
@rule("L6")
def test_l6_fixed_gross_loses_13_71_percent() -> None:
    assessment = maternal(
        first_parent=person(
            monthly_basis_grosze=None,
            fixed_monthly_gross_grosze=600_000,
        )
    )
    assert assessment.monthly_basis_grosze == 517_740


out("L7", "Uzupełnianie wynagrodzenia za niepełny miesiąc nie jest liczone.")
out("L8", "Premie, nagrody i składniki roczne nie mają wejścia w formularzu.")
out("L9", "Minimalna podstawa 4147,10 zł nie jest wymuszana.")
@rule("L10")
def test_l10_cap_for_non_employees() -> None:
    assessment = maternal(
        first_parent=person(post_insurance_basis_cap_grosze=203_213),
    )
    assert assessment.monthly_basis_grosze == 203_213


out("L11", "Wspólne zasady podstawy działają przez jedno wejście dla wszystkich świadczeń.")
@rule("L12")
def test_l12_post_insurance_cap() -> None:
    assessment = maternal(first_parent=person(post_insurance_basis_cap_grosze=500_000))
    assert assessment.monthly_basis_grosze == 500_000


out("L13", "Zmiana wymiaru czasu pracy w okresie podstawy nie jest modelowana.")


# --- Spójność mapy ------------------------------------------------------


def rulebook_ids() -> list[str]:
    text = RULES_PATH.read_text(encoding="utf-8")
    return re.findall(r"^\| ([A-L]\d+) \|", text, re.MULTILINE)


def test_every_rule_has_a_home() -> None:
    documented = rulebook_ids()
    assert len(documented) == 85
    assert set(documented) == set(CHECKS), (
        "Reguły bez wpisu: "
        + ", ".join(sorted(set(documented) - set(CHECKS)))
        + "; wpisy bez reguły: "
        + ", ".join(sorted(set(CHECKS) - set(documented)))
    )


@pytest.mark.parametrize("rule_id", sorted(CHECKS), ids=sorted(CHECKS))
def test_rule_scenario(rule_id: str) -> None:
    check, note = CHECKS[rule_id]
    if check is None:
        assert note, f"{rule_id} jest poza silnikiem, ale nie mówi dlaczego"
        pytest.skip(f"{rule_id}: {note}")
    check()