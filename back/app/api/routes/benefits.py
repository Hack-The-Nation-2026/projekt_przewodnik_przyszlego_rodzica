"""Katalog świadczeń i symulacja uprawnień."""

from fastapi import APIRouter

from app.schemas.benefit import BenefitSummary
from app.schemas.benefit_calculation import BenefitSimulation, SimulationResult
from app.services.benefit_service import calculate_benefits

router = APIRouter(prefix="/benefits", tags=["benefits"])

# Twarda lista na start, żeby frontend miał z czym pracować.
_BENEFITS: list[BenefitSummary] = [
    BenefitSummary(
        code="chorobowy",
        name="Zasiłek chorobowy",
        description="Świadczenie za czas niezdolności do pracy, w tym w okresie ciąży.",
    ),
    BenefitSummary(
        code="macierzynski",
        name="Zasiłek macierzyński",
        description="Świadczenie za okres urlopu macierzyńskiego, rodzicielskiego i ojcowskiego.",
    ),
    BenefitSummary(
        code="rehabilitacyjne",
        name="Świadczenie rehabilitacyjne",
        description="Wsparcie po wyczerpaniu zasiłku chorobowego, gdy rokowania są pomyślne.",
    ),
]


@router.get("", response_model=list[BenefitSummary])
def list_benefits() -> list[BenefitSummary]:
    return _BENEFITS


@router.post("/simulate", response_model=SimulationResult)
def simulate_benefits(request: BenefitSimulation) -> SimulationResult:
    return calculate_benefits(request)
