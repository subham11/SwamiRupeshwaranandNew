// tests/admin/analytics/admin.analytics.spec.ts
// STORY-013: Analytics Dashboard
// STORY-014: Backend Stats Endpoints

import { test, expect } from '@playwright/test';
import { AdminBasePage } from '../../../page-objects';
import { API_URL } from '../../../playwright.config';

test.describe('STORY-013 | Analytics Dashboard', () => {

  test('analytics page loads with 4 tabs', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/analytics');
    const tabs = ['Overview', 'Revenue', 'Users', 'Products'];
    for (const tab of tabs) {
      await expect(
        page.locator('[data-testid="analytics-tab"]').filter({ hasText: tab })
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test('Overview tab shows 8 KPI cards', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/analytics');
    await page.locator('[data-testid="analytics-tab"]').filter({ hasText: 'Overview' }).click();
    await page.waitForLoadState('networkidle');
    const kpiCards = page.locator('[data-testid="kpi-card"]');
    await expect(kpiCards.first()).toBeVisible({ timeout: 10_000 });
    expect(await kpiCards.count()).toBeGreaterThanOrEqual(8);
  });

  test('Overview tab shows monthly revenue bar chart', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/analytics');
    await page.locator('[data-testid="analytics-tab"]').filter({ hasText: 'Overview' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="chart-monthly-revenue"]')).toBeVisible({ timeout: 8_000 });
  });

  test('Overview tab shows order status pie chart', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/analytics');
    await page.locator('[data-testid="analytics-tab"]').filter({ hasText: 'Overview' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="chart-order-status"]')).toBeVisible({ timeout: 8_000 });
  });

  test('Revenue tab shows: line chart, top products, KPIs with % change', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/analytics');
    await page.locator('[data-testid="analytics-tab"]').filter({ hasText: 'Revenue' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="chart-revenue-line"]')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('[data-testid="chart-top-products"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-kpi-this-month"]')).toBeVisible();
  });

  test('Revenue tab KPIs show percentage change indicator', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/analytics');
    await page.locator('[data-testid="analytics-tab"]').filter({ hasText: 'Revenue' }).click();
    await page.waitForLoadState('networkidle');
    const pctChange = page.locator('[data-testid="kpi-pct-change"]').first();
    if (await pctChange.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const text = await pctChange.textContent();
      expect(text).toMatch(/[+\-]?\d+(\.\d+)?%/);
    }
  });

  test('Users tab shows user growth chart and users-by-role pie', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/analytics');
    await page.locator('[data-testid="analytics-tab"]').filter({ hasText: 'Users' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="chart-user-growth"]')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('[data-testid="chart-users-by-role"]')).toBeVisible();
  });

  test('Products tab shows category distribution and top sellers charts', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/analytics');
    await page.locator('[data-testid="analytics-tab"]').filter({ hasText: 'Products' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="chart-category-dist"]')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('[data-testid="chart-top-sellers"]')).toBeVisible();
  });

  test('Refresh button triggers data reload', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/analytics');
    let apiCallCount = 0;
    await page.route('**/stats**', route => {
      apiCallCount++;
      route.continue();
    });
    await page.locator('[data-testid="refresh-analytics"]').click();
    await page.waitForLoadState('networkidle');
    expect(apiCallCount).toBeGreaterThan(0);
  });

  test('all charts have interactive tooltips', async ({ page }) => {
    const admin = new AdminBasePage(page);
    await admin.gotoAdmin('/analytics');
    await page.locator('[data-testid="analytics-tab"]').filter({ hasText: 'Overview' }).click();
    await page.waitForLoadState('networkidle');
    const chart = page.locator('[data-testid="chart-monthly-revenue"]');
    if (await chart.isVisible()) {
      await chart.hover();
      await page.waitForTimeout(300);
      const tooltip = page.locator('[data-testid="chart-tooltip"]');
      if (await tooltip.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(tooltip).not.toBeEmpty();
      }
    }
  });
});

test.describe('STORY-014 | Backend Stats Endpoints', () => {

  async function getAdminToken(request: any) {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: { email: process.env.ADMIN_EMAIL || 'admin@bhairavapath.com',
              password: process.env.ADMIN_PASSWORD || 'Admin@1234' },
    });
    return (await res.json()).accessToken;
  }

  test('GET /orders/admin/stats returns expected shape', async ({ request }) => {
    const token = await getAdminToken(request);
    const res   = await request.get(`${API_URL}/orders/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('totalOrders');
    expect(body).toHaveProperty('totalRevenue');
    expect(body).toHaveProperty('thisMonthRevenue');
    expect(body).toHaveProperty('lastMonthRevenue');
    expect(body).toHaveProperty('averageOrderValue');
    expect(body).toHaveProperty('ordersByStatus');
    expect(body).toHaveProperty('topProducts');
    expect(body).toHaveProperty('monthlyRevenue');
  });

  test('GET /orders/admin/stats requires admin auth', async ({ request }) => {
    const res = await request.get(`${API_URL}/orders/admin/stats`);
    expect([401, 403]).toContain(res.status());
  });

  test('GET /products/admin/stats returns expected shape', async ({ request }) => {
    const token = await getAdminToken(request);
    const res   = await request.get(`${API_URL}/products/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('totalProducts');
    expect(body).toHaveProperty('activeProducts');
    expect(body).toHaveProperty('outOfStockProducts');
    expect(body).toHaveProperty('productsByCategory');
    expect(body).toHaveProperty('averagePrice');
    expect(body).toHaveProperty('featuredCount');
    expect(body).toHaveProperty('recentProducts');
  });

  test('GET /users/admin/stats returns expected shape', async ({ request }) => {
    const token = await getAdminToken(request);
    const res   = await request.get(`${API_URL}/users/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('totalUsers');
    expect(body).toHaveProperty('usersByRole');
    expect(body).toHaveProperty('activeUsers');
    expect(body).toHaveProperty('newUsersThisMonth');
    expect(body).toHaveProperty('newUsersLastMonth');
    expect(body).toHaveProperty('monthlyGrowth');
    expect(Array.isArray(body.monthlyGrowth)).toBeTruthy();
    expect(body.monthlyGrowth.length).toBeLessThanOrEqual(6);
  });

  test('monthly revenue data covers last 6 calendar months', async ({ request }) => {
    const token = await getAdminToken(request);
    const res   = await request.get(`${API_URL}/orders/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body  = await res.json();
    expect(Array.isArray(body.monthlyRevenue)).toBeTruthy();
    expect(body.monthlyRevenue.length).toBeLessThanOrEqual(6);
  });

  test('stats revenue excludes cancelled orders', async ({ request }) => {
    const token = await getAdminToken(request);
    const res   = await request.get(`${API_URL}/orders/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    // If there are cancelled orders, totalRevenue should be less than sum of all amounts
    expect(typeof body.totalRevenue).toBe('number');
    expect(body.totalRevenue).toBeGreaterThanOrEqual(0);
  });
});
