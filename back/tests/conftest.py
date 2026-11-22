"""Wspólne ustawienia testów. Asystent ma odpowiadać z katalogu, bez ruchu sieciowego."""

import os

import pytest

from app.core.config import get_settings


@pytest.fixture(autouse=True, scope="session")
def settings_file_outside_the_repo(tmp_path_factory):
    """Parametry zapisane z panelu nie mogą zmieniać wyników testów.

    Panel trzyma je w pliku obok kodu, więc ktoś, kto w przeglądarce zmienił stopę
    rodzicielskiego, przewracał porównania spraw z decyzją. Testy dostają własny,
    pusty plik, a panel testuje się osobno, z podmienioną ścieżką.
    """
    path = tmp_path_factory.mktemp("settings") / "admin-settings.json"
    previous = os.environ.get("ADMIN_SETTINGS_FILE")
    os.environ["ADMIN_SETTINGS_FILE"] = str(path)
    yield path
    if previous is None:
        os.environ.pop("ADMIN_SETTINGS_FILE", None)
    else:
        os.environ["ADMIN_SETTINGS_FILE"] = previous


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
