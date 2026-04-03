// tests/setup/auth.user.setup.ts

import { test as setup, expect } from '@playwright/test';
import { TEST_USERS } from '../../fixtures';
import { STORAGE_STATE } from '../../playwright.config';
import { AuthPage } from '../../page-objects';

setup('auth: user login', async ({ page }) => {
  const auth = new AuthPage(page);
  await auth.loginWithPassword(TEST_USERS.user.email, TEST_USERS.user.password);
  await expect(page).toHaveURL(/\/(dashboard|en|hi)/, { timeout: 10_000 });
  await page.context().storageState({ path: STORAGE_STATE.user });
  console.log('✅ User auth state saved');
});
