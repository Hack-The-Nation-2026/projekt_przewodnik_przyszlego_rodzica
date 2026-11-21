"""Modele logowania przez mObywatel.

Prawdziwy mObywatel oddaje dane przez login.gov.pl i OAuth, więc na hackathonie
zostaje symulacja: te same kształty żądań i odpowiedzi, własny zestaw kont.
"""
from pydantic import BaseModel, Field


class MobywatelLogin(BaseModel):
    identifier: str = Field(description="Login albo PESEL")
    password: str = Field(description="Hasło do konta demonstracyjnego")


class Citizen(BaseModel):
    pesel: str = Field(description="PESEL obywatela")
    first_name: str = Field(description="Imię")
    last_name: str = Field(description="Nazwisko (w demie tylko inicjał)")
    case_code: str = Field(description="Techniczny kod sprawy")
    case_label: str = Field(description="Opis sprawy widoczny dla użytkownika")
    status: str = Field(description="Etykieta statusu sprawy do pokazania w interfejsie")


class DemoAccount(BaseModel):
    identifier: str = Field(description="Login konta demonstracyjnego")
    password: str = Field(description="Hasło konta demonstracyjnego")
    citizen: Citizen
