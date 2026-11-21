"""Modele odpowiedzi API."""
from pydantic import BaseModel, Field


class BenefitSummary(BaseModel):
    code: str = Field(description="Techniczny identyfikator świadczenia")
    name: str = Field(description="Nazwa świadczenia widoczna dla użytkownika")
    description: str = Field(description="Krótki opis jednym zdaniem")
