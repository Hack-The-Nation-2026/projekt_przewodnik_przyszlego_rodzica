"""Asystent nawigacyjny: dopasowanie pytania, brak kwot i linki, które dokądś prowadzą."""

import re

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.assistant_service import TOPICS, ranked_topics

client = TestClient(app)

# Pytania zapisane tak, jak ludzie je piszą, z ogonkami i bez.
QUESTIONS = [
    ("Nie wiem, od czego zacząć", "start"),
    ("Ile dostanę zasiłku macierzyńskiego?", "kwota"),
    ("Jakie świadczenia mi przysługują?", "swiadczenia"),
    ("Jakie dokumenty muszę złożyć?", "dokumenty"),
    ("Gdzie złożyć wniosek o zasiłek?", "wniosek"),
    ("Do kiedy mam czas na złożenie wniosku?", "terminy"),
    ("Kto wypłaci zasiłek, pracodawca czy ZUS?", "pracodawca"),
    ("Gdzie sprawdzę stan sprawy w ZUS?", "zus_status"),
    ("Jak to wygląda, gdy korzystają oboje rodzice?", "oboje_rodzice"),
    ("Czy mogę łączyć pracę z urlopem rodzicielskim?", "laczenie_praca"),
    ("Jesteśmy rodzicami adopcyjnymi", "adopcja"),
    ("Jestem w trudnej sytuacji, gdzie szukać pomocy?", "trudna_sytuacja"),
    ("Mam zaległości w składkach", "zaleglosci"),
    ("Gdzie zobaczę moje zwolnienie lekarskie?", "ezla"),
    ("Jak uzyskać odpis aktu urodzenia?", "akt_urodzenia"),
    ("Jak zalogować się przez mObywatel?", "mobywatel"),
    ("Chcę zobaczyć gotową sprawę", "sprawy"),
    ("Do kogo zwrócić się poza serwisem?", "instytucje"),
]

DIGIT = re.compile(r"\d")


def test_topic_list_is_ready_for_the_page():
    response = client.get("/api/assistant/topics")
    assert response.status_code == 200
    topics = response.json()
    assert len(topics) >= 15
    assert len({row["id"] for row in topics}) == len(topics)
    assert all(row["question"].strip() for row in topics)


@pytest.mark.parametrize("question,expected", QUESTIONS)
def test_question_lands_on_the_right_topic(question, expected):
    response = client.post("/api/assistant/ask", json={"question": question})
    assert response.status_code == 200
    answer = response.json()
    assert answer["topic"] == expected, answer["answer"]
    assert answer["links"], "każda odpowiedź musi wskazać miejsce do sprawdzenia"


def test_answers_never_carry_numbers():
    """Asystent nawiguje, a kwoty, tygodnie i terminy liczy silnik reguł."""
    for topic in TOPICS:
        assert not DIGIT.search(topic.answer), topic.id
        assert not DIGIT.search(topic.question), topic.id
        for link in topic.links:
            assert not DIGIT.search(link.label), topic.id
            assert not DIGIT.search(link.description or ""), topic.id

    for question, _ in QUESTIONS:
        body = client.post("/api/assistant/ask", json={"question": question}).json()
        assert not DIGIT.search(body["answer"])


def test_unknown_question_points_at_the_official_sites():
    response = client.post(
        "/api/assistant/ask", json={"question": "Zupelnie inne pytanie o kosmos"}
    )
    assert response.status_code == 200
    answer = response.json()
    assert answer["topic"] is None
    hrefs = {link["href"] for link in answer["links"]}
    assert {
        "https://www.zus.pl",
        "https://www.gov.pl/web/rodzina",
        "https://www.pip.gov.pl",
    } <= hrefs
    assert answer["suggestions"]


def test_links_are_either_our_pages_or_https():
    for topic in TOPICS:
        for link in topic.links:
            if link.kind == "page":
                assert link.href.startswith("/"), link.href
            else:
                assert link.href.startswith("https://"), link.href


def test_internal_links_exist_on_the_site():
    """Każda podstrona, do której odsyła asystent, ma trasę w App.tsx."""
    from pathlib import Path

    routes = Path(__file__).resolve().parents[2] / "front" / "src" / "App.tsx"
    if not routes.exists():  # w samym obrazie backendu frontu może nie być
        pytest.skip("brak frontu w tym środowisku")
    source = routes.read_text(encoding="utf-8")
    for topic in TOPICS:
        for link in topic.links:
            if link.kind != "page":
                continue
            path = link.href.split("?")[0].strip("/") or "<index>"
            if path == "<index>":
                continue
            declared = {entry.split("/")[0] for entry in re.findall(r'path="([^"]+)"', source)}
            assert path in declared, path


def test_empty_question_is_rejected_by_validation():
    assert client.post("/api/assistant/ask", json={"question": "a"}).status_code == 422
    assert client.post("/api/assistant/ask", json={}).status_code == 422


def test_extra_fields_are_rejected_so_no_personal_data_gets_through():
    response = client.post("/api/assistant/ask", json={"question": "dokumenty", "pesel": "1"})
    assert response.status_code == 422


def test_ranking_ignores_case_and_diacritics():
    with_diacritics = ranked_topics("Gdzie złożę wniosek?")
    without = ranked_topics("gdzie zloze wniosek")
    assert with_diacritics and without
    assert with_diacritics[0][0].id == without[0][0].id
