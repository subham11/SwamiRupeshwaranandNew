// tests/setup/auth.admin.setup.ts
// Saves admin storageState so admin tests don't re-login each time

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { TEST_USERS } from '../../fixtures';
import { STORAGE_STATE } from '../../playwright.config';
import { AuthPage } from '../../page-objects';

setup('auth: admin login', async ({ page }) => {
  const auth = new AuthPage(page);
  await auth.loginWithPassword(TEST_USERS.admin.email, TEST_USERS.admin.password);

  // Verify we land on admin dashboard
  await expect(page).toHaveURL(/\/(admin|dashboard)/, { timeout: 10_000 });

  // Persist session
  await page.context().storageState({ path: STORAGE_STATE.admin });
  console.log('✅ Admin auth state saved');
});
