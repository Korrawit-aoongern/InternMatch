import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Phase 0 — unify dialog (alert) vs toast/div expectations.
 * App uses both: student register uses toast div, most "Save Changes" in
 * Module-2/5/6 use window.alert, but mixing page.on + page.once causes
 * "dialog.accept: Cannot accept dialog which is already handled".
 * This helper scopes to page.once and falls back to toast.
 */
export async function waitForDialogOrToast(
  page: Page,
  action: () => Promise<void>,
  expectedText?: RegExp | string,
): Promise<{ kind: 'dialog' | 'toast' | 'none'; message: string | null }> {
  let dialogMessage: string | null = null;
  let dialogKind: 'dialog' | null = null;

  const dialogHandler = async (dialog: any) => {
    dialogMessage = dialog.message();
    dialogKind = 'dialog';
    await dialog.accept().catch(() => {});
  };
  // Use once so we don't double-handle with any global page.on
  page.once('dialog', dialogHandler);

  await action();

  // Give dialog a moment, else check toast
  await page.waitForTimeout(600);
  if (dialogKind === 'dialog') {
    if (expectedText) {
      const re = typeof expectedText === 'string' ? new RegExp(expectedText) : expectedText;
      expect(dialogMessage || '').toMatch(re);
    }
    return { kind: 'dialog', message: dialogMessage };
  }

  // Fallback: look for toast / alert div
  const toast = page.locator('div.bg-red-50, div.bg-green-50, [role="alert"], div').filter({ hasText: expectedText ? (expectedText as any) : /สำเร็จ|ผิดพลาด|เกิดข้อผิดพลาด|ไม่ถูกต้อง/i }).first();
  if (await toast.isVisible().catch(() => false)) {
    const text = (await toast.textContent().catch(() => '')) || '';
    if (expectedText) {
      const re = typeof expectedText === 'string' ? new RegExp(expectedText) : expectedText;
      expect(text).toMatch(re);
    }
    return { kind: 'toast', message: text };
  }
  // No dialog nor toast — remove stale once handler if not fired
  page.removeListener('dialog', dialogHandler);
  return { kind: 'none', message: null };
}

/**
 * Scoped confirm: ensures we don't use page.on which leaks across tests
 */
export async function confirmNextDialog(page: Page, action: () => Promise<void>, accept = true) {
  const p = page.waitForEvent('dialog', { timeout: 5000 }).then(async (d) => {
    if (accept) await d.accept().catch(() => {});
    else await d.dismiss().catch(() => {});
    return d.message();
  }).catch(() => null);
  await action();
  return p;
}
