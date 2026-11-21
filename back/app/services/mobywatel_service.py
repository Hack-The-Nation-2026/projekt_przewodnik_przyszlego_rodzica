"""Konta demonstracyjne stojące za symulowanym logowaniem mObywatela.

Każde konto to inna osoba i inna sprawa, żeby po powrocie do aplikacji było widać,
że dane naprawdę zależą od tego, kto się zalogował.

Sprawy odpowiadają przykładowym przypadkom, które ZUS udostępnił do testowania.
W kodzie zostają tylko imię, inicjał i opis sprawy; same dokumenty są poza
repozytorium, bo Regulamin nie pozwala ich rozpowszechniać.
"""
from app.schemas.auth import Citizen, DemoAccount

# Jedno hasło dla wszystkich kont, żeby dało się je zapamiętać przy demie.
DEMO_PASSWORD = "demo1234"

_ACCOUNTS: tuple[DemoAccount, ...] = (
    DemoAccount(
        identifier="anna.k",
        password=DEMO_PASSWORD,
        citizen=Citizen(
            pesel="90010112345",
            first_name="Anna",
            last_name="K.",
            case_code="ZAS-CHOROBOWY",
            case_label="Zasiłek chorobowy w ciąży",
            status="przyznane",
        ),
    ),
    DemoAccount(
        identifier="justyna.t",
        password=DEMO_PASSWORD,
        citizen=Citizen(
            pesel="88050554321",
            first_name="Justyna",
            last_name="T.",
            case_code="ZAS-MAC-BLIZNIAKI",
            case_label="Zasiłek macierzyński przy bliźniętach i wcześniakach",
            status="sprawa skomplikowana",
        ),
    ),
    DemoAccount(
        identifier="tomasz.p",
        password=DEMO_PASSWORD,
        citizen=Citizen(
            pesel="85121267890",
            first_name="Tomasz",
            last_name="P.",
            case_code="URLOP-RODZICIELSKI-OJCIEC",
            case_label="Urlop rodzicielski ojca, odmowa za szóstą część",
            status="odmowa",
        ),
    ),
    DemoAccount(
        identifier="krystyna.z",
        password=DEMO_PASSWORD,
        citizen=Citizen(
            pesel="92030398765",
            first_name="Krystyna",
            last_name="Z.",
            case_code="UMOWA-DLA-POZORU",
            case_label="Umowa dla pozoru, odmowa zasiłku macierzyńskiego",
            status="odmowa",
        ),
    ),
)


def list_demo_accounts() -> list[DemoAccount]:
    """Konta do podpowiedzi w interfejsie. Tylko do pokazywania w trybie deweloperskim."""
    return list(_ACCOUNTS)


def authenticate(identifier: str, password: str) -> Citizen | None:
    """Sprawdza login i hasło, zwraca dane obywatela albo nic.

    Login można podać jako identyfikator konta albo jako PESEL.
    """
    wanted = identifier.strip().lower()
    for account in _ACCOUNTS:
        matches = wanted in (account.identifier, account.citizen.pesel)
        if matches and password == account.password:
            return account.citizen
    return None
