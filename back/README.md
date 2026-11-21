# Backend: Skrzydła Rodzica

REST API w FastAPI z katalogiem świadczeń i symulacją uprawnień dla rodziców.

## Uruchomienie

W repo jest już gotowe środowisko `.venv` z zainstalowanymi zależnościami, więc wystarczy je
aktywować:

```bash
cd back
source .venv/bin/activate
cp .env.example .env
uvicorn app.main:app --reload
```

Od zera, gdyby środowiska nie było, najszybciej pójdzie to przez `uv`:

```bash
cd back
uv venv .venv
uv pip install -r requirements-dev.txt
```

Klasyczne `pip` też działa, bo `pip` jest w środku `.venv`. Ważne, żeby instalować zależności
przez `pip` z aktywnego środowiska. Systemowy `pip` w Debianie jest zablokowany (PEP 668) i
zwróci błąd `externally-managed-environment`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
```

Dokumentacja API: http://localhost:8000/docs

## Struktura

```
back/
├── app/
│   ├── main.py            # tworzenie aplikacji FastAPI
│   ├── core/config.py     # konfiguracja ze zmiennych środowiskowych
│   ├── api/
│   │   ├── router.py      # spina wszystkie routery
│   │   └── routes/        # endpointy (health, benefits, auth)
│   ├── schemas/           # modele wejścia i wyjścia (pydantic)
│   └── services/          # logika domenowa
└── tests/
```

## Testy

```bash
cd back
pytest
```

## Symulacja świadczeń

`POST /api/benefits/simulate` jest dostępny w [Swagger UI](http://localhost:8000/docs).
Przykładowe wejście dla dwojga rodziców z osobnymi podstawami wymiaru:

```json
{
  "family": {
    "event": "birth",
    "event_date": "2026-06-01",
    "first_parent": {"employment": "employee", "sickness_insured": true, "monthly_basis_grosze": 600000},
    "second_parent": {"employment": "employee", "sickness_insured": true, "monthly_basis_grosze": 480000},
    "claims": [
      {"benefit": "macierzynski"},
      {"benefit": "rodzicielski", "days": 224},
      {"benefit": "rodzicielski", "person": "second_parent", "days": 63}
    ]
  }
}
```

Wynik zawiera okresy z datami włącznie, kwoty w groszach, numery reguł z `RULES.md`
i powód rozstrzygnięcia. `missing_data` oznacza, że brakuje faktu potrzebnego do oceny prawa.
Przy ustalonym prawie i nieznanej podstawie kwota ma wartość `null`.

Przy urodzeniu `first_parent` oznacza matkę, a `second_parent` drugiego rodzica. Wnioski
w `claims` rozpatrywane są w podanej kolejności. Dla `rodzicielski` wartość `days` na wejściu
zużywa wspólną pulę przed wydłużeniem. Odpowiedź rozróżnia `base_days_used` i faktyczny czas
świadczenia w `days`. Użyte wcześniej części i dni można podać w `parental_parts_already_used`
i `parental_days_already_used`. Przy niepełnym etacie podajcie wymiar umowy w
`contractual_work_percent` i część pełnego etatu wykonywaną podczas urlopu w `work_percent`.

Pozostałe sekcje żądania obejmują `pregnancy_sickness`, `rehabilitation`, `post_employment`
i `maternity_top_ups`. `monthly_basis_grosze` to ustalona podstawa miesięczna. Pole
`fixed_monthly_gross_grosze` służy do prostego przeliczenia, gdy stałe wynagrodzenie jest
jedynym składnikiem podstawy. Przy złożonej historii zatrudnienia podajcie ustaloną podstawę.
Wskaźnik waloryzacji świadczenia rehabilitacyjnego podaje się jako mnożnik, np. `"1.1"`.

Do porównań z dokumentami rozpoznanymi na HackNation służy `pytest tests/test_zus_calculation.py`.
Testy korzystają z ignorowanych plików `PRZYKLADY/zestaw-testowy.json` i
`PRZYKLADY/krok-3-symulacje.json`. Drugi zawiera żądania dla kalkulatora i określa,
co dało się potwierdzić w danej sprawie. Bez obu plików testy referencyjne są pomijane.

## Logowanie przez mObywatel

`POST /api/auth/mobywatel` sprawdza login i hasło, a potem oddaje dane obywatela. Jako login
przyjmuje też numer PESEL. Hasło do wszystkich kont demonstracyjnych to `demo1234`.

Listę kont zwraca `GET /api/auth/mobywatel/demo-accounts`, żeby frontend miał z czego zrobić
podpowiedź przy demie. Endpoint odpowiada 404, gdy `ENVIRONMENT=prod`.

## Wejście bez logowania

`POST /api/auth/manual` przyjmuje imię, nazwisko, 11-cyfrowy PESEL i opcjonalny opis sytuacji,
a oddaje ten sam kształt `Citizen` co mObywatel. Profil dostaje kod `WPISANE-RECZNIE`, status
`brak danych z ZUS` i `source` równy `manual`, więc frontend odróżnia dane z konta od wpisanych
z ręki. Sumy kontrolnej PESEL nie liczymy, bo demo nie ma blokować osoby z numerem przykładowym.

```json
{
  "first_name": "Katarzyna",
  "last_name": "N.",
  "pesel": "44051401359",
  "case_label": "Ciąża, jeden poród"
}
```

Pole `source` na `Citizen` mówi, którą drogą dane przyszły: `mobywatel` albo `manual`.
