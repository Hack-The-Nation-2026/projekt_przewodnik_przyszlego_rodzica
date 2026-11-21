"""Profil obywatela zbudowany z danych wpisanych ręcznie.

Osoba, która nie chce logować się przez mObywatel, podaje imię, nazwisko i PESEL.
Nie mamy wtedy żadnej sprawy z ZUS, więc profil dostaje własny kod i status, a opis
sytuacji, jeśli został podany, jedzie jako etykieta sprawy. Nic nie udajemy ponad to.
"""
from app.schemas.auth import Citizen, ManualEntry

MANUAL_CASE_CODE = "WPISANE-RECZNIE"
MANUAL_STATUS = "brak danych z ZUS"
DEFAULT_CASE_LABEL = "Sytuacja opisana ręcznie"


def build_citizen(entry: ManualEntry) -> Citizen:
    """Składa profil z tego, co osoba wpisała. Schemat już obciął spacje."""
    return Citizen(
        pesel=entry.pesel,
        first_name=entry.first_name,
        last_name=entry.last_name,
        case_code=MANUAL_CASE_CODE,
        case_label=entry.case_label or DEFAULT_CASE_LABEL,
        status=MANUAL_STATUS,
        source="manual",
    )
