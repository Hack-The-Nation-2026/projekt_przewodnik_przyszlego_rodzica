# zadanie-rodzice

Build repo for the HackNation 2026 challenge **Zasiłkowy Przewodnik Przyszłego Rodzica** (ZUS).
Workspace rules — sources, skills, playbook upkeep — live in `../AGENTS.md`.

## Layout

- `back/` — FastAPI service
- `front/` — Vite + React, Tailwind, shadcn-style components
- `OPIS/`, `PRZYKLADY/` — ZUS materials. Gitignored. Never commit them, never copy them out of
  this repo; the challenge Regulamin forbids distributing them.

## Frontend layout

- Every page under the site header renders inside `PageContainer` from
  `front/src/components/layout/page-container.tsx`. It holds one content width (`max-w-4xl`), so a
  card keeps its size when the user moves between the entry screen, the calculator, the benefits
  list and the rest. Pass padding and flex classes through `className`, never another `max-w-*`.
- Two layouts stand outside the rule: the home page, a wide marketing grid on `max-w-7xl`, and the
  mObywatel login screen, a full-screen simulation with its own palette.

## Commands

```bash
cd back  && source .venv/bin/activate && uvicorn app.main:app --reload   # :8000
cd front && npm run dev                                                  # :5173
cd back  && ./.venv/bin/python -m pytest -q
cd front && npm run build && npm run lint
```

The user starts the dev servers themselves. Don't leave one running in the background unless asked,
and stop anything you started before you finish.

## Git

Commit and push your own work. A change that is finished and verified should not sit uncommitted.

- Commit once a coherent change is done: it does one thing and fits in one line. Don't batch
  unrelated work, don't commit every file edit separately — and when in doubt, commit sooner.
- Push to `origin/main` in the same turn. No need to ask first.
- Verify before committing: `pytest` in `back/`, `npm run build` and `npm run lint` in `front/`.
  Never commit a state that fails the check covering that change.
- Subject in the imperative under ~72 characters; add a body only for a "why" that isn't obvious.
- Never commit secrets or `.env`. Check `git status` for ZUS materials before any `git add -A`.
  Never force-push `main`.
- If a commit or push is rejected, report it. Don't retry silently.

## Notes

- `.venv` was made by `uv` and carries `pip`, so `pip install -r requirements-dev.txt` works inside
  it. The system `pip` is blocked by PEP 668.
- OpenCode probes `127.0.0.1:8000/health` looking for a local vLLM server. Those 404s are harmless;
  `--log-level warning` quiets them.
