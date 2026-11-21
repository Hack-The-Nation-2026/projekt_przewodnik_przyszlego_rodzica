"""Asystent nawigacyjny. Nie liczy i nie przyjmuje danych osobowych."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.schemas.assistant import AssistantAnswer, AssistantQuestion, AssistantTopic
from app.services.assistant_llm import answer_with_model
from app.services.assistant_service import ask, public_topics

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.get("/topics", response_model=list[AssistantTopic])
def list_topics() -> list[AssistantTopic]:
    """Pytania startowe pokazywane pod pustą rozmową."""
    return public_topics()


@router.post("/ask", response_model=AssistantAnswer)
def ask_assistant(
    payload: AssistantQuestion,
    settings: Annotated[Settings, Depends(get_settings)],
) -> AssistantAnswer:
    """Kieruje do właściwej podstrony albo do instytucji. Kwot nie podaje."""
    if settings.assistant_enabled:
        try:
            answer = answer_with_model(payload.question, payload.history, settings)
            if answer is not None:
                return answer
        except Exception:
            # Sieć, limit albo zmiana po stronie dostawcy: katalog odpowiada tak samo dobrze,
            # a asystent nie może zniknąć ze strony przez cudzą awarię.
            logger.warning("Asystent: model niedostępny, odpowiada katalog", exc_info=True)
    return ask(payload.question, payload.history)
