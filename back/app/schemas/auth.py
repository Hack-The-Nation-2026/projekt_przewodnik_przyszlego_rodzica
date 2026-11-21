"""Modele wejścia do aplikacji: symulowany mObywatel i ręczne wpisanie danych.

Prawdziwy mObywatel oddaje dane przez login.gov.pl i OAuth, więc na hackathonie
zostaje symulacja: te same kształty żądań i odpowiedzi, własny zestaw kont.
Ręczne wpisanie danych jest dla osób, które nie chcą albo nie mogą się zalogować.
"""
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

# Spacje obcinamy przed sprawdzeniem długości, żeby same spacje nie przeszły jako imię.
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]
OptionalNote = Annotated[str, StringConstraints(strip_whitespace=True, max_length=140)]


class MobywatelLogin(BaseModel):
    identifier: str = Field(description="Login albo PESEL")
    password: str = Field(description="Hasło do konta demonstracyjnego")


class ManualEntry(BaseModel):
    """Dane wpisane z ręki.

    Numer PESEL sprawdzamy tylko po długości i cyfrach. Sumy kontrolnej nie liczymy,
    bo demo ma nie blokować osoby, która podaje numer przykładowy.
    """

    first_name: Name = Field(description="Imię")
    last_name: Name = Field(description="Nazwisko")
    pesel: str = Field(pattern=r"^\d{11}$", description="PESEL, 11 cyfr")
    case_label: OptionalNote = Field(default="", description="Krótki opis sytuacji, opcjonalny")


class Citizen(BaseModel):
    pesel: str = Field(description="PESEL obywatela")
    first_name: str = Field(description="Imię")
    last_name: str = Field(description="Nazwisko (w demie tylko inicjał)")
    case_code: str = Field(description="Techniczny kod sprawy")
    case_label: str = Field(description="Opis sprawy widoczny dla użytkownika")
    status: str = Field(description="Etykieta statusu sprawy do pokazania w interfejsie")
    source: str = Field(
        default="mobywatel",
        description="Skąd przyszły dane: mobywatel albo manual",
    )


class DemoAccount(BaseModel):
    identifier: str = Field(description="Login konta demonstracyjnego")
    password: str = Field(description="Hasło konta demonstracyjnego")
    citizen: Citizen
