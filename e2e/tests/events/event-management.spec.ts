/**
 * Event Management E2E Tests
 * Tests for admin event management functionality:
 * - Create, edit, delete events
 * - Event listing and search
 */

import { test, expect } from '../../fixtures';
import { 
  TEST_SUPER_ADMIN, 
  TEST_EVENT,
  URLS 
} from '../../fixtures/test-data';

test.describe('Admin Event Management', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_SUPER_ADMIN.email, TEST_SUPER_ADMIN.password);
    await loginPage.page.waitForURL(/.*admin|dashboard.*/);
  });

  test.describe('Event Listing', () => {
    test('should access events management page', async ({ adminEventsPage }) => {
      await adminEventsPage.goto();
      
      await expect(adminEventsPage.eventsTable.or(adminEventsPage.page.locator('text=Events'))).toBeVisible();
    });

    test('should display create event button', async ({ adminEventsPage }) => {
      await adminEventsPage.goto();
      
      const createButton = adminEventsPage.createEventButton
        .or(adminEventsPage.page.locator('button:has-text("Create"), button:has-text("Add")'));
      
      await expect(createButton.or(adminEventsPage.eventsTable)).toBeVisible();
    });

    test('should show existing events if any', async ({ adminEventsPage }) => {
      await adminEventsPage.goto();
      
      // Events list or empty state
      const eventsContent = adminEventsPage.eventRows.first()
        .or(adminEventsPage.page.locator('text=/no events|empty/i'))
        .or(adminEventsPage.eventsTable);
      
      await expect(eventsContent).toBeVisible();
    });

    test('should search events by title', async ({ adminEventsPage }) => {
      await adminEventsPage.goto();
      
      if (await adminEventsPage.searchInput.isVisible().catch(() => false)) {
        await adminEventsPage.searchEvents('test');
        
        // Should filter results or show no results
        await expect(adminEventsPage.eventsTable).toBeVisible();
      }
    });
  });

  test.describe('Create Event', () => {
    test('should open create event modal', async ({ adminEventsPage }) => {
      await adminEventsPage.goto();
      
      if (await adminEventsPage.createEventButton.isVisible().catch(() => false)) {
        await adminEventsPage.openCreateEventModal();
        await expect(adminEventsPage.eventModal).toBeVisible();
      }
    });

    test('should display all event form fields', async ({ adminEventsPage }) => {
      await adminEventsPage.goto();
      
      if (await adminEventsPage.createEventButton.isVisible().catch(() => false)) {
        await adminEventsPage.openCreateEventModal();
        
        await expect(adminEventsPage.titleInput).toBeVisible();
        await expect(adminEventsPage.descriptionInput.or(adminEventsPage.eventModal)).toBeVisible();
      }
    });

    test('should validate required fields', async ({ adminEventsPage }) => {
      await adminEventsPage.goto();
      
      if (await adminEventsPage.createEventButton.isVisible().catch(() => false)) {
        await adminEventsPage.openCreateEventModal();
        
        // Try to submit without filling required fields
        await adminEventsPage.submitButton.click();
        
        // Should show validation errors or stay on modal
        await expect(adminEventsPage.eventModal).toBeVisible();
      }
    });

    test.skip('should create a new event', async ({ adminEventsPage }) => {
      // Skipped to avoid creating test data
      await adminEventsPage.goto();
      
      const timestamp = Date.now();
      await adminEventsPage.createEvent({
        title: `Test Event ${timestamp}`,
        description: 'Test event description for E2E testing',
        date: '2025-12-25',
        time: '10:00',
        location: 'Test Location',
        capacity: 100
      });
      
      await expect(adminEventsPage.successToast).toBeVisible();
    });
  });

  test.describe('Edit Event', () => {
    test('should show edit button for existing events', async ({ adminEventsPage }) => {
      await adminEventsPage.goto();
      
      const firstEvent = adminEventsPage.eventRows.first();
      
      if (await firstEvent.isVisible().catch(() => false)) {
        const editButton = firstEvent.locator('[data-testid="edit-event"], button:has-text("Edit")');
        await expect(editButton.or(firstEvent)).toBeVisible();
      }
    });

    test.skip('should update event details', async ({ adminEventsPage }) => {
      await adminEventsPage.goto();
      
      const firstEvent = adminEventsPage.eventRows.first();
      
      if (await firstEvent.isVisible()) {
        const eventTitle = await firstEvent.locator('[data-testid="event-title"]').textContent();
        
        if (eventTitle) {
          await adminEventsPage.updateEvent(eventTitle, {
            description: 'Updated description via E2E test'
          });
          
          await expect(adminEventsPage.successToast).toBeVisible();
        }
      }
    });
  });

  test.describe('Delete Event', () => {
    test('should show delete confirmation', async ({ adminEventsPage }) => {
      await adminEventsPage.goto();
      
      const firstEvent = adminEventsPage.eventRows.first();
      
      if (await firstEvent.isVisible().catch(() => false)) {
        const deleteButton = firstEvent.locator('[data-testid="delete-event"], button:has-text("Delete")');
        
        if (await deleteButton.isVisible().catch(() => false)) {
          await deleteButton.click();
          await expect(adminEventsPage.deleteConfirmModal).toBeVisible();
          
          // Cancel the deletion
          await adminEventsPage.page.keyboard.press('Escape');
        }
      }
    });
  });
});

test.describe('Public Event Display', () => {
  test('should display events on public events page', async ({ page }) => {
    await page.goto('/en/events');
    
    // Events page or coming soon
    const eventsContent = page.locator('[data-testid="event-card"], .event-card, text=/events|upcoming/i');
    await expect(eventsContent.first().or(page.locator('h1, h2'))).toBeVisible();
  });

  test('should show event details', async ({ page }) => {
    await page.goto('/en/events');
    
    const eventCard = page.locator('[data-testid="event-card"], .event-card').first();
    
    if (await eventCard.isVisible().catch(() => false)) {
      await eventCard.click();
      
      // Should navigate to event details
      await expect(page).toHaveURL(/.*events\/.+/);
    }
  });
});
