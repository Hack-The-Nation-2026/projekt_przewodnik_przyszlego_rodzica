"""Zestaw przykładowy ZUS: lista spraw, wyszukanie po odcisku i rozpoznanie pliku.

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
    "Ten plik nie jest jednym z zestawów przykładowych ZUS. Wpisz dane z dokumentu "
    "w formularzu obok albo wybierz sprawę z listy."
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


def recognize(digest: str) -> ZusRecognition:
    """Dopasowanie po SHA-256. Ten sam plik daje ten sam odcisk, więc wynik jest pewny.

    Dwa zestawy mogą być tym samym plikiem. Wtedy rozpoznajemy pierwszy z nich, a drugi
    ma w danych `duplicate_of`, żeby lista nie pokazywała tej samej sprawy dwa razy.
    """
    sample = next((item for item in load_samples() if item.sha256 == digest), None)
    if sample is None:
        return ZusRecognition(sha256=digest, matched=False, sample=None, hint=UNKNOWN_HINT)
    return ZusRecognition(
        sha256=digest,
        matched=True,
        sample=sample,
        hint=f"Rozpoznano zestaw {sample.id}: {sample.file_name}",
    )