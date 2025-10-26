# sendback — One‑Click Returns Wallet

An end‑to‑end hackathon‑ready app: upload a receipt → see all orders with return countdowns → get one‑tap return options
(Return Bar, USPS Label Broker QR instructions, USPS carrier pickup) + a pre‑purchase policy checker.

## Monorepo structure
```
sendback/
  apps/
    web/  # Next.js (App Router)
    api/  # FastAPI backend
  .github/workflows/ (optional CI)
```
## Quickstart (local)
### 1) Backend
```
cd apps/api
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # put your keys if you have them; runs fine without
uvicorn main:app --reload --port 8000
```
Check: http://localhost:8000/health

### 2) Frontend
```
cd apps/web
npm i
cp .env.example .env.local
npm run dev  # http://localhost:3000
```

### 3) Try it
- On the homepage, upload a sample receipt (use the demo ones in `apps/api/seed/demo-receipts/`).  
- You should see an **order card** with a **countdown**. Click it to view **return options**.
- Try the **Policy** tab to summarize a store’s return policy.

> **Note:** If you provide Anthropic / Reka keys, extraction will use real LLM/OCR. Without keys, it falls back to a deterministic demo parser so everything still works.

## Environment variables
**apps/api/.env.example**
```
ANTHROPIC_API_KEY=
REKA_API_KEY=
LETTA_API_KEY=
ARIZE_API_KEY=
ARIZE_SPACE=sendback-dev
VAPI_API_KEY=
ELASTIC_APM_SERVER_URL=
ELASTIC_APM_SECRET_TOKEN=
DATABASE_URL=sqlite:///./sendback.db
```
**apps/web/.env.example**
```
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

## Scripts
- Backend: `uvicorn main:app --reload --port 8000`
- Frontend: `npm run dev`

## Deploying (later)
- You can deploy the API to any Python host (Elastic serverless recommended) and the web to Vercel/Netlify.
x