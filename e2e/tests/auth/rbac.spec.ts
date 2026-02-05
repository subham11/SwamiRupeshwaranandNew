/**
 * Role-Based Access Control (RBAC) E2E Tests
 * Tests for role permissions across the application:
 * - Super Admin: Full access to all features
 * - Admin: User management, subscriptions, content (no super admin ops)
 * - Content Editor: Content management only
 * - User: Personal dashboard and subscribed content only
 */

import { test, expect } from '../../fixtures';
import { 
  TEST_SUPER_ADMIN, 
  TEST_ADMIN, 
  TEST_CONTENT_EDITOR, 
  TEST_USER,
  UserRole,
  URLS 
} from '../../fixtures/test-data';

test.describe('Super Admin Permissions', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_SUPER_ADMIN.email, TEST_SUPER_ADMIN.password);
    await loginPage.page.waitForURL(/.*admin|dashboard.*/);
  });

  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/en/admin');
    await expect(page).toHaveURL(/.*admin.*/);
    // Should not redirect to login
    await expect(page).not.toHaveURL(/.*login.*/);
  });

  test('should access user management', async ({ adminUsersPage }) => {
    await adminUsersPage.goto();
    await expect(adminUsersPage.usersTable.or(adminUsersPage.page.locator('text=Users'))).toBeVisible();
  });

  test('should access subscription management', async ({ adminSubscriptionsPage }) => {
    await adminSubscriptionsPage.goto();
    await expect(adminSubscriptionsPage.plansTable.or(adminSubscriptionsPage.page.locator('text=Subscriptions'))).toBeVisible();
  });

  test('should access payments management', async ({ adminPaymentsPage }) => {
    await adminPaymentsPage.goto();
    await expect(adminPaymentsPage.paymentsTable.or(adminPaymentsPage.page.locator('text=Payments'))).toBeVisible();
  });

  test('should access content management', async ({ adminContentPage }) => {
    await adminContentPage.goto();
    await expect(adminContentPage.pagesTable.or(adminContentPage.page.locator('text=Content'))).toBeVisible();
  });

  test('should access donation management', async ({ adminDonationsPage }) => {
    await adminDonationsPage.goto();
    await expect(adminDonationsPage.donationsTable.or(adminDonationsPage.page.locator('text=Donations'))).toBeVisible();
  });

  test('should access support tickets', async ({ adminTicketsPage }) => {
    await adminTicketsPage.goto();
    await expect(adminTicketsPage.ticketsTable.or(adminTicketsPage.page.locator('text=Tickets'))).toBeVisible();
  });

  test('should access newsletter management', async ({ adminNewsletterPage }) => {
    await adminNewsletterPage.goto();
    await expect(adminNewsletterPage.newslettersTable.or(adminNewsletterPage.page.locator('text=Newsletter'))).toBeVisible();
  });

  test('should access events management', async ({ adminEventsPage }) => {
    await adminEventsPage.goto();
    await expect(adminEventsPage.eventsTable.or(adminEventsPage.page.locator('text=Events'))).toBeVisible();
  });
});

test.describe('Admin Permissions', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_ADMIN.email, TEST_ADMIN.password);
    await loginPage.page.waitForURL(/.*admin|dashboard.*/);
  });

  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/en/admin');
    // Admin should have access to admin dashboard
    await expect(page).toHaveURL(/.*admin.*/);
  });

  test('should access user management but not super admin features', async ({ adminUsersPage }) => {
    await adminUsersPage.goto();
    
    // Should see users table
    await expect(adminUsersPage.usersTable.or(adminUsersPage.page.locator('text=Users'))).toBeVisible();
    
    // Should NOT be able to invite super admin
    if (await adminUsersPage.inviteUserButton.isVisible().catch(() => false)) {
      await adminUsersPage.openInviteModal();
      const roleSelect = adminUsersPage.inviteRoleSelect;
      
      if (await roleSelect.isVisible()) {
        // Check if super_admin option is available
        const options = await roleSelect.locator('option').allTextContents();
        expect(options.map(o => o.toLowerCase())).not.toContain('super_admin');
      }
    }
  });

  test('should access subscription management', async ({ adminSubscriptionsPage }) => {
    await adminSubscriptionsPage.goto();
    await expect(adminSubscriptionsPage.plansTable.or(adminSubscriptionsPage.page.locator('text=Subscriptions'))).toBeVisible();
  });

  test('should access content management', async ({ adminContentPage }) => {
    await adminContentPage.goto();
    await expect(adminContentPage.pagesTable.or(adminContentPage.page.locator('text=Content'))).toBeVisible();
  });
});

test.describe('Content Editor Permissions', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_CONTENT_EDITOR.email, TEST_CONTENT_EDITOR.password);
    await loginPage.page.waitForURL(/.*dashboard.*/);
  });

  test('should access content management', async ({ adminContentPage }) => {
    await adminContentPage.goto();
    // Content editor should have access to content
    await expect(adminContentPage.pagesTable.or(adminContentPage.page.locator('text=Content'))).toBeVisible();
  });

  test('should NOT access user management', async ({ page }) => {
    await page.goto('/en/admin/users');
    
    // Should either redirect, show forbidden, or not show users table
    const isRedirected = page.url().includes('login') || page.url().includes('forbidden') || page.url().includes('dashboard');
    const hasForbiddenMessage = await page.locator('text=/forbidden|not authorized|access denied/i').isVisible().catch(() => false);
    const noUsersTable = await page.locator('[data-testid="users-table"]').isHidden().catch(() => true);
    
    expect(isRedirected || hasForbiddenMessage || noUsersTable).toBeTruthy();
  });

  test('should NOT access subscription management', async ({ page }) => {
    await page.goto('/en/admin/subscriptions');
    
    const isRedirected = page.url().includes('login') || page.url().includes('forbidden') || page.url().includes('dashboard');
    const hasForbiddenMessage = await page.locator('text=/forbidden|not authorized|access denied/i').isVisible().catch(() => false);
    
    expect(isRedirected || hasForbiddenMessage).toBeTruthy();
  });

  test('should NOT access payments management', async ({ page }) => {
    await page.goto('/en/admin/payments');
    
    const isRedirected = page.url().includes('login') || page.url().includes('forbidden') || page.url().includes('dashboard');
    const hasForbiddenMessage = await page.locator('text=/forbidden|not authorized|access denied/i').isVisible().catch(() => false);
    
    expect(isRedirected || hasForbiddenMessage).toBeTruthy();
  });

  test('should access event editing', async ({ adminEventsPage }) => {
    await adminEventsPage.goto();
    // Content editors should be able to manage events
    await expect(adminEventsPage.eventsTable.or(adminEventsPage.page.locator('text=Events'))).toBeVisible();
  });

  test('should access newsletter editing', async ({ adminNewsletterPage }) => {
    await adminNewsletterPage.goto();
    // Content editors should be able to manage newsletter content
    await expect(adminNewsletterPage.newslettersTable.or(adminNewsletterPage.page.locator('text=Newsletter'))).toBeVisible();
  });
});

test.describe('Regular User Permissions', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.page.waitForURL(/.*dashboard.*/);
  });

  test('should access user dashboard', async ({ userDashboardPage }) => {
    await userDashboardPage.goto();
    await expect(userDashboardPage.page).toHaveURL(/.*dashboard.*/);
    await expect(userDashboardPage.welcomeMessage.or(userDashboardPage.page.locator('h1, h2'))).toBeVisible();
  });

  test('should NOT access admin dashboard', async ({ page }) => {
    await page.goto('/en/admin');
    
    // Should redirect to login or show forbidden
    const isRedirected = page.url().includes('login') || page.url().includes('forbidden') || !page.url().includes('admin');
    const hasForbiddenMessage = await page.locator('text=/forbidden|not authorized|access denied/i').isVisible().catch(() => false);
    
    expect(isRedirected || hasForbiddenMessage).toBeTruthy();
  });

  test('should NOT access user management', async ({ page }) => {
    await page.goto('/en/admin/users');
    
    const isRedirected = page.url().includes('login') || page.url().includes('forbidden') || !page.url().includes('admin');
    expect(isRedirected).toBeTruthy();
  });

  test('should NOT access subscription management admin', async ({ page }) => {
    await page.goto('/en/admin/subscriptions');
    
    const isRedirected = page.url().includes('login') || page.url().includes('forbidden') || !page.url().includes('admin');
    expect(isRedirected).toBeTruthy();
  });

  test('should access own subscription page', async ({ page }) => {
    await page.goto('/en/subscriptions');
    
    // Users should be able to view subscriptions page
    await expect(page).toHaveURL(/.*subscriptions.*/);
  });

  test('should access support for creating tickets', async ({ supportPage }) => {
    await supportPage.goto();
    
    // Users should be able to access support
    await expect(supportPage.page).toHaveURL(/.*support.*/);
  });

  test('should access subscribed content based on plan', async ({ userContentPage }) => {
    await userContentPage.goto();
    
    // Check if content page is accessible
    // Content available depends on user's subscription tier
    await expect(userContentPage.contentGrid.or(userContentPage.page.locator('text=Content'))).toBeVisible();
  });
});

test.describe('Unauthenticated User Access', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all cookies to ensure no auth
    await page.context().clearCookies();
  });

  test('should access public pages', async ({ homePage }) => {
    await homePage.goto();
    await expect(homePage.page).toHaveURL(/.*\/en\/?$/);
  });

  test('should access subscription info page', async ({ subscriptionsPage }) => {
    await subscriptionsPage.goto();
    await expect(subscriptionsPage.page).toHaveURL(/.*subscriptions.*/);
  });

  test('should redirect to login when accessing admin', async ({ page }) => {
    await page.goto('/en/admin');
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('should redirect to login when accessing dashboard', async ({ page }) => {
    await page.goto('/en/dashboard');
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('should redirect to login when accessing user content', async ({ page }) => {
    await page.goto('/en/dashboard/content');
    await expect(page).toHaveURL(/.*login.*/);
  });
});
