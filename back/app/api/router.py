"""Spinamy endpointy w jeden router podłączany w main.py."""
from fastapi import APIRouter

from app.api.routes import auth, benefits, health, settings, zus

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(benefits.router)
api_router.include_router(auth.router)
api_router.include_router(zus.router)
api_router.include_router(settings.router)
