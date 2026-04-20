# ComplyNG Web — Handoff

## Last Updated: 2026-04-20 — Session: Clerk auth + Docker Postgres migration + docs refresh

This session finished the Clerk-authenticated onboarding flow, replaced the Neon-specific driver with a portable `postgres` (porsager) setup talking to a local Docker pgvector, and refreshed README.md + DEMO.md to match reality. Next session should ingest regulatory content into the new DB and do a full click-through of the end-to-end flow.

## Completed Pages & Routes

| Route | Status | Notes |
| --- | --- | --- |
| `/` | ✅ | Landing. `Navbar` is now async — shows "Open dashboard" when signed in (via `auth()`), "Log in" / "Get Started" otherwise. |
| `/signup/[[...rest]]` | ✅ | Clerk `<SignUp />`, redirects to `/dashboard` on success. |
| `/login/[[...rest]]` | ✅ | Clerk `<SignIn />`. |
| `/onboarding` | ✅ | Router page — redirects to `nextIncompleteStep` or `/dashboard` if complete. |
| `/onboarding/basics` | ✅ | Name, website, contact name. Zod-validated. |
| `/onboarding/type` | ✅ | 5 entity-type radio cards. |
| `/onboarding/scale` | ✅ | Nigerian users + 4 activity flags. |
| `/onboarding/licenses` | ✅ | CBN / NCC / SEC / DPO — marks `completed_at`. |
| `/dashboard` | ✅ | Clerk-gated. Reads profile from DB. |
| `/dashboard/ask` | ✅ | RAG Q&A, Clerk-gated. |
| `/dashboard/profile` | ✅ | Edit form now writes to DB via `saveFullProfile`. |
| `/api/ask` | ✅ | RAG endpoint, Clerk-gated by `proxy.ts`. |
| `/api/obligations` | ✅ | Reads from DB via `getProfile()`. |
| `/api/webhooks/clerk` | ✅ | Svix-verified `user.created` → `ensureProfileStub`. |

## Completed Components

- `src/components/landing/*` — navbar (auth-aware), hero, features, frameworks (NITDA/NDPC/CBN/NCC/SEC), footer, dashboard-preview.
- `src/components/onboarding/wizard-shell.tsx` — step indicator shared across all 4 onboarding pages.
- `src/components/dashboard/dashboard-nav.tsx` — Clerk `<UserButton />` + `ThemeToggle` + 3-link nav (Obligations / Ask / Profile).
- `src/components/dashboard/obligation-row.tsx`, `score-card.tsx`, `ask-panel.tsx` — unchanged from hackathon prototype.
- `src/components/theme-provider.tsx`, `theme-toggle.tsx` — next-themes.
- `src/components/ui/*` — shadcn (badge, button, card, input, navigation-menu, separator).

## API Integrations

Frontend → internal backend only (no separate API server yet — Go `complyng-api` is a future thing).

| Caller | Endpoint | Status |
| --- | --- | --- |
| `/dashboard/ask` form action | `/api/ask` (internal) | ✅ Working. Uses Anthropic Claude Sonnet + Gemini embeddings. |
| `/dashboard` page | `getProfile()` → Postgres | ✅ DB-backed. |
| `/dashboard/profile` form | server action → `saveFullProfile()` | ✅ DB-backed. |
| Clerk → `/api/webhooks/clerk` | `user.created` | ✅ Svix signature verification in place. |
| `src/lib/llm/retriever.ts` | Gemini embedding API + Postgres pgvector | ✅ Tagged-template queries work against porsager driver. |

External keys required: `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` (optional), `DATABASE_URL`.

## Current Test Status

```
 Test Files  3 passed (3)
      Tests  20 passed (20)
```

- `__tests__/rules.test.ts` — 7 tests, rules engine coverage (fintech / platform / telco / VASP / score / overdue ordering).
- `__tests__/onboarding.test.ts` — 12 tests, pure-logic coverage of `nextIncompleteStep`, `isOnboardingComplete`, `rowToBusinessProfile` (including wizard resume + schema mapping).
- `__tests__/hero.test.tsx` — 1 test, landing hero smoke test.

## Current Build Status

- **TypeCheck:** ✅ `npx tsc --noEmit` clean.
- **Lint:** ✅ `bun run lint` clean (eslint).
- **Build:** ✅ `bun run build` compiles all 15 routes + `ƒ Proxy (Middleware)`.
- **Dev server:** ✅ Runs at http://localhost:3000 after `bun run db:up && bun run migrate`.

## Files Modified This Session

**New**
- `docker-compose.yml` — pgvector/pgvector:pg16 + named volume + healthcheck.
- `docs/handoff.md` — this file.

**Modified**
- `src/lib/db/client.ts` — rewritten: `neon()` → `postgres()` (porsager).
- `scripts/migrate.ts` — driver swap + `await db.end()`; `db.query()` → `db.unsafe()`.
- `scripts/ingest.ts` — driver swap + `await db.end()`.
- `src/components/landing/navbar.tsx` — async, uses `auth()` from `@clerk/nextjs/server`; conditional "Open dashboard" vs "Log in / Get Started".
- `src/components/dashboard/dashboard-nav.tsx` — added `<UserButton />`.
- `src/app/layout.tsx` — wrapped in `<ClerkProvider afterSignOutUrl="/">`.
- `src/app/onboarding/layout.tsx` — `<UserButton />` without `afterSignOutUrl` prop (moved to provider).
- `src/app/dashboard/profile/actions.ts` — cookie → `saveFullProfile(userId, parsed.data)`.
- `package.json` — removed `@neondatabase/serverless`, added `postgres`. Added scripts: `db:up`, `db:down`, `db:reset`, `db:logs`, `db:psql`.
- `.env.local.example` — local Docker URL as default; added Clerk keys.
- `.env.local` — local Postgres URL added (was previously typo'd as `.evn`, renamed earlier in session).
- `README.md` — full rewrite from Next boilerplate to project overview.
- `DEMO.md` — removed Neon references, added Clerk/onboarding click-through, added `db:reset` panic button.
- `vitest.config.mts` — added `server-only` alias stub so `src/lib/db/profile.ts` can be unit-tested.
- `__tests__/stubs/server-only.ts` — new no-op stub.

**Earlier in session (already committed-ready)**
- `src/proxy.ts` (Next 16 renamed `middleware.ts`). Moved from project root to `src/` because Clerk's runtime check expects it there with `src/` layout.
- `src/app/signup/[[...rest]]/page.tsx`, `src/app/login/[[...rest]]/page.tsx`.
- `src/app/onboarding/{basics,type,scale,licenses}/{page.tsx,actions.ts}` — 4-step wizard.
- `src/app/api/webhooks/clerk/route.ts` — Svix-verified webhook.
- `src/lib/db/profile.ts` — 9 helpers covering the profile lifecycle.
- `src/lib/profile.ts` — rewritten from cookie → `auth().userId` + DB lookup.
- `__tests__/onboarding.test.ts` — 12 tests.

## Open Decisions

1. **Production Postgres host.** Plan explicitly made the app Neon-agnostic, but the deployment target is still unchosen (Fly / Railway / Supabase / self-hosted / Neon-as-Postgres). Pick before shipping.
2. **`CLERK_WEBHOOK_SECRET` on prod.** Webhook currently works without it (lazy stub creation covers the race), but production should configure the Clerk webhook endpoint + secret properly. Needs a public URL first.
3. **Source PDFs for RAG.** `content/docs/sources.json` expects 6 PDFs that aren't committed. Ingest falls back to the obligation JSON summaries, which works but is less rich. Decision: ship without PDFs for now, or track them down?
4. **Error UX in onboarding.** Server actions throw on Zod failure — there's no user-visible error surface yet. Form works but a bad input just 500s.
5. **Obligation completion toggle wiring.** `toggleObligationCompletion` exists in the repo layer and the plan mentions clicking to mark obligations met, but I didn't verify the UI button is wired to it. Check `src/components/dashboard/obligation-row.tsx`.

## Traps to Avoid

- **Middleware/Proxy location.** Next 16 docs say proxy goes in project root, but Clerk 7 with a `src/` layout insists on `src/proxy.ts`. If you see `clerkMiddleware() was not run`, that's the cause.
- **Clerk 7 export changes.** `SignedIn` / `SignedOut` are gone from `@clerk/nextjs`. Use server-side `auth()` check in a server component instead. `afterSignOutUrl` prop is gone from `<UserButton />` — set it once on `<ClerkProvider afterSignOutUrl="/">`.
- **`.env` typos.** The env file was briefly named `.evn` and Next silently didn't load it (there's no warning). Double-check the filename if env-dependent code explodes with `ENV not set`.
- **`server-only` in tests.** Any module imported by `src/lib/db/profile.ts` transitively imports `server-only`, which throws at import time in vitest's jsdom env. Worked around with a stub in `__tests__/stubs/server-only.ts` + vitest `alias`. Don't remove it.
- **Script hangs.** porsager's Pool holds the Node event loop open; `scripts/migrate.ts` and `scripts/ingest.ts` both need `await db.end()` or they'll never exit. Wired up already — don't refactor it away.
- **TEXT[] column binding.** The existing `steps as unknown as string[]` double-cast is harmless with porsager (which binds JS arrays natively to `text[]`), but don't "clean it up" — it compiles against both drivers.
- **Destructive `db:reset`.** Wipes the Docker volume (`docker compose down -v`). Warn the user before running it in any shared env.
- **Content re-ingest on demo day.** Plan deliberately chose no pre-baked SQL seed dump. First ingest takes ~1 min and needs `GOOGLE_API_KEY`. Run it once before demo, don't rely on "it'll be fast when I need it."

## Next Session Should

1. **Confirm `.env.local` has all six keys** (`DATABASE_URL`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, optional `CLERK_WEBHOOK_SECRET`).
2. **Run `bun run ingest`** against the local Docker Postgres to populate `regulatory_chunks` — the RAG `/dashboard/ask` path returns zero results otherwise.
3. **Full end-to-end click-through:**
   - Sign up at `/signup` with a throwaway email.
   - Walk the wizard.
   - Verify `/dashboard` renders obligations matching the entity type picked.
   - Ask a question at `/dashboard/ask` — confirm cited answer.
   - Check the `business_profile` row with `bun run db:psql` → `SELECT * FROM business_profile;`.
4. **Verify obligation completion toggle** — click "mark complete" on an obligation and check the `obligation_completion` table gets a row. If the UI isn't wired, wire it (see Open Decision #5).
5. **Commit the untracked work.** Most of this session is still in untracked files (see `git status`): `docker-compose.yml`, `__tests__/`, `src/app/api/`, `src/app/dashboard/`, `src/app/login/`, `src/app/onboarding/`, `src/app/signup/`, `src/components/dashboard/`, `src/components/onboarding/`, `src/lib/db/`, `src/lib/llm/`, `src/lib/rules/`, `src/proxy.ts`, `vitest.config.mts`, `content/`, `demo/`, `scripts/`, `DEMO.md`. Break into logical commits (auth + onboarding; db driver swap; docs).
6. **Pick a production Postgres host** (Open Decision #1) if deployment is on the agenda.
