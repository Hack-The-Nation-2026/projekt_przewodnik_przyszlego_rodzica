"""Parametry aplikacji trzymane w pliku, żeby panel zmieniał je bez wdrożenia.

Domyślne wartości siedzą w kodzie, a plik zapisuje tylko to, co ktoś zmienił w panelu.
Brak pliku albo uszkodzony JSON oznacza powrót do wartości domyślnych, więc kalkulator
zawsze ma z czego liczyć.
"""

import json
import os
from datetime import UTC, datetime
from pathlib import Path

from pydantic import ValidationError

from app.schemas.settings import AppSettings, default_settings

DEFAULT_PATH = Path(__file__).resolve().parents[2] / "data" / "admin-settings.json"


def settings_path() -> Path:
    """Ścieżka pliku z parametrami; testy podmieniają ją zmienną środowiskową."""
    return Path(os.environ.get("ADMIN_SETTINGS_FILE") or DEFAULT_PATH)


def load_settings() -> AppSettings:
    path = settings_path()
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default_settings()
    try:
        return AppSettings.model_validate(raw)
    except ValidationError:
        return default_settings()


def save_settings(settings: AppSettings) -> AppSettings:
    saved = settings.model_copy(update={"updated_at": datetime.now(UTC)})
    path = settings_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(saved.model_dump_json(indent=2), encoding="utf-8")
    return saved


def reset_settings() -> AppSettings:
    saved = default_settings().model_copy(update={"updated_at": datetime.now(UTC)})
    path = settings_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(saved.model_dump_json(indent=2), encoding="utf-8")
    return saved