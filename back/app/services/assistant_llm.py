"""Model językowy, który wybiera temat z katalogu.

Model dostaje pytanie użytkownika, poprzednie pytania z tej rozmowy i listę tematów
naszego katalogu. Nie wysyłamy materiałów ZUS, danych osobowych ani niczego z wniosków.
Model nie pisze odpowiedzi:
wskazuje temat, a zdanie, linki i następne pytania bierzemy z katalogu. Dzięki temu nie
może wymyślić strony, której w serwisie nie ma, ani podać kwoty, której nie liczy kalkulator.
"""

import json
import logging
from collections.abc import Sequence

import httpx

from app.core.config import Settings
from app.schemas.assistant import AssistantAnswer, AssistantTurn
from app.services.assistant_service import BY_ID, TOPICS, build_answer

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Jesteś asystentem nawigacyjnym w serwisie "Skrzydła Rodzica" o zasiłkach \
dla rodziców w Polsce.

Dostajesz pytanie użytkownika i listę tematów, które serwis obsługuje. Wybierz temat, który \
najlepiej pasuje do pytania, nawet jeśli ktoś napisał je innymi słowami.

Pytanie może być dopytaniem do wcześniejszych pytań, na przykład "a co z dokumentami?".
Wtedy wybierz temat, o który pyta cała rozmowa, a nie samo ostatnie zdanie.

Zasady:
- Podaj id jednego tematu i nic więcej.
- Nie odpowiadaj na pytanie, nie przepisuj go i nie dodawaj własnych zdań.
- Jeśli żaden temat nie pasuje, podaj null.

Zwróć wyłącznie JSON w formacie:
{"topic": "<id tematu albo null>"}"""


def _catalog_hint() -> str:
    """Lista tematów z pytaniem, po którym model rozpozna temat."""
    return "\n".join(f"- {topic.id}: {topic.question}" for topic in TOPICS)


def _history_hint(history: Sequence[AssistantTurn]) -> str:
    """Poprzednie pytania z rozmowy. Bez nich "a co z dokumentami?" nie ma do czego nawiązać."""
    if not history:
        return ""
    lines = []
    for turn in history[-4:]:
        chosen = f" (wtedy temat: {turn.topic})" if turn.topic else ""
        lines.append(f"- {turn.question}{chosen}")
    return "Wcześniejsze pytania:\n" + "\n".join(lines) + "\n\n"


def _request(question: str, history: Sequence[AssistantTurn], settings: Settings) -> str:
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
                    "content": (
                        f"Tematy do wyboru:\n{_catalog_hint()}\n\n"
                        f"{_history_hint(history)}Pytanie: {question}"
                    ),
                },
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
            "max_tokens": 1500,
        },
        timeout=httpx.Timeout(settings.assistant_timeout_seconds, connect=5.0),
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"].get("content") or ""
    return content


def _parse_topic(content: str) -> str | None:
    """Wyciąga id tematu. Model czasem opakowuje JSON w blok kodu."""
    text = content.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        text = text.rsplit("```", 1)[0]
    data = json.loads(text)
    topic = data.get("topic")
    return topic if isinstance(topic, str) else None


def answer_with_model(
    question: str,
    history: Sequence[AssistantTurn],
    settings: Settings,
) -> AssistantAnswer | None:
    """Pyta model o temat. Zwraca None, gdy model nic nie wskaże, a wtedy woła się katalog."""
    content = _request(question, history, settings)
    try:
        topic_id = _parse_topic(content)
    except (json.JSONDecodeError, ValueError):
        logger.warning("Asystent: model nie zwrócił JSON-a")
        return None

    topic = BY_ID.get(topic_id) if topic_id else None
    if topic is None:
        return None
    return build_answer(topic, question, history, mode="model")
