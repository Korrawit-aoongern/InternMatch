# back — Archived (Dead Code)

> **Status: ARCHIVED — Not used in production.**
> This directory is a scaffold from early project init and is intentionally left dormant.

## Why this exists
- Created at `641a02b Init 1.0` as placeholder Express hello-world (`src/app.ts:5`).
- Never evolved beyond `Hello World!` on `:3003`. No routes, DB, auth, or business logic.

## Current architecture (source of truth)
All backend concerns live in `front/` (Next.js full-stack):
- Auth/session: `front/lib/actions/auth.ts`, `front/app/api/auth/*` (JWT + bcrypt + httpOnly cookies)
- Database: `front/lib/supabase/server.ts` (`getSupabaseAdmin()` with Supabase service_role)
- Domain logic: `front/lib/actions/internships.ts`, `skills.ts`, `portfolios.ts`
- Match scoring: `front/lib/utils/match.ts`
- AI: `front/lib/actions/geminiRecommendations.ts` (Gemini REST + fallback `front/lib/utils/mockAnalysis.ts`)
- Email: `front/app/api/auth/forgot-password/route.ts` (nodemailer)
- File upload: Supabase Storage (`avatars`, `resumes`) via server actions

`front/` has **zero imports** from `back/` and no `NEXT_PUBLIC_API_URL` / proxy in `front/next.config.ts`.

## CI
- `deploy_backend` job in root `.gitlab-ci.yml` is disabled/archived. Backend is not deployed.
- See root `.gitlab-ci.yml` comments for details.

## What to do with this directory
- **Option A (keep):** Leave as-is. It has no effect on builds/deploys/tests.
- **Option B (clean up later):** Delete `back/` and remove `"back"` from `workspaces` in root `package.json:16`.
- **Option C (revive):** If a separate service is needed later (e.g., mobile API, independent scaling), re-implement from scratch — do not build on `src/app.ts`.

Do not add new code here without a deliberate decision to revive a standalone service.
