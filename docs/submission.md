# ComplyNG — Hackathon Submission Content

Draft text for the Microsoft AI Skills Week RegTech Hackathon submission template. Paste section-by-section into the provided `.docx`.

---

## Team Information

- **Team Name:** ComplyNG
- **Team Members:** Jephthah Mbah
- **Contact Email:** donjeph@gmail.com
- **GitHub Repository Link:** https://github.com/sproutjeph/complyng-web
- **Demo Link (if hosted):** Live demo driven locally during judging; repo README has the one-command setup.

---

## Problem Statement

- **What problem are we solving?** Nigerian Data Controllers of Major Importance (DCMIs) — fintechs, telcos, digital platforms — must now operate against the **NDPC General Application and Implementation Directive 2025 (GAID 2025)**, which took effect 19 September 2025 and operationalised the Nigeria Data Protection Act 2023. Today compliance is a trail of spreadsheets and PDFs: there is no auditable bridge from *"what the regulation requires"* to *"what the organisation actually does"*.
- **Why is it important?** GAID 2025 forces annual DPCO-attested Form C returns, 72-hour breach notifications, cross-border transfer registers, automated-decision disclosures, and parental-consent verification — each enforceable with fines up to ₦10m or 2% of gross revenue. DPCOs (Data Protection Compliance Organisations) need a machine-readable record to attest against. Without one, every audit is rebuilt from scratch.
- **Regulatory framework focus:** Primary anchor is **NDPC — GAID 2025** (13 obligations). Sectoral overlays built in: **CBN** (Risk-Based Cybersecurity Framework), **NCC** (Consumer Code), **NITDA** (Code of Practice), **SEC** (Digital Assets Rules), **NDPA 2023**. Total: 6 frameworks, 52 obligations.

---

## Target User

- **Primary user:** Compliance Officer at a licensed DPCO auditing a client, or an in-house Compliance/Privacy lead at a DCMI preparing the annual Form C return.
- **Specific task:** Turn a draft privacy policy + existing evidence (DPO appointment letter, DPIA, incident log) into a regulator-ready **attestation** — a signed, hashable OSCAL document — plus a public Trust Center page any auditor can verify without contacting us.

---

## Solution Overview

- **Brief description:** ComplyNG is a single interface that (1) ingests a regulated entity's privacy policy, (2) runs an AI gap analysis grounded in GAID 2025 article text, (3) lets the team attach evidence per obligation, (4) emits an OSCAL Assessment-Results attestation with a content hash, and (5) publishes a public Trust Center whose hash is byte-identical to the downloadable OSCAL JSON.
- **What makes our approach unique:**
  - **"AI explains; the rules engine decides."** The deterministic TypeScript rules engine (`src/lib/rules/engine.ts`) decides what applies and when. The LLM only explains gaps and cites — it never makes the compliance call. Defensible in front of counsel.
  - **Dual-citation grounding.** Every gap finding stores both a verbatim quote from the organisation's policy *and* the matching GAID article excerpt. No ungrounded claims; the schema refuses answers without citations.
  - **OSCAL output, not PDF.** Assessment-Results JSON with deterministic UUIDs, stable-stringified sha256 content hash, optional HMAC signature. Machine-verifiable.
  - **Public Trust Center with verifiable hash.** The public page shows the same hash the auditor downloads. Any third party can `sha256(stableStringify(...))` and confirm.
  - **JSON-as-framework-contract.** Adding a regulator = dropping one JSON file into `content/frameworks/`. No code change, no server restart. Live-demoable.

---

## Core Workflow

End-to-end, from the operator's point of view:

1. **Sign up & onboard** — 4-step wizard (basics → entity type → scale → licenses) writes a `business_profile` row. Resumable.
2. **Obligations computed** — `computeObligations(profile, frameworks)` selects every obligation whose trigger matches (e.g. `if_processes_personal_data`, `if_cbn_licensed`, `if_users_over`). Scoring and due dates derive deterministically.
3. **Upload privacy policy** — `/dashboard/policies` — PDF/Markdown/TXT parsed, chunked (~1KB), embedded with Gemini `gemini-embedding-001`, stored in `policy_chunk` (pgvector).
4. **AI gap analysis** — For each GAID 2025 obligation: retrieve top-K policy chunks + top-K GAID regulator chunks by cosine similarity; prompt **Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`) with a strict JSON schema; persist `gap_finding` rows with dual citations and severity.
5. **Attach evidence** — Expand evidence drawer on `/dashboard`, upload a PDF or cite a URL. The server action sha256-hashes the file and flips the obligation to `met`.
6. **Export OSCAL** — `/api/export/oscal?download=1` emits OSCAL Assessment-Results JSON: findings from obligations, observations from evidence, deterministic UUIDs, content-hash, optional HMAC.
7. **Publish Trust Center** — `/dashboard/trust` → pick a slug → Publish. The document and hash are snapshotted at publish time into the `trust` table.
8. **Public verification** — `/trust/<slug>` shows posture and hash; `/trust/<slug>/attestation?download=1` serves the stored OSCAL. Hash on the page equals `sha256(stableStringify(downloaded.assessment_results))`.

---

## Regulation Structuring (Policy Pack)

Five sample mappings pulled directly from `content/frameworks/*.json` and the engine code:

| Clause | Obligation | Control | Evidence | Assessment Logic |
| --- | --- | --- | --- | --- |
| **GAID 2025 Part VIII, Art. 29 & Schedule 2** — "Breach notifications to NDPC must use the Schedule 2 template (nature, categories and approximate number of data subjects, likely consequences, measures taken) and be filed within 72 hours." | File breach notifications to NDPC within 72 hours using the GAID Schedule 2 template. (`NDPC-GAID-BRCH-007`) | Rule evaluator in `src/lib/rules/engine.ts`: trigger `if_processes_personal_data` + due rule `within_days_of_event` (3 days). Gap analysis in `src/lib/policy/gap-analysis.ts` asks Claude whether the uploaded policy references the 72-hour window and the Schedule 2 fields. | Breach response runbook PDF uploaded via evidence drawer; sha256-hashed; row in `evidence` table referencing `obligation_completion`. | Pass/fail per incident. Obligation = `met` when (a) evidence artefact attached AND (b) Claude returns `meets=true` with a verbatim policy quote covering the 72-hour window. Otherwise `unmet` with severity `high` (filings/breach class). |
| **NDPA 2023 s.32 / GAID 2025 Part IV** — Every DCMI must designate a qualified DPO and publish their contact details. | Appoint a Data Protection Officer and publish contact in the privacy notice. (`NDPC-DPO-002`) | Structural check against `business_profile.has_dpo`, plus policy gap analysis for published contact details. | DPO appointment letter + link to the published privacy notice section. | Obligation = `met` when `business_profile.has_dpo = true` AND evidence attached AND policy contains DPO contact block. Severity `high` if unmet. |
| **CBN RBCF §3.1** — Maintain a board-approved, annually reviewed cybersecurity policy. | Board-approved cybersecurity policy, annual review. (`CBN-POLICY-001`) | Trigger `if_cbn_licensed`; due rule `annual` (Jan 31). Only applies when the profile indicates CBN licensing. | Board resolution PDF + most recent review minutes. | Trigger gate first (skips entirely for non-CBN entities), then `met` when evidence dated within the last 12 months. Due-date logic in `nextDueDate()` surfaces overdue status on the dashboard. |
| **CBN RBCF §8.3** — Report material cyber incidents to the CBN Incident Response Team within 24 hours of detection. | Report cyber incidents to CBN within 24h. (`CBN-INCIDENT-004`) | Trigger `if_cbn_licensed`; due rule `within_days_of_event` (1 day). Evidence-driven; no scheduled due date. | CBN incident report reference number, or evidence of timely submission. | Pass/fail per incident. No scheduled recurrence — obligation evaluated against attached evidence when incidents occur. |
| **GAID 2025 Part IX, Art. 34** — Where services are likely to be accessed by children under 18, operate a verifiable parental-consent mechanism and document the verification method. | Parental-consent verification for children's data processing. (`NDPC-GAID-CHILD-005`) | Gap analysis only: Claude checks whether the uploaded policy describes a parental-consent mechanism and its verification method. Dual citation required. | Policy excerpt + optional DPIA extract covering the child-data risk category. | `meets=true` only when both policy citation and regulation citation are verbatim-matched. Severity `medium` when silent. |

**Evaluator code path (same for every row):**
`src/lib/rules/engine.ts::computeObligations(profile, frameworks)` → status drawn from `completedCodes` set (evidence attached) → gap analysis augments with `gap_finding` rows grounded in dual citations.

---

## System Architecture

**Layers:**

- **Input Layer** — Next.js 16 App Router server components + React 19 client components. Clerk-authenticated routes under `/dashboard` and `/onboarding`. Public routes `/`, `/trust/[slug]`.
- **AI Layer** — Two services via HTTP: Anthropic **Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`) for gap analysis with prompt caching; Google **Gemini** (`gemini-embedding-001`) for policy + regulator embeddings.
- **Rules/Logic Layer** — Pure TypeScript evaluator `src/lib/rules/engine.ts` over framework JSON in `content/frameworks/*.json`. Triggers like `if_processes_personal_data`, `if_cbn_licensed`, `if_users_over`. Due rules: `annual`, `quarterly`, `monthly`, `within_days_of_event`, `once`. Per-framework scoring plus aggregate compliance score.
- **Data Layer** — Postgres 16 + pgvector via porsager/`postgres` driver. Tables: `business_profile`, `obligation_completion`, `evidence`, `policy_document`, `policy_chunk`, `regulatory_chunks`, `gap_finding`, `trust`. Migrations in `scripts/migrate.ts`; ingest in `scripts/ingest.ts`.
- **Output Layer** — OSCAL Assessment-Results JSON from `src/lib/export/oscal.ts` (deterministic UUIDs, stable-stringified sha256 hash, optional HMAC signature); public Trust Center page `/trust/[slug]`; downloadable attestation at `/trust/[slug]/attestation?download=1`.

**Architecture diagram:** see `docs/architecture.md` in the repo (ASCII block diagram) or the inline "What's in the box" section in `DEMO.md`.

---

## Technology Stack

- **Frontend:** Next.js 16 (App Router, React Server Components, server actions), React 19 (`useActionState`), Tailwind CSS, shadcn/ui primitives, next-themes, lucide-react icons.
- **Backend:** Next.js server actions (`"use server"`), porsager/`postgres` client with pgvector extension, Zod for input validation, Clerk server SDK for auth.
- **AI Tools / Models:**
  - **Anthropic Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`) — gap analysis, grounded Q&A. Prompt caching via `cache_control: ephemeral`.
  - **Google Gemini** (`gemini-embedding-001`) — 768-dim embeddings for policy chunks + regulator chunks.
- **Database:** Postgres 16 with pgvector (`pgvector/pgvector:pg16` via Docker Compose locally).
- **APIs & Integrations:**
  - Clerk (auth + `user.created` Svix webhook).
  - OSCAL Assessment-Results v1.1.2 schema (NIST).
  - Vitest + jsdom (27 tests passing).

---

## Compliance Logic (Rules Engine)

- **How we determine compliance:** Two complementary signals per obligation.
  1. **Structural** — facts from the onboarding wizard: `processesPersonalData`, `handlesPayments`, `isLicensedByCBN/NCC/SEC`, `hasDpo`, `userCountNG`. Triggers in `src/lib/rules/engine.ts:53-101` switch on these.
  2. **Evidence-backed** — presence of an attached artefact in the `evidence` table, sha256-hashed, keyed to an obligation code. Flips the obligation to `met` in `obligation_completion`.
- **Rules implemented:**
  - 8 trigger predicates (`always`, `if_processes_personal_data`, `if_handles_payments`, `if_offers_digital_assets`, `if_cbn_licensed`, `if_ncc_licensed`, `if_sec_licensed`, `if_users_over`, `if_entity_in`).
  - 5 due-rule shapes (`once`, `annual`, `quarterly`, `monthly`, `within_days_of_event`).
  - Sort order: overdue → upcoming → met → not_applicable.
- **Pass/fail or scoring?** **Both.** Per-obligation status is categorical (`met`, `upcoming`, `overdue`, `not_applicable`); compliance score is `round(met_applicable / total_applicable * 100)` via `complianceScore()`. The dashboard shows both; OSCAL carries per-obligation findings, not the aggregate score.

---

## AI Usage

- **Where AI is used:**
  1. **Gap analysis** (`src/lib/policy/gap-analysis.ts`) — for each GAID 2025 obligation, retrieve top-K policy chunks + top-K regulator chunks, prompt Claude for a strict JSON verdict, persist `gap_finding` rows.
  2. **Grounded Q&A** (`src/lib/llm/answerer.ts` + `/dashboard/ask`) — retrieval over regulatory chunks, Claude answers with inline clause citations.
- **How outputs are grounded:**
  - Prompts include the exact retrieved policy excerpt and regulator excerpt verbatim.
  - System prompt constrains the schema: `{meets, severity, description, policy_citation, regulation_citation}`. Citations must be verbatim slices from the provided excerpts.
  - "If the policy is silent on the obligation, `meets=false`" — silence is not interpreted as compliance.
  - Retrieval uses pgvector cosine similarity over Gemini embeddings; no free-form generation without retrieved context.
- **Low-confidence handling:**
  - If Claude omits citations, the finding is persisted with `policy_citation: null` and surfaced as "needs review" rather than pass/fail.
  - JSON-parse failure raises; no string-scraped fallback is ever treated as an answer.
  - The rules engine never consults Claude — even if AI output is malformed, the deterministic compliance decision stands.

---

## Evidence & Explainability

**How we provide transparency and traceability:**

- **Clause references on every row.** Each obligation stores `clauseRef` (e.g. *"GAID 2025 Part VIII, Art. 29 & Schedule 2"*) and `sourceUrl` (regulator's canonical PDF). Rendered on the dashboard and in OSCAL observations.
- **Dual-citation gap findings.** Every `gap_finding` shows the policy excerpt *and* the regulation excerpt side-by-side, with severity and a ≤60-word actionable description.
- **Evidence provenance.** Every attached file is sha256-hashed at upload; the `evidence` table stores `filename`, `sha256`, `mime_type`, and the linking `obligation_code`. OSCAL observations include the hash.
- **Content-hash attestation.** OSCAL output is canonicalised (`stableStringify`) before hashing, so two runs with the same data produce byte-identical JSON and hash. Optional HMAC signature binds the hash to a shared secret.
- **Hash chain of custody.** Trust Center snapshots the document + hash at publish time (`src/app/dashboard/trust/actions.ts`). The public page shows the hash; the download endpoint serves the *same* stored document. Third-party auditors can verify without trusting the server.
- **Reasons behind decisions.** Each `gap_finding.description` explains *why* Claude judged the policy as meeting or missing the obligation, referencing the specific gap. The rules engine exposes `reason` per computed obligation (e.g. "Licensed or regulated by CBN", "More than 100,000 Nigerian users").

---

## Demo Walkthrough

- **Input:** A realistic draft privacy policy (`demo/acme-fintech-privacy-policy.md`) and onboarding answers describing a Nigerian fintech with 100k users, CBN licensing, and a DPO.
- **Processing (visible steps):**
  1. Onboarding wizard saves profile; `/dashboard` renders 30+ applicable obligations across CBN + NDPC + GAID 2025.
  2. Policy upload parses, chunks, and embeds the document (~6 seconds).
  3. "Analyse gaps" iterates every GAID 2025 obligation; findings render with dual citations and severity.
  4. Evidence drawer: attach a sample DPIA PDF → obligation flips `met` → compliance score ticks up.
  5. Export OSCAL: file downloads with `complyng-attestation` wrapper, content hash visible.
  6. Publish Trust Center under slug "acme" → `/trust/acme` is public, no auth required.
- **Output:**
  - A machine-verifiable OSCAL Assessment-Results JSON document.
  - A public Trust Center page showing compliance posture, framework breakdown, obligation-level status, evidence metadata (filename + sha256, never file contents), and the content hash.
  - A downloadable attestation at `/trust/acme/attestation?download=1` whose `sha256(stableStringify(assessment_results))` matches the hash on the public page.

---

## Challenges & Future Improvements

- **Challenges:**
  - **Silent-failure-prone AI boundary.** A bad Google API key stops ingestion; a bad Anthropic key stops gap analysis. Both fail without surface-level errors until exercised. Solved by exercising both in the hero flow; still want first-boot key validation.
  - **Next.js 16 breaking changes.** `middleware.ts` renamed to `proxy.ts`, Clerk 7's removal of `<SignedIn>`/`<SignedOut>`, `useActionState` patterns — significant delta vs. pre-training conventions.
  - **OSCAL Assessment-Results learning curve.** Deterministic UUIDs and canonical stringification had to be built from the spec; most OSCAL examples online are for System Security Plans, not assessment outputs.
  - **"Not legal advice" credibility balance.** Every obligation row is `verifyStatus: "unverified"` until Nigerian counsel reviews. Shipped this honestly rather than faking certainty.
- **With more time (polish):**
  - **Trust Center republish audit trail** — currently overwrites; want an append-only `trust_publication` history so posture evolution is auditable.
  - **HMAC key rotation story** — today the signature uses one env secret; need staged rotation + verify-any-of-N.
  - **Regulator PDF auto-ingest pipeline** — today PDFs are hand-placed in `content/docs/`; want scheduled scraping from `ndpc.gov.ng`, `cbn.gov.ng`, etc., with diff detection.
  - **First-boot key validation** — surface Anthropic/Google key failures before the first user-facing action, not during it.
- **What we'd build next:**
  - **DPCO workspace** — multi-client console so a licensed DPCO can audit several DCMIs and prepare Form C returns in bulk.
  - **Regulator-side verifier** — a companion page where an NDPC auditor pastes a Trust Center URL, downloads the OSCAL, and the verifier shows which observations and findings have valid hashes.
  - **WhatsApp + email delivery** — obligation due-date nudges via the channels Nigerian SMEs actually read, not a web dashboard.
  - **Go API (`complyng-api`)** — split the compliance engine into a separate service so regulators and partners can embed it into their own tooling.
