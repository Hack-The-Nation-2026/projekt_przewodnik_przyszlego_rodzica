"""Wspólne ustawienia testów. Asystent ma odpowiadać z katalogu, bez ruchu sieciowego."""

import os

import pytest

from app.core.config import get_settings


@pytest.fixture(autouse=True, scope="session")
def assistant_without_key():
    """Klucz z lokalnego `.env` nie może ciągnąć testów do zewnętrznego modelu.

    Zmienna środowiskowa ma pierwszeństwo przed plikiem, a pusta wartość wyłącza
    ścieżkę modelu. Testy, które chcą sprawdzić model, podmieniają zależność ustawień.
    """
    previous = os.environ.get("ASSISTANT_API_KEY")
    os.environ["ASSISTANT_API_KEY"] = ""
    get_settings.cache_clear()
    yield
    if previous is None:
        os.environ.pop("ASSISTANT_API_KEY", None)
    else:
        os.environ["ASSISTANT_API_KEY"] = previous
    get_settings.cache_clear()
