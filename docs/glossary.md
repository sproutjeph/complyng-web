# ComplyNG Glossary

Every term, acronym, model name, and concept you'll hear during the demo — explained in plain English, with why it matters to ComplyNG specifically. Share this with anyone on the team who needs to be conversation-ready in front of a judge, a DPCO, or a prospective customer.

Terms are grouped by topic. If you're reading this cold, skim the **Regulatory landscape** and **OSCAL** sections first — those are the two areas judges probe hardest.

---

## Regulatory landscape (Nigeria)

### NDPA — Nigeria Data Protection Act 2023

The statute. Nigeria's equivalent of the EU's GDPR. Signed into law in June 2023 by President Tinubu. It gives Nigerians rights over their personal data (access, correction, deletion, portability), creates categories of data (personal, sensitive), and makes the Nigeria Data Protection Commission the enforcement body.

The Act tells you *what* must happen. It doesn't tell you *how* — the how lives in GAID.

### NDPC — Nigeria Data Protection Commission

The federal regulator created by NDPA 2023 to enforce it. Based in Abuja. Issues directives (like GAID), licenses auditors (DPCOs), investigates complaints, and levies fines. Think of them as Nigeria's ICO (UK) or CNIL (France).

### GAID 2025 — General Application and Implementation Directive 2025

The operational playbook under NDPA. Published by NDPC and effective **19 September 2025**. GAID turns NDPA's principles into specific deliverables: which forms to file (A, B, C), when to file them, which breach-notification template to use (Schedule 2), how to log cross-border transfers, and so on.

ComplyNG is built around GAID, not just NDPA, because GAID is what compliance teams actually execute against day-to-day. If a company says "we comply with NDPA," the DPCO will ask "show me your Form C" — that's GAID.

### DCMI — Data Controller of Major Importance

An organisation that processes personal data of Nigerians at a scale or sensitivity that NDPC considers consequential enough to regulate directly. Being a DCMI isn't optional — you qualify automatically and then owe the DCMI obligations.

You are a DCMI if *any* of these apply (GAID Part II):

- You process personal data of more than **200,000 Nigerian residents** per year.
- You process **sensitive personal data** (health, biometric, financial, children's data) at material scale.
- You're in a **named sector**: banks, fintechs, telcos, insurers, e-commerce, health, education, hospitality, digital content.
- You're **specifically designated** by the Commissioner.

In practice: any serious Nigerian fintech, telco, or digital platform is a DCMI. Most ComplyNG customers will be DCMIs.

### DPMI — Data Processor of Major Importance

Same idea as DCMI but for entities processing personal data *on behalf of someone else* — cloud hosts, payment switches, SaaS vendors handling a DCMI's data. Same regulatory obligations apply, just reframed around the processor relationship.

### DPCO — Data Protection Compliance Organisation

An **NDPC-licensed auditor**. GAID requires every DCMI to hire a DPCO annually to audit its compliance and prepare the Form C return. DPCOs are professional firms that went through NDPC's licensing process — think of them as the equivalent of statutory auditors for financial reporting.

DPCOs are one of ComplyNG's two primary user types. DCMIs use ComplyNG to *prepare*; DPCOs use it to *attest*.

### DPO — Data Protection Officer

The in-house role every DCMI must appoint (NDPA s.32, GAID Part IV). Named in the privacy notice, reports to senior management, responsible for day-to-day data-protection decisions. Must be qualified — NDPC expects formal training or certification.

ComplyNG's onboarding asks "do you have a DPO?" because the answer changes which obligations apply.

### DPIA — Data Protection Impact Assessment

A formal written risk assessment required *before* any "high-risk" processing — profiling, large-scale sensitive data, automated decisions with legal effect. The DPIA documents what data is processed, why, what risks it poses, and what mitigations are in place.

DPIAs are a common form of evidence users attach in ComplyNG's evidence drawer.

### Form A / Form B / Form C

GAID's named templates.

- **Form A** — DCMI registration with NDPC. File within 6 months of qualifying.
- **Form B** — less commonly used; variation of registration.
- **Form C** — the **annual compliance return**, attested by a DPCO, covering the prior calendar year. Due **31 March** each year. This is the big one. Your product helps produce the evidence bundle that backs Form C.

### Schedule 2

GAID's **breach-notification template**. When a DCMI suffers a personal-data breach, GAID requires notification to NDPC **within 72 hours**, using the Schedule 2 structure: nature of breach, categories and approximate number of data subjects affected, likely consequences, mitigations taken.

"Does the uploaded policy reference Schedule 2 and the 72-hour window?" is one of the gap-analysis questions ComplyNG asks Claude.

### Other Nigerian regulators in ComplyNG

Data protection is one obligation stack; Nigerian DCMIs also live under sectoral regulators.

- **CBN — Central Bank of Nigeria.** Regulates banks, fintechs, payment service providers. Owns the **Risk-Based Cybersecurity Framework (RBCF, 2022)** — ComplyNG's CBN framework JSON maps to this.
- **NCC — Nigerian Communications Commission.** Regulates telcos and ISPs. Owns the Consumer Code (2007).
- **NITDA — National Information Technology Development Agency.** Regulates broad tech/IT. Owns the Code of Practice for Interactive Computer Service Platforms.
- **SEC — Securities and Exchange Commission.** Regulates capital markets. Owns the Digital Assets / VASP rules (2022).

### VASP — Virtual Asset Service Provider

SEC's term for crypto exchanges, custodians, and digital-asset issuers. One of the entity types ComplyNG's onboarding supports — picking VASP swaps in SEC obligations.

### Penalties, briefly

GAID fines scale to **₦10 million or 2% of gross annual revenue, whichever is higher, per finding**. CBN incident-reporting failures carry similar order-of-magnitude fines. This is why DCMIs need software, not spreadsheets — a missed 72-hour breach window can cost 2% of revenue.

---

## OSCAL and the Trust Center

### OSCAL — Open Security Controls Assessment Language

A family of **JSON (and XML, and YAML) schemas published by NIST** (the US National Institute of Standards and Technology) for expressing compliance information in a machine-readable form. Think of OSCAL as "XBRL for compliance" — a standard wire format so regulators, auditors, and tools don't have to parse PDFs.

- Published open-source on GitHub (`usnistgov/OSCAL`). Current stable version: **1.1.2** (2024).
- Originally built for FedRAMP — the US government's cloud authorisation program — which was drowning in hand-written Word-document security plans. Now mandatory for FedRAMP submissions.
- Adopted by Drata, Vanta, AWS, Azure, Google Cloud for US federal compliance.

OSCAL is ComplyNG's output format because it's the only widely-recognised machine-readable compliance standard. A regulator, a partner bank, or a future auditor can parse our output with off-the-shelf tooling.

### OSCAL-AR — OSCAL Assessment Results

The specific OSCAL document type ComplyNG emits. The OSCAL family has five main shapes:

| Type | Describes | Produced by |
| --- | --- | --- |
| **Catalog** | A library of controls (e.g. all of NIST 800-53). | The standards body. |
| **Profile** | A subset of a Catalog tailored to a context. | The framework owner. |
| **System Security Plan (SSP)** | "Our system; here's how we implement each control." | The organisation being audited. |
| **Assessment Plan** | "Here's how we'll test whether the controls work." | The auditor. |
| **Assessment Results (AR)** | "Here's what we found." | The auditor, at the end of an audit. |

Most OSCAL tutorials online cover SSPs. ComplyNG picked Assessment Results on purpose — that's the **outcome** side, which is what a DPCO produces at the end of a Form C engagement. Nobody else in the Nigerian compliance market emits OSCAL-AR.

### OSCAL findings and observations

Inside an Assessment Results document:

- **Finding** — a conclusion about a control. `status: satisfied / not-satisfied / not-applicable`. In ComplyNG, every obligation becomes a finding.
- **Observation** — a piece of evidence supporting a finding. In ComplyNG, every uploaded artefact (DPO letter, board resolution, DPIA PDF) becomes an observation with its filename, MIME type, and sha256 hash.

### Deterministic UUID

UUIDs are normally random 128-bit IDs. ComplyNG's UUIDs are **computed from their inputs** (obligation code + framework code) so re-running the export produces the exact same UUIDs, which keeps the content hash stable across exports.

Without this, two exports of identical data would produce different UUIDs and therefore different bytes and therefore different hashes — breaking the Trust Center claim.

### Stable stringify (canonicalisation)

JSON objects have no inherent key order. `{"a":1,"b":2}` and `{"b":2,"a":1}` describe the same object but serialise to different strings, which hash to different fingerprints. **`stableStringify` sorts keys alphabetically before serialising**, so the same data always produces the same bytes and the same hash.

ComplyNG canonicalises the OSCAL document with `stableStringify` before hashing. This is what makes Trust Center verification possible.

### sha256 — Secure Hash Algorithm, 256-bit

A one-way cryptographic hash function. You feed in any string (or any bytes); you get back a 64-character hexadecimal fingerprint. Properties:

- Same input → same output, always.
- Any single-character change in the input → completely different output.
- You can't reverse it — you can't reconstruct the input from the hash.

ComplyNG hashes the canonicalised OSCAL document with sha256. That hash is the fingerprint the Trust Center publishes.

### Content hash

ComplyNG's label for `sha256(stableStringify(oscalDocument))`. This is the number displayed on the Trust Center public page. An auditor who downloads the attestation can re-run the same computation locally; if their hash matches the published one, the document hasn't been tampered with.

### HMAC — Hash-based Message Authentication Code

An optional second cryptographic signature. sha256 proves "this document hasn't changed"; HMAC additionally proves "ComplyNG specifically signed it" using a shared secret. ComplyNG supports HMAC via the `ATTESTATION_HMAC_SECRET` env variable but it's optional for the hackathon demo.

### NIST — National Institute of Standards and Technology

US federal agency. Publishes technical standards: AES (encryption), SHA-2 (hashing), the Cybersecurity Framework, OSCAL. Non-regulatory but enormously influential — NIST standards are adopted worldwide.

### FedRAMP — Federal Risk and Authorization Management Program

US government program that authorises cloud service providers for federal use. FedRAMP was the first major adopter of OSCAL and is still the largest. When you see "OSCAL in production," it usually means FedRAMP packages.

### FISMA — Federal Information Security Modernization Act

US law requiring federal agencies to secure their information systems. FISMA reporting now uses OSCAL. Context only — not directly relevant to Nigerian compliance.

### Trust Center

ComplyNG's product surface for sharing compliance posture publicly. `/trust/<slug>` is a no-auth page that shows:

- The organisation's compliance score.
- Framework-by-framework breakdown.
- Evidence **metadata** only (filename + sha256 — never file contents).
- The OSCAL content hash.

A download link at `/trust/<slug>/attestation?download=1` serves the stored OSCAL document. Its hash matches what's shown on the public page.

Think of it as trust.google.com, but the page is cryptographically verifiable against the downloadable artefact.

### Slug

The URL-safe identifier in the Trust Center path — e.g. "acme" in `/trust/acme`. Chosen at publish time.

### Hash chain of custody (the demo punchline)

The end-to-end verification story:

1. User clicks **Publish** on `/dashboard/trust`.
2. ComplyNG builds the OSCAL document.
3. `stableStringify` canonicalises it → `sha256` produces the hash.
4. Both the document and the hash are stored in the `trust` table at publish time.
5. `/trust/<slug>` displays the hash.
6. An auditor downloads the OSCAL from `/trust/<slug>/attestation?download=1`.
7. They locally run `sha256(stableStringify(downloaded))`.
8. Match ⇒ the document hasn't been tampered with *and the auditor never had to trust ComplyNG*.

That last point is why it matters — it shifts the trust model from "trust the vendor" to "trust the math."

---

## AI and the RAG pipeline

### LLM — Large Language Model

A general-purpose AI model trained on text (Claude, GPT, Gemini). ComplyNG uses Claude Sonnet 4.5 for reasoning and Gemini for embeddings.

### Claude Sonnet 4.5

Anthropic's mid-tier frontier model (`claude-sonnet-4-5-20250929`). Balances quality and cost. Handles ComplyNG's gap-analysis reasoning — given an obligation, retrieved policy chunks, and retrieved regulator chunks, it returns a strict JSON verdict.

### Anthropic

The AI research company that makes Claude. Based in San Francisco, founded 2021. The provider of ComplyNG's reasoning model.

### Gemini

Google's AI model family. ComplyNG uses `gemini-embedding-001` for converting text into 768-dimensional vectors. Gemini's free embedding tier is enough for the demo.

### RAG — Retrieval-Augmented Generation

The AI pattern ComplyNG uses everywhere. Instead of letting an LLM generate freely (and hallucinate), you:

1. **Retrieve** relevant source chunks from a database.
2. **Augment** the prompt with those chunks.
3. **Generate** an answer using only the retrieved context.

RAG makes hallucination structurally harder because the model is *told* to ground its answer in specific text. Both ComplyNG's gap analysis and `/dashboard/ask` use RAG.

### Embedding

Converting text into a list of numbers (a vector) such that semantically similar texts produce vectors that sit close together in vector space. ComplyNG embeds both the regulator text and the uploaded policy. Model used: `gemini-embedding-001`. Dimensions: 768.

### Vector / embedding vector

The numeric representation itself — a list of 768 numbers for ComplyNG. You compare two vectors with cosine similarity to measure how semantically close the underlying texts are.

### Chunk

A short slice of text (~1KB) that gets embedded and stored as one row in `regulatory_chunks` (for laws) or `policy_chunk` (for uploaded policies). ComplyNG chunks on heading boundaries with overlap so semantic context isn't lost at chunk edges.

### pgvector

A Postgres extension that adds vector storage and similarity search as native SQL types. Lets ComplyNG keep all data (business profiles, obligations, evidence, vectors) in one Postgres — no separate vector database like Pinecone or Weaviate needed. Query syntax: `ORDER BY embedding <=> $query_vec` where `<=>` is cosine distance.

### Cosine similarity / cosine distance

The mathematical operation that measures how "close" two vectors point. Closer direction = more similar meaning. ComplyNG uses cosine distance (`<=>` in pgvector) because it's invariant to vector magnitude — only direction matters for semantic similarity.

### Top-K retrieval

"Give me the K closest chunks to this query." ComplyNG uses **K = 5**. For each obligation, retrieval pulls the 5 most relevant policy chunks *and* the 5 most relevant regulator chunks before prompting Claude.

### Gap analysis

ComplyNG's flagship AI feature. Orchestrator in `src/lib/policy/gap-analysis.ts`. For each GAID 2025 obligation: retrieve top-K from both corpora, prompt Claude with the obligation + excerpts + a strict JSON schema, parse, persist the verdict as a `gap_finding` row.

### Structured output / JSON schema

Forcing the LLM to answer in a specific, pre-declared JSON shape. ComplyNG's gap-analysis schema:

```json
{
  "meets": boolean,
  "severity": "high" | "medium" | "low",
  "description": string,
  "policy_citation": string | null,
  "regulation_citation": string | null
}
```

If Claude returns something that doesn't parse, ComplyNG rejects it rather than silently saving garbage.

### Dual citation

Every gap finding must include a **verbatim** quote from the organisation's policy *and* a **verbatim** quote from the regulation. If a citation is missing, the finding is surfaced as "needs review" rather than pass/fail. This is the operational form of "grounded in regulator text" — no ungrounded claims.

### Prompt caching (`cache_control: ephemeral`)

An Anthropic API feature. When the same long prompt prefix (typically the system prompt) is reused across many calls, you can mark it with `cache_control: { type: "ephemeral" }` and Anthropic caches the processing. Subsequent calls that hit the same cached prefix are cheaper and faster.

ComplyNG's system prompt is ~1KB and identical across every obligation in a gap-analysis run — caching is a material cost reduction.

### System prompt

The instruction text the LLM sees before the user's question. It sets role, constraints, output format. ComplyNG's system prompt for gap analysis declares the JSON schema, the "verbatim citations only" rule, and the "silent policy = `meets: false`" rule.

### Low-confidence handling

When Claude produces an output ComplyNG can't validate (missing citations, unparseable JSON), ComplyNG surfaces it as `needs review` rather than treating it as pass/fail. The rules engine never consults the LLM, so even a malformed AI output doesn't poison the deterministic compliance decision.

### "AI explains, rules engine decides"

ComplyNG's architectural slogan. The **deterministic TypeScript rules engine** decides which obligations apply and whether evidence is attached. The **LLM** only explains gaps and cites — it never makes the compliance call. This is the story you tell a judge who asks "what if the AI gets it wrong?"

---

## Compliance engine

### Rules engine

Deterministic, pure-TypeScript code in `src/lib/rules/engine.ts` that computes `(business profile) + (frameworks) → list of applicable obligations`. No AI involved. Outputs status (`met` / `upcoming` / `overdue` / `not_applicable`), due dates, and a human-readable reason.

### Obligation

A single "must-do" pulled from a regulation — e.g. "File Form C by 31 March" or "Appoint a Data Protection Officer." Each obligation has: a code (e.g. `NDPC-DPO-002`), a title, a description, a clause reference, a source URL, a trigger predicate, a due-rule, and a penalty amount in kobo (1/100 of a naira).

ComplyNG has **52 obligations across 6 frameworks** today.

### Framework

A regulator's whole ruleset expressed as one JSON file in `content/frameworks/`. There are 6: NDPC (NDPA-2023 baseline), NDPC-GAID (GAID 2025), CBN, NCC, NITDA, SEC.

### Trigger

A predicate deciding if an obligation applies. Implemented as discriminated unions in TypeScript. The eight trigger types:

- `always` — applies unconditionally.
- `if_processes_personal_data` — applies if the business processes personal data.
- `if_handles_payments` — applies if the business handles payments.
- `if_offers_digital_assets` — applies if VASP-like.
- `if_cbn_licensed` — applies if licensed by CBN.
- `if_ncc_licensed` — applies if licensed by NCC.
- `if_sec_licensed` — applies if registered with SEC.
- `if_users_over` — applies if Nigerian-user count exceeds a threshold.
- `if_entity_in` — applies if the entity type is in a list.

### Due rule

A predicate deciding when an obligation is due. Five shapes:

- `once` — one-time; no recurrence.
- `annual` — e.g. "every 31 January."
- `quarterly` — e.g. "the 15th of the first month of each quarter."
- `monthly` — e.g. "the 1st of each month."
- `within_days_of_event` — e.g. "within 3 days of a breach."

### Compliance score

`round(met_applicable / total_applicable × 100)`. Shown on the dashboard. *Not* in OSCAL — OSCAL carries per-obligation findings, and auditors compute their own aggregate metrics.

### Evidence

Any artefact that proves an obligation is met: DPO appointment letter, board resolution, DPIA, incident-report reference, verification URL. Evidence is:

- sha256-hashed on upload.
- Stored with metadata only on the public Trust Center page (filename + hash, never file contents).
- Linked to an obligation in `obligation_completion`.

### `verifyStatus: "unverified"`

Every obligation currently carries this flag. It's an honest disclaimer: the obligation text was derived from public regulator documents but has not yet been reviewed by Nigerian counsel. Flipping this to `"verified"` is a legal-review task, not an engineering task.

---

## Web stack

### Next.js 16

The web framework ComplyNG is built on. Current major version. Server-first (server components render on the server by default), with opt-in client components via `"use client"`. Uses the App Router (`src/app/…`) rather than the older Pages Router.

### App Router

Next.js's current routing model. Each directory under `src/app/` maps to a URL segment; `page.tsx` is the route's component; `layout.tsx` wraps children; `route.ts` defines an API route. Server components by default, client components opt-in.

### Server components

React components that render entirely on the server and send HTML (plus a small serialised props payload) to the browser. No React runtime in the browser for these components. The default in Next.js 16.

### Client components

React components that hydrate in the browser, can use hooks like `useState`, and respond to user input. Opt in by putting `"use client"` at the top of the file. ComplyNG uses client components only where interactivity is needed — forms, drawers, file pickers.

### Server action

A function marked `"use server"` that runs on the server but is called like a normal async function from a client component. No REST endpoint to wire up. ComplyNG uses server actions for every mutation: form submissions, file uploads, trust publish.

### React 19

The UI library version ComplyNG uses. Key feature: `useActionState` — a hook that wraps a server action and exposes `{state, formAction, pending}` to the form, enabling inline error rendering without custom state management.

### `useActionState`

React 19 hook. Used in `src/components/onboarding/basics-form.tsx` and the other onboarding forms. Takes a server action and an initial state; returns the latest state (e.g. `{error: "…"}`), a wrapped `formAction`, and a `pending` flag.

### Tailwind CSS

Utility-class CSS framework. Instead of writing custom CSS, you compose classes like `flex items-center gap-2 rounded-md border border-border`. Ships with ComplyNG's theme tokens.

### shadcn/ui

A set of accessible React components (buttons, dialogs, dropdowns, inputs) copied directly into the repo rather than installed as a package dependency. Lets ComplyNG modify any component without fork or wrap boilerplate.

### Clerk

Authentication-as-a-service. Handles sign-up, sign-in, email verification, OAuth. Ships SDKs for the client (`@clerk/nextjs`) and server (`auth()`, `currentUser()`). ComplyNG's `src/proxy.ts` uses Clerk to gate authenticated routes.

### Svix

The webhook-delivery infrastructure Clerk uses under the hood. Signing secrets are prefixed `whsec_…`. ComplyNG verifies the Svix signature on Clerk's `user.created` webhook before creating a business-profile row.

### Webhook

A server-to-server POST triggered by an event. Clerk POSTs to `/api/webhooks/clerk` when a user is created; ComplyNG verifies the signature, then inserts a `business_profile` row for the new user.

### Postgres 16

The relational database. Hosts all data: profiles, obligations, evidence, gap findings, policy chunks, regulatory chunks, trust publications. Runs in Docker locally via `docker-compose.yml`.

### porsager/postgres

The Node/Bun Postgres client library. Named after its author, Rasmus Porsager. Known for being fast, supporting SQL tagged-template literal syntax (`` db`SELECT * FROM users WHERE id = ${id}` ``), and safe parameterisation.

### Zod

A runtime validation library. Define a schema once; get both TypeScript types and runtime validation. ComplyNG uses Zod on every server action to validate form data before hitting the database.

### Vitest

The test runner. Vite-native alternative to Jest. Faster, simpler config. ComplyNG has 27 tests passing — rules engine, OSCAL builder, chunker.

### jsdom

A browser-DOM simulator used in tests so server-side code that imports UI modules can run without a real browser.

### Bun

The JavaScript runtime and package manager ComplyNG uses locally. Replaces npm + Node for scripts. `bun install`, `bun run dev`, `bun scripts/migrate.ts`. Much faster than Node for cold starts.

### Docker Compose

Tool for running multi-container applications defined in a YAML file. ComplyNG's `docker-compose.yml` spins up the pgvector Postgres container for local dev. `bun run db:up` wraps `docker compose up`.

### `proxy.ts`

Next.js 16 renamed the `middleware.ts` file to `proxy.ts`. Pure naming change, same request-interception functionality. ComplyNG's `src/proxy.ts` hosts the Clerk auth gate — every request runs through it and unauthenticated requests to `/dashboard` or `/onboarding` redirect to `/signup`.

### Turbopack

Next.js 16's default development bundler, written in Rust. Replaces Webpack in dev mode. Faster hot-reload and startup than Webpack.

### `.env.local`

Local-only environment-variables file holding secrets: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, Clerk keys. Never committed to git (`.env.local` is in `.gitignore`). An example file (`.env.local.example`) is committed to show which keys are needed.

---

## Repository context

### `complyng-web` vs. `complyng-api`

ComplyNG is two repos:

- **`complyng-web`** (this one) — the Next.js app, rules engine, policy upload, gap analysis, Trust Center. What the hackathon demo runs.
- **`complyng-api`** — a separate Go backend planned for production, not needed for the hackathon.

If a judge asks "is there a separate backend?", the answer is: there's a planned Go API for production scaling, but everything in the demo runs in the Next.js web app, and that's by design — a DCMI can self-host it with only Postgres as a dependency.

### Monorepo

A single git repository holding multiple projects or packages. ComplyNG is *not* a monorepo — each of `complyng-web` and `complyng-api` lives in its own repo. The term comes up because some judges might assume a monorepo layout.

---

## Tying it all together — the one-minute version

> **ComplyNG** is a compliance platform for Nigerian **DCMIs** and the **DPCOs** who audit them. It operationalises **GAID 2025** through a deterministic **rules engine** over six regulators' frameworks, grounded **RAG** gap analysis using **Claude Sonnet 4.5** with dual regulator/policy citations, and an **OSCAL Assessment Results** export wrapped in a public, **sha256**-verifiable **Trust Center**. The AI explains; the rules engine decides.

Every capitalised term in that paragraph has its entry above. If a team member can read this document end-to-end and then re-read that sentence, they're ready for the demo.
