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
    ("Czym jest ZUS?", "czym_jest_zus"),
    ("Ile płacę składek?", "skladki"),
    ("Mam bliźniaki, czy dostanę więcej?", "bliznieta"),
    ("Ile trwa urlop macierzyński?", "urlop_wymiar"),
    ("Co to jest podstawa wymiaru?", "podstawa_wymiaru"),
    ("Dziecko urodziło się za wcześnie, co z urlopem?", "wczesniak"),
    ("Czy zasiłek chorobowy w ciąży jest płatny 100%?", "chorobowe_w_ciazy"),
    ("Czy ojciec może wziąć urlop rodzicielski?", "oboje_rodzice"),
    ("Jestem w ciąży, a pracodawca chce mnie zwolnić", "ochrona_pracy"),
    ("Czy dostanę 800 plus?", "swiadczenia_poza_zus"),
    ("Czy należy mi się zasiłek opiekuńczy na dziecko?", "zasilek_opiekunczy"),
    ("Co zrobić, jak zgubiłam ZUS Z-3?", "dokumenty"),
    ("Adoptowaliśmy dziecko, jakie dokumenty?", "adopcja"),
    ("czy dostane swiadczenie na chore dziecko jesli wyzdrowieje", "zasilek_opiekunczy"),
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


def test_question_outside_the_catalog_points_at_the_sources():
    """Pytanie spoza zakresu nie kończy rozmowy, tylko mówi, gdzie sprawdzić."""
    body = client.post("/api/assistant/ask", json={"question": "ile mogę mieć dzieci"}).json()
    assert body["topic"] is None
    for name in ("ZUS", "Ministerstwo Rodziny", "Inspekcja Pracy"):
        assert name in body["answer"]
    assert "potwierdzić" in body["answer"]
    hrefs = {link["href"] for link in body["links"]}
    assert "/swiadczenia" in hrefs
    assert {
        "https://www.zus.pl",
        "https://www.gov.pl/web/rodzina",
        "https://www.pip.gov.pl",
    } <= hrefs
    assert [row["id"] for row in body["suggestions"]] == [
        "start",
        "swiadczenia",
        "instytucje",
    ]


def test_every_answer_offers_the_next_questions():
    """Pod odpowiedzią stoją następne pytania, więc rozmowa nie kończy się na jednym zdaniu."""
    for question, _ in QUESTIONS:
        body = client.post("/api/assistant/ask", json={"question": question}).json()
        suggestions = body["suggestions"]
        assert len(suggestions) >= 3, question
        ids = {row["id"] for row in suggestions}
        assert body["topic"] not in ids, question
        assert all(row["question"].strip() for row in suggestions)


def test_definition_question_gets_an_answer_not_just_institutions():
    body = client.post("/api/assistant/ask", json={"question": "czym jest zus"}).json()
    assert body["topic"] == "czym_jest_zus"
    assert "Zakład Ubezpieczeń Społecznych" in body["answer"]
    assert any(link["kind"] == "page" for link in body["links"])
    assert body["suggestions"]


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


def test_links_do_not_point_at_the_dead_ezus_shortcut():
    """Stary adres https://www.zus.pl/ezus zwracał 404, więc linki idą do logowania."""
    hrefs = {link.href for topic in TOPICS for link in topic.links}
    assert "https://www.zus.pl/ezus" not in hrefs
    assert "https://www.zus.pl/ezus/logowanie?jezyk=pl" in hrefs


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


def test_follow_up_question_reads_the_whole_conversation():
    """“a co z dokumentami?” ma sens tylko razem z poprzednim pytaniem."""
    history = [{"question": "gdzie złożyć wniosek o zasiłek macierzyński", "topic": "wniosek"}]
    body = client.post(
        "/api/assistant/ask",
        json={"question": "a co z dokumentami?", "history": history},
    ).json()
    assert body["topic"] == "dokumenty", body["answer"]


def test_full_question_does_not_need_the_history():
    history = [{"question": "jakie dokumenty muszę złożyć", "topic": "dokumenty"}]
    body = client.post(
        "/api/assistant/ask",
        json={"question": "ile dostanę zasiłku?", "history": history},
    ).json()
    assert body["topic"] == "kwota"


def test_follow_up_without_a_keyword_offers_the_thread_as_suggestions():
    # Słów nie ma, więc asystent nie zgaduje tematu, ale podpowiada ten z rozmowy.
    history = [{"question": "jakie dokumenty muszę złożyć", "topic": "dokumenty"}]
    body = client.post(
        "/api/assistant/ask",
        json={"question": "a co dalej z tym zrobić", "history": history},
    ).json()
    assert body["suggestions"][0]["id"] == "dokumenty"
    assert body["links"]


def test_history_is_capped_and_checked():
    too_long = [{"question": f"pytanie numer {index}"} for index in range(7)]
    assert (
        client.post(
            "/api/assistant/ask", json={"question": "cokolwiek", "history": too_long}
        ).status_code
        == 422
    )
    personal = [{"question": "gdzie złożyć wniosek", "pesel": "1"}]
    assert (
        client.post(
            "/api/assistant/ask", json={"question": "cokolwiek", "history": personal}
        ).status_code
        == 422
    )


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


# --- Ścieżka modelu -------------------------------------------------------------------

from app.core.config import Settings, get_settings  # noqa: E402
from app.services import assistant_llm  # noqa: E402
from app.services.assistant_service import BY_ID  # noqa: E402

GOOD_JSON = '{"topic": "wniosek"}'


def test_model_picks_the_topic_and_the_catalog_writes_the_answer(monkeypatch):
    monkeypatch.setattr(assistant_llm, "_request", lambda question, history, settings: GOOD_JSON)
    settings = Settings(assistant_api_key="t")
    answer = assistant_llm.answer_with_model("gdzie złożyć wniosek", [], settings)
    assert answer is not None
    assert answer.mode == "model"
    assert answer.topic == "wniosek"
    assert answer.answer == BY_ID["wniosek"].answer
    assert answer.links[0].href == "/dokumenty"


def test_model_cannot_slip_its_own_sentence_into_the_answer(monkeypatch):
    # Model nie pisze odpowiedzi, więc jego zdanie nie ma prawa dotrzeć do użytkownika.
    payload = '{"topic": "kwota", "answer": "Sprawdź sekcję Uprawnienia i kwotę 100 zł."}'
    monkeypatch.setattr(assistant_llm, "_request", lambda question, history, settings: payload)
    answer = assistant_llm.answer_with_model("ile dostanę", [], Settings(assistant_api_key="t"))
    assert answer is not None
    assert answer.answer == BY_ID["kwota"].answer
    assert "100" not in answer.answer
    assert "Uprawnienia" not in answer.answer


def test_model_with_an_unknown_topic_falls_back_to_the_catalog(monkeypatch):
    payload = '{"topic": "cos-nowego"}'
    monkeypatch.setattr(assistant_llm, "_request", lambda question, history, settings: payload)
    assert (
        assistant_llm.answer_with_model("dziwne pytanie", [], Settings(assistant_api_key="t"))
        is None
    )


def test_broken_json_falls_back_to_the_catalog(monkeypatch):
    monkeypatch.setattr(assistant_llm, "_request", lambda question, history, settings: "nie json")
    assert assistant_llm.answer_with_model("cokolwiek", [], Settings(assistant_api_key="t")) is None


def test_route_answers_with_the_model_when_a_key_is_set(monkeypatch):
    app.dependency_overrides[get_settings] = lambda: Settings(assistant_api_key="t")
    monkeypatch.setattr(assistant_llm, "_request", lambda question, history, settings: GOOD_JSON)
    try:
        body = client.post("/api/assistant/ask", json={"question": "gdzie złożyć wniosek"}).json()
    finally:
        app.dependency_overrides.clear()
    assert body["mode"] == "model"
    assert body["topic"] == "wniosek"
    assert body["answer"] == BY_ID["wniosek"].answer


def test_model_cannot_send_a_question_to_a_topic_it_does_not_mention(monkeypatch):
    # Model wskazał temat o stracie dziecka na pytanie o zwolnienie z pracy. Pytanie nie
    # daje temu tematowi żadnego oparcia, więc odpowiedź wraca do katalogu.
    payload = '{"topic": "trudna_sytuacja"}'
    monkeypatch.setattr(assistant_llm, "_request", lambda question, history, settings: payload)
    answer = assistant_llm.answer_with_model(
        "Jestem w ciąży, a pracodawca chce mnie zwolnić", [], Settings(assistant_api_key="t")
    )
    assert answer is None


def test_slowo_weak_match_does_not_overrule_the_model(monkeypatch):
    # "złożyć" daje słabe trafienie w temat wniosku, ale model lepiej rozpoznał dokumenty.
    payload = '{"topic": "dokumenty"}'
    monkeypatch.setattr(assistant_llm, "_request", lambda question, history, settings: payload)
    answer = assistant_llm.answer_with_model(
        "Urodziłam wczoraj, co mam teraz złożyć?", [], Settings(assistant_api_key="t")
    )
    assert answer is not None
    assert answer.topic == "dokumenty"


def test_model_choice_that_the_question_supports_stays(monkeypatch):
    payload = '{"topic": "chorobowe_w_ciazy"}'
    monkeypatch.setattr(assistant_llm, "_request", lambda question, history, settings: payload)
    answer = assistant_llm.answer_with_model(
        "Czy zasiłek chorobowy w ciąży jest płatny 100%?", [], Settings(assistant_api_key="t")
    )
    assert answer is not None
    assert answer.topic == "chorobowe_w_ciazy"
    assert answer.mode == "model"


def test_route_overrides_a_topic_the_question_does_not_support(monkeypatch):
    app.dependency_overrides[get_settings] = lambda: Settings(assistant_api_key="t")
    payload = '{"topic": "trudna_sytuacja"}'
    monkeypatch.setattr(assistant_llm, "_request", lambda question, history, settings: payload)
    try:
        body = client.post(
            "/api/assistant/ask",
            json={"question": "Jestem w ciąży, a pracodawca chce mnie zwolnić"},
        ).json()
    finally:
        app.dependency_overrides.clear()
    assert body["topic"] == "ochrona_pracy"
    assert body["mode"] == "catalog"
    assert "wsparciu" not in body["answer"]


def test_route_keeps_working_when_the_model_fails(monkeypatch):
    def boom(question, history, settings):
        raise RuntimeError("dostawca padł")

    app.dependency_overrides[get_settings] = lambda: Settings(assistant_api_key="t")
    monkeypatch.setattr(assistant_llm, "_request", boom)
    try:
        response = client.post("/api/assistant/ask", json={"question": "gdzie złożyć wniosek"})
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["mode"] == "catalog"
    assert response.json()["topic"] == "wniosek"


def test_route_without_a_key_never_touches_the_network(monkeypatch):
    def unexpected(question, history, settings):
        raise AssertionError("bez klucza nie ma prawa być wywołania modelu")

    monkeypatch.setattr(assistant_llm, "_request", unexpected)
    body = client.post("/api/assistant/ask", json={"question": "gdzie złożyć wniosek"}).json()
    assert body["mode"] == "catalog"
