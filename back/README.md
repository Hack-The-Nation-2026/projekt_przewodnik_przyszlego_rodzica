# Backend — Zasiłkowy Przewodnik Przyszłego Rodzica

REST API w FastAPI, które obsłuży logikę uprawnień i kalkulatorów zasiłków.
Na razie szkielet, treść wyzwania dopiszemy później.

## Uruchomienie

```bash
cd back
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload
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
│   │   └── routes/        # endpointy (health, benefits)
│   ├── schemas/           # modele wejścia i wyjścia (pydantic)
│   └── services/          # logika domenowa
└── tests/
```

## Testy

```bash
cd back
pytest
```
