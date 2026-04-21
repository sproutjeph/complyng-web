# ComplyNG Web — Handoff

## Last Updated: 2026-04-20 — Session: GAID hero flow + OSCAL/Trust Center + landing rewrite

This session shipped the four must-have hackathon features (policy upload → AI gap analysis → evidence ledger → OSCAL export → public Trust Center) and rewrote the landing page so it describes the app as actually built. Hero flow was verified end-to-end in a live browser against the dev server. All tests green, build clean, lint clean, typecheck clean.

## Completed Pages & Routes

| Route | Status | Notes |
| --- | --- | --- |
| `/` | ✅ | Landing rewritten this session — hero, features, CTA, footer, navbar, social-proof, dashboard-preview all describe the real app. |
| `/signup/[[...rest]]` | ✅ | Clerk `<SignUp />`. |
| `/login/[[...rest]]` | ✅ | Clerk `<SignIn />`. |
| `/onboarding` + `/onboarding/{basics,type,scale,licenses}` | ✅ | 4-step wizard, DB-backed, resumable. |
| `/dashboard` | ✅ | Obligations grouped by framework, score card, evidence drawers per row, "Export OSCAL" button. |
| `/dashboard/ask` | ✅ | RAG Q&A, cited. |
| `/dashboard/profile` | ✅ | Edit business profile, saves via `saveFullProfile`. |
| `/dashboard/policies` | ✅ | Upload policy PDF/MD, list uploaded policies. |
| `/dashboard/policies/[id]` | ✅ | Per-policy gap-analysis view with dual citations. |
| `/dashboard/trust` | ✅ | Slug picker + Publish / Unpublish / Refresh. |
| `/trust/[slug]` | ✅ | Public no-auth trust center, renders OSCAL content with compliance score, frameworks, evidence metadata, sha256 hash. Includes download link to `/trust/[slug]/attestation?download=1`. |
| `/trust/[slug]/attestation` | ✅ | Serves the stored OSCAL JSON; hash byte-identical to what the public page displays. |
| `/api/ask` | ✅ | RAG endpoint, Clerk-gated. |
| `/api/obligations` | ✅ | Reads from DB via `getProfile()`. |
| `/api/webhooks/clerk` | ✅ | Svix-verified `user.created`. |
| `/api/export/oscal` | ✅ | GET returns OSCAL Assessment-Results JSON; `?download=1` → attachment disposition; Clerk-gated via proxy matcher `/api/export(.*)`. |

## Completed Components

- `src/components/landing/*` — rewritten this session. Navbar (auth-aware), hero (GAID 2025 messaging), features (6 real features), frameworks (JSON-per-regulator story), CTA (Start free + View the source), footer (real links), social-proof (real stats), dashboard-preview (GAID obligations with clause refs + sha256/OSCAL/Trust strip).
- `src/components/onboarding/wizard-shell.tsx` — step indicator.
- `src/components/dashboard/dashboard-nav.tsx` — UserButton + ThemeToggle + nav (Obligations / Ask / Policies / Trust / Profile).
- `src/components/dashboard/obligation-row.tsx`, `score-card.tsx`, `ask-panel.tsx`, `policy-upload.tsx`, `gap-list.tsx`, `evidence-drawer.tsx` (inline `<details>` drawer — no client JS needed).
- `src/components/trust/trust-center.tsx` — shared Trust Center renderer.
- `src/components/theme-provider.tsx`, `theme-toggle.tsx` — next-themes.
- `src/components/ui/*` — shadcn primitives.

## API Integrations

| Caller | Endpoint | Status |
| --- | --- | --- |
| `/dashboard/ask` form action | `/api/ask` | ✅ Anthropic Claude Sonnet + Gemini embeddings + pgvector retrieval. |
| `/dashboard` page | `getProfile()` + rules engine | ✅ DB-backed. |
| `/dashboard/profile` form | server action → `saveFullProfile()` | ✅ DB-backed. |
| `/dashboard/policies` form | `uploadPolicy`, `runGapAnalysis` server actions | ✅ pdf-parse → chunker → embedder → persist; Claude Sonnet 4.5 with structured JSON for gap analysis. |
| Evidence drawer form | `attachEvidence`, `removeEvidence` server actions | ✅ sha256-hashed, auto-flips obligation to `met`. |
| `/dashboard/trust` form | `saveTrustCenterSlug`, `publishTrustCenter`, `unpublishTrustCenter`, `refreshTrustCenter` | ✅ Uses `snapshotAttestation` to build OSCAL against live obligations + evidence. |
| `/api/export/oscal` | `buildOscalAttestation` | ✅ Deterministic UUIDs, content hash, optional HMAC (controlled by `ATTESTATION_HMAC_SECRET`). |
| `/trust/[slug]/attestation` | `getTrustCenterBySlug` | ✅ Serves stored OSCAL; hash matches public page. |
| Clerk → `/api/webhooks/clerk` | `user.created` | ✅ Svix signature verified. |

External keys: `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` (optional), `DATABASE_URL`, `ATTESTATION_HMAC_SECRET` (optional — when set, OSCAL output is HMAC-signed).

## Current Test Status

```
 Test Files  4 passed (4)
      Tests  27 passed (27)
```

- `__tests__/rules.test.ts` — rules engine.
- `__tests__/onboarding.test.ts` — wizard step helpers, schema mapping.
- `__tests__/hero.test.tsx` — landing hero smoke test (updated this session to match new headline "Turn GAID 2025 into…").
- `__tests__/oscal.test.ts` — 7 new tests: deterministic content hash, hash changes on evidence add, finding/observation count, OSCAL state mapping, HMAC signing with/without secret, sha256 of canonical JSON, filename slugification.

## Current Build Status

- **TypeCheck:** ✅ `bunx tsc --noEmit` clean.
- **Lint:** ✅ `bun run lint` clean.
- **Build:** ✅ `bun run build` compiles every route including `/api/export/oscal`, `/dashboard/policies/[id]`, `/dashboard/trust`, `/trust/[slug]`, `/trust/[slug]/attestation`.
- **Dev server:** ✅ Ran live during this session; hero flow verified in browser.

## Files Modified This Session

**Rewritten / updated (landing)**
- `src/components/landing/hero.tsx` — GAID 2025 hero copy + CTA swap.
- `src/components/landing/features.tsx` — 6 real features (Rules Engine, Policy Gap Analysis, Evidence Ledger, OSCAL, Trust Center, Cited AI Q&A).
- `src/components/landing/cta.tsx` — removed WhatsApp; added GitHub "View the source" (icon is `Code2` — `Github` is no longer exported by lucide-react).
- `src/components/landing/footer.tsx` — real product/framework/resource links.
- `src/components/landing/navbar.tsx` — shortened nav; banner mentions GAID 2025 effective date.
- `src/components/landing/social-proof.tsx` — real stats (6 frameworks, 34+ obligations, OSCAL, sha256).
- `src/components/landing/dashboard-preview.tsx` — GAID obligations with clause refs + bottom strip calling out sha256/OSCAL/Trust.
- `src/components/landing/frameworks.tsx` — subhead rewritten around JSON-per-regulator story.

**New (earlier this session, pre-compact)**
- `src/lib/export/oscal.ts` — `buildOscalAttestation`, `stableStringify`, `deterministicUuid`, `findingState`, `attestationFilename`. Emits OSCAL Assessment-Results subset with findings (obligations) + observations (evidence records).
- `src/lib/db/trust.ts` — trust_center CRUD.
- `src/app/api/export/oscal/route.ts` — GET OSCAL.
- `src/app/dashboard/trust/page.tsx` + `actions.ts` — admin UI.
- `src/app/trust/[slug]/page.tsx` — public Trust Center.
- `src/app/trust/[slug]/attestation/route.ts` — downloadable OSCAL matching the published hash.
- `src/proxy.ts` — added `/api/export(.*)` matcher.
- `src/components/dashboard/dashboard-nav.tsx` — Trust link.
- `__tests__/oscal.test.ts` — 7 tests.
- `__tests__/hero.test.tsx` — updated headline assertion.
- `demo/deeppay-fintech-privacy-policy.md` — seed policy; also copied to `public/demo/`.
- `DEMO.md` — added the 6-step hero-flow section.

## Open Decisions

1. **Commit hygiene.** ~37 files are still untracked/modified (see `git status`). Work landed across several concerns: hero-flow features, landing rewrite, OSCAL + Trust Center, docs. Break into logical commits before the demo checkpoint.
2. **Production Postgres host.** Still unchosen (Fly / Railway / Supabase / Neon / self-hosted).
3. **`ATTESTATION_HMAC_SECRET` management.** Optional today. If used on prod, needs a secret-rotation story.
4. **Source PDFs.** `content/docs/` is expected to hold GAID 2025 / NDPA / etc. Ingest falls back to obligation-JSON synthetic chunks when PDFs are missing — works, but answers are less rich. Decide whether to ship without PDFs.
5. **Error UX on server actions.** Wizard + policy upload server actions still throw on Zod failure; no user-facing error surface.
6. **Trust Center editing audit trail.** Republishing changes the attestation hash but there's no audit table recording old hashes. Consider if regulators would want the history.

## Traps to Avoid

- **Lucide `Github` icon gone.** Landing CTA originally imported `Github`; build fails with "Export Github doesn't exist". Use `Code2` or any other lucide export.
- **Hero test drift.** `__tests__/hero.test.tsx` asserts on the headline text. If you change the headline again, update the regex.
- **`src/proxy.ts` matcher.** Anything under `/api/export/*` must stay listed — otherwise the OSCAL download becomes a 404 behind the proxy.
- **`postgres.JSONValue` type on insert.** When writing `attestation` JSONB via porsager, cast with `input.attestation as postgres.JSONValue` around `db.json(...)`. Raw `Record<string, unknown>` fails strict typing.
- **Mutable fixtures in oscal tests.** Share arrays across tests only by copy: `sampleEvidence.map((e) => ({ ...e }))`. Otherwise the "hash changes when evidence is added" test mutates fixtures consumed by later tests.
- **Test output vs `| tail -N` pipe.** `bun run test | tail -N` sometimes buffers and hides output. Use `> /tmp/test-out.log && cat /tmp/test-out.log` or filter with `grep -E "(PASS|FAIL|Tests|Test Files)"`.
- **Browser tab freeze.** After publishing Trust Center, `javascript_tool` occasionally timed out with CDP "renderer frozen". Fall back to `curl` to verify `/trust/[slug]` content and hash.
- **Clerk 7 export changes.** `SignedIn`/`SignedOut` don't exist. Use server-side `auth()`. `<ClerkProvider afterSignOutUrl="/">` is the only place to set that prop.
- **Middleware → proxy.** Next 16 renamed `middleware.ts` → `proxy.ts` and with `src/` layout it must live at `src/proxy.ts` for Clerk.
- **`server-only` in vitest.** Handled by alias stub `__tests__/stubs/server-only.ts`. Don't remove.
- **Script hangs.** porsager holds the event loop open; every script needs `await db.end()`.
- **`db:reset` is destructive.** Wipes the Docker volume. Warn before running in a shared env.

## Next Session Should

1. **Commit the pending work** in focused commits — this session's landing-page rewrite is already staged in working tree (modified files), and the OSCAL/Trust Center flow lives across `src/app/api/export/`, `src/app/dashboard/trust/`, `src/app/dashboard/policies/`, `src/app/trust/`, `src/lib/export/oscal.ts`, `src/lib/db/trust.ts`, `src/lib/policy/`, `__tests__/oscal.test.ts`. Break by concern before creating the PR.
2. **Produce the demo GIF** — `demo/complyng-hero-flow.gif` already captured (3.8MB, 24 frames, 1050x1148). Double-check it still tells the full story; re-capture if any UI changed this session.
3. **Set up the production Postgres host** (Open Decision #2). Until then `/trust/[slug]` only works locally.
4. **Decide on PDFs.** Either commit `content/docs/gaid-2025.{pdf,md}` and rerun `bun run ingest`, or explicitly document the fallback in DEMO.md so judges know the answer quality ceiling.
5. **Tighten server-action error UX** — at minimum render inline errors on `/onboarding/*` and `/dashboard/policies` instead of letting Zod throw.
6. **Live-verify** the landing → signup → onboarding → policy upload → gap analysis → evidence → OSCAL → Trust Center flow one more time end-to-end, in a fresh browser, against a clean DB. `bun run db:reset && bun run ingest` before demo day.
