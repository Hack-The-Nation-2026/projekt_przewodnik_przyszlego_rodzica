"""Odczyt i zmiana parametrów kalkulatora z panelu administracyjnego."""

from fastapi import APIRouter

from app.schemas.settings import AppSettings
from app.services.settings_store import load_settings, reset_settings, save_settings

router = APIRouter(tags=["settings"])


@router.get("/settings", response_model=AppSettings)
def read_settings() -> AppSettings:
    """Parametry widoczne dla frontendu: stopy, wymiary urlopów i stan funkcji."""
    return load_settings()


@router.put("/admin/settings", response_model=AppSettings)
def update_settings(payload: AppSettings) -> AppSettings:
    """Zapisuje cały zestaw parametrów. Zmiana działa od następnego zapytania."""
    return save_settings(payload)


@router.post("/admin/settings/reset", response_model=AppSettings)
def restore_defaults() -> AppSettings:
    return reset_settings()