"""System ZUS: dane o ubezpieczeniu, składki, e-ZLA, PUE i akta urodzenia."""

from fastapi import APIRouter

from app.schemas.zus import (
    BirthCertificateOrder,
    BirthCertificateRequest,
    EzlaCertificate,
    PueRequest,
    PueSession,
    SimulationQuery,
    ZusLink,
    ZusProfile,
)
from app.services import zus_service

router = APIRouter(prefix="/zus", tags=["zus"])


@router.post("/profile", response_model=ZusProfile)
def profile(query: SimulationQuery) -> ZusProfile:
    """Stan ubezpieczenia i zadłużenia na dzień podany w żądaniu."""
    return zus_service.build_profile(query)


@router.post("/ezla", response_model=list[EzlaCertificate])
def ezla(query: SimulationQuery) -> list[EzlaCertificate]:
    """Zaświadczenia e-ZLA powiązane z ubezpieczeniem."""
    return zus_service.build_ezla(query)


@router.post("/pue", response_model=PueSession)
def pue(query: PueRequest) -> PueSession:
    """Symulowane połączenie z PUE/eZUS i wgląd w dane konta."""
    return zus_service.connect_pue(query)


@router.post("/birth-certificate", response_model=BirthCertificateOrder)
def birth_certificate(request: BirthCertificateRequest) -> BirthCertificateOrder:
    """Wniosek o odpis zupełny albo skrócony aktu urodzenia."""
    return zus_service.order_birth_certificate(request)


@router.get("/links", response_model=list[ZusLink])
def links() -> list[ZusLink]:
    """Przekierowania do ZUS, MRPiPS i PIP."""
    return zus_service.list_links()