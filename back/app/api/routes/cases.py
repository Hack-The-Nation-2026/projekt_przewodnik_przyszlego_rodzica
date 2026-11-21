"""Sprawy demonstracyjne i porównanie kalkulatora z decyzją."""

from fastapi import APIRouter, HTTPException

from app.schemas.cases import CaseApplication, CaseResult, CaseSummary
from app.services.case_service import case_summaries, find_case, simulate_case
from app.services.settings_store import load_settings

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("", response_model=list[CaseSummary])
def list_cases() -> list[CaseSummary]:
    """Wnioski do wyboru na stronie. Numery i treść są demonstracyjne."""
    return case_summaries()


@router.get("/{case_id}/application", response_model=CaseApplication)
def read_application(case_id: str) -> CaseApplication:
    """Wniosek w formacie do pobrania, żeby można go było zmienić i wgrać z powrotem."""
    case = find_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Nie ma takiej sprawy w zestawie.")
    return case


@router.get("/{case_id}", response_model=CaseResult)
def read_case(case_id: str) -> CaseResult:
    case = find_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Nie ma takiej sprawy w zestawie.")
    return simulate_case(case, load_settings())


@router.post("/simulate", response_model=CaseResult)
def simulate(case: CaseApplication) -> CaseResult:
    """Liczy dowolny wniosek w tym samym formacie, także wgrany z pliku."""
    return simulate_case(case, load_settings())