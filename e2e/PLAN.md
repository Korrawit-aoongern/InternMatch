# InternMatch — Playwright Fix Plan (Module-by-Module, Workers:1, Teardown Required)

> Source of truth: `docs/Test_Case_Template_InternMatch.xlsx` (sheet `Test Cases`, header row 4). Pipeline per user approved 2026-09-18.

## Execution Pipeline (per phase)
1. Read Excel Status (col M) for module IDs
2. Run `npx playwright test tests/Module-{N}.spec.ts --project=chromium --workers=1` (force, `playwright.config.ts:23` normally `undefined`)
3. Fix **test script only** for IDs where Status=Fail; if suspected app bug → set `Remarks="App failed - needs review"` and do NOT edit `front/**`
4. Re-run until 100% on that module
5. Tear down all inserted data (`users`→cascade `students/companies/internships/applications`, storage `avatars/resumes`)
6. Update Excel row: `L Actual Result`, `M Status→Pass`, `O/Q/R executor/date/remarks`, commit phase
7. Next phase

Global constraint: `workers:1` per phase to avoid `users_username_key` / parallel DB collisions (`front/lib/actions/auth.ts:71` insert). Teardown via helpers `e2e/tests/helpers/*`.

## Excel Audit (2026-09-18 snapshot via openpyxl)
- Dimensions `A1:Z184`, 180 data rows from row 5.
- Header `Test Cases!A4:R4`: `Test Case ID | Module/Feature | Test Case Title | Requirement | ... | Status(13) | ... | Remarks(18)`
- Totals: **Pass 152, Fail 28**.
- All `TC-I1-*` = Pass. All 28 fails are `TC-I2-*`:

| E2E file | Total IDs | Fails on sheet | Fail IDs |
|---|---|---|---|
| `Module-1.spec.ts` (W3-1..W3-10, 24) | 24 | 0 | — |
| `Module-2.spec.ts` (W3-8..W4-10, 33) | 33 | 0 | — |
| `Module-3.spec.ts` (W1-1..W1-10, 30) | 30 | 0 | — |
| `Module-4.spec.ts` (W4-5..W4-8 + W1, 32) | 32 | 0 | — |
| `Module-5.spec.ts` (W3-1..W3-6, 18) | 18 | 9 | `W3-3-001, W3-3-003, W3-4-001, W3-4-003, W3-5-001, W3-5-002, W3-6-001, W3-6-002, W3-6-003` |
| `Module-6.spec.ts` (W3-7..W3-19, 39) | 39 | 19 | `W3-7-001, W3-8-001, W3-9-001, W3-9-003, W3-11-003, W3-12-001/002/003, W3-13-001/003, W3-14-001, W3-15-001, W3-16-003, W3-17-001, W3-18-001/002/003, W3-19-001/003` |
| `Module-7.spec.ts` (W4-1..W4-4, 12) | 12 | 0 | — |

Fail `Actual Result` (col L) already gives fix hint — use as spec.

## Phases 0..7

### Phase 0 — Infrastructure & Helpers (prereq)
- Add `e2e/tests/helpers/timestamp.ts`: `getTimestamp()` = `Date.now()_rand` (align `Module-2.spec.ts:5`).
- Add `e2e/tests/helpers/dialog.ts`: `dialogOrToast(page, expected)` helper — `Promise.race([page.waitForEvent('dialog'), page.locator('div.bg-red-50, [role="alert"]').waitFor()])` plus scoped `page.once` (fix global `page.on("dialog")` double-handle causing `dialog.accept already handled` in `Module-5.spec.ts:420-509`).
- Add `e2e/tests/helpers/cleanup.ts`: `teardownUser(page,email)` / `teardownInternship(page,title)` / `teardownAll(tracked)` using `getSupabaseAdmin()` (`front/lib/supabase/server.ts:5`) via `fetch('/api/test-cleanup')` fallback to direct `supabase.from("users").delete().eq("email", ...)`. Called in `test.afterEach` / `test.afterAll`. Verify no `????` Thai mojibake.
- Document `workers:1` override; confirm harness: `npx playwright test tests/example.spec.ts --project=chromium --workers=1` green. No Excel write.

### Phase 1 — Module 1 Auth (`Module-1.spec.ts:3`, 24 TC-I1)
- W3-1..W3-7 + W3-10 (sheet Pass). Re-run `Module-1.spec.ts` with workers 1 to repro prior `duplicate key users_username_key` flake. Expect 24/24 pass. If new fail → mark `Remarks="App failed"` per note, do not edit app. Tasks: verify selectors `input[name="email"]` vs `input[id="email"]`, `select[id="study_year"]`, logout cookie/BF cache. Teardown tracked `student_test_*`/`company_*` users. Excel update per row L/M/O/P/R.

### Phase 2 — Module 2 Profile/Skills (`Module-2.spec.ts:3`, 33 TC-I1)
- Sheet Pass. Observed prior `Save Changes` dialog timeout `Module-2.spec.ts:143,216,257` (app uses toast not alert). With workers 1 verify; if fail patch `waitForEvent('dialog')` → toast fallback `expect(page.getByText(/สำเร็จ/)).toBeVisible()`. Teardown skills/portfolios/resumes.

### Phase 3 — Module 3 Company Profile & Posting (`Module-3.spec.ts:3`, 30 TC-I2-W1)
- Sheet Pass. Verify `activeModal` `.fixed.inset-0` (`Module-3.spec.ts:96`), skill step, date fields absence. Teardown postings.

### Phase 4 — Module 4 Filtering & Search (`Module-4.spec.ts:3`, 32 TC-I2-W4-5..W4-8 + W1)
- Sheet Pass. Verify `select[title="W4-5 กรองตามประเภทงาน"]` injection waits.

### Phase 5 — Module 5 Applicant Management (first failing, 9 fails)
- Fix batch (test-script only):
  - Remove global `page.on("dialog")` in `applyToInternship`/`openFirstApplicantModal` → scoped `page.once` + toast fallback. Fixes `W3-4-001:113`, `W3-5-001:116`, `W3-6-001:119`, `W3-6-003:121`, `W3-4-003:115`.
  - Scope heading: `getByRole("main").getByRole("heading",{name:"Applications"})` for `W3-5-002:117` strict 2× h1.
  - Add `.first()` to badge `Pending/Reviewing/Accepted/Rejected`.
  - Fix `W3-6-002:120` empty status `name:/^$/` selector → `not.toBeVisible` scoped to status row.
  - Ownership `W3-3-003:112` empty state selector `ไม่พบรายชื่อผู้สมัคร` scoping.
- Teardown all applications/internships/users per test.

### Phase 6 — Module 6 Skill Matching & AI Upskill (19 fails, 20/39 passed baseline)
- Fix batch: add `.first()` to `"% Match"`/`Applications` (168-match `W3-12-002`), soft modal visibility, `waitForTimeout(800)` before card click, replace `Escape` with Close button (`W3-16-003`, `W3-19-003` Target page closed), handle filtered 0% cards not in `/matches` but in `/dashboard/Internships`. Teardown skills+postings.

### Phase 7 — Module 7 Notifications & Email (12, sheet Pass)
- Verify bell `button[title="แจ้งเตือน"]` (`Module-7.spec.ts:105`), email mock, download cert. Teardown notifications.

## Verification per phase
- Single-module `chromium` workers 1 must be 100% before closing.
- No cross-phase DB leak (unique `getTimestamp` per test, `afterEach` cleanup).
- Excel write-back only after 100% verified.

## Risks
- Supabase RLS may block direct delete → fallback to `supabase.from("users").delete()` via service role or `/api/test-cleanup` route (add if missing).
- Storage buckets `avatars`/`resumes` (`front/lib/actions/auth.ts:365,440`) need object delete.
- Parallel `--workers=1` enforced via CLI; `playwright.config.ts:23` stays `undefined` locally.

## Next step
Execute Phase 0 then Phase 1 (`Module-1.spec.ts --workers=1 --project=chromium`) per approval.
