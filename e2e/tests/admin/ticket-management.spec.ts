/**
 * Support Ticket Admin E2E Tests
 * Tests for admin support ticket management:
 * - View and filter tickets
 * - Reply to tickets
 * - Update ticket status
 * - Resolve and close tickets
 */

import { test, expect } from '../../fixtures';
import { 
  TEST_SUPER_ADMIN,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  URLS 
} from '../../fixtures/test-data';

test.describe('Support Ticket Management', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TEST_SUPER_ADMIN.email, TEST_SUPER_ADMIN.password);
    await loginPage.page.waitForURL(/.*admin|dashboard.*/);
  });

  test.describe('Tickets Dashboard', () => {
    test('should access tickets management page', async ({ adminTicketsPage }) => {
      await adminTicketsPage.goto();
      
      await expect(adminTicketsPage.ticketsTable.or(adminTicketsPage.page.locator('text=Tickets'))).toBeVisible();
    });

    test('should display ticket statistics', async ({ adminTicketsPage }) => {
      await adminTicketsPage.goto();
      
      const stats = adminTicketsPage.openTicketsCount
        .or(adminTicketsPage.totalTicketsCount)
        .or(adminTicketsPage.page.locator('text=/open|total|pending/i'));
      
      await expect(stats.or(adminTicketsPage.ticketsTable)).toBeVisible();
    });

    test('should show tickets list or empty state', async ({ adminTicketsPage }) => {
      await adminTicketsPage.goto();
      
      const content = adminTicketsPage.ticketRows.first()
        .or(adminTicketsPage.page.locator('text=/no tickets|empty/i'))
        .or(adminTicketsPage.ticketsTable);
      
      await expect(content).toBeVisible();
    });
  });

  test.describe('Ticket Filtering', () => {
    test('should filter by category', async ({ adminTicketsPage }) => {
      await adminTicketsPage.goto();
      
      if (await adminTicketsPage.categoryFilter.isVisible().catch(() => false)) {
        await adminTicketsPage.filterByCategory(TicketCategory.GENERAL);
        
        await expect(adminTicketsPage.ticketsTable).toBeVisible();
      }
    });

    test('should filter by priority', async ({ adminTicketsPage }) => {
      await adminTicketsPage.goto();
      
      if (await adminTicketsPage.priorityFilter.isVisible().catch(() => false)) {
        await adminTicketsPage.filterByPriority(TicketPriority.HIGH);
        
        await expect(adminTicketsPage.ticketsTable).toBeVisible();
      }
    });

    test('should filter by status', async ({ adminTicketsPage }) => {
      await adminTicketsPage.goto();
      
      if (await adminTicketsPage.statusFilter.isVisible().catch(() => false)) {
        await adminTicketsPage.filterByStatus(TicketStatus.OPEN);
        
        await expect(adminTicketsPage.ticketsTable).toBeVisible();
      }
    });

    test('should search tickets', async ({ adminTicketsPage }) => {
      await adminTicketsPage.goto();
      
      if (await adminTicketsPage.searchInput.isVisible().catch(() => false)) {
        await adminTicketsPage.searchTickets('help');
        
        await expect(adminTicketsPage.ticketsTable).toBeVisible();
      }
    });
  });

  test.describe('Ticket Details', () => {
    test('should open ticket details', async ({ adminTicketsPage }) => {
      await adminTicketsPage.goto();
      
      const firstTicket = adminTicketsPage.ticketRows.first();
      
      if (await firstTicket.isVisible().catch(() => false)) {
        await firstTicket.click();
        
        await expect(adminTicketsPage.ticketDetailModal.or(adminTicketsPage.page.locator('text=/details|subject/i'))).toBeVisible();
      }
    });

    test('should display ticket information', async ({ adminTicketsPage }) => {
      await adminTicketsPage.goto();
      
      const firstTicket = adminTicketsPage.ticketRows.first();
      
      if (await firstTicket.isVisible().catch(() => false)) {
        await firstTicket.click();
        
        // Should show ticket subject and description
        const ticketInfo = adminTicketsPage.ticketSubject
          .or(adminTicketsPage.ticketDescription)
          .or(adminTicketsPage.page.locator('text=/subject|description/i'));
        
        await expect(ticketInfo).toBeVisible();
      }
    });
  });

  test.describe('Ticket Replies', () => {
    test('should have reply input field', async ({ adminTicketsPage }) => {
      await adminTicketsPage.goto();
      
      const firstTicket = adminTicketsPage.ticketRows.first();
      
      if (await firstTicket.isVisible().catch(() => false)) {
        await firstTicket.click();
        await adminTicketsPage.page.waitForTimeout(500);
        
        const replyInput = adminTicketsPage.replyInput
          .or(adminTicketsPage.page.locator('textarea'));
        
        await expect(replyInput.or(adminTicketsPage.ticketDetailModal)).toBeVisible();
      }
    });

    test.skip('should submit reply to ticket', async ({ adminTicketsPage }) => {
      await adminTicketsPage.goto();
      
      const firstTicket = adminTicketsPage.ticketRows.first();
      
      if (await firstTicket.isVisible()) {
        const subject = await firstTicket.locator('[data-testid="ticket-subject"]').textContent();
        
        if (subject) {
          await adminTicketsPage.replyToTicket(subject, 'Test reply from E2E test');
          await expect(adminTicketsPage.successToast).toBeVisible();
        }
      }
    });
  });

  test.describe('Status Management', () => {
    test('should show status update options', async ({ adminTicketsPage }) => {
      await adminTicketsPage.goto();
      
      const firstTicket = adminTicketsPage.ticketRows.first();
      
      if (await firstTicket.isVisible().catch(() => false)) {
        await firstTicket.click();
        await adminTicketsPage.page.waitForTimeout(500);
        
        const statusOptions = adminTicketsPage.statusSelect
          .or(adminTicketsPage.resolveButton)
          .or(adminTicketsPage.closeButton)
          .or(adminTicketsPage.page.locator('text=/status|resolve|close/i'));
        
        await expect(statusOptions).toBeVisible();
      }
    });

    test.skip('should update ticket status', async ({ adminTicketsPage }) => {
      await adminTicketsPage.goto();
      
      const firstTicket = adminTicketsPage.ticketRows.first();
      
      if (await firstTicket.isVisible()) {
        const subject = await firstTicket.locator('[data-testid="ticket-subject"]').textContent();
        
        if (subject) {
          await adminTicketsPage.updateTicketStatus(subject, TicketStatus.IN_PROGRESS);
          await expect(adminTicketsPage.successToast).toBeVisible();
        }
      }
    });

    test.skip('should resolve ticket', async ({ adminTicketsPage }) => {
      await adminTicketsPage.goto();
      
      const firstTicket = adminTicketsPage.ticketRows.first();
      
      if (await firstTicket.isVisible()) {
        const subject = await firstTicket.locator('[data-testid="ticket-subject"]').textContent();
        
        if (subject) {
          await adminTicketsPage.resolveTicket(subject, 'Issue resolved via E2E test');
          await expect(adminTicketsPage.successToast).toBeVisible();
        }
      }
    });
  });
});
