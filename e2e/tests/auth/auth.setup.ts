import { test as setup, expect } from '@playwright/test';
import { TEST_SUPER_ADMIN } from '../../fixtures/test-data';

const authFile = 'fixtures/.auth/user.json';

/**
 * Authentication setup - runs before all tests that require auth.
 * The login page defaults to OTP mode. We switch to password mode first.
 *
 * Set environment variables for credentials:
 *   TEST_SUPER_ADMIN_EMAIL=...
 *   TEST_SUPER_ADMIN_PASSWORD=...
 */
setup('authenticate as user', async ({ page }) => {
  // Navigate to login page
  await page.goto('/en/login');
  await page.waitForLoadState('networkidle');

  // Switch to password login mode (default is OTP)
  const passwordLink = page.locator('text=Login with password instead');
  if (await passwordLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await passwordLink.click();
    await page.waitForTimeout(500);
  }

  // Fill in credentials
  await page.locator('#email').fill(TEST_SUPER_ADMIN.email);
  await page.locator('input[type="password"]').first().fill(TEST_SUPER_ADMIN.password);

  // Submit form
  await page.locator('button:has-text("Login")').first().click();

  // Wait for successful login — may redirect to dashboard or home
  await page.waitForURL(/\/(en|hi)\/(dashboard|admin|$)/, { timeout: 15000 });

  // Save auth state
  await page.context().storageState({ path: authFile });
});
