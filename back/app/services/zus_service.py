"""Udawane dane z ZUS, liczone na dzień podany w żądaniu.

Nic nie jest tu prawdziwe i interfejs mówi o tym wprost. Chodzi o to, żeby każda
symulacja z briefu miała konkretny ekran z sensownymi wartościami: stan
ubezpieczenia, zadłużenie ze składek, e-ZLA, wgląd w PUE oraz wniosek o odpis
aktu urodzenia. Daty są przesuwane razem z dniem sprawdzenia, więc demo zawsze
wygląda aktualnie, a kwoty biorą się z podanej podstawy wymiaru.
"""
from __future__ import annotations

import zlib
from datetime import date, datetime, timedelta, timezone

from app.schemas.zus import (
    BirthCertificateOrder,
    BirthCertificateRequest,
    ContributionDebt,
    CopyType,
    DebtItem,
    EzlaCertificate,
    InsurancePeriod,
    InsuranceStatus,
    PueSession,
    SimulationQuery,
    ZusLink,
    ZusProfile,
)

# Składki społeczne pracownika: emerytalna 9,76%, rentowa 1,5%, chorobowa 2,45%.
EMPLOYEE_CONTRIBUTION_RATE = 0.1371
# Podstawa wymiaru zasiłku to podstawa składek pomniejszona o te 13,71%.
BENEFIT_BASIS_RATE = 1 - EMPLOYEE_CONTRIBUTION_RATE

MONTHS = (
    "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
    "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
)

LINKS = (
    ZusLink(
        label="Zakład Ubezpieczeń Społecznych",
        url="https://www.zus.pl",
        description="Wnioski, formularze i informacje o zasiłkach.",
    ),
    ZusLink(
        label="Ministerstwo Rodziny, Pracy i Polityki Społecznej",
        url="https://www.gov.pl/web/rodzina",
        description="Przepisy o urlopach i świadczeniach dla rodziców.",
    ),
    ZusLink(
        label="Państwowa Inspekcja Pracy",
        url="https://www.pip.gov.pl",
        description="Prawa pracownika i ochrona zatrudnienia w ciąży.",
    ),
)


def _today() -> date:
    return datetime.now(timezone.utc).date()


def _month_label(day: date) -> str:
    return f"{MONTHS[day.month - 1]} {day.year}"


def _shift_back(day: date, days: int) -> date:
    return day - timedelta(days=days)


def _first_day_of_previous_month(day: date, months_back: int) -> date:
    month = day.month - months_back
    year = day.year
    while month <= 0:
        month += 12
        year -= 1
    return date(year, month, 1)


def build_profile(query: SimulationQuery) -> ZusProfile:
    as_of = query.as_of or _today()
    basis = query.monthly_basis_grosze

    if query.insured:
        insurance = InsuranceStatus(
            insured=True,
            payer="Pracodawca z Twojej umowy o pracę",
            title_code="0110",
            title_name="osoba wykonująca pracę na podstawie umowy o pracę",
            covered_since=date(as_of.year - 2, 1, 1),
            last_contribution=_first_day_of_previous_month(as_of, 1),
            note="Składka chorobowa jest odprowadzana co miesiąc, więc prawo do zasiłku jest.",
        )
    else:
        insurance = InsuranceStatus(
            insured=False,
            payer="Brak płatnika składek",
            title_code="brak",
            title_name="brak tytułu do ubezpieczenia chorobowego",
            covered_since=None,
            last_contribution=None,
            note="Bez ubezpieczenia chorobowego ZUS nie wypłaci zasiłku, choćby umowa nadal trwała.",
        )

    debt = _build_debt(as_of, basis, with_debt=query.with_debt and query.insured)
    return ZusProfile(as_of=as_of, insurance=insurance, debt=debt)


def _build_debt(as_of: date, basis_grosze: int, *, with_debt: bool) -> ContributionDebt:
    if not with_debt:
        return ContributionDebt(
            as_of=as_of,
            has_debt=False,
            total_grosze=0,
            items=[],
            effect="Brak zaległości, więc wypłata zasiłku niczym nie jest zagrożona.",
        )

    amount = round(basis_grosze * EMPLOYEE_CONTRIBUTION_RATE)
    items = [
        DebtItem(
            period=_month_label(_first_day_of_previous_month(as_of, back)),
            title="Składki społeczne pracownika",
            amount_grosze=amount,
        )
        for back in (1, 2)
    ]
    return ContributionDebt(
        as_of=as_of,
        has_debt=True,
        total_grosze=sum(item.amount_grosze for item in items),
        items=items,
        effect=(
            "Zaległość obciąża płatnika, nie Ciebie. W symulacji kwota zasiłku się nie zmienia, "
            "ale ZUS może dochodzić składki od pracodawcy."
        ),
    )


def build_ezla(query: SimulationQuery) -> list[EzlaCertificate]:
    as_of = query.as_of or _today()
    basis = query.monthly_basis_grosze
    benefit_basis = round(basis * BENEFIT_BASIS_RATE)

    if not query.insured:
        return []

    sickness_from = _shift_back(as_of, 20)
    sickness_to = _shift_back(as_of, 1)
    care_from = _shift_back(as_of, 47)
    care_to = _shift_back(as_of, 43)

    return [
        EzlaCertificate(
            document_id=f"ZLA/{sickness_from.year}/{sickness_from:%m}{sickness_from:%d}",
            issued_at=sickness_from,
            doctor="lek. Anna Nowak",
            diagnosis_code="O26.8",
            kind="chorobowe",
            label="Niezdolność do pracy w okresie ciąży",
            period_from=sickness_from,
            period_to=sickness_to,
            days=(sickness_to - sickness_from).days + 1,
            basis_grosze=benefit_basis,
            status="Wystawione i przekazane do ZUS",
        ),
        EzlaCertificate(
            document_id=f"ZLA/{care_from.year}/{care_from:%m}{care_from:%d}",
            issued_at=care_from,
            doctor="lek. Piotr Zieliński",
            diagnosis_code="Z76.0",
            kind="opieka",
            label="Opieka nad chorym dzieckiem",
            period_from=care_from,
            period_to=care_to,
            days=(care_to - care_from).days + 1,
            basis_grosze=benefit_basis,
            status="Wystawione, czeka na wypłatę",
        ),
    ]


def connect_pue(query: PueRequest) -> PueSession:
    now = datetime.now(timezone.utc)
    as_of = now.date()

    if query.insured:
        periods = [
            InsurancePeriod(
                from_date=date(as_of.year - 2, 1, 1),
                to_date=None,
                payer="Pracodawca z Twojej umowy o pracę",
                title_name="umowa o pracę",
            ),
            InsurancePeriod(
                from_date=date(as_of.year - 4, 4, 1),
                to_date=date(as_of.year - 2, 1, 1),
                payer="Poprzedni pracodawca",
                title_name="umowa o pracę",
            ),
        ]
        documents = 7
    else:
        periods = []
        documents = 0

    return PueSession(
        connected_at=now,
        valid_minutes=15,
        person=query.person,
        periods=periods,
        document_count=documents,
        last_document=_shift_back(as_of, 6) if documents else None,
        note=(
            "To symulacja wglądu w konto PUE/eZUS. W prawdziwym systemie logujesz się tam "
            "przez login.gov.pl."
        ),
    )


def order_birth_certificate(request: BirthCertificateRequest) -> BirthCertificateOrder:
    today = _today()
    seed = f"{request.child_name}|{request.copy_type}|{request.office}".encode("utf-8")
    number = f"USC/{today.year}/{zlib.crc32(seed) % 9000 + 1000}"
    label: str = "zupełny" if request.copy_type == "zupelny" else "skrócony"
    return BirthCertificateOrder(
        number=number,
        copy_type=request.copy_type,
        office=request.office or "Urząd stanu cywilnego",
        child_name=request.child_name,
        ready_from=today + timedelta(days=14),
        note=(
            f"Wniosek o odpis {label} przyjęty w symulacji. W urzędzie załatwisz to osobiście "
            "albo przez e-urząd."
        ),
    )


def list_links() -> list[ZusLink]:
    return list(LINKS)


__all__ = [
    "build_ezla",
    "build_profile",
    "connect_pue",
    "list_links",
    "order_birth_certificate",
    "CopyType",
]