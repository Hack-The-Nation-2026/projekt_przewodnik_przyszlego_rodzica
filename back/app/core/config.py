# Konfiguracja czytana ze zmiennych środowiskowych i pliku .env.
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Przewodnik Przyszłego Rodzica API"
    environment: str = "dev"
    api_prefix: str = "/api"
    # Adresy frontendu rozdzielone przecinkami. Ze stringa robimy listę, żeby .env był czytelny.
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173"
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    # Asystent nawigacyjny. Bez klucza działa tryb demo z katalogu tematów, więc cała
    # aplikacja działa offline. Z kluczem model tylko układa zdanie i wybiera temat,
    # a linki i liczby dalej pochodzą z katalogu serwisu.
    assistant_api_key: str = ""
    assistant_model: str = "deepseek/deepseek-v4.1-flash"
    assistant_base_url: str = "https://openrouter.ai/api/v1"
    assistant_timeout_seconds: float = 12.0

    @property
    def assistant_enabled(self) -> bool:
        return bool(self.assistant_api_key.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()
