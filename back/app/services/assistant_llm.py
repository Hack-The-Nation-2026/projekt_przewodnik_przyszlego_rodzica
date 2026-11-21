"""Model językowy, który układa zdanie asystenta.

Model dostaje tylko pytanie użytkownika i listę tematów naszego katalogu. Nie wysyłamy
materiałów ZUS, danych osobowych ani niczego z wniosków. Model nie liczy i nie wybiera
linków: wskazuje temat, a linki bierzemy z katalogu, więc trasa i tak jest sprawdzona
testem. Odpowiedź przechodzi ten sam filtr co tryb demo, więc kwota nie wycieknie.
"""

import json
import logging
import re

import httpx

from app.core.config import Settings
from app.schemas.assistant import AssistantAnswer
from app.services.assistant_service import (
    BY_ID,
    INSTITUTION_LINKS,
    TOPICS,
    ranked_topics,
)

logger = logging.getLogger(__name__)

DIGITS = re.compile(r"\d")
# Całe słowa, bo "zł" siedzi też w "złożyć" i "złożenia".
CURRENCY = re.compile(r"\b(pln|zł|zl|złotych|zlotych)\b", re.IGNORECASE)
MIN_ANSWER = 25
MAX_ANSWER = 420

SYSTEM_PROMPT = """Jesteś asystentem nawigacyjnym w serwisie "Skrzydła Rodzica" o zasiłkach \
dla rodziców w Polsce.

Twoje zadanie to powiedzieć, gdzie w serwisie ktoś znajdzie odpowiedź na swoje pytanie.

Zasady:
- Nie podawaj żadnych liczb: kwot, tygodni, dni, terminów ani dat.
- Nie interpretuj przepisów i nie oceniaj, czy ktoś ma prawo do świadczenia.
- Nie pytaj o dane osobowe, PESEL ani o dokumenty.
- Odpowiadaj po polsku, najwyżej dwoma zdaniami, bez list i bez punktów.
- Wybierz jeden temat z listy i podaj jego id. Jeśli żaden nie pasuje, podaj null.

Zwróć wyłącznie JSON w formacie:
{"topic": "<id tematu albo null>", "answer": "<jedno albo dwa zdania po polsku>"}"""


def _catalog_hint() -> str:
    """Lista tematów z krótkim opisem, dokąd prowadzą. Bez tego model zgaduje strony."""
    lines = []
    for topic in TOPICS:
        where = ", ".join(link.label for link in topic.links)
        lines.append(f"- {topic.id}: {topic.question} (prowadzi do: {where})")
    return "\n".join(lines)


def _request(question: str, settings: Settings) -> str:
    """Jedno wywołanie modelu. Osobna funkcja, żeby test mógł je podmienić."""
    response = httpx.post(
        f"{settings.assistant_base_url.rstrip('/')}/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.assistant_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.assistant_model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Tematy do wyboru:\n{_catalog_hint()}\n\nPytanie: {question}",
                },
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
            "max_tokens": 1500,
        },
        timeout=httpx.Timeout(settings.assistant_timeout_seconds, connect=5.0),
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"].get("content") or ""
    return content


def _parse(content: str) -> tuple[str | None, str]:
    """Wyciąga temat i zdanie z odpowiedzi modelu. Model czasem opakowuje JSON w blok kodu."""
    text = content.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        text = text.rsplit("```", 1)[0]
    data = json.loads(text)
    topic = data.get("topic")
    answer = (data.get("answer") or "").strip()
    return (topic if isinstance(topic, str) else None), answer


def _is_safe(answer: str) -> bool:
    """Kwoty i terminy zostają w silniku reguł, więc liczba w zdaniu dyskwalifikuje odpowiedź."""
    if not MIN_ANSWER <= len(answer) <= MAX_ANSWER:
        return False
    return not DIGITS.search(answer) and not CURRENCY.search(answer)


def answer_with_model(question: str, settings: Settings) -> AssistantAnswer | None:
    """Pyta model. Zwraca None, gdy odpowiedź jest nieużywalna, a wtedy woła się katalog."""
    content = _request(question, settings)
    try:
        topic_id, text = _parse(content)
    except (json.JSONDecodeError, ValueError):
        logger.warning("Asystent: model nie zwrócił JSON-a")
        return None

    if not _is_safe(text):
        logger.warning("Asystent: odpowiedź modelu odrzucona przez filtr treści")
        return None

    topic = BY_ID.get(topic_id) if topic_id else None
    matches = ranked_topics(question)
    alternatives = [entry.public() for entry, _score in matches[1:4]]

    return AssistantAnswer(
        topic=topic.id if topic else None,
        answer=text,
        links=list(topic.links) if topic else list(INSTITUTION_LINKS),
        suggestions=alternatives,
        mode="model",
    )
