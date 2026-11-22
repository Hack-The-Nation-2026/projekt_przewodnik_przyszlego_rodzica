"""Dokumenty z ZUS: lista spraw, wyszukanie po odcisku i rozpoznanie pliku.

Plik `app/data/zus-samples.json` powstaje ze skanów z `PRZYKLADY/` skryptem
`scripts/build_zus_samples.py`. Skanów nie ma w repozytorium, więc w kodzie zostaje
tylko to, co potrzebne do rozpoznania sprawy i pokazania jej treści.
"""

import json
from functools import lru_cache
from pathlib import Path

from app.schemas.zus_samples import ZusRecognition, ZusSample, ZusSampleSummary

SAMPLES_PATH = Path(__file__).resolve().parents[1] / "data" / "zus-samples.json"
UNKNOWN_HINT = (
    "Nie rozpoznaliśmy tego dokumentu. Serwis czyta pisma z ZUS. Jeśli to inny plik, "
    "wpisz dane w formularzu kalkulatora."
)


@lru_cache(maxsize=1)
def load_samples() -> tuple[ZusSample, ...]:
    raw = json.loads(SAMPLES_PATH.read_text(encoding="utf-8"))
    return tuple(ZusSample.model_validate(item) for item in raw)


def sample_summaries() -> list[ZusSampleSummary]:
    return [
        ZusSampleSummary(
            id=sample.id,
            title=sample.title,
            facts=sample.facts,
            outcome=sample.outcome,
            forms=sample.forms,
            tags=sample.tags,
            file_name=sample.file_name,
            duplicate_of=sample.duplicate_of,
        )
        for sample in load_samples()
    ]


def find_sample(sample_id: str) -> ZusSample | None:
    return next((sample for sample in load_samples() if sample.id == sample_id), None)


def recognize(digest: str, file_name: str | None = None) -> ZusRecognition:
    """Dopasowanie po SHA-256. Ten sam plik daje ten sam odcisk, więc wynik jest pewny.

    Dwa dokumenty mogą być tym samym plikiem. Wtedy rozpoznajemy pierwszy z nich, a drugi
    ma w danych `duplicate_of`, żeby ta sama sprawa nie pojawiała się dwa razy.

    Gdy odcisk nie pasuje, próbujemy jeszcze nazwy pliku. Wtedy treść mogła się zmienić,
    więc komunikat mówi, że dopasowanie jest po nazwie i dane trzeba sprawdzić.
    """
    sample = next((item for item in load_samples() if item.sha256 == digest), None)
    if sample is not None:
        return ZusRecognition(
            sha256=digest,
            matched=True,
            sample=sample,
            hint=f"Rozpoznaliśmy dokument: {sample.file_name}",
        )
    if file_name:
        wanted = file_name.strip().casefold()
        sample = next(
            (item for item in load_samples() if item.file_name.casefold() == wanted), None
        )
        if sample is not None:
            return ZusRecognition(
                sha256=digest,
                matched=True,
                sample=sample,
                hint=(
                    "Rozpoznaliśmy dokument po nazwie pliku, bo odcisk się nie zgadza. "
                    "Sprawdź, czy to ten sam dokument."
                ),
            )
    return ZusRecognition(sha256=digest, matched=False, sample=None, hint=UNKNOWN_HINT)