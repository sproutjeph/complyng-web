# ComplyNG

AI regulatory compliance for Nigerian fintechs, platforms, and telcos. One dashboard consolidates obligations across **NITDA, NDPC, CBN, NCC, and SEC**, with cited AI Q&A grounded in the actual acts.

Sister backend: [sproutjeph/complyng-api](https://github.com/sproutjeph/complyng-api).

## Stack

- **Next.js 16** (App Router, Turbopack, React 19) — note the middleware rename to `proxy.ts`.
- **Clerk** for auth (email/password + Google).
- **Postgres + pgvector** for both relational data (`business_profile`, `obligation_completion`) and RAG vectors (`regulatory_chunks`, 768-dim).
- **Anthropic Claude Sonnet** for grounded answers; **Gemini `text-embedding-004`** for embeddings.
- **Tailwind 4 + shadcn/ui + Base UI**.
- `postgres` (porsager) driver — no vendor lock-in, works against any Postgres.

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- Docker Desktop (for the local Postgres)
- API keys:
  - [Anthropic](https://console.anthropic.com/)
  - [Google AI Studio](https://aistudio.google.com/app/apikey) (free tier is plenty)
  - [Clerk](https://dashboard.clerk.com/) — create an application, copy the publishable + secret keys, and (for production) a webhook signing secret

## Getting started

```bash
bun install
cp .env.local.example .env.local    # fill in the API keys

bun run db:up                        # starts pgvector Postgres on :5432
bun run migrate                      # creates schema + pgvector extension
bun run ingest                       # embeds regulatory content into the DB

bun run dev                          # http://localhost:3000
```

Sign up at `/signup`, walk the 4-step onboarding wizard (basics → entity type → scale → licenses), land on `/dashboard`.

## Scripts

| Script | What it does |
| --- | --- |
| `bun run dev` | Next dev server on :3000 |
| `bun run build` | Production build |
| `bun run lint` | ESLint |
| `bun run test` | Vitest (rules engine + onboarding unit tests) |
| `bun run db:up` | Start the pgvector Postgres container (waits for healthy) |
| `bun run db:down` | Stop the container (keeps volume) |
| `bun run db:reset` | **Wipe volume** + restart + migrate + ingest. Demo panic button. |
| `bun run db:logs` | Tail Postgres logs |
| `bun run db:psql` | Open a psql shell inside the container |
| `bun run migrate` | Idempotent `CREATE IF NOT EXISTS` for all tables + pgvector |
| `bun run ingest` | Embed regulatory content (from `content/docs/` or fallback JSON) |

## Project layout

```
src/
  app/                         # Next App Router
    (marketing)                # /               landing
    dashboard/                 # /dashboard, /dashboard/ask, /dashboard/profile (Clerk-protected)
    onboarding/                # 4-step wizard (basics → type → scale → licenses)
    login/, signup/            # Clerk <SignIn /> / <SignUp />
    api/ask                    # RAG endpoint
    api/webhooks/clerk         # Svix-verified user.created → stub profile row
  components/                  # landing, dashboard, onboarding, shadcn ui
  lib/
    rules/                     # deterministic obligation engine (pure TS)
    llm/                       # chunker, embedder, retriever, answerer
    db/                        # postgres client, profile repo, obligation completion
  proxy.ts                     # Clerk middleware (Next 16 rename)
content/
  frameworks/*.json            # one file per regulator, 34 obligations total
  docs/                        # source PDFs / markdown for RAG ingest (optional)
scripts/
  migrate.ts, ingest.ts
__tests__/                     # rules + onboarding tests
demo/
  bonus-framework-cbn-amlcft.json   # P3 "add a framework without code" artifact
```

## Environment variables

| Key | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Defaults to the Docker service. |
| `ANTHROPIC_API_KEY` | Claude Sonnet for answers |
| `GOOGLE_API_KEY` | Gemini embeddings (768-dim) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk (client) |
| `CLERK_SECRET_KEY` | Clerk (server) |
| `CLERK_WEBHOOK_SECRET` | Optional. Verifies Svix signatures for `user.created` webhook. The app also lazily creates profile stubs, so this is belt-and-braces. |

## Deploying against a hosted Postgres

The app is driver-agnostic — any Postgres with pgvector works. Swap `DATABASE_URL`:

```
DATABASE_URL=postgres://user:pass@host:5432/db?sslmode=require
```

`postgres(url)` auto-enables SSL when `sslmode=require` is in the URL.

## Demo day

See [DEMO.md](./DEMO.md) for the click-through script, P3 live demo (adding a new framework by dropping a JSON file), and what's deliberately out of scope.

## Not legal advice

Every obligation is marked `verifyStatus: "unverified"` — a Nigerian lawyer must review each row before any customer relies on the dates or amounts. The answerer is instructed to refuse rather than guess when retrieved context doesn't cover a question.
