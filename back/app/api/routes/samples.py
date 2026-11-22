"""Dokumenty z ZUS: lista spraw i rozpoznanie wgranego PDF-a po odcisku."""

from fastapi import APIRouter, HTTPException

from app.schemas.zus_samples import DigestRequest, ZusRecognition, ZusSample, ZusSampleSummary
from app.services.zus_sample_service import find_sample, recognize, sample_summaries

router = APIRouter(prefix="/samples", tags=["samples"])


@router.get("", response_model=list[ZusSampleSummary])
def list_samples() -> list[ZusSampleSummary]:
    """Lista znanych dokumentów. Rozpoznanie idzie osobno, po odcisku pliku."""
    return sample_summaries()


@router.post("/recognize", response_model=ZusRecognition)
def recognize_sample(payload: DigestRequest) -> ZusRecognition:
    """Dopasowuje SHA-256 pliku do znanego dokumentu. Odcisk liczy przeglądarka."""
    return recognize(payload.sha256, payload.file_name)


@router.get("/{sample_id}", response_model=ZusSample)
def read_sample(sample_id: str) -> ZusSample:
    sample = find_sample(sample_id)
    if sample is None:
        raise HTTPException(status_code=404, detail="Nie znaleziono takiego dokumentu.")
    return sample