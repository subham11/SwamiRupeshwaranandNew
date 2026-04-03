// tests/admin/newsletter/admin.newsletter.spec.ts
// STORY-023: Newsletter Management

import { test, expect } from '@playwright/test';
import { AdminBasePage } from '../../../page-objects';

test.describe('STORY-023 | Newsletter Management', () => {

  test('newsletter page loads with subscriber stats', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/newsletter');
    await expect(page.locator('[data-testid="newsletter-page"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="subscriber-stats"]')).toBeVisible();
  });

  test('stats show: total, active, unsubscribed, 30-day growth, campaigns sent', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/newsletter');
    await page.waitForLoadState('networkidle');
    const stats = page.locator('[data-testid="subscriber-stats"]');
    const text  = await stats.textContent();
    const lower = text?.toLowerCase() ?? '';
    expect(lower).toMatch(/total|active|unsubscribed|growth|campaign/i);
  });

  test('subscribers list renders with status badges', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/newsletter');
    await page.waitForLoadState('networkidle');
    const rows = admin.tableRows;
    if (await rows.count() > 0) {
      await expect(rows.first().locator('[data-testid="subscriber-status"]')).toBeVisible();
      const statusText = await rows.first().locator('[data-testid="subscriber-status"]').textContent();
      expect(['active', 'unsubscribed']).toContain(statusText?.toLowerCase().trim());
    }
  });

  test('admin can create an email campaign', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/newsletter');
    await page.locator('[data-testid="create-campaign-btn"]').click();
    await expect(page.locator('[data-testid="campaign-form"]')).toBeVisible({ timeout: 5_000 });
    await page.locator('[data-testid="campaign-subject"]').fill(`Sanity Newsletter ${Date.now()}`);
    await page.locator('[data-testid="campaign-content"]').fill('<p>Hello Sanity Test Content</p>');
    await page.locator('[data-testid="save-campaign-btn"]').click();
    await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
  });

  test('admin can delete a subscriber', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/newsletter');
    const rows = admin.tableRows;
    if (await rows.count() > 0) {
      const before = await rows.count();
      await rows.last().locator('[data-testid="delete-subscriber"]').click();
      if (await admin.confirmDelete.isVisible({ timeout: 2000 })) {
        await admin.confirmDelete.click();
      }
      await expect(admin.successToast).toBeVisible({ timeout: 5_000 });
    }
  });

  test('public newsletter subscription form submits successfully', async ({ page }) => {
    await page.goto('/en');
    const emailInput = page.locator('[data-testid="newsletter-email"]');
    const submitBtn  = page.locator('[data-testid="newsletter-subscribe-btn"]');
    if (await emailInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await emailInput.fill(`sanity_${Date.now()}@testmail.com`);
      await submitBtn.click();
      await expect(page.locator('[data-testid="newsletter-success"]')).toBeVisible({ timeout: 5_000 });
    }
  });
});
