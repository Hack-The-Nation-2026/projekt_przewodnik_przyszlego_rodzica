"""Parametry kalkulatora i przełączniki funkcji, zmieniane z panelu administracyjnego."""

from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

Percent = Annotated[Decimal, Field(gt=0, le=100, decimal_places=2)]
Weeks = Annotated[int, Field(ge=1, le=104)]


class RateSettings(BaseModel):
    """Stopy procentowe, od których zależą kwoty w kalkulatorze."""

    model_config = ConfigDict(extra="forbid")

    maternity: Percent = Decimal("100")
    averaged: Percent = Decimal("81.5")
    parental: Percent = Decimal("70")

    @field_serializer("maternity", "averaged", "parental")
    def as_number(self, value: Decimal) -> float:
        """Frontend dostaje liczby, nie napisy, żeby mógł ich użyć w formatowaniu."""
        return float(value)


class LeaveSettings(BaseModel):
    """Wymiary urlopów w tygodniach."""

    model_config = ConfigDict(extra="forbid")

    maternity_weeks_by_child_count: list[Weeks] = Field(
        default=[20, 31, 33, 35, 37],
        description="Wymiar macierzyńskiego dla 1, 2, 3, 4 i 5 lub więcej dzieci.",
    )
    parental_weeks_single: Weeks = 41
    parental_weeks_multiple: Weeks = 43
    za_zyciem_extra_weeks: Annotated[int, Field(ge=0, le=104)] = 24
    exclusive_weeks: Annotated[int, Field(ge=0, le=52)] = 9

    @field_validator("maternity_weeks_by_child_count")
    @classmethod
    def check_child_count(cls, value: list[int]) -> list[int]:
        if len(value) != 5:
            raise ValueError("Podaj wymiar dla 1, 2, 3, 4 i 5 lub więcej dzieci.")
        return value


class FeatureFlag(BaseModel):
    """Pojedyncza funkcja serwisu, którą można wyłączyć bez wdrożenia."""

    model_config = ConfigDict(extra="forbid")

    key: str = Field(min_length=1, max_length=40, pattern=r"^[a-z][a-z0-9_]*$")
    label: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=200)
    enabled: bool = True


DEFAULT_FEATURES: list[FeatureFlag] = [
    FeatureFlag(
        key="zus_simulations",
        label="System ZUS",
        description="Ekran z ubezpieczeniem, zadłużeniem, e-ZLA i PUE/eZUS.",
    ),
    FeatureFlag(
        key="parental_plan",
        label="Podział urlopu rodzicielskiego",
        description="Karta z suwakiem wspólnych tygodni w wynikach kalkulatora.",
    ),
    FeatureFlag(
        key="risk_warnings",
        label="Ostrzeżenia o ryzykach",
        description="Sekcja „Co może zmienić wypłatę” w wynikach kalkulatora.",
    ),
]


class AppSettings(BaseModel):
    """Cały zestaw parametrów razem z datą ostatniej zmiany."""

    model_config = ConfigDict(extra="forbid")

    rates: RateSettings = Field(default_factory=RateSettings)
    leave: LeaveSettings = Field(default_factory=LeaveSettings)
    features: list[FeatureFlag] = Field(
        default_factory=lambda: [flag.model_copy() for flag in DEFAULT_FEATURES]
    )
    updated_at: datetime | None = None

    @field_validator("features")
    @classmethod
    def check_unique_keys(cls, value: list[FeatureFlag]) -> list[FeatureFlag]:
        keys = [flag.key for flag in value]
        if len(keys) != len(set(keys)):
            raise ValueError("Klucze funkcji muszą być unikalne.")
        return value


def default_settings() -> AppSettings:
    return AppSettings()