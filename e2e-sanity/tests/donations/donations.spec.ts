// tests/donations/donations.spec.ts
// STORY-025: Donation System

import { test, expect } from '@playwright/test';
import { TEST_DONATION_AMOUNTS } from '../../fixtures';

test.describe('STORY-025 | Donation System', () => {

  test('donation page loads with configurable amount options', async ({ page }) => {
    await page.goto('/en/donate');
    const amountBtns = page.locator('[data-testid="donation-amount-btn"]');
    await expect(amountBtns.first()).toBeVisible({ timeout: 8_000 });
    const count = await amountBtns.count();
    expect(count).toBeGreaterThan(0);
  });

  test('custom amount input is available', async ({ page }) => {
    await page.goto('/en/donate');
    const customInput = page.locator('[data-testid="custom-amount-input"]');
    await expect(customInput).toBeVisible();
  });

  test('one-time and recurring options are available', async ({ page }) => {
    await page.goto('/en/donate');
    await expect(page.locator('[data-testid="donation-one-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="donation-recurring"]')).toBeVisible();
  });

  test('selecting a preset amount updates display', async ({ page }) => {
    await page.goto('/en/donate');
    const firstBtn = page.locator('[data-testid="donation-amount-btn"]').first();
    const amount   = await firstBtn.textContent();
    await firstBtn.click();
    const display = page.locator('[data-testid="selected-amount"]');
    const displayText = await display.textContent();
    expect(displayText).toContain(amount?.replace(/[^0-9]/g, '') ?? '');
  });

  test('entering custom amount updates the selected value', async ({ page }) => {
    await page.goto('/en/donate');
    const customInput = page.locator('[data-testid="custom-amount-input"]');
    await customInput.fill('750');
    const display = page.locator('[data-testid="selected-amount"]');
    await expect(display).toContainText('750', { timeout: 3_000 });
  });

  test('Donate Now button opens Razorpay payment modal', async ({ page }) => {
    await page.goto('/en/donate');
    await page.locator('[data-testid="donation-amount-btn"]').first().click();
    await page.locator('[data-testid="donate-now-btn"]').click();

    const razorpayVisible = await page
      .frameLocator('iframe[src*="razorpay"]').locator('body')
      .isVisible({ timeout: 10_000 }).catch(() => false)
      || await page.locator('[data-testid="razorpay-modal"]')
      .isVisible({ timeout: 2_000 }).catch(() => false);
    expect(razorpayVisible).toBeTruthy();
  });
});
