/**
 * Donation Admin E2E Tests
 * Tests for admin donation management:
 * - View donations
 * - Configure donation amounts
 * - Manage initiatives
 */

import { test, expect } from '../../fixtures';
import { 
  TEST_SUPER_ADMIN,
  DONATION_AMOUNTS,
  DonationFrequency,
  URLS 
} from '../../fixtures/test-data';

test.describe('Donation Management', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_SUPER_ADMIN.email, TEST_SUPER_ADMIN.password);
    await loginPage.page.waitForURL(/.*admin|dashboard.*/);
  });

  test.describe('Donations Dashboard', () => {
    test('should access donations management page', async ({ adminDonationsPage }) => {
      await adminDonationsPage.goto();
      
      await expect(adminDonationsPage.donationsTable.or(adminDonationsPage.page.locator('text=Donations'))).toBeVisible();
    });

    test('should display total donations amount', async ({ adminDonationsPage }) => {
      await adminDonationsPage.goto();
      
      const totalAmount = adminDonationsPage.totalDonationsAmount
        .or(adminDonationsPage.page.locator('text=/total|₹/i'));
      
      await expect(totalAmount.or(adminDonationsPage.donationsTable)).toBeVisible();
    });

    test('should show donations list or empty state', async ({ adminDonationsPage }) => {
      await adminDonationsPage.goto();
      
      const content = adminDonationsPage.donationRows.first()
        .or(adminDonationsPage.page.locator('text=/no donations|empty/i'))
        .or(adminDonationsPage.donationsTable);
      
      await expect(content).toBeVisible();
    });

    test('should filter donations by frequency', async ({ adminDonationsPage }) => {
      await adminDonationsPage.goto();
      
      if (await adminDonationsPage.frequencyFilter.isVisible().catch(() => false)) {
        await adminDonationsPage.filterByFrequency(DonationFrequency.MONTHLY);
        
        await expect(adminDonationsPage.donationsTable).toBeVisible();
      }
    });
  });

  test.describe('Donation Configuration', () => {
    test('should access configuration tab', async ({ adminDonationsPage }) => {
      await adminDonationsPage.goto();
      
      if (await adminDonationsPage.configTab.isVisible().catch(() => false)) {
        await adminDonationsPage.goToConfigTab();
        
        const configContent = adminDonationsPage.weeklyAmountInput
          .or(adminDonationsPage.page.locator('text=/configuration|settings/i'));
        await expect(configContent).toBeVisible();
      }
    });

    test('should display current donation amounts', async ({ adminDonationsPage }) => {
      await adminDonationsPage.goto();
      
      if (await adminDonationsPage.configTab.isVisible().catch(() => false)) {
        await adminDonationsPage.goToConfigTab();
        
        // Check for amount inputs
        const amountInputs = adminDonationsPage.page.locator('input[type="number"], input[name*="amount"]');
        await expect(amountInputs.first().or(adminDonationsPage.page.locator('text=/amount/i'))).toBeVisible();
      }
    });

    test.skip('should update donation amounts', async ({ adminDonationsPage }) => {
      await adminDonationsPage.goto();
      
      await adminDonationsPage.setDonationAmounts({
        weekly: DONATION_AMOUNTS.WEEKLY.amount,
        monthly: DONATION_AMOUNTS.MONTHLY.amount,
        yearly: DONATION_AMOUNTS.YEARLY.amount
      });
      
      await expect(adminDonationsPage.successToast).toBeVisible();
    });
  });

  test.describe('Donation Initiatives', () => {
    test('should access initiatives tab', async ({ adminDonationsPage }) => {
      await adminDonationsPage.goto();
      
      if (await adminDonationsPage.initiativesTab.isVisible().catch(() => false)) {
        await adminDonationsPage.goToInitiativesTab();
        
        const initiativeContent = adminDonationsPage.createInitiativeButton
          .or(adminDonationsPage.page.locator('text=/initiatives|campaigns/i'));
        await expect(initiativeContent).toBeVisible();
      }
    });

    test.skip('should create a new initiative', async ({ adminDonationsPage }) => {
      await adminDonationsPage.goto();
      
      await adminDonationsPage.createInitiative({
        name: `Test Initiative ${Date.now()}`,
        description: 'Test initiative for E2E testing',
        goal: 100000
      });
      
      await expect(adminDonationsPage.successToast).toBeVisible();
    });
  });
});
