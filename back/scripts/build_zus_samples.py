"""Buduje `app/data/zus-samples.json` z zestawu przykładowego ZUS.

Skany leżą w `PRZYKLADY/` (poza repozytorium). Do kodu trafia tylko to, co potrzebne do
rozpoznania sprawy: odcisk SHA-256, wzory formularzy, rodzaj świadczeń, wynik z materiału
i krótki opis stanu faktycznego. Treści dokumentów nie kopiujemy.

OCR jest opcjonalny. Gdy katalogi z cache istnieją (`--cover-dir`, `--pages-dir`), skrypt
bierze z nich tekst pierwszej strony i pozostałych stron. Bez OCR-a zostają same heurystyki
z nazwy pliku.

Cache robi się raz, na wyrenderowanych stronach:

    pdftoppm -r 250 -png plik.pdf strona            # pierwsza strona
    tesseract strona-1.png stdout -l pol --psm 4    # język polski z tessdata_fast
    pdftoppm -f 2 -r 120 -png plik.pdf reszta
    tesseract reszta-2.png stdout -l pol --psm 6

    python3 scripts/build_zus_samples.py --cover-dir /tmp/ocr-cover --pages-dir /tmp/ocr-pages
"""

import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SAMPLES_DIR = ROOT.parent / "PRZYKLADY"
TARGET = ROOT / "app" / "data" / "zus-samples.json"

FEMALE = {
    "Agata", "Agnieszka", "Alicja", "Alina", "Anna", "Barbara", "Cecylia", "Dagmara",
    "Dorota", "Ewa", "Helena", "Janina", "Joanna", "Jolanta", "Julia", "Justyna",
    "Karolina", "Katarzyna", "Kinga", "Krystyna", "Małgorzata", "Natalia", "Paulina",
    "Pola", "Sylwia", "Teresa", "Zofia", "Zuzanna",
}

BENEFITS = [
    ("w wysokości zasiłku macierzyńskiego", "w_wysokosci_macierzynskiego"),
    ("w wysokości zas. mac", "w_wysokosci_macierzynskiego"),
    ("uzupełniając", "uzupelniajacy"),
    ("uzup.", "uzupelniajacy"),
    ("rodzicielsk", "rodzicielski"),
    ("ojcowsk", "ojcowski"),
    ("chorobow", "chorobowy_w_ciazy"),
    ("rehabilitacyj", "rehabilitacyjne"),
    ("macierzyńs", "macierzynski"),
    ("mac.", "macierzynski"),
]

TAGS = [
    ("martwe urodzenie", "martwe_urodzenie"),
    ("martwourodzone", "martwe_urodzenie"),
    ("wcześniak", "wczesniak"),
    ("bliźni", "bliznieta"),
    ("za życiem", "zaswiadczenie_za_zyciem"),
    ("przyjęcie dziecka", "przyjecie_na_wychowanie"),
    ("przyjęcia dziecka", "przyjecie_na_wychowanie"),
    ("przysposobienie", "przysposobienie"),
    ("rodzina zastępcza", "rodzina_zastepcza"),
    ("osoba współpracująca", "osoba_wspolpracujaca"),
    ("zadłużenie", "zadluzenie"),
    ("zlecenie", "umowa_zlecenie"),
    ("likwidacj", "likwidacja_pracodawcy"),
    ("rezygnacja", "rezygnacja_z_urlopu"),
    ("urlop ojcowski", "urlop_ojcowski"),
    ("9 tygodni", "dziewiec_tygodni"),
    ("9 tyg", "dziewiec_tygodni"),
    ("przed przewidywaną datą porodu", "przed_terminem"),
    ("po ustaniu ubezp", "po_ustaniu_ubezpieczenia"),
    ("brak ubezpieczenia", "brak_ubezpieczenia"),
    ("nie podlega ubezpieczeniom", "brak_ubezpieczenia"),
    ("nie podlega ubezp", "brak_ubezpieczenia"),
    ("brak zgłoszenia", "brak_ubezpieczenia"),
    ("umowa dla pozoru", "umowa_pozorna"),
    ("pozoru", "umowa_pozorna"),
    ("łączenie urlopu", "laczenie_z_praca"),
    ("łącznie urlop", "laczenie_z_praca"),
    ("podwyższenie", "podwyzszenie_swiadczenia"),
    ("zatrudnienie do dnia porodu", "zatrudnienie_do_dnia_porodu"),
    ("przyznająca", "decyzja_przyznajaca"),
    ("odmowa", "decyzja_odmowna"),
    ("odmowna", "decyzja_odmowna"),
]

ABBREVIATIONS = [
    ("w wysokości zas. mac.", "w wysokości zasiłku macierzyńskiego"),
    ("w wysokości zas.mac.", "w wysokości zasiłku macierzyńskiego"),
    ("zas.mac.", "zasiłek macierzyński"),
    ("zas. mac.", "zasiłek macierzyński"),
    ("zas.chorobowy", "zasiłek chorobowy"),
    ("zas. chorobowy", "zasiłek chorobowy"),
    ("zas.chor.", "zasiłek chorobowy"),
    ("zas. chor.", "zasiłek chorobowy"),
    ("zas.", "zasiłek"),
    ("url.mac.", "urlop macierzyński"),
    ("url. mac.", "urlop macierzyński"),
    ("ur. mac.", "urlop macierzyński"),
    ("url.rodz.", "urlop rodzicielski"),
    ("url. rodz.", "urlop rodzicielski"),
    ("ur. rodz.", "urlop rodzicielski"),
    ("u. mac.", "urlop macierzyński"),
    ("u. rodz.", "urlop rodzicielski"),
    ("uzup.", "uzupełniający"),
    ("mac.", "macierzyński"),
    ("rodz.", "rodzicielski"),
    ("ubezp.", "ubezpieczenie"),
    ("łęczenie", "łączenie"),
]

FORM_PATTERNS = [
    ("ZAM", r"\bZAM\b"),
    ("Z-3", r"\bZ-3\b"),
    ("Z-3b", r"\bZ-3b\b"),
    ("ZAS-12", r"\bZAS-?12\b"),
    ("ZAS-54", r"\bZAS-?54\b"),
    ("Z-15A", r"\bZ-?15A\b"),
    ("Odpis aktu urodzenia", r"Odpis skr\u00f3cony aktu urodzenia"),
    ("Zaświadczenie o pobycie dziecka w szpitalu", r"pobycie .{0,20}szpital"),
    ("Zaświadczenie płatnika składek", r"Za\u015bwiadczenie p\u0142atnika sk\u0142adek"),
]

OUTCOME_FROM_TEXT = [
    ("denied", r"w sprawie odm\u00f3wiono|odm\u00f3wiono przyznania|odmowiono przyznania"),
    ("granted", r"w sprawie przyznano zasi\u0142ek|zasi\u0142ek przyznano|"
                r"przyznano prawo do zasi\u0142ku|przyznano prawo do zasilku"),
    ("denied", r"odmow|nie przys\u0142uguje|brak prawa|nie podlega ubezpieczeniu chorobowemu"),
    ("granted", r"wyp\u0142acono \u015bwiadczenia|wyp\u0142ata zasi\u0142ku|wyp\u0142acony|przyznano prawo|"
                r"decyzja przyznaj\u0105ca|ustalono uprawnienia"),
    ("partially_granted", r"cz\u0119\u015bciow"),
]

OUTCOME_FROM_NAME = [
    ("denied", ("odmow", "brak ubezpieczenia", "nie podlega ubezpieczeniom", "pozoru",
                "bez chorobowego", "brak zgłoszenia")),
    ("granted", ("przyznając", "przyznanie prawa", "prawo do zasiłku", "podwyższenie kwoty")),
]

BENEFIT_TITLES = {
    "macierzynski": "zasiłek macierzyński",
    "uzupelniajacy": "uzupełniający urlop macierzyński",
    "rodzicielski": "zasiłek za urlop rodzicielski",
    "ojcowski": "zasiłek za urlop ojcowski",
    "chorobowy_w_ciazy": "zasiłek chorobowy w ciąży",
    "w_wysokosci_macierzynskiego": "zasiłek w wysokości zasiłku macierzyńskiego",
    "rehabilitacyjne": "świadczenie rehabilitacyjne",
}


def read_ocr(cover_dir: Path | None, pages_dir: Path | None, stem: str) -> str:
    """Tekst okładki plus pozostałych stron zestawu, jeżeli cache OCR istnieje."""
    chunks: list[str] = []
    if cover_dir is not None:
        cache = cover_dir / (stem + ".json")
        if cache.exists():
            payload = json.loads(cache.read_text(encoding="utf-8"))
            text = payload.get("text", "")
            chunks.append(text if isinstance(text, str) else " ".join(text))
    if pages_dir is not None:
        cache = pages_dir / (stem + ".json")
        if cache.exists():
            payload = json.loads(cache.read_text(encoding="utf-8"))
            text = payload.get("text", [])
            chunks.append(" ".join(text) if isinstance(text, list) else text)
    return " ".join(chunks)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def page_count(path: Path) -> int:
    info = subprocess.run(["pdfinfo", str(path)], capture_output=True, text=True, check=True)
    for line in info.stdout.splitlines():
        if line.startswith("Pages:"):
            return int(line.split()[-1])
    return 1


def strip_prefix(stem: str) -> str:
    """Usuwa imię, nazwisko i numer zestawu, zostawia opis sprawy."""
    match = re.match(r"^([^\s_]+(?:\s+[^\s_]+){0,2}?)\s*_\s*(?:\d+\s*_\s*)?(.*)$", stem)
    if match and len(match.group(2)) > 8:
        return match.group(2).strip(" _")
    head, _, tail = stem.partition("_")
    if tail and len(tail) > 8:
        return tail.strip(" _")
    return re.sub(r"^[^\s]+\s+[^\s]+\s*[-_]?\s*", "", stem)


def person(stem: str) -> tuple[str, str]:
    """Imię decyduje o płci sprawy, ale opis może ją odwrócić: „dla ojca”, „matka nieubezpieczona”."""
    first = stem.split()[0]
    lowered = stem.lower()
    if "dla ojca" in lowered or "ojca" in lowered.split("_")[-1]:
        return "Ojciec", "father"
    if "matka" in lowered and "nieubezpieczona matka" not in lowered:
        return "Matka", "mother"
    if first in FEMALE:
        return "Matka", "mother"
    return "Ojciec", "father"


def benefits_of(text: str) -> list[str]:
    """Kolejność według pierwszego wystąpienia, żeby tytuł czytał się jak opis sprawy."""
    lowered = text.lower()
    hits: list[tuple[int, str]] = []
    for needle, code in BENEFITS:
        position = lowered.find(needle)
        if position < 0:
            continue
        hits.append((position, code))
        lowered = lowered[:position] + "\0" * len(needle) + lowered[position + len(needle):]
    found: list[str] = []
    for _, code in sorted(hits):
        if code not in found:
            found.append(code)
    return found or ["macierzynski"]


def tags_of(text: str) -> list[str]:
    lowered = text.lower()
    tags: list[str] = []
    for needle, tag in TAGS:
        if needle in lowered and tag not in tags:
            tags.append(tag)
    return tags


def outcome_of(text: str, ocr_text: str) -> str:
    lowered = text.lower()
    for value, needles in OUTCOME_FROM_NAME:
        if any(needle in lowered for needle in needles):
            return value
    for value, pattern in OUTCOME_FROM_TEXT:
        if re.search(pattern, ocr_text.lower()):
            return value
    return "unknown"


def forms_of(ocr_text: str) -> list[str]:
    forms: list[str] = []
    for label, pattern in FORM_PATTERNS:
        if re.search(pattern, ocr_text, re.IGNORECASE) and label not in forms:
            forms.append(label)
    return forms


STRONG_EVIDENCE = [
    r"w sprawie przyznano zasi\u0142ek[^.!|\u2014-]{0,40}",
    r"zasi\u0142ek przyznano",
    r"przyznano prawo do zasi\u0142ku[^.!|]{0,70}",
    r"decyzja przyznaj\u0105ca zasi\u0142ek[^.!|]{0,120}",
    r"w sprawie odm\u00f3wiono[^.!|\u2014-]{0,70}",
    r"nie podlega ubezpieczeniu chorobowemu",
]


def evidence_of(ocr_text: str) -> str:
    """Zdanie z materiału, które mówi o wyniku sprawy.

    OCR skanów czyta formularze raz lepiej, raz gorzej, więc bierzemy tylko frazy, które
    da się rozpoznać jednoznacznie, i odrzucamy resztki, w których przeważa szum.
    """
    lowered = ocr_text.lower()
    for pattern in STRONG_EVIDENCE:
        match = re.search(pattern, lowered)
        if not match:
            continue
        snippet = re.sub(r"\s+", " ", ocr_text[match.start():match.end()]).strip(" .,|;:-")
        following = ocr_text[match.end():match.end() + 1]
        if following.isalpha():
            snippet = snippet.rsplit(" ", 1)[0]
        words = snippet.split()
        while words and (
            len(words[-1]) <= 2
            or re.fullmatch(r"[\d\-–]+", words[-1])
            or words[-1].endswith(":")
            or re.search(r"[^0-9A-Za-zĄ-ż\-]", words[-1])
        ):
            words.pop()
        snippet = " ".join(words).strip(" .,|;:-\u2014")
        letters = sum(char.isalpha() or char.isspace() for char in snippet)
        if len(snippet) < 20 or letters / len(snippet) < 0.85:
            continue
        return snippet[:400]
    return ""


def facts_of(description: str, outcome: str) -> str:
    text = description.replace("_", ", ").replace(", ,", ",").lower()
    for pattern, replacement in ABBREVIATIONS:
        text = text.replace(pattern, replacement)
    parts = [part.strip(" .,") for part in re.split(r"\s+-\s+", text) if part.strip(" .,")]
    sentences: list[str] = []
    for part in parts:
        if not part:
            continue
        sentences.append(part[0].upper() + part[1:] + ".")
        if len(" ".join(sentences)) > 420:
            break
    outcome_sentence = {
        "granted": "ZUS przyznał świadczenie.",
        "denied": "ZUS odmówił prawa do świadczenia.",
        "partially_granted": "ZUS przyznał świadczenie częściowo.",
        "unknown": "Wynik sprawy nie jest zapisany w zestawie.",
    }[outcome]
    if outcome == "unknown" or outcome_sentence not in sentences:
        sentences.append(outcome_sentence)
    return " ".join(sentences)[:600]


def title_of(benefits: list[str]) -> str:
    names = [BENEFIT_TITLES.get(code, code) for code in benefits]
    head = names[0]
    return (head[0].upper() + head[1:] + (", " + ", ".join(names[1:]) if len(names) > 1 else ""))[:160]


def build(cover_dir: Path | None, pages_dir: Path | None) -> list[dict]:
    files = sorted(SAMPLES_DIR.glob("*.pdf"))
    if not files:
        raise SystemExit(f"Brak plików PDF w {SAMPLES_DIR}")
    entries: list[dict] = []
    by_name: dict[str, str] = {}
    for index, path in enumerate(files, start=1):
        sample_id = f"ZUS-{index:03d}"
        stem = path.stem
        ocr_text = read_ocr(cover_dir, pages_dir, stem)
        description = strip_prefix(stem)
        label, role = person(stem)
        benefits = benefits_of(description)
        tags = tags_of(description + " " + stem)
        outcome = outcome_of(description, ocr_text)
        forms = forms_of(ocr_text)
        entry = {
            "id": sample_id,
            "sha256": digest(path),
            "file_name": path.name,
            "pages": page_count(path),
            "title": title_of(benefits),
            "facts": facts_of(description, outcome),
            "outcome": outcome,
            "evidence": evidence_of(ocr_text),
            "benefits": benefits,
            "tags": tags,
            "forms": forms,
            "role": role,
            "applicant": {
                "label": label,
                "employment": (
                    "contractor" if "zlecenie" in description.lower()
                    else "self_employed" if "współpracując" in description.lower()
                    or "działalność" in description.lower()
                    else "employee"
                ),
                "insured": (
                    False if {"brak_ubezpieczenia", "umowa_pozorna"} & set(tags)
                    else None
                ),
                "insurance_kind": None,
            },
            "duplicate_of": None,
        }
        base = re.sub(r"\s*\(\d+\)$", "", stem)
        if base in by_name:
            entry["duplicate_of"] = by_name[base]
            entry["facts"] = "Ten sam zestaw co " + by_name[base] + "."
        else:
            by_name[base] = sample_id
        entries.append(entry)
    return entries


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cover-dir", type=Path, default=None,
                        help="cache OCR pierwszej strony zestawu")
    parser.add_argument("--pages-dir", type=Path, default=None,
                        help="cache OCR pozostałych stron zestawu")
    args = parser.parse_args()
    entries = build(args.cover_dir, args.pages_dir)
    TARGET.write_text(json.dumps(entries, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    unknown = sum(1 for entry in entries if entry["outcome"] == "unknown")
    print(f"Zapisano {len(entries)} spraw do {TARGET}")
    print(f"Bez rozstrzygnięcia: {unknown}")


if __name__ == "__main__":
    main()