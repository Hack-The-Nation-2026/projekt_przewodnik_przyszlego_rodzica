"""Odczyt lokalnego zestawu referencyjnego ZUS z kroku 1."""

from datetime import date
from pathlib import Path
from typing import Annotated, Literal

from pydantic import BaseModel, Field, model_validator

DEFAULT_PATH = Path(__file__).resolve().parents[2] / "PRZYKLADY" / "zestaw-testowy.json"

CaseId = Annotated[str, Field(pattern=r"^ZUS-\d{3}$")]
PageNumber = Annotated[int, Field(ge=1)]


class CatalogEntry(BaseModel):
    id: CaseId
    filename: str
    pages: PageNumber
    tags: list[str] = Field(min_length=1)
    duplicate_of: CaseId | None = None


class Money(BaseModel):
    grosze: int = Field(ge=0)
    origin: Literal["document", "derived"]
    description: str
    pages: list[PageNumber] = Field(min_length=1)


class Period(BaseModel):
    kind: str
    start: date
    end: date
    origin: Literal["outcome", "application", "derived"]

    @model_validator(mode="after")
    def check_dates(self) -> "Period":
        if self.end < self.start:
            raise ValueError("Koniec okresu poprzedza jego początek")
        return self


class Outcome(BaseModel):
    status: Literal["granted", "denied", "partially_granted"]
    reason: str
    periods: list[Period]
    amount: Money | None


class CaseInputs(BaseModel):
    employment: Literal["employee", "contractor", "self_employed"] | None = None
    sickness_insured: bool | None = None
    birth_date: date | None = None
    stillbirth: bool | None = None
    planned_periods: list[Period] = Field(default_factory=list)
    part_time_percent: int | None = Field(default=None, ge=0, le=100)
    adoption_proceeding: bool | None = None
    non_professional_foster_care: bool | None = None
    employment_extended_to_birth: bool | None = None
    employer_liquidated: bool | None = None
    contribution_arrears_above_threshold: bool | None = None
    missing_documents_supplied_on_appeal: bool | None = None
    requested_days: int | None = Field(default=None, gt=0)


class ReferenceCase(BaseModel):
    id: CaseId
    facts: str
    pages: list[PageNumber] = Field(min_length=1)
    inputs: CaseInputs
    basis: Money | None
    expected: Outcome
    note: str | None = None


class CaseSet(BaseModel):
    version: Literal[1]
    catalog: list[CatalogEntry] = Field(min_length=1)
    cases: list[ReferenceCase] = Field(min_length=1)

    @model_validator(mode="after")
    def check_references(self) -> "CaseSet":
        catalog = {entry.id: entry for entry in self.catalog}
        case_ids = {case.id for case in self.cases}
        if len(catalog) != len(self.catalog) or len(case_ids) != len(self.cases):
            raise ValueError("Powtórzony identyfikator sprawy")
        for entry in self.catalog:
            if entry.duplicate_of is not None:
                original = catalog.get(entry.duplicate_of)
                if original is None or original.duplicate_of is not None:
                    raise ValueError(f"{entry.id}: niewłaściwe odwołanie do oryginału")
        for case in self.cases:
            entry = catalog.get(case.id)
            if entry is None or entry.duplicate_of:
                raise ValueError(f"{case.id}: brak oryginału w katalogu")
            source_pages = set(case.pages)
            for money in (case.basis, case.expected.amount):
                if money is not None:
                    source_pages.update(money.pages)
            if max(source_pages) > entry.pages:
                raise ValueError(f"{case.id}: odwołanie poza zakresem PDF")
        return self


def load_case_set(path: Path = DEFAULT_PATH) -> CaseSet:
    return CaseSet.model_validate_json(path.read_bytes())
