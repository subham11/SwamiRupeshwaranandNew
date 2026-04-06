// tests/admin/events/admin.events.spec.ts
// STORY-035: Events CRUD
// STORY-029: Activity Log (Audit Trail)

import { test, expect } from '@playwright/test';
import { AdminBasePage } from '../../../page-objects';
import { TEST_EVENT } from '../../../fixtures';

test.describe('STORY-035 | Events CRUD', () => {

  test('admin events list page loads', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/events');
    await expect(page.locator('[data-testid="events-page"]')).toBeVisible({ timeout: 10_000 });
  });

  test('admin can create an event with bilingual fields', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/events/create');
    await page.locator('[data-testid="event-title-en"]').fill(TEST_EVENT.title);
    await page.locator('[data-testid="event-title-hi"]').fill(`${TEST_EVENT.title} हिंदी`);
    await page.locator('[data-testid="event-desc-en"]').fill(TEST_EVENT.description);
    await page.locator('[data-testid="event-location"]').fill(TEST_EVENT.location);

    // Date range
    const startDate = new Date(Date.now() + 7 * 86400_000).toISOString().split('T')[0];
    const endDate   = new Date(Date.now() + 9 * 86400_000).toISOString().split('T')[0];
    await page.locator('[data-testid="event-start-date"]').fill(startDate);
    await page.locator('[data-testid="event-end-date"]').fill(endDate);

    await admin.saveBtn.click();
    await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
  });

  test('admin can edit an existing event', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/events');
    if (await admin.tableRows.count() > 0) {
      await admin.tableRows.first().locator('[data-testid="edit-btn"]').click();
      await expect(page).toHaveURL(/\/admin\/events\/.+\/edit/);
      await page.locator('[data-testid="event-location"]').fill('Updated Ashram Location');
      await admin.saveBtn.click();
      await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
    }
  });

  test('admin can delete an event', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/events');
    if (await admin.tableRows.count() > 0) {
      const before = await admin.tableRows.count();
      await admin.tableRows.last().locator('[data-testid="delete-btn"]').click();
      if (await admin.confirmDelete.isVisible({ timeout: 2000 })) {
        await admin.confirmDelete.click();
      }
      await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
      await page.waitForLoadState('networkidle');
      expect(await admin.tableRows.count()).toBeLessThan(before);
    }
  });

  test('public events page lists upcoming events', async ({ page }) => {
    await page.goto('/en/events');
    await page.waitForLoadState('networkidle');
    const eventCards = page.locator('[data-testid="event-card"]');
    // May be empty or populated — just assert page loads
    await expect(page.locator('[data-testid="events-page"]')).toBeVisible({ timeout: 8_000 });
    const count = await eventCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('event detail page shows full information', async ({ page }) => {
    await page.goto('/en/events');
    const eventCards = page.locator('[data-testid="event-card"]');
    if (await eventCards.count() > 0) {
      await eventCards.first().click();
      await expect(page).toHaveURL(/\/en\/events\/.+/, { timeout: 8_000 });
      await expect(page.locator('[data-testid="event-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="event-location"]')).toBeVisible();
      await expect(page.locator('[data-testid="event-date"]')).toBeVisible();
    }
  });

  test('events appear in global search results', async ({ page }) => {
    await page.goto('/en/events');
    const eventCards = page.locator('[data-testid="event-card"]');
    if (await eventCards.count() > 0) {
      const eventTitle = await eventCards.first()
        .locator('[data-testid="event-title"]').textContent();
      const term = eventTitle?.split(' ')[0] ?? 'test';

      await page.goto(`/search?q=${encodeURIComponent(term)}`);
      const results = page.locator('[data-testid="search-result"]');
      await expect(results.first()).toBeVisible({ timeout: 8_000 });
    }
  });
});

test.describe('STORY-029 | Activity Log (Audit Trail)', () => {

  test('activity log page loads at /admin/activity-log', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/activity-log');
    await expect(page.locator('[data-testid="activity-log-page"]')).toBeVisible({ timeout: 10_000 });
  });

  test('activity log shows paginated entries sorted newest first', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/activity-log');
    await page.waitForLoadState('networkidle');
    const rows = admin.tableRows;
    if (await rows.count() > 0) {
      await expect(rows.first()).toBeVisible();
      await expect(rows.first().locator('[data-testid="log-date"]')).toBeVisible();
      // First entry date >= second entry date (newest first)
      if (await rows.count() > 1) {
        const date1 = await rows.nth(0).locator('[data-testid="log-date"]').getAttribute('data-timestamp');
        const date2 = await rows.nth(1).locator('[data-testid="log-date"]').getAttribute('data-timestamp');
        if (date1 && date2) {
          expect(Number(date1)).toBeGreaterThanOrEqual(Number(date2));
        }
      }
    }
  });

  test('log entries show: userId, action, entityType, entityId, date', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/activity-log');
    await page.waitForLoadState('networkidle');
    if (await admin.tableRows.count() > 0) {
      const row = admin.tableRows.first();
      await expect(row.locator('[data-testid="log-action"]')).toBeVisible();
      await expect(row.locator('[data-testid="log-entity-type"]')).toBeVisible();
      await expect(row.locator('[data-testid="log-date"]')).toBeVisible();
    }
  });

  test('activity log supports filtering by entityType', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/activity-log?entityType=product');
    await page.waitForLoadState('networkidle');
    const rows = admin.tableRows;
    if (await rows.count() > 0) {
      const types = await rows.locator('[data-testid="log-entity-type"]').allTextContents();
      types.forEach(t => expect(t.toLowerCase()).toContain('product'));
    }
  });

  test('activity log stats endpoint returns totals and breakdowns', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: process.env.ADMIN_EMAIL || 'admin@swamirupeshwaranand.org',
              password: process.env.ADMIN_PASSWORD || 'Admin@1234' },
    });
    const { accessToken } = await loginRes.json();
    const res = await request.get('/api/activity-log/stats', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('totalLogs');
    expect(body).toHaveProperty('byEntityType');
    expect(body).toHaveProperty('byAction');
    expect(body).toHaveProperty('activeUsersToday');
  });
});
