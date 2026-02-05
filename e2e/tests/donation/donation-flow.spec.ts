import { test, expect } from '../../fixtures';
import { TEST_DONATION } from '../../fixtures/test-data';

test.describe('Donation Page', () => {
  test('should display donation form', async ({ donationPage }) => {
    await donationPage.goto();

    await expect(donationPage.amountInput).toBeVisible();
    await expect(donationPage.nameInput).toBeVisible();
    await expect(donationPage.emailInput).toBeVisible();
    await expect(donationPage.submitButton).toBeVisible();
  });

  test('should have predefined amount options', async ({ donationPage }) => {
    await donationPage.goto();

    const count = await donationPage.predefinedAmounts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should allow selecting predefined amounts', async ({ donationPage }) => {
    await donationPage.goto();

    await donationPage.selectPredefinedAmount(0);
    
    // Verify amount input has a value
    const value = await donationPage.amountInput.inputValue();
    expect(value).toBeTruthy();
  });

  test('should allow entering custom amount', async ({ donationPage }) => {
    await donationPage.goto();

    await donationPage.fillCustomAmount('500');
    
    const value = await donationPage.amountInput.inputValue();
    expect(value).toBe('500');
  });

  test('should validate required fields', async ({ donationPage, page }) => {
    await donationPage.goto();

    // Try to submit empty form
    await donationPage.submitButton.click();

    // Check that form wasn't submitted (still on same page)
    await expect(page).toHaveURL(/\/donate/);
  });

  test('should have recurring donation option', async ({ donationPage }) => {
    await donationPage.goto();

    await expect(donationPage.recurringCheckbox).toBeVisible();
  });

  test('should have anonymous donation option', async ({ donationPage }) => {
    await donationPage.goto();

    await expect(donationPage.anonymousCheckbox).toBeVisible();
  });
});

test.describe('Donation - Different Locales', () => {
  test('should work in English', async ({ donationPage, page }) => {
    await donationPage.goto('en');
    await expect(page).toHaveURL(/\/en\/donate/);
  });

  test('should work in Hindi', async ({ donationPage, page }) => {
    await donationPage.goto('hi');
    await expect(page).toHaveURL(/\/hi\/donate/);
  });
});

test.describe('Donation Form Flow', () => {
  test('should fill complete donation form', async ({ donationPage }) => {
    await donationPage.goto();

    await donationPage.fillCustomAmount(TEST_DONATION.amount);
    await donationPage.fillDonorInfo(
      TEST_DONATION.name,
      TEST_DONATION.email,
      TEST_DONATION.phone
    );
    
    if (await donationPage.purposeSelect.isVisible()) {
      await donationPage.selectPurpose(TEST_DONATION.purpose);
    }
    
    if (await donationPage.messageTextarea.isVisible()) {
      await donationPage.addMessage(TEST_DONATION.message);
    }

    // Verify all fields are filled
    await expect(donationPage.amountInput).toHaveValue(TEST_DONATION.amount);
    await expect(donationPage.nameInput).toHaveValue(TEST_DONATION.name);
    await expect(donationPage.emailInput).toHaveValue(TEST_DONATION.email);
  });
});
