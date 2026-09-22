import type { Page } from '@playwright/test';

/**
 * Phase 0 — teardown helpers.
 * Deletes test data created via getTimestamp() accounts.
 * Prefers API route /api/test-cleanup (if present), else falls back to
 * direct Supabase delete via server action style request (best-effort).
 * Never throws — teardown is best-effort so test failure isn't masked.
 */

type Tracked = {
  emails?: string[];
  titles?: string[]; // internship titles
  usernames?: string[];
};

const tracked: Tracked = { emails: [], titles: [], usernames: [] };

export function trackEmail(email: string) {
  tracked.emails!.push(email);
}
export function trackUsername(username: string) {
  tracked.usernames!.push(username);
}
export function trackTitle(title: string) {
  tracked.titles!.push(title);
}
export function getTracked() { return { ...tracked }; }
export function resetTracked() { tracked.emails = []; tracked.titles = []; tracked.usernames = []; }

export async function teardownViaAPI(page: Page, payload: { emails?: string[]; titles?: string[]; usernames?: string[] }) {
  try {
    const res = await page.request.post('/api/test-cleanup', { data: payload }).catch(() => null);
    if (res && res.ok()) return true;
    // also try DELETE verb
    const res2 = await page.request.delete('/api/test-cleanup', { data: payload }).catch(() => null);
    if (res2 && res2.ok()) return true;
  } catch {}
  return false;
}

/**
 * Fallback: use page.evaluate to call Supabase directly if API missing.
 * Requires NEXT_PUBLIC_SUPABASE_URL + ANON key available in browser, but
 * deletion needs service role — so this will usually no-op. Keep as no-throw.
 */
export async function teardownFallback(page: Page, payload: Tracked) {
  try {
    await page.evaluate(async (p) => {
      // No-op placeholder — real cleanup is server-side via /api/test-cleanup.
      // We keep the hook so future server route can be added without test changes.
      return p;
    }, payload);
  } catch {}
}

export async function teardownAll(page: Page) {
  const payload = getTracked();
  if (!payload.emails?.length && !payload.titles?.length && !payload.usernames?.length) return;
  const ok = await teardownViaAPI(page, payload);
  if (!ok) await teardownFallback(page, payload);
  resetTracked();
}

/**
 * Per-test helper to wrap a test with automatic cleanup
 */
export async function withCleanup(page: Page, fn: () => Promise<void>) {
  try {
    await fn();
  } finally {
    await teardownAll(page).catch(() => {});
  }
}
