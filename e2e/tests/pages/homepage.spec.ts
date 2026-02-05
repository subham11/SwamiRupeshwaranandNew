import { test, expect } from '../../fixtures';
import { LOCALES } from '../../fixtures/test-data';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ homePage, page }) => {
    await homePage.goto();

    await expect(page).toHaveTitle(/.+/); // Has some title
    await expect(homePage.navBar).toBeVisible();
  });

  test('should display navigation bar', async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.navBar).toBeVisible();
  });

  test('should display footer', async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.footer).toBeVisible();
  });

  test('should have language toggle', async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.languageToggle).toBeVisible();
  });

  test('should have theme toggle', async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.themeToggle).toBeVisible();
  });
});

test.describe('Homepage - Language Switching', () => {
  test('should switch to Hindi', async ({ homePage, page }) => {
    await homePage.goto('en');
    
    // Click language toggle
    await homePage.switchLanguage('hi');

    await expect(page).toHaveURL(/\/hi/);
  });

  test('should switch back to English', async ({ homePage, page }) => {
    await homePage.goto('hi');
    
    await homePage.switchLanguage('en');

    await expect(page).toHaveURL(/\/en/);
  });
});

test.describe('Homepage - Theme Toggle', () => {
  test('should toggle theme', async ({ homePage, page }) => {
    await homePage.goto();

    // Get initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    // Toggle theme
    await homePage.toggleTheme();

    // Wait for theme change
    await page.waitForTimeout(500);

    // Get new theme
    const newTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    expect(newTheme).not.toBe(initialTheme);
  });
});

test.describe('Homepage - Navigation Links', () => {
  test('should navigate to login', async ({ homePage, page }) => {
    await homePage.goto();

    if (await homePage.loginButton.isVisible()) {
      await homePage.navigateToLogin();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('should navigate to register', async ({ homePage, page }) => {
    await homePage.goto();

    if (await homePage.registerButton.isVisible()) {
      await homePage.navigateToRegister();
      await expect(page).toHaveURL(/\/register/);
    }
  });
});

test.describe('Homepage - Responsive', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/en');

    // Page should still load and be usable
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/en');

    await expect(page.locator('nav')).toBeVisible();
  });
});
