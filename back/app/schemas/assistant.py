"""Wejście i wyjście asystenta nawigacyjnego. Tylko pytanie i linki, bez danych osobowych."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AssistantLink(BaseModel):
    """Miejsce, do którego asystent odsyła: podstrona serwisu albo strona instytucji."""

    label: str
    href: str
    kind: Literal["page", "external"]
    description: str | None = None


class AssistantTopic(BaseModel):
    """Gotowe pytanie, które można kliknąć zamiast pisać własne."""

    id: str
    question: str


class AssistantQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: str = Field(min_length=2, max_length=300)


class AssistantAnswer(BaseModel):
    """Odpowiedź nawigacyjna: co powiedzieć i gdzie odesłać."""

    topic: str | None
    answer: str
    links: list[AssistantLink]
    suggestions: list[AssistantTopic] = Field(default_factory=list)
