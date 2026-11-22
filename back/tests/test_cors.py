"""CORS: dokładne adresy z listy oraz gwiazdka dla adresów podglądu, które się zmieniają."""
import re

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import app

client = TestClient(app)


def test_local_origin_gets_the_header() -> None:
    response = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_unknown_origin_gets_no_header() -> None:
    response = client.get("/api/health", headers={"Origin": "https://example.com"})
    assert "access-control-allow-origin" not in response.headers


def test_wildcard_entry_becomes_a_regex() -> None:
    settings = Settings(cors_origins="https://stala.example,https://projekt*.vercel.app")
    assert settings.cors_origin_list == ["https://stala.example"]
    regex = settings.cors_origin_regex
    assert regex is not None
    assert re.fullmatch(regex, "https://projekt-abc123-zespol.vercel.app")
    # Gwiazdka nie przechodzi na kolejną kropkę, więc cudza subdomena nie przejdzie.
    assert not re.fullmatch(regex, "https://projekt.atak.example")


def test_without_wildcard_there_is_no_regex() -> None:
    settings = Settings(cors_origins="https://stala.example")
    assert settings.cors_origin_regex is None
