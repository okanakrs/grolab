# GroLab

GroLab is an AI-assisted SaaS idea generation starter kit.

## Stack

- Backend: FastAPI
- Frontend: Next.js + Tailwind CSS + Framer Motion
- Billing: Stripe checkout + webhook-based credit refill
- Research signals: Product Hunt (Algolia), Reddit, Google Trends (SerpApi)

## Features

- Deep research style multi-step idea generation UI
- Market evidence badges (trends, competitors, evidence)
- Credit guard before generation requests
- Stripe subscription checkout endpoints
- Request tracking with `X-Request-ID`

## Project Structure

- `main.py`: FastAPI app setup and middleware
- `routers/`: API routes (`discovery.py`, `billing.py`)
- `services/`: business logic and integrations
- `frontend/`: Next.js app

## Environment Variables

Create a `.env` file in repository root:

```env
LLM_PROVIDER=anthropic
LLM_TIMEOUT_SECONDS=30

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6

PH_ALGOLIA_APP_ID=
PH_ALGOLIA_API_KEY=
PH_ALGOLIA_INDEX=Post_production

REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=grolab-research-bot/0.1
REDDIT_SUBREDDITS=startups,Entrepreneur,SaaS

SERPAPI_API_KEY=

NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=
STRIPE_PRICE_ENTERPRISE=
FRONTEND_BASE_URL=http://127.0.0.1:3000
```

## Local Run

### Backend

```bash
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Billing Endpoints

- `POST /api/checkout`
- `POST /api/webhook`
- `GET /api/credits`

## CI

GitHub Actions workflow runs:

- Python compile checks for backend
- Frontend build check

## Versioning

Initial release tag: `v0.1.0`
