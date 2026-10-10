# Karobaar AI — Backend

Voice-first financial evidence and decision support for informal Pakistani merchants
(kiryana stores, tailors, mechanics). Built for the **Alibaba Cloud AI Hackathon
Pakistan 2026** — Financial Inclusion track.

A merchant speaks one sentence in Urdu / Roman Urdu ("Ahmed ne paanch hazaar ka maal
udhaar liya"), snaps a receipt, or asks a question ("Total udhaar kitna hai?") — and
gets structured, trustworthy financial records plus a **Financial Evidence Passport**
they can show to microfinance lenders.

## Core design rule

> **AI captures and explains. SQL computes every number.**

The LLM never performs arithmetic and never writes to the ledger directly:

- Voice/receipt -> AI **draft** -> merchant reviews -> only then `POST /api/events` saves it.
- "Ask Karobaar" -> LLM **picks a tool** -> SQL computes the value -> LLM only **phrases** the given numbers.
- Financing matching says *"appears to meet"* / *"requirements pending"* — never
  "eligible" or "approved".

## Tech stack

| Layer | Choice |
|---|---|
| API | FastAPI + Pydantic v2 (OpenAPI at `/docs`) |
| DB | SQLAlchemy 2.0 ORM + SQLite (Postgres-ready via `DATABASE_URL`) |
| AI — first priority | **Groq** — `qwen/qwen3-32b` (text/JSON), `whisper-large-v3-turbo` (audio), `meta-llama/llama-4-scout-17b-16e-instruct` (receipt vision) |
| AI — fallback | **Google Gemini** — `gemini-2.5-flash` (text, vision, audio) |
| AI — floor | **Demo provider** — deterministic rule-based parser, never fails |

Per-call fallback chain: `Groq -> Gemini -> Demo`. A rate-limited Groq call silently
routes to Gemini for that one request; malformed model JSON gets one repair retry on
the same provider before moving down the chain. With no API keys at all, the whole
product still runs end-to-end in demo mode.

## Quickstart

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Optional: put real keys in .env (see .env.example). Without keys -> demo mode.
uvicorn app.main:app --reload --port 8000
```

- Swagger UI: http://localhost:8000/docs
- On first start the DB is created and auto-seeded with a deterministic 3.5-month
  kiryana-store dataset (63 events, 5 customers) so every screen has data immediately.

## Configuration (`.env`)

| Variable | Default | Meaning |
|---|---|---|
| `AI_PROVIDER` | `auto` | `auto` \| `groq` \| `gemini` \| `demo` |
| `GROQ_API_KEY` | *(empty)* | Groq key (from console.groq.com) |
| `GEMINI_API_KEY` | *(empty)* | Google AI Studio key |
| `GROQ_TEXT_MODEL` | `qwen/qwen3-32b` | extraction / question / answer model |
| `GROQ_AUDIO_MODEL` | `whisper-large-v3-turbo` | transcription |
| `GROQ_VISION_MODEL` | `meta-llama/llama-4-scout-17b-16e-instruct` | receipt OCR |
| `GEMINI_MODEL` | `gemini-2.5-flash` | fallback for all capabilities |
| `DATABASE_URL` | `sqlite:///./karobaar.db` | any SQLAlchemy URL |
| `UPLOADS_DIR_PATH` | `uploads` | receipt evidence storage |
| `CORS_ORIGINS` | `http://localhost:3000,...` | comma-separated frontend origins |
| `AUTO_SEED` | `true` | seed the demo dataset when the DB is empty |

## API

All routes are under `/api`. Money crosses the API as **integer paisa**
(1 PKR = 100 paisa) plus a ready-to-render `*_display` string.

| Method & Path | Purpose |
|---|---|
| `GET /api/health` | Liveness; `?verify=true` pings every provider |
| `POST /api/capture/transcribe` | Audio (multipart) -> transcript (Whisper) |
| `POST /api/capture/extract` | Transcript/text -> reviewable draft event (nothing saved) |
| `POST /api/capture/extract-receipt` | Receipt photo (multipart) -> draft + evidence saved to `uploads/` |
| `POST /api/events` | **Confirm** a draft/manual event into the ledger |
| `GET /api/events` | List with filters: `event_type, customer_id, payment_status, source_type, from, to, limit, offset` |
| `GET /api/events/{id}` / `PATCH` / `DELETE` | Read / edit amount-date-notes / remove |
| `GET /api/customers` / `GET /api/customers/{id}` | Udhaar book (biggest debtor first) / full statement |
| `GET /api/dashboard` | One call for the whole home screen |
| `GET /api/ask/suggestions` | Starter questions + supported tools |
| `POST /api/ask` | Ask Karobaar (interpret -> SQL tool -> phrase) |
| `GET /api/evidence/passport` | Financial Evidence Passport |
| `GET /api/financing/programs` | 4 real Pakistani financing programs |
| `GET /api/financing/readiness` | Metric requirements matched/missing; manual ones = next steps |
| `POST /api/reminders/draft` | AI-drafted payment reminder (merchant edits & sends) |
| `POST /api/demo/seed` / `POST /api/demo/reset` | Load / wipe the demo dataset |

Error envelope: `{"error": {"type": "not_found" | "validation_error" | "ai_unavailable" | ..., "message": "..."}}`
with status 404 / 422 / 503.

## Deterministic domain rules

- **Money** is integer paisa end-to-end; floats exist only at the AI boundary and are
  converted exactly once (`rupees_to_paisa`).
- **FIFO udhaar settlement** — `recompute_customer_settlement()` replays every confirmed
  payment against that customer's credit sales oldest-first. Create/update/delete all
  funnel through it, so balances can never drift. A "mark paid" button does not exist:
  the merchant records a `payment_received` event instead.
- **Only confirmed events** count in every metric, passport figure, and Ask answer.
- **Duplicates** are flagged (same type + customer + amount + date) before saving.
- **PKT timezone** (UTC+5) drives every "today", month bucket, and overdue decision
  (> 30 days unpaid = overdue).
- **Ask Karobaar tools** are SQL-backed (`total_outstanding`, `top_debtor`,
  `monthly_sales`, `sales_comparison`, `customer_outstanding`); unknown intents get an
  honest "I can't answer that" plus suggestions.
- The **Passport** reports qualitative labels (recovery pattern, revenue consistency,
  customer concentration) — explicitly not a credit score.

## Project structure

```
Backend/
├── app/
│   ├── main.py            # FastAPI app, lifespan, CORS, error handlers
│   ├── config.py          # env settings + provider chain resolution
│   ├── db.py              # engine, sessions, PKT/month helpers
│   ├── models.py          # Customer, BusinessEvent (integer paisa)
│   ├── errors.py          # domain errors -> HTTP mapping
│   ├── schemas/           # Pydantic contracts (single source of response truth)
│   ├── ai/                # base protocol, prompts, Groq, Gemini, Demo, FallbackAdapter
│   ├── services/          # money, ledger (FIFO), metrics, passport, matching, ask_engine
│   ├── routers/           # health, capture, events, customers, dashboard, ask,
│   │                      # evidence, financing, reminders, demo
│   └── data/              # financing_programs.json + deterministic seed
├── tests/                 # money, FIFO, events/capture/ask/dashboard/financing APIs
├── scripts/eval_extractor.py  # sample-utterance accuracy harness
├── requirements.txt
└── render.yaml            # one-click Render deployment
```

## Testing

```bash
pytest            # 60+ tests; fully offline (demo provider, in-memory SQLite)
python scripts/eval_extractor.py   # extraction accuracy against the live chain
```

Tests pin the seed dataset's designed outcomes: total outstanding **Rs 100,000**,
top debtor **Ahmed Rs 58,500** (oldest unpaid 45 days = overdue), credit sales
**Rs 198,000**, recovered **Rs 98,000 (~49.5%)**.

## Deployment

`render.yaml` deploys to Render (free plan): `uvicorn app.main:app --host 0.0.0.0 --port $PORT`,
health check on `/api/health`. Set `GROQ_API_KEY` / `GEMINI_API_KEY` in the dashboard;
`CORS_ORIGINS` must list your frontend URL. On the free plan the SQLite file is
ephemeral (re-seeded per deploy) — attach a disk or set `DATABASE_URL` to a managed
Postgres for persistence.
