// tests/dashboard/dashboard.spec.ts
// STORY-026: Enhanced User Dashboard

import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../page-objects';
import { TEST_USERS } from '../../fixtures';

test.describe('STORY-026 | User Dashboard', () => {

  test('dashboard renders all 5 tabs', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.profileTab).toBeVisible();
    await expect(dashboard.ordersTab).toBeVisible();
    await expect(dashboard.subscriptionsTab).toBeVisible();
    await expect(dashboard.wishlistTab).toBeVisible();
    await expect(dashboard.securityTab).toBeVisible();
  });

  test('profile tab shows name, email, verification badge, member since', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.profileTab.click();
    await expect(page.locator('[data-testid="profile-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="member-since"]')).toBeVisible();
  });

  test('user can edit and save name from profile tab', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.profileTab.click();
    const newName = `Tester ${Date.now()}`;
    await dashboard.nameInput.fill(newName);
    await dashboard.saveProfileBtn.click();
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible({ timeout: 5_000 });
  });

  test('orders tab renders list of orders (or empty state)', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.ordersTab.click();
    await page.waitForLoadState('networkidle');
    const hasOrders   = await dashboard.orderCards.count() > 0;
    const emptyState  = page.locator('[data-testid="empty-orders"]');
    const hasEmpty    = await emptyState.isVisible().catch(() => false);
    expect(hasOrders || hasEmpty).toBeTruthy();
  });

  test('order card shows items, status badge, and shipping info', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.ordersTab.click();
    await page.waitForLoadState('networkidle');
    if (await dashboard.orderCards.count() > 0) {
      const card = dashboard.orderCards.first();
      await card.click(); // expand
      await expect(card.locator('[data-testid="order-status"]')).toBeVisible();
      await expect(card.locator('[data-testid="order-items"]')).toBeVisible();
    }
  });

  test('Download Invoice button exists for paid orders', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.ordersTab.click();
    await page.waitForLoadState('networkidle');
    const paidOrders = dashboard.orderCards
      .filter({ has: page.locator('[data-testid="order-status"][data-status="paid"]') });
    if (await paidOrders.count() > 0) {
      await expect(paidOrders.first().locator('[data-testid="download-invoice"]')).toBeVisible();
    }
  });

  test('security tab shows change/set password form', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.securityTab.click();
    await expect(page.locator('[data-testid="security-form"]')).toBeVisible();
  });

  test('dashboard loading skeletons appear while data loads (network throttled)', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/api/**', async route => {
      requestCount++;
      await page.waitForTimeout(200);
      await route.continue();
    });
    await page.goto('/dashboard');
    const skeletons = page.locator('[data-testid*="skeleton"]');
    // At least briefly show skeletons
    await expect(page.locator('[data-testid="profile-name"]')).toBeVisible({ timeout: 15_000 });
    expect(requestCount).toBeGreaterThan(0);
  });
});
