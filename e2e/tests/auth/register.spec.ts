import { test, expect } from '../../fixtures';

test.describe('Registration Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should display registration form', async ({ registerPage }) => {
    await registerPage.goto();

    await expect(registerPage.nameInput).toBeVisible();
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.confirmPasswordInput).toBeVisible();
    await expect(registerPage.submitButton).toBeVisible();
  });

  test('should show validation error for mismatched passwords', async ({ registerPage }) => {
    await registerPage.goto();
    await registerPage.register(
      'Test User',
      'newuser@example.com',
      'password123',
      'differentpassword'
    );

    await expect(registerPage.errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should show validation error for invalid email', async ({ registerPage, page }) => {
    await registerPage.goto();
    
    await registerPage.nameInput.fill('Test User');
    await registerPage.emailInput.fill('invalid-email');
    await registerPage.passwordInput.fill('password123');
    await registerPage.confirmPasswordInput.fill('password123');
    await registerPage.submitButton.click();

    // Check for HTML5 validation or custom error
    const emailInput = registerPage.emailInput;
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should navigate to login page', async ({ registerPage, page }) => {
    await registerPage.goto();
    await registerPage.navigateToLogin();

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Registration - Different Locales', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should work in English', async ({ registerPage, page }) => {
    await registerPage.goto('en');
    await expect(page).toHaveURL(/\/en\/register/);
  });

  test('should work in Hindi', async ({ registerPage, page }) => {
    await registerPage.goto('hi');
    await expect(page).toHaveURL(/\/hi\/register/);
  });
});
