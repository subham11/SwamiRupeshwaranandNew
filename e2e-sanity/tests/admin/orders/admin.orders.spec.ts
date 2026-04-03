// tests/admin/orders/admin.orders.spec.ts
// STORY-006: Orders Admin
// STORY-007: Invoice PDF Generation

import { test, expect } from '@playwright/test';
import { AdminOrdersPage } from '../../../page-objects';

test.describe('STORY-006 | Admin Orders Management', () => {

  test('admin orders page loads with stats cards', async ({ page }) => {
    const admin = new AdminOrdersPage(page);
    await admin.goto();
    await expect(admin.statsCards.first()).toBeVisible({ timeout: 10_000 });
    const count = await admin.statsCards.count();
    expect(count).toBeGreaterThanOrEqual(4); // Total, Paid, Processing, Shipped
  });

  test('stats cards show: Total, Paid, Processing, Shipped labels', async ({ page }) => {
    const admin = new AdminOrdersPage(page);
    await admin.goto();
    const labels = await admin.statsCards.allTextContents();
    const joined = labels.join(' ').toLowerCase();
    expect(joined).toContain('total');
    expect(joined).toContain('paid');
    expect(joined).toContain('processing');
    expect(joined).toContain('shipped');
  });

  test('filter tabs render: All, Pending, Paid, Processing, Shipped, Delivered, Cancelled', async ({ page }) => {
    const admin = new AdminOrdersPage(page);
    await admin.goto();
    const expected = ['all', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    const tabTexts = await admin.filterTabs.allTextContents();
    const joined = tabTexts.join(' ').toLowerCase();
    for (const tab of expected) {
      expect(joined).toContain(tab);
    }
  });

  test('orders table shows Order ID, customer, items count, amount, status, date', async ({ page }) => {
    const admin = new AdminOrdersPage(page);
    await admin.goto();
    if (await admin.orderRows.count() > 0) {
      const firstRow = admin.orderRows.first();
      await expect(firstRow.locator('[data-testid="order-id"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="order-customer"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="order-amount"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="order-status-badge"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="order-date"]')).toBeVisible();
    }
  });

  test('clicking an order row expands item details and shipping address', async ({ page }) => {
    const admin = new AdminOrdersPage(page);
    await admin.goto();
    if (await admin.orderRows.count() > 0) {
      await admin.orderRows.first().locator('[data-testid="order-expand"]').click();
      const detail = page.locator('[data-testid="order-detail-expanded"]').first();
      await expect(detail).toBeVisible({ timeout: 5_000 });
      await expect(detail.locator('[data-testid="order-items-list"]')).toBeVisible();
      await expect(detail.locator('[data-testid="shipping-address"]')).toBeVisible();
    }
  });

  test('filtering by "Paid" tab shows only paid orders', async ({ page }) => {
    const admin = new AdminOrdersPage(page);
    await admin.goto();
    await admin.filterTabs.filter({ hasText: /paid/i }).first().click();
    await page.waitForLoadState('networkidle');
    const rows = admin.orderRows;
    if (await rows.count() > 0) {
      const statuses = await rows
        .locator('[data-testid="order-status-badge"]')
        .allTextContents();
      statuses.forEach(s => expect(s.toLowerCase()).toContain('paid'));
    }
  });

  test('admin can update order status via modal dropdown', async ({ page }) => {
    const admin = new AdminOrdersPage(page);
    await admin.goto();
    if (await admin.orderRows.count() > 0) {
      await admin.orderRows.first().locator('[data-testid="order-actions"]').click();
      await expect(admin.statusDropdown).toBeVisible({ timeout: 5_000 });
      await admin.statusDropdown.selectOption('processing');
      await admin.updateStatusBtn.click();
      await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
    }
  });

  test('tracking number field appears when status is "shipped"', async ({ page }) => {
    const admin = new AdminOrdersPage(page);
    await admin.goto();
    if (await admin.orderRows.count() > 0) {
      await admin.orderRows.first().locator('[data-testid="order-actions"]').click();
      await admin.statusDropdown.selectOption('shipped');
      await expect(admin.trackingInput).toBeVisible({ timeout: 3_000 });
    }
  });

  test('admin can enter tracking number for shipped order', async ({ page }) => {
    const admin = new AdminOrdersPage(page);
    await admin.goto();
    if (await admin.orderRows.count() > 0) {
      await admin.orderRows.first().locator('[data-testid="order-actions"]').click();
      await admin.statusDropdown.selectOption('shipped');
      await admin.trackingInput.fill('TRACK123456789');
      await admin.updateStatusBtn.click();
      await expect(admin.successToast).toBeVisible({ timeout: 8_000 });
    }
  });
});

test.describe('STORY-007 | Invoice PDF Generation', () => {

  test('admin orders page has Download Invoice for paid orders', async ({ page }) => {
    const admin = new AdminOrdersPage(page);
    await admin.goto();
    await admin.filterTabs.filter({ hasText: /paid/i }).first().click();
    await page.waitForLoadState('networkidle');
    if (await admin.orderRows.count() > 0) {
      const dlBtn = admin.orderRows.first().locator('[data-testid="download-invoice"]');
      await expect(dlBtn).toBeVisible();
    }
  });

  test('invoice download triggers a PDF file response', async ({ page }) => {
    const admin = new AdminOrdersPage(page);
    await admin.goto();
    await admin.filterTabs.filter({ hasText: /paid/i }).first().click();
    await page.waitForLoadState('networkidle');
    if (await admin.orderRows.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        admin.orderRows.first().locator('[data-testid="download-invoice"]').click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    }
  });

  test('user can download invoice from Dashboard Orders tab', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('[data-testid="tab-orders"]').click();
    await page.waitForLoadState('networkidle');
    const paidCard = page.locator('[data-testid="order-card"]')
      .filter({ has: page.locator('[data-testid="order-status"][data-status="paid"]') })
      .first();
    if (await paidCard.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await paidCard.click();
      const dlBtn = paidCard.locator('[data-testid="download-invoice"]');
      await expect(dlBtn).toBeVisible();
    }
  });
});
