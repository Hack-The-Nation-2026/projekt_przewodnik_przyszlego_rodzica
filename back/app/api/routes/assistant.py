"""Asystent nawigacyjny. Nie liczy i nie przyjmuje danych osobowych."""

from fastapi import APIRouter

from app.schemas.assistant import AssistantAnswer, AssistantQuestion, AssistantTopic
from app.services.assistant_service import ask, public_topics

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.get("/topics", response_model=list[AssistantTopic])
def list_topics() -> list[AssistantTopic]:
    """Pytania startowe pokazywane pod pustą rozmową."""
    return public_topics()


@router.post("/ask", response_model=AssistantAnswer)
def ask_assistant(payload: AssistantQuestion) -> AssistantAnswer:
    """Kieruje do właściwej podstrony albo do instytucji. Kwot nie podaje."""
    return ask(payload.question)
