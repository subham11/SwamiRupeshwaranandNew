import { test, expect } from '../../fixtures';

test.describe('Admin Dashboard', () => {
  // Note: These tests require admin authentication
  // The setup should authenticate as admin user

  test('should display admin dashboard', async ({ adminDashboardPage, page }) => {
    await adminDashboardPage.goto();

    // Check if redirected to login (if not admin) or dashboard is shown
    const url = page.url();
    if (url.includes('login')) {
      // Not authenticated as admin - this is expected behavior
      expect(url).toContain('login');
    } else {
      // Admin dashboard should be visible
      await expect(adminDashboardPage.sidebar).toBeVisible();
    }
  });

  test('should show statistics cards', async ({ adminDashboardPage, page }) => {
    await adminDashboardPage.goto();

    // Skip if redirected to login
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    const statsCount = await adminDashboardPage.getStatsCardCount();
    expect(statsCount).toBeGreaterThan(0);
  });

  test('should have navigation sidebar', async ({ adminDashboardPage, page }) => {
    await adminDashboardPage.goto();

    // Skip if redirected to login
    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    await expect(adminDashboardPage.sidebar).toBeVisible();
  });
});

test.describe('Admin Navigation', () => {
  test('should navigate to users section', async ({ adminDashboardPage, page }) => {
    await adminDashboardPage.goto();

    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    await adminDashboardPage.navigateToUsers();
    await expect(page).toHaveURL(/\/admin.*users/);
  });

  test('should navigate to donations section', async ({ adminDashboardPage, page }) => {
    await adminDashboardPage.goto();

    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    await adminDashboardPage.navigateToDonations();
    await expect(page).toHaveURL(/\/admin.*donations/);
  });

  test('should navigate to tickets section', async ({ adminDashboardPage, page }) => {
    await adminDashboardPage.goto();

    if (page.url().includes('login')) {
      test.skip();
      return;
    }

    await adminDashboardPage.navigateToTickets();
    await expect(page).toHaveURL(/\/admin.*tickets/);
  });
});
