"""Rozpoznawanie zestawów przykładowych ZUS po odcisku pliku.

Regulamin zadania nie pozwala rozpowszechniać udostępnionych dokumentów, więc w kodzie
leży tylko to, co potrzebne do rozpoznania i pokazania sprawy: nazwa pliku, odcisk
SHA-256, rodzaj świadczeń, wzory formularzy i wynik zapisany na okładce zestawu.
"""

from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.cases import Applicant

Outcome = Literal["granted", "denied", "partially_granted", "unknown"]


class ZusSample(BaseModel):
    """Jedna sprawa z zestawu przykładowego."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(pattern=r"^ZUS-\d{3}$")
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    file_name: str = Field(min_length=1, max_length=200)
    pages: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=160)
    facts: str = Field(min_length=1, max_length=600)
    outcome: Outcome
    evidence: str = Field(default="", max_length=400)
    benefits: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    forms: list[str] = Field(default_factory=list)
    role: Literal["mother", "father"] | None = None
    applicant: Applicant
    duplicate_of: str | None = None


class ZusSampleSummary(BaseModel):
    """To, co widać na liście wyboru, bez odcisku pliku."""

    id: str
    title: str
    facts: str
    outcome: Outcome
    forms: list[str]
    tags: list[str]
    file_name: str
    duplicate_of: str | None = None


class ZusRecognition(BaseModel):
    """Wynik dopasowania wgranego PDF-a do zestawu."""

    sha256: str
    matched: bool
    sample: ZusSample | None = None
    hint: str


class DigestRequest(BaseModel):
    """Odcisk liczy przeglądarka, więc sam dokument nie opuszcza urządzenia.

    `file_name` jest tylko zapasem: gdy ktoś zapisał plik ponownie i odcisk się zmienił,
    rozpoznajemy sprawę po nazwie i mówimy o tym wprost.
    """

    model_config = ConfigDict(extra="forbid")

    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    file_name: str | None = Field(default=None, max_length=200)