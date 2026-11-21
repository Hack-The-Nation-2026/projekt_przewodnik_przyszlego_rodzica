# Backend — Zasiłkowy Przewodnik Przyszłego Rodzica

REST API w FastAPI, które obsłuży logikę uprawnień i kalkulatorów zasiłków.
Na razie szkielet, treść wyzwania dopiszemy później.

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

## Logowanie przez mObywatel

`POST /api/auth/mobywatel` sprawdza login i hasło, a potem oddaje dane obywatela. Jako login
przyjmuje też numer PESEL. Hasło do wszystkich kont demonstracyjnych to `demo1234`.

Listę kont zwraca `GET /api/auth/mobywatel/demo-accounts`, żeby frontend miał z czego zrobić
podpowiedź przy demie. Endpoint odpowiada 404, gdy `ENVIRONMENT=prod`.
