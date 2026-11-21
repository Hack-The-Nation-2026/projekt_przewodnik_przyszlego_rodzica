"""Symulowane logowanie przez mObywatel.

Frontend wychodzi na osobną stronę i wraca tutaj z danymi obywatela, tak jak
w prawdziwym przepływie z login.gov.pl.
"""
from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings
from app.schemas.auth import Citizen, DemoAccount, MobywatelLogin
from app.services import mobywatel_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/mobywatel", response_model=Citizen)
def mobywatel_login(payload: MobywatelLogin) -> Citizen:
    citizen = mobywatel_service.authenticate(payload.identifier, payload.password)
    if citizen is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy login lub hasło.",
        )
    return citizen


@router.get("/mobywatel/demo-accounts", response_model=list[DemoAccount])
def demo_accounts() -> list[DemoAccount]:
    if get_settings().environment == "prod":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return mobywatel_service.list_demo_accounts()
