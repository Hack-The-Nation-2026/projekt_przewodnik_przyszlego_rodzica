"""Symulacja danych z ZUS: ubezpieczenie, składki, e-ZLA, PUE i akta urodzenia.

Wszystko jest udawane, ale kształty odpowiedzi są takie jak w prawdziwym ZUS,
żeby frontend nie zależał od zmyślonych struktur. Daty liczymy od dnia, na który
sprawdzamy stan (domyślnie dziś), a kwoty z podstawy wymiaru podanej w żądaniu.
"""
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, StringConstraints
from typing import Annotated

CopyType = Literal["zupelny", "skrocony"]
EzlaKind = Literal["chorobowe", "opieka"]

ShortText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]


class SimulationQuery(BaseModel):
    """Co pokazać w symulacji: osoba ubezpieczona albo nie, z długiem albo bez."""

    insured: bool = Field(default=True, description="Czy osoba ma tytuł ubezpieczenia")
    with_debt: bool = Field(default=False, description="Czy pokazać zaległość ze składek")
    as_of: date | None = Field(default=None, description="Dzień, na który liczymy stan")
    monthly_basis_grosze: int = Field(default=800_000, ge=0, le=10_000_000)


class DebtItem(BaseModel):
    period: str = Field(description="Miesiąc, którego dotyczy składka")
    title: str = Field(description="Czego dotyczy należność")
    amount_grosze: int


class ContributionDebt(BaseModel):
    as_of: date
    has_debt: bool
    total_grosze: int
    items: list[DebtItem]
    effect: str = Field(description="Co zaległość zmienia w wypłacie zasiłku")


class InsuranceStatus(BaseModel):
    insured: bool
    payer: str
    title_code: str
    title_name: str
    covered_since: date | None
    last_contribution: date | None
    note: str


class ZusProfile(BaseModel):
    as_of: date
    insurance: InsuranceStatus
    debt: ContributionDebt


class EzlaCertificate(BaseModel):
    document_id: str
    issued_at: date
    doctor: str
    diagnosis_code: str
    kind: EzlaKind
    label: str
    period_from: date
    period_to: date
    days: int
    basis_grosze: int
    status: str


class PueRequest(BaseModel):
    insured: bool = True
    person: str = Field(default="Osoba ubezpieczona", description="Kogo dotyczy wgląd w konto")


class InsurancePeriod(BaseModel):
    from_date: date
    to_date: date | None
    payer: str
    title_name: str


class PueSession(BaseModel):
    connected_at: datetime
    valid_minutes: int
    person: str
    periods: list[InsurancePeriod]
    document_count: int
    last_document: date | None
    note: str


class BirthCertificateRequest(BaseModel):
    copy_type: CopyType = Field(default="skrocony", description="Odpis zupełny albo skrócony")
    office: str = Field(default="Urząd stanu cywilnego", max_length=120)
    child_name: ShortText


class BirthCertificateOrder(BaseModel):
    number: str
    copy_type: CopyType
    office: str
    child_name: str
    ready_from: date
    note: str


class ZusLink(BaseModel):
    label: str
    url: str
    description: str