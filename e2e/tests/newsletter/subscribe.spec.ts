import { test, expect } from '../../fixtures';
import { TEST_NEWSLETTER } from '../../fixtures/test-data';

test.describe('Newsletter Subscription', () => {
  test('should display newsletter form on homepage', async ({ homePage, page }) => {
    await homePage.goto();

    // Newsletter form may be in footer or as a section
    const newsletterForm = page.locator('[data-testid="newsletter-form"], .newsletter-form, #newsletter');
    await expect(newsletterForm).toBeVisible();
  });

  test('should have email input field', async ({ homePage, newsletterPage }) => {
    await homePage.goto();

    await expect(newsletterPage.emailInput).toBeVisible();
  });

  test('should validate email format', async ({ homePage, newsletterPage, page }) => {
    await homePage.goto();

    // Try to subscribe with invalid email
    await newsletterPage.emailInput.fill('invalid-email');
    await newsletterPage.submitButton.click();

    // Check for validation error
    const isInvalid = await newsletterPage.emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test('should have submit button', async ({ homePage, newsletterPage }) => {
    await homePage.goto();

    await expect(newsletterPage.submitButton).toBeVisible();
  });
});

test.describe('Newsletter - Different Locales', () => {
  test('should show newsletter form in English page', async ({ page }) => {
    await page.goto('/en');
    
    const form = page.locator('[data-testid="newsletter-form"], .newsletter-form, #newsletter');
    await expect(form).toBeVisible();
  });

  test('should show newsletter form in Hindi page', async ({ page }) => {
    await page.goto('/hi');
    
    const form = page.locator('[data-testid="newsletter-form"], .newsletter-form, #newsletter');
    await expect(form).toBeVisible();
  });
});
