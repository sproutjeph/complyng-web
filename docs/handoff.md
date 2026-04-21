# ComplyNG Web — Handoff

## Last Updated: 2026-04-21 — Session: Demo-day polish (pending-state fix, form UX, submission docs, hackathon deck with NITDA problem map)

Demo-day session. Landed four focused commits on top of main (all already pushed), plus a rebuild of the hackathon PowerPoint deck on the Desktop to include a dedicated slide mapping ComplyNG onto the four NITDA hackathon problem statements. App is unchanged from the end of the 2026-04-20 session except for the `fix(forms)` inline-error pass and the `fix(policies)` pending-state button. Tests, typecheck, lint all green. Working tree is effectively clean (only Claude settings + last-ingest timestamp drift).

## Completed Pages & Routes

All routes unchanged from previous handoff and still green.

| Route | Status | Notes |
| --- | --- | --- |
| `/` | ✅ | GAID 2025 landing. |
| `/signup/[[...rest]]`, `/login/[[...rest]]` | ✅ | Clerk. |
| `/onboarding` + `/onboarding/{basics,type,scale,licenses}` | ✅ | 4-step wizard. **This session:** Zod failures now render inline instead of throwing. |
| `/dashboard` | ✅ | Obligations, score card, evidence drawers, Export OSCAL. |
| `/dashboard/ask` | ✅ | RAG Q&A with citations. |
| `/dashboard/profile` | ✅ | Business-profile editor. |
| `/dashboard/policies` | ✅ | Upload policy, list. **This session:** upload errors now render inline. |
| `/dashboard/policies/[id]` | ✅ | Gap-analysis view. **This session:** "Run gap analysis" button now shows pending state (spinner + "Analysing…") instead of freezing the UI. |
| `/dashboard/trust` | ✅ | Slug picker + Publish / Unpublish / Refresh. |
| `/trust/[slug]` | ✅ | Public no-auth Trust Center with OSCAL hash. |
| `/trust/[slug]/attestation` | ✅ | Downloadable OSCAL JSON. |
| `/api/ask`, `/api/obligations`, `/api/webhooks/clerk`, `/api/export/oscal` | ✅ | Unchanged. |

## Completed Components

Unchanged from previous handoff, plus:

- `src/app/dashboard/policies/[id]/gap-analysis-button.tsx` — new `"use client"` component using React 19 `useFormStatus`. Swaps `<Play>` icon for `<Loader2>` spinner and text for "Analysing…" while the `runGapAnalysis` server action is inflight. Includes `aria-live="polite"` announcement for screen readers.
- Inline form-error surface reused by `src/app/onboarding/*` and `src/app/dashboard/policies` instead of letting server-action Zod failures throw.

## API Integrations

Unchanged from previous handoff. No new backend endpoints this session.

| Caller | Endpoint | Status |
| --- | --- | --- |
| `/dashboard/ask` form action | `/api/ask` | ✅ Anthropic Claude Sonnet + Gemini embeddings + pgvector retrieval. |
| `/dashboard` page | `getProfile()` + rules engine | ✅ DB-backed. |
| `/dashboard/profile` form | `saveFullProfile()` | ✅ DB-backed. |
| `/dashboard/policies` form | `uploadPolicy`, `runGapAnalysis` server actions | ✅ pdf-parse → chunker → embedder → persist; Claude Sonnet 4.5 structured-JSON gap analysis. |
| Evidence drawer form | `attachEvidence`, `removeEvidence` | ✅ sha256-hashed, auto-flips obligation to `met`. |
| `/dashboard/trust` form | `saveTrustCenterSlug`, `publishTrustCenter`, `unpublishTrustCenter`, `refreshTrustCenter` | ✅ Snapshots OSCAL against live obligations + evidence. |
| `/api/export/oscal` | `buildOscalAttestation` | ✅ Deterministic UUIDs, content hash, optional HMAC. |
| `/trust/[slug]/attestation` | `getTrustCenterBySlug` | ✅ Hash matches public page. |
| Clerk → `/api/webhooks/clerk` | `user.created` | ✅ Svix-verified. |

External keys: `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` (optional), `DATABASE_URL`, `ATTESTATION_HMAC_SECRET` (optional).

## Current Test Status

```
 Test Files  4 passed (4)
      Tests  27 passed (27)
```

Files: `__tests__/rules.test.ts`, `__tests__/onboarding.test.ts`, `__tests__/hero.test.tsx`, `__tests__/oscal.test.ts`.

## Current Build Status

- **TypeCheck:** ✅ `npx tsc --noEmit` clean (no output).
- **Lint:** ✅ `bun run lint` clean.
- **Build:** ✅ Previous session confirmed; no app source changed since then that would affect compilation.
- **Dev server:** not spun up this session (demo-prep focus).

## Files Modified This Session

Everything that mattered for the demo is already committed. `git diff --stat main` is only noise:

```
.claude/settings.local.json     | 7 +++++--
content/docs/.last-ingest.json  | 2 +-
```

Committed this session (in order, all on `main` now):
1. `8c75357` docs: README, demo walkthrough, Acme seed policy
2. `ed20953` fix(forms): inline error UX for onboarding + policy upload
3. `f5de9a2` docs: fix obligation counts + draft submission content
4. `41153b9` docs: add glossary for demo + team reference
5. `5e1a737` fix(policies): show pending state on gap-analysis button (branch `fix/gap-analysis-pending-state`, PR #1)
6. `5e99611` Merge pull request #1 from sproutjeph/fix/gap-analysis-pending-state

Off-repo artifacts produced this session (NOT in git):
- `/Users/jephthah/Desktop/ComplyNG - Hackathon Deck.pptx` — 13-slide hackathon deck. Slide 3 is now "NITDA problem statements we solve" with a 4-card layout mapping ComplyNG onto P1 (primary — single compliance interface), P3 (strong — multi-framework adaptability), P4 (medium — regulator visibility), P2 (light — real-time assessment + reporting).
- `/tmp/build_deck.py` — python-pptx generator. DST points at Desktop path. Re-run with `python3 /tmp/build_deck.py` to regenerate.

## Open Decisions

1. **Commit hygiene.** Working tree is now effectively clean — only `.claude/settings.local.json` (Claude permission noise) and `content/docs/.last-ingest.json` (ingest timestamp) drift. Safe to leave untracked.
2. **Production Postgres host.** Still unchosen (Fly / Railway / Supabase / Neon / self-hosted). Without this, `/trust/[slug]` is local-only and regulators can't verify.
3. **`ATTESTATION_HMAC_SECRET` management.** Optional today. If used on prod, needs a secret-rotation story.
4. **Source PDFs.** `content/docs/` is expected to hold GAID 2025 / NDPA / etc. Ingest falls back to obligation-JSON synthetic chunks when PDFs are missing — works, but answers are less rich.
5. **Trust Center editing audit trail.** Republishing changes the attestation hash but there's no audit table recording old hashes. Consider if regulators would want history.
6. **Deck location.** Deck lives on Desktop with generator at `/tmp/build_deck.py` — not in version control. If the team wants to track it, move the script into `scripts/` and gitignore the `.pptx` output.

## Traps to Avoid

- **`useFormStatus` placement.** Must be called inside a child component of `<form>`, never in the same component that renders `<form>`. The new `GapAnalysisButton` is correct; don't inline it back.
- **Lucide `Github` icon gone.** Landing CTA originally imported `Github`; build fails with "Export Github doesn't exist". Use `Code2`.
- **Hero test drift.** `__tests__/hero.test.tsx` asserts on the headline text. If you change the headline, update the regex.
- **`src/proxy.ts` matcher.** Anything under `/api/export/*` must stay listed — otherwise the OSCAL download 404s behind the proxy.
- **`postgres.JSONValue` type on insert.** When writing `attestation` JSONB via porsager, cast with `input.attestation as postgres.JSONValue` around `db.json(...)`.
- **Mutable fixtures in oscal tests.** Share arrays across tests only by copy: `sampleEvidence.map((e) => ({ ...e }))`.
- **Test output buffering.** `bun run test | tail -N` buffers. Prefer `bun run test 2>&1 | grep -E "(PASS|FAIL|Tests|Test Files)"`.
- **Browser tab freeze.** After publishing Trust Center, `javascript_tool` occasionally times out with CDP "renderer frozen". Fall back to `curl` for verification.
- **Clerk 7 export changes.** `SignedIn`/`SignedOut` don't exist. Use server-side `auth()`. `<ClerkProvider afterSignOutUrl="/">` is the only place to set that prop.
- **Middleware → proxy.** Next 16 renamed `middleware.ts` → `proxy.ts` and with `src/` layout it must live at `src/proxy.ts` for Clerk.
- **`server-only` in vitest.** Handled by alias stub `__tests__/stubs/server-only.ts`. Don't remove.
- **porsager holds the event loop.** Every script needs `await db.end()`.
- **`db:reset` is destructive.** Wipes the Docker volume. Warn before running in a shared env.
- **Deck DST drift.** `/tmp/build_deck.py` DST was updated to `/Users/jephthah/Desktop/ComplyNG - Hackathon Deck.pptx`. If a stale copy of the script with a Downloads path gets run, the Desktop deck will go stale silently.

## Next Session Should

1. **Walk hero flow end-to-end** against a clean DB before the demo slot: `bun run db:reset && bun run ingest`, then landing → signup → onboarding → upload `demo/acme-fintech-privacy-policy.md` → "Run gap analysis" (confirm the new pending spinner fires) → attach evidence → Export OSCAL → publish Trust Center → verify `/trust/<slug>` shows matching sha256.
2. **Verify the demo GIF** (`demo/complyng-hero-flow.gif`, 3.8MB, 24 frames, 1050×1148) still matches the current UI — the pending-state fix changed the button mid-flow. Re-record if the old GIF shows a frozen button.
3. **Finalise `docs/submission.md`** — content is drafted; confirm it matches the deck's NITDA mapping (P1 primary, P3 strong, P4 medium, P2 light) and the hash-anchored OSCAL story.
4. **Decide on production Postgres** (Open Decision #2). Without it, `/trust/[slug]` is local-only.
5. **Decide on PDFs** (Open Decision #4). Either commit `content/docs/gaid-2025.{pdf,md}` and rerun `bun run ingest`, or document the fallback in DEMO.md.
6. **Consider moving `build_deck.py` into `scripts/`** if the team wants the deck under version control.
