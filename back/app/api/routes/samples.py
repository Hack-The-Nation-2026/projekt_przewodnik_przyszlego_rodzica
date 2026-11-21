"""Zestaw przykładowy ZUS: lista spraw i rozpoznanie wgranego PDF-a po odcisku."""

from fastapi import APIRouter, HTTPException

from app.schemas.zus_samples import DigestRequest, ZusRecognition, ZusSample, ZusSampleSummary
from app.services.zus_sample_service import find_sample, recognize, sample_summaries

router = APIRouter(prefix="/samples", tags=["samples"])


@router.get("", response_model=list[ZusSampleSummary])
def list_samples() -> list[ZusSampleSummary]:
    """Sprawy z zestawu przykładowego. Wybór z listy albo rozpoznanie po pliku."""
    return sample_summaries()


@router.post("/recognize", response_model=ZusRecognition)
def recognize_sample(payload: DigestRequest) -> ZusRecognition:
    """Dopasowuje SHA-256 pliku do zestawu. Przeglądarka liczy odcisk lokalnie."""
    return recognize(payload.sha256, payload.file_name)


@router.get("/{sample_id}", response_model=ZusSample)
def read_sample(sample_id: str) -> ZusSample:
    sample = find_sample(sample_id)
    if sample is None:
        raise HTTPException(status_code=404, detail="Nie ma takiej sprawy w zestawie przykładowym.")
    return sample