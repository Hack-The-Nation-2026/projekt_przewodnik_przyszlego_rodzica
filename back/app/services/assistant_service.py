"""Asystent nawigacyjny: kieruje do właściwej podstrony albo do instytucji.

Zakres jest wąski i taki ma zostać. Asystent nie liczy, nie interpretuje
przepisów i nie przyjmuje danych osobowych, na wejściu jest tylko pytanie,
na wyjściu gotowa odpowiedź z katalogu tematów i linki. Kwoty, tygodnie
i terminy zostają w silniku reguł, więc żadna odpowiedź ich nie podaje.

Dopasowanie jest deterministyczne: normalizujemy pytanie (bez wielkich liter
i ogonków), a potem liczymy trafienia w rdzenie słów i całe frazy przypisane
do tematu. Dzięki temu demo działa bez klucza API i bez sieci, a wynik jest
ten sam przy każdym uruchomieniu. Dopytanie, na przykład "a co z dokumentami?",
czytamy razem z poprzednimi pytaniami, które przysyła przeglądarka. Serwer
historii nie zapisuje.
"""

import re
import unicodedata
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Literal

from app.schemas.assistant import AssistantAnswer, AssistantLink, AssistantTopic, AssistantTurn

# Ile waży trafienie. Fraza jest precyzyjniejsza niż pojedynczy rdzeń, więc
# wygrywa z nim, a pojedyncze słowo wystarcza tylko wtedy, gdy żaden inny temat
# nie ma nic do powiedzenia. Lepiej wskazać bliski temat niż zbyć pytanie.
PHRASE_WEIGHT = 3
STEM_WEIGHT = 1
MIN_SCORE = 1
# Jeden rdzeń to jeszcze za mało, żeby zaufać tematowi bez patrzenia na kontekst.
WEAK_SCORE = 1
# Ile poprzednich pytań bierzemy pod uwagę. Dalsze i tak niewiele wnoszą.
CONTEXT_TURNS = 3

Mode = Literal["catalog", "model"]

ZUS = AssistantLink(
    label="Strona ZUS",
    href="https://www.zus.pl",
    kind="external",
    description="Formularze, informacje o zasiłkach i kontakt do placówek.",
)
FAMILY = AssistantLink(
    label="Ministerstwo Rodziny, Pracy i Polityki Społecznej",
    href="https://www.gov.pl/web/rodzina",
    kind="external",
    description="Przepisy o urlopach i świadczeniach dla rodziców.",
)
PIP = AssistantLink(
    label="Państwowa Inspekcja Pracy",
    href="https://www.pip.gov.pl",
    kind="external",
    description="Prawa pracownika i ochrona zatrudnienia w ciąży.",
)

# Gdy pytanie nie pasuje do żadnego tematu, zostają trzy oficjalne adresy.
INSTITUTION_LINKS: tuple[AssistantLink, ...] = (ZUS, FAMILY, PIP)

BENEFITS_PAGE = AssistantLink(
    label="Lista świadczeń",
    href="/swiadczenia",
    kind="page",
    description="Co obejmuje serwis i gdzie szukać szczegółów.",
)
# Pytanie spoza katalogu: najpierw nasza lista, a pod nią trzy oficjalne źródła.
FALLBACK_LINKS: tuple[AssistantLink, ...] = (BENEFITS_PAGE, *INSTITUTION_LINKS)


@dataclass(frozen=True)
class Topic:
    """Jeden temat: pytanie, odpowiedź, linki i słowa, po których go poznajemy."""

    id: str
    question: str
    answer: str
    links: tuple[AssistantLink, ...]
    phrases: tuple[str, ...] = ()
    stems: tuple[str, ...] = ()

    def public(self) -> AssistantTopic:
        return AssistantTopic(id=self.id, question=self.question)


TOPICS: tuple[Topic, ...] = (
    Topic(
        id="start",
        question="Nie wiem, od czego zacząć",
        answer=(
            "Zacznij od ekranu wejścia. Możesz zalogować się przez mObywatel i wczytać dane "
            "z ZUS albo wpisać je ręcznie. Potem kilka pytań i zobaczysz, co ci przysługuje."
        ),
        links=(
            AssistantLink(
                label="Wejście i logowanie",
                href="/wejscie",
                kind="page",
                description="Dwie drogi: mObywatel albo ręczne wpisanie danych.",
            ),
            AssistantLink(
                label="Lista świadczeń",
                href="/swiadczenia",
                kind="page",
                description="Co obejmuje serwis i czego dotyczy każde świadczenie.",
            ),
        ),
        phrases=(
            "od czego zacz",
            "pierwsze kroki",
            "jak zacz",
            "nie wiem od czego",
            "co mam zrobic",
            "jak to dziala",
            "od poczatku",
            "zagubion",
        ),
        stems=("zacz", "start"),
    ),
    Topic(
        id="kwota",
        question="Ile dostanę zasiłku?",
        answer=(
            "Kwoty liczy kalkulator z twoich danych. Wpisz podstawę wymiaru i sytuację "
            "rodzinną, a zobaczysz wyliczenie dla obojga rodziców razem."
        ),
        links=(
            AssistantLink(
                label="Kalkulator",
                href="/kalkulator",
                kind="page",
                description="Wyliczenie zasiłku z podziałem na rodziców.",
            ),
        ),
        phrases=(
            "ile dostan",
            "ile zasilk",
            "jaka kwot",
            "wysokosc zasilk",
            "ile wyniesie",
            "ile bede",
            "ile pieniedz",
            "ile kasy",
            "ile mi wyjdzie",
            "jak duzo",
            "ile to wychodzi",
            "ile za",
        ),
        stems=("kwot", "wylicz", "wysokosc", "pieniadz"),
    ),
    Topic(
        id="skladki",
        question="Ile płacę składek?",
        answer=(
            "Składki zależą od podstawy wymiaru, a symulacja ZUS pokazuje je na wybranym dniu. "
            "W kalkulatorze wpiszesz swoje dane i zobaczysz wyliczenie zasiłku."
        ),
        links=(
            AssistantLink(
                label="Kalkulator",
                href="/kalkulator",
                kind="page",
                description="Wyliczenie zasiłku z twoich danych.",
            ),
            AssistantLink(
                label="Symulacja ZUS",
                href="/zus",
                kind="page",
                description="Ubezpieczenie, składki i zaległości na wybrany dzień.",
            ),
        ),
        phrases=(
            "ile place",
            "ile placimy",
            "ile wynosza skladki",
            "jakie skladki",
            "ile skladek",
            "ile odprowadzam",
            "skladki na zus",
            "ile kosztuje zus",
        ),
        stems=("skladk", "odprowadz"),
    ),
    Topic(
        id="swiadczenia",
        question="Jakie świadczenia mi przysługują?",
        answer=(
            "Lista świadczeń pokazuje, co obejmuje serwis, i prowadzi do szczegółów każdego "
            "z nich. Uprawnienia sprawdzisz w kalkulatorze po odpowiedziach na kilka pytań."
        ),
        links=(
            AssistantLink(
                label="Świadczenia",
                href="/swiadczenia",
                kind="page",
                description="Opis świadczeń i odesłania do szczegółów.",
            ),
        ),
        phrases=(
            "jakie swiadczen",
            "co mi przyslug",
            "do czego mam prawo",
            "lista swiadczen",
            "jakie zasilk",
            "co sie nalezy",
            "co moge dostac",
        ),
        stems=(
            "swiadczen",
            "przyslug",
            "zasilk",
            "macierzyn",
            "rodzicielsk",
            "ojcowsk",
            "chorobow",
        ),
    ),
    Topic(
        id="uprawnienia",
        question="Czy mam prawo do zasiłku?",
        answer=(
            "Uprawnienia zależą od twojej sytuacji: umowy, ubezpieczenia i tego, kto jest "
            "rodzicem. Odpowiedz na pytania w kalkulatorze, a serwis pokaże, które świadczenia "
            "wchodzą w grę i czego jeszcze brakuje."
        ),
        links=(
            AssistantLink(
                label="Kalkulator i wywiad",
                href="/kalkulator",
                kind="page",
                description="Pytania o sytuację i sprawdzenie uprawnień.",
            ),
            AssistantLink(
                label="Lista świadczeń",
                href="/swiadczenia",
                kind="page",
                description="Co obejmuje serwis i na czym polega każde świadczenie.",
            ),
        ),
        phrases=(
            "czy mam prawo",
            "jakie mam prawa",
            "czy mi przyslug",
            "czy dostan",
            "co zrobic zeby dostac",
            "czy sie kwalifikuj",
            "czy moge dostac",
        ),
        stems=("uprawnien", "kwalifik"),
    ),
    Topic(
        id="dokumenty",
        question="Jakie dokumenty muszę złożyć?",
        answer=(
            "Dokumenty są rozpisane dla każdego świadczenia osobno: formularz, załączniki "
            "i miejsce złożenia. Wybierz świadczenie i zobacz swoją listę."
        ),
        links=(
            AssistantLink(
                label="Dokumenty i wnioski",
                href="/dokumenty",
                kind="page",
                description="Formularze i załączniki per świadczenie.",
            ),
        ),
        phrases=(
            "jakie dokument",
            "co dolacz",
            "jakie zalacznik",
            "potrzebne dokument",
            "co zabrac",
            "co przygotowac",
            "jakie papiery",
        ),
        stems=("dokument", "zalacznik", "formularz", "papiery"),
    ),
    Topic(
        id="wniosek",
        question="Gdzie złożyć wniosek?",
        answer=(
            "Miejsce złożenia zależy od świadczenia i od tego, kto prowadzi twoją sprawę. "
            "Przy każdym dokumencie jest napisane, czy idzie do pracodawcy, czy do ZUS."
        ),
        links=(
            AssistantLink(
                label="Dokumenty i wnioski",
                href="/dokumenty",
                kind="page",
                description="Formularz, załączniki i miejsce złożenia.",
            ),
            ZUS,
        ),
        phrases=("gdzie zloz", "jak zloz", "gdzie wysyl", "gdzie sklad", "zlozyc podanie"),
        stems=("wnios", "zloz"),
    ),
    Topic(
        id="terminy",
        question="Do kiedy mam czas na złożenie?",
        answer=(
            "Terminy zależą od świadczenia i różnią się między wnioskami. Rozpiska stoi przy "
            "każdym dokumencie, a szczegóły potwierdza ZUS."
        ),
        links=(
            AssistantLink(
                label="Dokumenty i terminy",
                href="/dokumenty",
                kind="page",
                description="Termin i miejsce złożenia przy każdym wniosku.",
            ),
            ZUS,
        ),
        phrases=(
            "do kiedy",
            "jaki termin",
            "jak dlugo mam czas",
            "termin sklad",
            "kiedy sklad",
            "kiedy zloz",
            "do jakiej daty",
            "czy nie jest za pozno",
        ),
        stems=("termin",),
    ),
    Topic(
        id="pracodawca",
        question="Kto wypłaci zasiłek: pracodawca czy ZUS?",
        answer=(
            "To zależy od rodzaju świadczenia i od tego, czy jesteś ubezpieczona u płatnika "
            "składek. Przy każdym dokumencie jest wskazane, kto przyjmuje wniosek i kto wypłaca."
        ),
        links=(
            AssistantLink(
                label="Dokumenty i wnioski",
                href="/dokumenty",
                kind="page",
                description="Miejsce złożenia i płatnik przy każdym świadczeniu.",
            ),
            ZUS,
        ),
        phrases=(
            "kto wyplaci",
            "kto wyplaca",
            "pracodawca czy zus",
            "kto placi zasil",
            "kto prowadzi spraw",
            "od pracodawcy",
        ),
        stems=("pracodawc", "platnik", "wyplac"),
    ),
    Topic(
        id="zus_status",
        question="Gdzie sprawdzę stan sprawy w ZUS?",
        answer=(
            "Stan sprawy i dokumenty widać na koncie w eZUS. W serwisie jest osobny ekran, "
            "który pokazuje, jak wygląda ubezpieczenie i co z niego wynika."
        ),
        links=(
            AssistantLink(
                label="Symulacja danych z ZUS",
                href="/zus",
                kind="page",
                description="Ubezpieczenie, składki i zaległości na wybrany dzień.",
            ),
            AssistantLink(
                label="eZUS",
                href="https://www.zus.pl/ezus",
                kind="external",
                description="Konto, stan sprawy i korespondencja z ZUS.",
            ),
        ),
        phrases=(
            "stan spraw",
            "gdzie sprawdz",
            "moje dane w zus",
            "konto w zus",
            "co z moja sprawa",
        ),
        stems=("ezus", "pue"),
    ),
    Topic(
        id="czym_jest_zus",
        question="Czym jest ZUS?",
        answer=(
            "ZUS, czyli Zakład Ubezpieczeń Społecznych, prowadzi sprawy ubezpieczeń społecznych: "
            "składki, zwolnienia lekarskie i zasiłki. Kto wypłaca świadczenie, zależy od rodzaju "
            "umowy, a w serwisie zobaczysz, jak wygląda twoje ubezpieczenie."
        ),
        links=(
            AssistantLink(
                label="Symulacja ZUS",
                href="/zus",
                kind="page",
                description="Ubezpieczenie, składki i zaległości na wybrany dzień.",
            ),
            AssistantLink(
                label="eZUS",
                href="https://www.zus.pl/ezus",
                kind="external",
                description="Oficjalne konto i stan sprawy w ZUS.",
            ),
        ),
        phrases=(
            "czym jest zus",
            "co to jest zus",
            "co to za zus",
            "czym sie zajmuje zus",
            "do czego sluzy zus",
            "co robi zus",
            "co oznacza zus",
            "czym jest zaklad ubezpieczen",
        ),
    ),
    Topic(
        id="oboje_rodzice",
        question="Jak to wygląda, gdy korzystają oboje rodzice?",
        answer=(
            "Kalkulator liczy oboje rodziców w jednym przebiegu i pokazuje, kto ile dostanie. "
            "Podział urlopu ustawisz w wywiadzie, a wynik zobaczysz obok siebie."
        ),
        links=(
            AssistantLink(
                label="Kalkulator",
                href="/kalkulator",
                kind="page",
                description="Wyliczenie dla matki i ojca w jednym przebiegu.",
            ),
        ),
        phrases=(
            "oboje rodzic",
            "drugi rodzic",
            "ojciec i matka",
            "podzial urlop",
            "kto zostaje",
            "urlop dla obojga",
        ),
        stems=("oboj", "podzial"),
    ),
    Topic(
        id="laczenie_praca",
        question="Czy mogę łączyć pracę z urlopem rodzicielskim?",
        answer=(
            "Tak, w granicach przewidzianych przepisami, a zasiłek zmienia się wraz z wymiarem "
            "czasu pracy. Wpisz wymiar pracy w kalkulatorze, żeby zobaczyć, co to zmienia."
        ),
        links=(
            AssistantLink(
                label="Kalkulator",
                href="/kalkulator",
                kind="page",
                description="Wymiar czasu pracy i jego wpływ na zasiłek.",
            ),
            PIP,
        ),
        phrases=(
            "laczyc prac",
            "laczenie prac",
            "praca a urlop",
            "czesc etatu",
            "wrocic do prac",
            "praca i urlop",
            "pol etat",
            "wymiar czasu",
            "pracowac w czasie urlopu",
        ),
        stems=("lacz", "etat"),
    ),
    Topic(
        id="adopcja",
        question="Jesteśmy rodzicami adopcyjnymi albo zastępczymi",
        answer=(
            "Serwis obsługuje też adopcję i rodzinę zastępczą. Wybierz tę drogę w wywiadzie, "
            "a kalkulator i lista dokumentów dostosują się do waszej sytuacji."
        ),
        links=(
            AssistantLink(
                label="Kalkulator dla adopcji",
                href="/kalkulator",
                kind="page",
                description="Ta sama droga, inna sytuacja rodzinna.",
            ),
            AssistantLink(
                label="Dokumenty dla adopcji",
                href="/dokumenty?sytuacja=adoption",
                kind="page",
                description="Wnioski właściwe dla rodziców adopcyjnych.",
            ),
        ),
        phrases=("adopcyj", "przysposob", "rodzina zastepcz", "rodzic zastepcz", "zastepcz"),
        stems=("adopcyj", "przysposob", "zastepcz"),
    ),
    Topic(
        id="trudna_sytuacja",
        question="Jestem w trudnej sytuacji i potrzebuję pomocy",
        answer=(
            "Ekran wsparcia zbiera, gdzie szukać pomocy po poronieniu, po śmierci dziecka, "
            "przy wcześniaku i przy ciężkiej chorobie. Są tam organizacje i numery kontaktu."
        ),
        links=(
            AssistantLink(
                label="Wsparcie i trudne sytuacje",
                href="/wsparcie",
                kind="page",
                description="Organizacje, programy i kontakty dla rodzin.",
            ),
            FAMILY,
        ),
        phrases=(
            "trudnej sytuacji",
            "potrzebuje pomoc",
            "gdzie szukac pomoc",
            "szukam pomoc",
            "poronien",
            "smierc dziec",
            "wczesniak",
            "chore dziec",
            "kryzys",
            "przemoc",
            "depresj",
        ),
        stems=("wspar", "pomoc"),
    ),
    Topic(
        id="zaleglosci",
        question="Mam zaległości w składkach",
        answer=(
            "Zaległości wpływają na prawo do zasiłku, dlatego serwis pokazuje je razem ze stanem "
            "ubezpieczenia. Sprawdź, co wynika z twoich danych, i potwierdź to w ZUS."
        ),
        links=(
            AssistantLink(
                label="Symulacja ZUS",
                href="/zus",
                kind="page",
                description="Zaległości i ich wpływ na ubezpieczenie.",
            ),
            ZUS,
        ),
        phrases=("zaleglosci", "zadluzen", "nie zaplacone skladk", "dlug wobec zus", "komornik"),
        stems=("zalegl", "dlug", "skladk"),
    ),
    Topic(
        id="ezla",
        question="Gdzie zobaczę moje zwolnienie lekarskie?",
        answer=(
            "Zwolnienie wystawia lekarz, a jego dane widać w eZUS. W serwisie osobny ekran "
            "pokazuje, jak zwolnienie wpływa na zasiłek chorobowy i macierzyński."
        ),
        links=(
            AssistantLink(
                label="Symulacja ZUS",
                href="/zus",
                kind="page",
                description="Dane z ZUS, w tym wpływ zwolnienia na zasiłek.",
            ),
            AssistantLink(
                label="eZUS",
                href="https://www.zus.pl/ezus",
                kind="external",
                description="Zwolnienia lekarskie i stan sprawy.",
            ),
        ),
        phrases=(
            "zwolnienie lekarsk",
            "e zla",
            "zasilek chorobow",
            "chorobowe",
            "l4",
            "na zwolnieniu",
        ),
        stems=("zla", "zwolnien", "chorobow"),
    ),
    Topic(
        id="akt_urodzenia",
        question="Jak uzyskać odpis aktu urodzenia?",
        answer=(
            "Akt urodzenia wydaje urząd stanu cywilnego, a wniosek składasz osobiście albo "
            "elektronicznie. Formularz i miejsce złożenia znajdziesz przy dokumentach."
        ),
        links=(
            AssistantLink(
                label="Dokumenty i wnioski",
                href="/dokumenty",
                kind="page",
                description="Wnioski, także te urzędowe, i miejsce złożenia.",
            ),
            AssistantLink(
                label="gov.pl",
                href="https://www.gov.pl",
                kind="external",
                description="Serwis obywatelski z wnioskami urzędowymi.",
            ),
        ),
        phrases=("akt urodzen", "odpis akt", "urzad stanu cywiln", "usc"),
        stems=("urodzen", "odpis"),
    ),
    Topic(
        id="mobywatel",
        question="Jak zalogować się przez mObywatel?",
        answer=(
            "Na ekranie wejścia jest przycisk logowania przez mObywatel. W wersji "
            "demonstracyjnej logowanie jest symulowane, więc nie potrzebujesz prawdziwego konta."
        ),
        links=(
            AssistantLink(
                label="Wejście i logowanie",
                href="/wejscie",
                kind="page",
                description="mObywatel albo ręczne wpisanie danych.",
            ),
        ),
        phrases=("mobywatel", "jak sie zalogow", "sie zalogow", "logowanie przez"),
        stems=("mobywatel", "logow", "zalogow"),
    ),
    Topic(
        id="sprawy",
        question="Chcę zobaczyć gotową sprawę",
        answer=(
            "Zestaw spraw pokazuje wnioski od początku do decyzji. Wybierz jedną, a zobaczysz "
            "weryfikację ubezpieczenia, wyliczenie i porównanie z decyzją."
        ),
        links=(
            AssistantLink(
                label="Sprawy demonstracyjne",
                href="/sprawy",
                kind="page",
                description="Gotowe wnioski i porównanie z decyzją.",
            ),
        ),
        phrases=(
            "gotowa spraw",
            "przyklad spraw",
            "przykladowe wniosk",
            "zestaw spraw",
            "pokaz przyklad",
        ),
        stems=("przyklad", "demo"),
    ),
    Topic(
        id="instytucje",
        question="Do kogo zwrócić się poza serwisem?",
        answer=(
            "Sprawy zasiłkowe prowadzi ZUS, przepisy o urlopach rodzi ministerstwo rodziny, "
            "a praw pracowniczych pilnuje inspekcja pracy. Poniżej są ich oficjalne strony."
        ),
        links=(ZUS, FAMILY, PIP),
        phrases=(
            "zwrocic sie",
            "gdzie zglosic",
            "gdzie sie udac",
            "instytucje",
            "kontakt",
            "numer telefonu",
        ),
        stems=("instytuc", "kontakt", "urzad"),
    ),
)

FALLBACK_ANSWER = (
    "Tego pytania nie obejmuje zakres serwisu, więc nie podaję odpowiedzi, której nie mogę "
    "potwierdzić. Oficjalne strony są poniżej: sprawy zasiłkowe prowadzi ZUS, przepisy o urlopach "
    "Ministerstwo Rodziny, Pracy i Polityki Społecznej, a praw pracowniczych Państwowa Inspekcja "
    "Pracy."
)

BY_ID = {topic.id: topic for topic in TOPICS}


def _normalise(text: str) -> str:
    """Sprowadza pytanie do małych liter bez ogonków, żeby porównanie było odporne na pisownię."""
    lowered = text.lower().replace("ł", "l")
    decomposed = unicodedata.normalize("NFKD", lowered)
    ascii_text = "".join(char for char in decomposed if not unicodedata.combining(char))
    words = re.sub(r"[^a-z0-9]+", " ", ascii_text).strip()
    return f" {words} "


def _score(topic: Topic, words: list[str]) -> int:
    score = 0
    for phrase in topic.phrases:
        if _contains_phrase(words, phrase):
            score += PHRASE_WEIGHT
    for stem in topic.stems:
        if any(word.startswith(stem) for word in words):
            score += STEM_WEIGHT
    return score


def _contains_phrase(words: list[str], phrase: str) -> bool:
    """Fraza to ciąg początków słów, więc "oboje rodzic" łapie też "oboje rodzicami"."""
    parts = phrase.split()
    span = len(parts)
    for start in range(len(words) - span + 1):
        if all(
            word.startswith(part)
            for word, part in zip(words[start : start + span], parts, strict=True)
        ):
            return True
    return False


def ranked_topics(question: str) -> list[tuple[Topic, int]]:
    """Tematy posortowane od najlepiej dopasowanego. Przydaje się w testach i w podpowiedziach."""
    words = _normalise(question).split()
    scored = [(_score(topic, words), topic) for topic in TOPICS]
    scored = [pair for pair in scored if pair[0] > 0]
    scored.sort(key=lambda pair: (-pair[0], TOPICS.index(pair[1])))
    return [(topic, score) for score, topic in scored]


def public_topics() -> list[AssistantTopic]:
    """Pytania startowe, które strona pokazuje jako podpowiedzi."""
    return [topic.public() for topic in TOPICS]


def _context_text(history: Sequence[AssistantTurn]) -> str:
    """Poprzednie pytania jako jeden tekst, żeby dopytanie miało do czego nawiązać."""
    return " ".join(turn.question for turn in history[-CONTEXT_TURNS:])


def suggestions_for(question: str, chosen: str | None, limit: int = 3) -> list[AssistantTopic]:
    """Następne pytania pod odpowiedzią.

    Najpierw te, które pasują do samego pytania, potem te, które prowadzą do tej samej
    strony co wybrany temat, a na końcu reszta katalogu. Dzięki temu podpowiedzi trzymają
    się tematu rozmowy, a nie zawsze tych samych trzech pytań.
    """
    picked = [topic for topic, _score in ranked_topics(question) if topic.id != chosen]

    chosen_topic = BY_ID.get(chosen) if chosen else None
    if chosen_topic is not None:
        chosen_pages = {link.href for link in chosen_topic.links}
        for topic in TOPICS:
            if len(picked) >= limit:
                break
            if topic.id == chosen or topic in picked:
                continue
            if any(link.href in chosen_pages for link in topic.links):
                picked.append(topic)

    for topic in TOPICS:
        if len(picked) >= limit:
            break
        if topic.id != chosen and topic not in picked:
            picked.append(topic)
    return [topic.public() for topic in picked[:limit]]


def build_answer(
    topic: Topic,
    question: str,
    history: Sequence[AssistantTurn] = (),
    mode: Mode = "catalog",
) -> AssistantAnswer:
    """Jedno miejsce, w którym powstaje odpowiedź, dla katalogu i dla modelu."""
    context = _context_text(history)
    asked = f"{context} {question}".strip()
    return AssistantAnswer(
        topic=topic.id,
        answer=topic.answer,
        links=list(topic.links),
        suggestions=suggestions_for(asked, topic.id),
        mode=mode,
    )


def _from_context(
    question: str,
    matches: list[tuple[Topic, int]],
    history: Sequence[AssistantTurn],
) -> Topic | None:
    """Dopytanie z jednym słowem kluczowym: kontekst rozstrzyga, ale tylko wśród tematów,
    na które wskazuje samo pytanie. Dzięki temu "a co z dokumentami?" nie wraca do wniosku."""
    context = _context_text(history)
    if not context:
        return None
    context_scores = {topic.id: score for topic, score in ranked_topics(context)}
    best = max(matches, key=lambda pair: (context_scores.get(pair[0].id, 0), pair[1]))
    return best[0]


def ask(
    question: str,
    history: Sequence[AssistantTurn] = (),
) -> AssistantAnswer:
    """Odpowiada nawigacją. Nieznane pytanie dostaje odesłania, a nie zgadywanie."""
    matches = ranked_topics(question)
    if not matches:
        return AssistantAnswer(
            topic=None,
            answer=FALLBACK_ANSWER,
            links=list(FALLBACK_LINKS),
            suggestions=suggestions_for(f"{_context_text(history)} {question}", None, 4),
        )

    if matches[0][1] <= WEAK_SCORE:
        resolved = _from_context(question, matches, history)
        if resolved is not None:
            return build_answer(resolved, question, history)
    return build_answer(matches[0][0], question, history)
