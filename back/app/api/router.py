"""Spinamy endpointy w jeden router podłączany w main.py."""
from fastapi import APIRouter

from app.api.routes import benefits, health

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(benefits.router)
