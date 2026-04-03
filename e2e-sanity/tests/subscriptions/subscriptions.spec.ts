// tests/subscriptions/subscriptions.spec.ts
// STORY-019: Subscription Plans

import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../page-objects';
import { SUBSCRIPTION_PLANS } from '../../fixtures';

test.describe('STORY-019 | Subscription Plans', () => {

  test('public subscribe page shows all plan cards', async ({ page }) => {
    await page.goto('/en/subscribe');
    for (const plan of SUBSCRIPTION_PLANS) {
      await expect(page.locator(`[data-testid="plan-card"]`).filter({ hasText: plan }))
        .toBeVisible({ timeout: 10_000 });
    }
  });

  test('each plan card shows name, price, features, and subscribe button', async ({ page }) => {
    await page.goto('/en/subscribe');
    const cards = page.locator('[data-testid="plan-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const firstCard = cards.first();
    await expect(firstCard.locator('[data-testid="plan-name"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="plan-price"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="plan-features"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="subscribe-btn"]')).toBeVisible();
  });

  test('Free plan activates immediately without payment modal', async ({ page }) => {
    await page.goto('/en/subscribe');
    const freeCard = page.locator('[data-testid="plan-card"]').filter({ hasText: 'Free' });
    await freeCard.locator('[data-testid="subscribe-btn"]').click();
    // Should NOT show Razorpay
    await page.waitForTimeout(2000);
    const razorpay = page.locator('iframe[src*="razorpay"]');
    await expect(razorpay).toBeHidden();
    // Should show success or confirmation
    const success = page.locator('[data-testid="subscription-confirmed"]');
    await expect(success).toBeVisible({ timeout: 8_000 });
  });

  test('paid plan initiates Razorpay subscription flow', async ({ page }) => {
    await page.goto('/en/subscribe');
    const silverCard = page.locator('[data-testid="plan-card"]').filter({ hasText: 'Silver' });
    await silverCard.locator('[data-testid="subscribe-btn"]').click();
    // Razorpay should open
    await expect(page.frameLocator('iframe[src*="razorpay"]').locator('body'))
      .toBeVisible({ timeout: 10_000 })
      .catch(async () => {
        // Fallback: check for Razorpay modal
        await expect(page.locator('[data-testid="razorpay-modal"]')).toBeVisible({ timeout: 5_000 });
      });
  });

  test('dashboard subscriptions tab shows current plan', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.subscriptionsTab.click();
    await page.waitForLoadState('networkidle');
    const planCard = page.locator('[data-testid="current-plan-card"]');
    await expect(planCard).toBeVisible();
    await expect(planCard.locator('[data-testid="plan-name"]')).not.toBeEmpty();
    await expect(planCard.locator('[data-testid="plan-status"]')).toBeVisible();
  });

  test('dashboard subscriptions tab shows payment history', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.subscriptionsTab.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="payment-history"]')).toBeVisible();
  });
});
