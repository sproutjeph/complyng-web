# ComplyNG — Demo Guide

Single-interface compliance across Nigeria's digital/ICT regulators (NITDA, NDPC, CBN, NCC, SEC), with a multi-framework rules engine, Clerk-authenticated onboarding, and cited AI Q&A over the actual source texts.

## What's in the box

- `src/lib/rules/` — pure TypeScript rules engine. `(profile) + (frameworks) → ComputedObligation[]`.
- `content/frameworks/*.json` — five framework definitions covering 34 obligations. Each row carries `sourceUrl` and `verifyStatus: "unverified"` because no counsel has reviewed them yet.
- `src/lib/llm/` — RAG pipeline (chunker, embedder, retriever, answerer) with Anthropic prompt caching.
- `src/lib/db/` — `postgres` (porsager) client + profile repo (business_profile, obligation_completion).
- `src/app/onboarding/` — 4-step wizard (basics → entity type → scale → licenses), resumable, DB-backed.
- `src/app/dashboard/` — `/dashboard`, `/dashboard/ask`, `/dashboard/profile` (all Clerk-protected).
- `src/proxy.ts` — Clerk auth gate (Next 16 renamed middleware → proxy).
- `docker-compose.yml` — `pgvector/pgvector:pg16` for local dev.
- `scripts/migrate.ts` + `scripts/ingest.ts` — schema + pgvector setup and document ingest.

## Problem statements addressed

- **P1 — Single compliance interface.** `/dashboard` consolidates obligations across 5 regulators with deadlines, penalties, and clause citations.
- **P3 — Multi-framework adaptability.** Adding a regulator is adding a JSON file. See "P3 live demo" below.

## Quick start (local)

```bash
bun install
cp .env.local.example .env.local     # fill in the API keys

bun run db:up                         # starts pgvector Postgres in Docker (:5432)
bun run migrate                       # creates pgvector + regulatory_chunks + business_profile
bun run ingest                        # chunks + embeds source docs (or fallback JSON)

bun run dev                           # http://localhost:3000
```

Go to `/signup`, create an account, walk the wizard, land on `/dashboard`.

### Required environment variables

| Key | Why | Where to get |
| --- | --- | --- |
| `DATABASE_URL` | Postgres + pgvector connection. Defaults to the local Docker service. | `bun run db:up` (local) or any hosted Postgres provider |
| `ANTHROPIC_API_KEY` | Claude Sonnet for grounded answers | https://console.anthropic.com |
| `GOOGLE_API_KEY` | Gemini `text-embedding-004` (768-dim) — free tier is plenty | https://aistudio.google.com/app/apikey |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk, client-side | https://dashboard.clerk.com → API keys |
| `CLERK_SECRET_KEY` | Clerk, server-side | same |
| `CLERK_WEBHOOK_SECRET` | Optional — verifies Svix signature on `user.created`. The app also lazy-creates profile rows, so this is belt-and-braces. | Clerk dashboard → Webhooks → signing secret |

### Optional: source documents

`bun run ingest` looks in `content/docs/` for files named in `content/docs/sources.json`:

- `ndpa-2023.pdf`
- `gaid-2025.pdf`
- `nitda-code-of-practice-2022.pdf`
- `cbn-rbcf-ofis-2022.pdf`
- `ncc-consumer-code-2007.pdf`
- `sec-digital-assets-rules-2022.pdf`

**If the PDFs are not present,** the ingest script falls back to the obligation descriptions from `content/frameworks/*.json` as synthetic chunks. The demo still works; answers simply cite the summary text rather than the original act.

`.pdf`, `.md`, and `.txt` files are all supported. Drop them in and re-run `bun run ingest`.

## What to click

1. **`/` (landing)** — marketing front door. Click "Get Started" (top nav) or "Start free" → `/signup`.
2. **`/signup`** — Clerk sign-up (email/password or Google). Verify the email code.
3. **`/onboarding`** — 4-step wizard:
   - **Basics** — business name, website, contact name.
   - **Entity type** — Fintech · Platform · Telco · Digital Service Provider · VASP.
   - **Scale & activity** — Nigerian users, personal-data/payments/digital-assets/telco flags.
   - **Licenses** — CBN / NCC / SEC / DPO.
   Each step auto-saves; you can quit halfway and come back — the wizard resumes where you left off.
4. **`/dashboard`** — obligations grouped by regulator, with score card, deadlines, penalties, and source-of-law links. Every obligation is currently `unverified`. Marking one complete writes a row into `obligation_completion`.
5. **`/dashboard/profile`** — toggle attributes (entity type, user count, licenses). Save and watch the obligation list recompute. E.g. flip to `telco` → NITDA + NCC take over; flip to `vasp` → SEC appears.
6. **`/dashboard/ask`** — type a regulatory question. The answer is grounded only in ingested sources and cites clauses inline. Try:
   - *"What does NDPA require when a personal data breach occurs?"*
   - *"What cybersecurity controls must a CBN-licensed fintech have in place?"*
   - *"Which content must a platform take down within 24 hours under NITDA's Code?"*
7. **Sign out** — top-right avatar → "Sign out" → back to `/`. Signing in as a different Clerk user shows a different profile and different obligations (verify isolation).

## P3 live demo — add a framework without writing code

1. Open `/dashboard` and note the five regulator groupings.
2. Copy `demo/bonus-framework-cbn-amlcft.json` into `content/frameworks/`.
3. Refresh `/dashboard`. A new CBN AML/CFT grouping appears with its obligations. No code changed, no server restart.

The loader is the plugin system — that is the point. New regulation → new JSON → recompute. The rules engine does not know about NITDA vs. NDPC vs. CBN individually; it applies the same `trigger` and `dueRule` predicates uniformly.

## Hero flow — GAID 2025 operationalization (3 min)

Judges reward end-to-end: a compliance lead lands, gets value, regulator-facing
artifact goes out. The killer flow is:

1. **`/dashboard/policies` — Upload the fintech privacy policy.** Drop in
   `demo/acme-fintech-privacy-policy.md`. The parser chunks + embeds it (~6s),
   and the policy lands in `policy_document` / `policy_chunk` (pgvector).
2. **Run AI gap analysis.** Click **Analyse gaps**. The orchestrator
   (`src/lib/policy/gap-analysis.ts`) iterates every GAID 2025 obligation,
   retrieves top-K policy chunks *and* top-K GAID regulation chunks, prompts
   Claude Sonnet 4.5 for a strict JSON verdict, and persists `gap_finding`
   rows with dual citations (policy quote + regulation clause).
3. **Review gaps on the policy page.** Each finding shows severity, the
   obligation code it maps to, a pinpoint quote from the policy, and the
   GAID article it violates. This is the "AI explains, rules engine decides"
   split.
4. **Attach evidence to an obligation.** Back on `/dashboard`, expand the
   Evidence drawer on a row, upload a PDF or cite a verification URL.
   The server action sha256-hashes the file, writes to `data/evidence/…`,
   and auto-marks the obligation `met` in `obligation_completion`.
5. **Export OSCAL.** Click **Export OSCAL** on `/dashboard`. The GET to
   `/api/export/oscal?download=1` streams an OSCAL Assessment-Results subset
   with findings, observations (one per evidence record), deterministic UUIDs,
   sha256 content-hash, and an optional HMAC signature (set
   `ATTESTATION_HMAC_SECRET` in `.env.local`).
6. **Publish Trust Center.** `/dashboard/trust` → pick a slug → Publish.
   `/trust/<slug>` becomes a public, no-auth page showing posture,
   obligations per framework, evidence metadata (filename + sha256 — not
   file contents), and the attestation hash. The hash is byte-identical to
   the OSCAL JSON a regulator can download, so any auditor can verify
   posture without trusting us.

The close: **"OSCAL is NIST's machine-readable attestation format. Because
we emit OSCAL, NDPC could ingest this through an API — supervisory reporting
is solved the same way."**

### Before the hero demo

```bash
bun run migrate            # adds policy_document, policy_chunk, gap_finding,
                           # evidence, trust_center
bun run ingest             # loads GAID 2025 chunks into regulatory_chunks
                           # (falls back from content/docs/gaid-2025.md)
bun run dev
```

Sign up (or use an existing account), finish the wizard as a fintech
processing personal data, then walk through the six steps above.

## Demo day panic button

If something got wedged (bad profile state, corrupted ingest, stale vectors):

```bash
bun run db:reset     # wipes the Docker volume, re-creates schema, re-ingests
```

Takes ~1 minute end-to-end (most of it is the embedding pass). Run once before going on stage.

## What this demo is *not*

- **Not legal advice.** Every obligation is marked `unverified`. Before any customer relies on these dates or amounts, a Nigerian lawyer must review each row.
- **Not the full product yet.** The production plan pairs this web app with a Go API (`complyng-api`), WhatsApp delivery, email notifications, and a signed trust badge. Those remain out of scope for now.
- **Not exhaustive.** 34 obligations is a credible slice, not the full surface. The JSON loader scales linearly — adding obligations 35–200 is a data task, not an engineering task.

## Why this design

- **"AI explains; rules engine decides."** The deterministic engine decides what applies and when it's due; the LLM never makes compliance calls, it only explains and cites. This is defensible in front of counsel.
- **JSON as the framework contract.** Every regulator is a JSON file with the same schema (validated by Zod). That schema is the P3 story.
- **Cited answers or nothing.** The answerer is instructed to refuse rather than guess when retrieved context doesn't cover the question — a hallucination in this domain is a compliance violation.
- **Portable Postgres.** The `postgres` (porsager) driver talks to any Postgres — local Docker for dev and demo, any managed provider for prod. No vendor lock-in.
