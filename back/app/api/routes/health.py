"""Endpoint kontrolny, po którym frontend sprawdza, czy API odpowiada."""
from fastapi import APIRouter

router = APIRouter(tags=["meta"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
