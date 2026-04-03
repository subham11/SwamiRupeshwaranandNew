// tests/admin/tickets/support.tickets.spec.ts
// STORY-024: Support Tickets

import { test, expect } from '@playwright/test';
import { AdminBasePage, DashboardPage } from '../../../page-objects';

test.describe('STORY-024 | Support Tickets', () => {

  // ── Customer Side ──────────────────────────────────────────────────────────
  test('user can create a support ticket from dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    const supportBtn = page.locator('[data-testid="support-tickets-link"]');
    if (await supportBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await supportBtn.click();
    } else {
      await page.goto('/support');
    }
    await page.locator('[data-testid="create-ticket-btn"]').click();
    await page.locator('[data-testid="ticket-subject"]').fill(`Sanity Ticket ${Date.now()}`);
    await page.locator('[data-testid="ticket-category"]').selectOption('general');
    await page.locator('[data-testid="ticket-priority"]').selectOption('medium');
    await page.locator('[data-testid="ticket-description"]').fill(
      'This is an automated sanity test ticket.'
    );
    await page.locator('[data-testid="submit-ticket-btn"]').click();
    await expect(page.locator('[data-testid="ticket-created-success"]')).toBeVisible({ timeout: 8_000 });
  });

  test('user can view their tickets list', async ({ page }) => {
    await page.goto('/support');
    const ticketList = page.locator('[data-testid="my-tickets-list"]');
    await expect(ticketList).toBeVisible({ timeout: 8_000 });
  });

  test('ticket fields validate: subject and description required', async ({ page }) => {
    await page.goto('/support');
    await page.locator('[data-testid="create-ticket-btn"]').click();
    await page.locator('[data-testid="submit-ticket-btn"]').click();
    await expect(page.locator('[data-testid="field-error"]').first()).toBeVisible({ timeout: 5_000 });
  });

  // ── Admin Side ─────────────────────────────────────────────────────────────
  test('admin support page shows stats cards', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/support');
    await expect(admin.statsCards.first()).toBeVisible({ timeout: 10_000 });
    const labels = await admin.statsCards.allTextContents();
    const joined = labels.join(' ').toLowerCase();
    expect(joined).toMatch(/total|open|progress|resolved/);
  });

  test('admin can view tickets with filter by status', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/support');
    const tabs = admin.filterTabs;
    await expect(tabs.first()).toBeVisible({ timeout: 8_000 });
    const tabTexts = await tabs.allTextContents();
    const joined   = tabTexts.join(' ').toLowerCase();
    expect(joined).toContain('open');
  });

  test('admin can reply to a ticket', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/support');
    await page.waitForLoadState('networkidle');
    const rows = admin.tableRows;
    if (await rows.count() > 0) {
      await rows.first().locator('[data-testid="view-ticket-btn"]').click();
      await expect(page.locator('[data-testid="ticket-detail"]')).toBeVisible({ timeout: 5_000 });
      await page.locator('[data-testid="reply-text"]').fill('Sanity test admin reply.');
      await page.locator('[data-testid="send-reply-btn"]').click();
      await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
    }
  });

  test('admin can update ticket status', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/support');
    if (await admin.tableRows.count() > 0) {
      await admin.tableRows.first().locator('[data-testid="view-ticket-btn"]').click();
      await page.locator('[data-testid="ticket-status-select"]').selectOption('in_progress');
      await page.locator('[data-testid="update-ticket-status"]').click();
      await expect(admin.successToast).toBeVisible({ timeout: 5_000 });
    }
  });

  test('all 4 ticket statuses are selectable: open, in_progress, resolved, closed', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/support');
    if (await admin.tableRows.count() > 0) {
      await admin.tableRows.first().locator('[data-testid="view-ticket-btn"]').click();
      const statusSelect = page.locator('[data-testid="ticket-status-select"]');
      for (const status of ['open', 'in_progress', 'resolved', 'closed']) {
        await statusSelect.selectOption(status);
        expect(await statusSelect.inputValue()).toBe(status);
      }
    }
  });
});
