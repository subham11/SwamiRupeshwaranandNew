// tests/auth/authentication.spec.ts
// STORY-036: OTP + Password Authentication
// STORY-037: Role-Based Access Control

import { test, expect } from '@playwright/test';
import { AuthPage } from '../../page-objects';
import { TEST_USERS } from '../../fixtures';

test.describe('STORY-036 | Authentication', () => {

  test('login page renders both OTP and Password tabs', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();
    await expect(auth.otpTab).toBeVisible();
    await expect(auth.passwordTab).toBeVisible();
    await expect(auth.emailInput).toBeVisible();
  });

  test('OTP tab shows email + Send OTP button', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();
    await auth.otpTab.click();
    await expect(auth.emailInput).toBeVisible();
    await expect(auth.sendOtpBtn).toBeVisible();
    await expect(auth.passwordInput).toBeHidden();
  });

  test('password tab shows email + password inputs', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();
    await auth.passwordTab.click();
    await expect(auth.emailInput).toBeVisible();
    await expect(auth.passwordInput).toBeVisible();
    await expect(auth.loginBtn).toBeVisible();
  });

  test('wrong password shows error message', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.loginWithPassword(TEST_USERS.user.email, 'WrongPass999!');
    await expect(auth.errorMsg).toBeVisible();
    await expect(auth.errorMsg).not.toBeEmpty();
  });

  test('invalid email format prevents submission', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.goto();
    await auth.passwordTab.click();
    await auth.emailInput.fill('not-an-email');
    await auth.passwordInput.fill('somepass');
    await auth.loginBtn.click();
    // HTML5 validation or custom error
    const isValid = await auth.emailInput.evaluate(
      (el: HTMLInputElement) => el.validity.valid
    );
    expect(isValid).toBe(false);
  });

  test('successful password login redirects to dashboard or home', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.loginWithPassword(TEST_USERS.user.email, TEST_USERS.user.password);
    await expect(page).toHaveURL(/(dashboard|en|hi)/, { timeout: 10_000 });
  });

  test('JWT tokens are issued and stored after login', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.loginWithPassword(TEST_USERS.user.email, TEST_USERS.user.password);
    await expect(page).toHaveURL(/(dashboard|en|hi)/);
    const cookies = await page.context().cookies();
    const storage = await page.evaluate(() => ({
      access:  localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken'),
    }));
    // At least one token mechanism must be present
    const hasToken = cookies.some(c => c.name.toLowerCase().includes('token'))
      || !!storage.access;
    expect(hasToken).toBeTruthy();
  });
});

test.describe('STORY-037 | Role-Based Access Control', () => {

  test('unauthenticated user cannot access /admin — redirected', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page).not.toHaveURL(/\/admin\/products/, { timeout: 8_000 });
  });

  test('unauthenticated user cannot access /dashboard — redirected', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/dashboard/, { timeout: 8_000 });
  });

  test('unauthenticated user can access public products page', async ({ page }) => {
    await page.goto('/en/products');
    await expect(page).toHaveURL(/\/en\/products/);
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
  });

  test('authenticated regular user cannot access /admin — redirected to dashboard', async ({ page }) => {
    // page already has user storageState (from chromium:user project)
    await page.goto('/admin/products');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8_000 });
  });

  test('forgot password flow: OTP field appears after email submission', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.locator('[data-testid="forgot-email"]').fill(TEST_USERS.user.email);
    await page.locator('[data-testid="send-reset-otp"]').click();
    await expect(page.locator('[data-testid="otp-sent-notice"]')).toBeVisible({ timeout: 8_000 });
  });
});
