import { test as setup, expect } from '@playwright/test';
import { TEST_USER } from '../../fixtures/test-data';

const authFile = 'fixtures/.auth/user.json';

/**
 * Authentication setup - runs before all tests that require auth
 * Saves auth state to be reused across tests
 */
setup('authenticate as user', async ({ page }) => {
  // Navigate to login page
  await page.goto('/en/login');

  // Fill in credentials
  await page.locator('input[name="email"], input[type="email"]').fill(TEST_USER.email);
  await page.locator('input[name="password"], input[type="password"]').fill(TEST_USER.password);

  // Submit form
  await page.locator('button[type="submit"]').click();

  // Wait for successful login - adjust based on your app's behavior
  // Option 1: Wait for redirect to dashboard/home
  await page.waitForURL(/\/(en|hi)\/(dashboard|$)/);

  // Option 2: Wait for auth state indicator
  // await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

  // Save auth state
  await page.context().storageState({ path: authFile });
});
