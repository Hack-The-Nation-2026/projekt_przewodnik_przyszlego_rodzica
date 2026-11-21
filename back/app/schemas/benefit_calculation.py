"""Dane wejściowe i wyniki symulacji świadczeń."""

from datetime import date
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

EventDate = Annotated[date, Field(ge=date(1900, 1, 1), le=date(2199, 12, 31))]
Money = Annotated[int, Field(ge=0, le=1_000_000_000)]
WorkPercent = Annotated[Decimal, Field(ge=0, le=50, decimal_places=2)]
FamilyBenefit = Literal["macierzynski", "uzupelniajacy", "rodzicielski", "ojcowski"]
Parent = Literal["first_parent", "second_parent"]
EndReason = Literal["death", "bankruptcy", "liquidation", "unlawful_court_ruling", "other"]


class SimulationInput(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Span(SimulationInput):
    start: EventDate
    end: EventDate

    @model_validator(mode="after")
    def check_dates(self) -> "Span":
        if self.end < self.start:
            raise ValueError("Koniec okresu poprzedza początek.")
        return self


class Person(SimulationInput):
    employment: Literal["employee", "contractor", "self_employed", "other"] | None = None
    sickness_insured: bool | None = None
    on_childcare_leave: bool = False
    contribution_arrears_above_threshold: bool | None = None
    monthly_basis_grosze: Money | None = None
    fixed_monthly_gross_grosze: Money | None = Field(
        default=None,
        description="Stałe wynagrodzenie stanowiące podstawę przed potrąceniem składek (13,71%).",
    )
    contractual_work_percent: Annotated[Decimal, Field(gt=0, le=100, decimal_places=2)] = Decimal(
        100
    )
    employment_extended_to_birth: bool = False
    employment_ended_during_pregnancy: bool = False
    employment_end_reason: EndReason | None = None
    post_insurance_basis_cap_grosze: Money | None = None


class Child(SimulationInput):
    birth_date: EventDate | None = None
    school_start_deferred: bool = False
    stillborn: bool = False
    death_date: EventDate | None = None
    birth_weight_g: int | None = Field(default=None, gt=0)
    hospital_stays: list[Span] | None = Field(default=None, max_length=30)


class FamilyClaim(SimulationInput):
    person: Parent = "first_parent"
    benefit: FamilyBenefit
    start: EventDate | None = None
    days: int | None = Field(default=None, gt=0, le=1000)
    work_percent: WorkPercent = Decimal(0)
    work_days: int | None = Field(default=None, gt=0, le=1000)
    extension_work_percent: WorkPercent = Decimal(0)

    @model_validator(mode="after")
    def check_work(self) -> "FamilyClaim":
        if self.work_percent or self.work_days or self.extension_work_percent:
            if self.benefit != "rodzicielski" or not self.work_percent:
                raise ValueError("Łączenie pracy dotyczy urlopu rodzicielskiego.")
            if self.days is None or (self.work_days is not None and self.work_days > self.days):
                raise ValueError(
                    "Okres łączenia wymaga podania wymiaru wniosku i musi się w nim mieścić."
                )
        return self


class FamilyPlan(SimulationInput):
    event: Literal["birth", "adoption", "foster_care"] = "birth"
    event_date: EventDate | None = None
    expected_birth_date: EventDate | None = None
    children: list[Child] = Field(default_factory=lambda: [Child()], min_length=1, max_length=12)
    first_parent: Person
    second_parent: Person | None = None
    adoption_proceeding: bool | None = None
    adoption_filing_date: EventDate | None = None
    adoption_order_date: EventDate | None = None
    non_professional_foster_care: bool | None = None
    za_zyciem: bool = False
    pregnancy_weeks_at_birth: int | None = Field(default=None, ge=20, le=45)
    maternity_start: EventDate | None = None
    maternity_transfer: EventDate | None = None
    transfer_care_confirmed: bool | None = None
    shortened_transfer_eligible: bool = False
    paternity_eligible_parent: Parent = "second_parent"
    averaged_rate_application: EventDate | None = None
    averaged_rate_applicant: Parent = "first_parent"
    averaged_rate_full_period: bool = False
    averaged_shared_transfer_confirmed: bool = False
    averaged_parental_used_in_first_year: bool | None = None
    parental_days_already_used: dict[Parent, Annotated[int, Field(ge=0, le=469)]] = Field(
        default_factory=dict
    )
    parental_parts_already_used: int = Field(default=0, ge=0, le=5)
    paternity_days_already_used: int = Field(default=0, ge=0, le=14, multiple_of=7)
    claims: list[FamilyClaim] = Field(min_length=1, max_length=30)


class PregnancySickness(SimulationInput):
    person: Person
    incapacity: Span
    covered_days_before_incapacity: int | None = Field(default=None, ge=0)
    waiting_period_exempt: bool | None = None
    compulsory_insurance: bool | None = None
    sickness_days_used: int | None = Field(default=None, ge=0, le=270)
    birthday: EventDate | None = None
    employer_paid_days_by_year: dict[int, Annotated[int, Field(ge=0, le=33)]] | None = None
    employer_annual_limits_by_year: dict[int, Literal[14, 33]] = Field(default_factory=dict)
    insurance_ended_on: EventDate | None = None
    post_insurance_exclusion_applies: bool | None = None


class Rehabilitation(SimulationInput):
    person: Person
    start: EventDate
    days: int = Field(gt=0, le=730)
    sickness_pool_exhausted: bool | None = None
    still_unable_to_work: bool | None = None
    favourable_medical_ruling: bool | None = None
    exclusion_applies: bool | None = None
    eligible_after_insurance_ended: bool | None = None
    incapacity_during_pregnancy: bool
    indexation_factor: Decimal | None = Field(default=None, ge=1, le=10, decimal_places=5)


class PostEmployment(SimulationInput):
    person: Person
    last_employment_day: EventDate | None = None
    birth_date: EventDate | None = None
    replacement_employment_provided: bool | None = None


class MaternityTopUp(SimulationInput):
    person: Parent = "first_parent"
    eligible_benefit_confirmed: bool | None = None
    period: Span
    combined_net_grosze: Money | None = None

    @model_validator(mode="after")
    def check_month(self) -> "MaternityTopUp":
        start, end = self.period.start, self.period.end
        if (start.year, start.month) != (end.year, end.month):
            raise ValueError("Podwyższenie oblicza się odrębnie dla każdego miesiąca.")
        return self


class BenefitSimulation(SimulationInput):
    family: FamilyPlan | None = None
    pregnancy_sickness: PregnancySickness | None = None
    rehabilitation: Rehabilitation | None = None
    post_employment: PostEmployment | None = None
    maternity_top_ups: list[MaternityTopUp] = Field(default_factory=list, max_length=24)

    @model_validator(mode="after")
    def check_sections(self) -> "BenefitSimulation":
        if not any(
            (
                self.family,
                self.pregnancy_sickness,
                self.rehabilitation,
                self.post_employment,
                self.maternity_top_ups,
            )
        ):
            raise ValueError("Wybierz co najmniej jeden rodzaj symulacji.")
        periods = {
            (item.person, item.period.start.year, item.period.start.month)
            for item in self.maternity_top_ups
        }
        if len(periods) != len(self.maternity_top_ups):
            raise ValueError("Podaj jedno rozliczenie podwyższenia na osobę i miesiąc.")
        return self


class PaymentPeriod(BaseModel):
    kind: str
    start: date
    end: date
    days: int
    rate_percent: Decimal
    daily_grosze: int | None
    gross_grosze: int | None


class BenefitAssessment(BaseModel):
    benefit: str
    person: Parent = "first_parent"
    status: Literal["granted", "denied", "partially_granted", "missing_data"]
    reason_code: str
    reason: str
    rule_ids: list[str] = Field(default_factory=list)
    days: int = 0
    denied_days: int = 0
    base_days_used: int | None = None
    monthly_basis_grosze: int | None = None
    gross_grosze: int | None = None
    net_top_up_grosze: int | None = None
    periods: list[PaymentPeriod] = Field(default_factory=list)


class FamilyPool(BaseModel):
    total_days: int
    exclusive_days_per_parent: int = 63
    remaining_shared_days: int
    remaining_days_by_parent: dict[Parent, int]


class SimulationResult(BaseModel):
    assessments: list[BenefitAssessment]
    parental_pool: FamilyPool | None = None
