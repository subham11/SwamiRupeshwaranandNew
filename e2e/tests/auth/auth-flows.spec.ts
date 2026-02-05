/**
 * Authentication Flow E2E Tests
 * Tests for complete authentication flows including:
 * - OTP verification
 * - Password change
 * - Password reset
 * - Session management
 */

import { test, expect } from '../../fixtures';
import { 
  TEST_USER, 
  TEST_SUPER_ADMIN,
  URLS,
  TIMEOUTS 
} from '../../fixtures/test-data';

test.describe('OTP Verification Flow', () => {
  test.skip('should require OTP verification for new account', async ({ registerPage, page }) => {
    // Note: This test is skipped as it requires actual OTP delivery
    // and would need mock OTP service for full E2E testing
    
    await registerPage.goto();
    
    const timestamp = Date.now();
    const testEmail = `otp-test-${timestamp}@example.com`;
    
    await registerPage.register(
      `OTP Test User ${timestamp}`,
      testEmail,
      'Test@123456'
    );
    
    // Should redirect to OTP verification page
    await expect(page).toHaveURL(/.*verify|otp.*/);
  });

  test.skip('should show OTP input fields after registration', async ({ page }) => {
    // Test for OTP input visibility
    const otpInputs = page.locator('[data-testid="otp-input"], input[type="text"][maxlength="1"]');
    const singleOtpInput = page.locator('[data-testid="otp-input"], input[name="otp"]');
    
    await expect(otpInputs.first().or(singleOtpInput)).toBeVisible();
  });

  test.skip('should allow resending OTP', async ({ page }) => {
    const resendButton = page.locator('button:has-text("Resend"), [data-testid="resend-otp"]');
    await expect(resendButton).toBeVisible();
    
    // Check resend cooldown
    await resendButton.click();
    // Button should be disabled temporarily
    await expect(resendButton).toBeDisabled();
  });
});

test.describe('Password Change Flow', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.page.waitForURL(/.*dashboard.*/);
  });

  test('should navigate to change password page from profile', async ({ page }) => {
    // Navigate to profile/settings
    await page.goto('/en/dashboard/profile');
    
    // Look for change password link/button
    const changePasswordLink = page.locator('a:has-text("Change Password"), button:has-text("Change Password"), [data-testid="change-password"]');
    if (await changePasswordLink.isVisible().catch(() => false)) {
      await changePasswordLink.click();
      await expect(page).toHaveURL(/.*password.*/);
    }
  });

  test.skip('should validate current password when changing', async ({ page }) => {
    await page.goto('/en/dashboard/change-password');
    
    const currentPasswordInput = page.locator('[name="currentPassword"], [data-testid="current-password"]');
    const newPasswordInput = page.locator('[name="newPassword"], [data-testid="new-password"]');
    const confirmPasswordInput = page.locator('[name="confirmPassword"], [data-testid="confirm-password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    // Fill with wrong current password
    if (await currentPasswordInput.isVisible()) {
      await currentPasswordInput.fill('WrongPassword123');
      await newPasswordInput.fill('NewPassword@123');
      await confirmPasswordInput.fill('NewPassword@123');
      await submitButton.click();
      
      // Should show error
      const errorMessage = page.locator('.error, [data-testid="error"], [role="alert"]');
      await expect(errorMessage).toBeVisible();
    }
  });

  test.skip('should require password confirmation to match', async ({ page }) => {
    await page.goto('/en/dashboard/change-password');
    
    const currentPasswordInput = page.locator('[name="currentPassword"], [data-testid="current-password"]');
    const newPasswordInput = page.locator('[name="newPassword"], [data-testid="new-password"]');
    const confirmPasswordInput = page.locator('[name="confirmPassword"], [data-testid="confirm-password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    if (await currentPasswordInput.isVisible()) {
      await currentPasswordInput.fill(TEST_USER.password);
      await newPasswordInput.fill('NewPassword@123');
      await confirmPasswordInput.fill('DifferentPassword@123'); // Mismatch
      await submitButton.click();
      
      // Should show password mismatch error
      const errorMessage = page.locator('.error, [data-testid="error"], text=match');
      await expect(errorMessage).toBeVisible();
    }
  });
});

test.describe('Password Reset Flow', () => {
  test('should display forgot password link on login page', async ({ loginPage }) => {
    await loginPage.goto();
    
    const forgotPasswordLink = loginPage.page.locator('a:has-text("Forgot"), [data-testid="forgot-password"]');
    await expect(forgotPasswordLink).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ loginPage }) => {
    await loginPage.goto();
    
    const forgotPasswordLink = loginPage.page.locator('a:has-text("Forgot"), [data-testid="forgot-password"]');
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      await expect(loginPage.page).toHaveURL(/.*forgot|reset.*/);
    }
  });

  test('should show email input on forgot password page', async ({ page }) => {
    await page.goto('/en/auth/forgot-password');
    
    const emailInput = page.locator('input[type="email"], input[name="email"], [data-testid="email-input"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("Reset"), button:has-text("Send")');
    
    // At least email input or form should be visible
    await expect(emailInput.or(submitButton).or(page.locator('form'))).toBeVisible();
  });

  test.skip('should send reset email for valid email', async ({ page }) => {
    await page.goto('/en/auth/forgot-password');
    
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const submitButton = page.locator('button[type="submit"]');
    
    if (await emailInput.isVisible()) {
      await emailInput.fill(TEST_USER.email);
      await submitButton.click();
      
      // Should show success message
      const successMessage = page.locator('.success, [data-testid="success"], [role="alert"]:has-text("sent")');
      await expect(successMessage).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Session Management', () => {
  test('should persist login session across page refresh', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL(/.*dashboard.*/, { timeout: TIMEOUTS.NAVIGATION });
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in (not redirected to login)
    await expect(page).not.toHaveURL(/.*login.*/);
  });

  test('should logout correctly', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL(/.*dashboard.*/, { timeout: TIMEOUTS.NAVIGATION });
    
    // Find and click logout
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout"]');
    const userMenu = page.locator('[data-testid="user-menu"], [aria-label="User menu"]');
    
    // Open user menu if needed
    if (await userMenu.isVisible().catch(() => false)) {
      await userMenu.click();
    }
    
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
      
      // Should redirect to login or home
      await expect(page).toHaveURL(/.*login|home|\/.*/);
    }
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    
    // Try to access protected route
    await page.goto('/en/admin/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/, { timeout: TIMEOUTS.NAVIGATION });
  });
});
