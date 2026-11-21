"""Wnioski i sprawy: dane wejściowe, weryfikacja ubezpieczenia i wynik porównania."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.benefit_calculation import BenefitAssessment, BenefitSimulation, Parent

Employment = Literal["employee", "contractor", "self_employed", "none"]
InsuranceKind = Literal["compulsory", "voluntary"]


class Applicant(BaseModel):
    """To, co wniosek mówi o osobie ubiegającej się o świadczenie."""

    model_config = ConfigDict(extra="forbid")

    label: str = Field(min_length=1, max_length=80)
    employment: Employment
    insured: bool | None = None
    insurance_kind: InsuranceKind | None = None
    insured_days: int | None = Field(default=None, ge=0, le=20000)
    first_time_insured: bool = False
    contribution_arrears: bool | None = None
    employment_ended_in_pregnancy: bool = False
    employment_end_reason: Literal["death", "bankruptcy", "liquidation", "other"] | None = None


class ExpectedRow(BaseModel):
    """Czego oczekujemy na podstawie decyzji albo przepisu."""

    model_config = ConfigDict(extra="forbid")

    benefit: str
    person: Parent = "first_parent"
    status: Literal["granted", "denied", "partially_granted", "missing_data"]
    gross_grosze: int | None = None


class CaseApplication(BaseModel):
    """Jeden wniosek: fakty, gotowe wejście kalkulatora i oczekiwany wynik."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(pattern=r"^[A-Z0-9-]{3,24}$")
    title: str = Field(min_length=1, max_length=120)
    facts: str = Field(min_length=1, max_length=600)
    applicant: Applicant
    request: BenefitSimulation
    expected: list[ExpectedRow] = Field(default_factory=list)


class InsuranceCheck(BaseModel):
    """Czy osoba z wniosku podlega ubezpieczeniu i na jakiej podstawie."""

    covered: bool | None
    reason: str
    rule_ids: list[str]


class ComparisonRow(BaseModel):
    benefit: str
    person: Parent
    status: str
    gross_grosze: int | None
    expected_status: str
    expected_gross_grosze: int | None
    matches: bool


class CaseResult(BaseModel):
    case_id: str
    title: str
    facts: str
    applicant: Applicant
    insurance: InsuranceCheck
    assessments: list[BenefitAssessment]
    comparison: list[ComparisonRow]
    matches: bool | None


class CaseSummary(BaseModel):
    id: str
    title: str
    facts: str
    applicant_label: str
    expected: list[ExpectedRow]


class UploadError(BaseModel):
    detail: str
    supported: list[str]