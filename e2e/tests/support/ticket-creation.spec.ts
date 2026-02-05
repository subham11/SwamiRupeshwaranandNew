import { test, expect } from '../../fixtures';
import { TEST_TICKET } from '../../fixtures/test-data';

test.describe('Support Page', () => {
  test('should display ticket creation form', async ({ supportPage }) => {
    await supportPage.goto();

    await expect(supportPage.subjectInput).toBeVisible();
    await expect(supportPage.descriptionTextarea).toBeVisible();
    await expect(supportPage.submitButton).toBeVisible();
  });

  test('should have category selection', async ({ supportPage }) => {
    await supportPage.goto();

    await expect(supportPage.categorySelect).toBeVisible();
  });

  test('should have priority selection', async ({ supportPage }) => {
    await supportPage.goto();

    await expect(supportPage.prioritySelect).toBeVisible();
  });

  test('should validate required fields', async ({ supportPage, page }) => {
    await supportPage.goto();

    // Try to submit empty form
    await supportPage.submitButton.click();

    // Should still be on support page
    await expect(page).toHaveURL(/\/support/);
  });

  test('should fill ticket form', async ({ supportPage }) => {
    await supportPage.goto();

    await supportPage.subjectInput.fill(TEST_TICKET.subject);
    await supportPage.descriptionTextarea.fill(TEST_TICKET.description);

    await expect(supportPage.subjectInput).toHaveValue(TEST_TICKET.subject);
    await expect(supportPage.descriptionTextarea).toHaveValue(TEST_TICKET.description);
  });
});

test.describe('Support - Different Locales', () => {
  test('should work in English', async ({ supportPage, page }) => {
    await supportPage.goto('en');
    await expect(page).toHaveURL(/\/en\/support/);
  });

  test('should work in Hindi', async ({ supportPage, page }) => {
    await supportPage.goto('hi');
    await expect(page).toHaveURL(/\/hi\/support/);
  });
});

test.describe('Support Ticket Creation Flow', () => {
  test('should complete ticket creation form', async ({ supportPage }) => {
    await supportPage.goto();

    await supportPage.createTicket({
      subject: TEST_TICKET.subject,
      category: TEST_TICKET.category,
      priority: TEST_TICKET.priority,
      description: TEST_TICKET.description,
      email: TEST_TICKET.email,
    });

    // After submission, expect success message or redirect
    // Adjust based on actual app behavior
  });
});
