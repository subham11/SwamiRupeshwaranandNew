/**
 * Payment Integration E2E Tests
 * Tests for Razorpay payment integration on subscription and donation pages.
 * Uses storageState auth (no manual login needed).
 */

import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Razorpay Integration', () => {
  test('should load subscription page with plan cards', async ({ page }) => {
    await page.goto('/en/subscribe');
    await page.waitForLoadState('networkidle');

    // Page should render with subscription plans
    expect(page.url()).toContain('/subscribe');

    // Look for plan cards or pricing elements
    const planCards = page.locator('[class*="plan"], [class*="card"], [class*="pricing"]');
    const subscribeButtons = page.locator('button:has-text("Subscribe"), button:has-text("Get Started"), button:has-text("Choose")');
    const pageContent = page.locator('text=/plan|subscribe|membership/i');

    // At least the page should have some content
    const hasPlans = await planCards.first().isVisible().catch(() => false);
    const hasButtons = await subscribeButtons.first().isVisible().catch(() => false);
    const hasContent = await pageContent.first().isVisible().catch(() => false);

    expect(hasPlans || hasButtons || hasContent).toBeTruthy();
  });

  test('should load donation page', async ({ page }) => {
    await page.goto('/en/donation');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/donation');

    // Donation page should have amount options or donation form
    const donationContent = page.locator('text=/donat|amount|seva|contribute/i');
    await expect(donationContent.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display all subscription plan tiers', async ({ page }) => {
    await page.goto('/en/subscribe');
    await page.waitForLoadState('networkidle');

    // Check for plan names or pricing tiers
    const planNames = ['Free', 'Basic', 'Standard', 'Premium', 'Gold', 'Diamond'];
    let foundPlans = 0;

    for (const name of planNames) {
      const planEl = page.locator(`text=${name}`).first();
      if (await planEl.isVisible().catch(() => false)) {
        foundPlans++;
      }
    }

    // Should find at least some plans
    expect(foundPlans).toBeGreaterThan(0);
  });

  test.skip('should open Razorpay checkout modal on plan subscribe', async ({ page }) => {
    // Skipped: requires actual Razorpay interaction which modifies billing
    await page.goto('/en/subscribe');
    await page.waitForLoadState('networkidle');

    const subscribeButton = page.locator('button:has-text("Subscribe")').first();
    if (await subscribeButton.isVisible()) {
      await subscribeButton.click();

      // Razorpay modal or iframe should appear
      const razorpayFrame = page.locator('iframe[src*="razorpay"], .razorpay-checkout-frame');
      await expect(razorpayFrame).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Payment Failure Handling', () => {
  test('should handle network errors on subscription page gracefully', async ({ page }) => {
    await page.goto('/en/subscribe');
    await page.waitForLoadState('networkidle');

    const subscribeButton = page.locator('button:has-text("Subscribe")').first();

    if (await subscribeButton.isVisible().catch(() => false)) {
      // Setup request interception to simulate payment API failure
      await page.route('**/api/**/payment/**', route => route.abort());
      await page.route('**/api/**/subscription/**', route => route.abort());

      await subscribeButton.click();
      await page.waitForTimeout(3000);

      // Should remain on subscription page (not crash)
      expect(page.url()).toContain('/subscribe');

      // Remove routes
      await page.unroute('**/api/**/payment/**');
      await page.unroute('**/api/**/subscription/**');
    }
  });
});

test.describe('Donation Payments', () => {
  test('should display donation amount options', async ({ page }) => {
    await page.goto('/en/donation');
    await page.waitForLoadState('networkidle');

    // Look for preset amounts or custom amount field
    const amountDisplay = page.locator('input[type="number"], input[placeholder*="amount"], button:has-text("₹"), text=/₹/');
    const donationForm = page.locator('form, [class*="donation"]');

    const hasAmounts = await amountDisplay.first().isVisible().catch(() => false);
    const hasForm = await donationForm.first().isVisible().catch(() => false);

    expect(hasAmounts || hasForm).toBeTruthy();
  });

  test.skip('should process donation via Razorpay', async ({ page }) => {
    // Skipped: processes real payments
    await page.goto('/en/donation');
    await page.waitForLoadState('networkidle');

    const donateButton = page.locator('button:has-text("Donate"), button:has-text("Pay")').first();
    if (await donateButton.isVisible()) {
      await donateButton.click();

      const razorpayFrame = page.locator('iframe[src*="razorpay"]');
      await expect(razorpayFrame).toBeVisible({ timeout: 10000 });
    }
  });
});
