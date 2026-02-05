import { test, expect } from '../../fixtures';
import { TEST_USER, URLS } from '../../fixtures/test-data';

test.describe('Login Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Clear auth state for login tests

  test('should display login form', async ({ loginPage }) => {
    await loginPage.goto();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // Wait for error message
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to register page', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.navigateToRegister();

    await expect(page).toHaveURL(/\/register/);
  });

  test('should have forgot password link', async ({ loginPage }) => {
    await loginPage.goto();

    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });
});

test.describe('Login - Different Locales', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should work in English', async ({ loginPage, page }) => {
    await loginPage.goto('en');
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test('should work in Hindi', async ({ loginPage, page }) => {
    await loginPage.goto('hi');
    await expect(page).toHaveURL(/\/hi\/login/);
  });
});
