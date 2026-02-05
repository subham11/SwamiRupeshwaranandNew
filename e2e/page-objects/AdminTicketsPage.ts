import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { TicketCategory, TicketPriority, TicketStatus } from '../fixtures/test-data';

export class AdminTicketsPage extends BasePage {
  // Tickets List
  readonly ticketsTable: Locator;
  readonly ticketRows: Locator;
  readonly openTicketsCount: Locator;
  readonly totalTicketsCount: Locator;

  // Filters
  readonly categoryFilter: Locator;
  readonly priorityFilter: Locator;
  readonly statusFilter: Locator;
  readonly searchInput: Locator;

  // Ticket Detail Modal
  readonly ticketDetailModal: Locator;
  readonly ticketSubject: Locator;
  readonly ticketDescription: Locator;
  readonly ticketUserEmail: Locator;
  readonly ticketCategory: Locator;
  readonly ticketPriority: Locator;
  readonly ticketStatus: Locator;
  
  // Reply Section
  readonly replyInput: Locator;
  readonly replySubmitButton: Locator;
  readonly repliesList: Locator;

  // Status Update
  readonly statusSelect: Locator;
  readonly updateStatusButton: Locator;
  readonly resolveButton: Locator;
  readonly closeButton: Locator;

  // Toast
  readonly successToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    super(page);
    // Tickets List
    this.ticketsTable = page.locator('[data-testid="tickets-table"]');
    this.ticketRows = page.locator('[data-testid="ticket-row"]');
    this.openTicketsCount = page.locator('[data-testid="open-tickets-count"]');
    this.totalTicketsCount = page.locator('[data-testid="total-tickets-count"]');

    // Filters
    this.categoryFilter = page.locator('[data-testid="category-filter"]');
    this.priorityFilter = page.locator('[data-testid="priority-filter"]');
    this.statusFilter = page.locator('[data-testid="status-filter"]');
    this.searchInput = page.locator('[data-testid="ticket-search"], input[placeholder*="Search"]');

    // Ticket Detail Modal
    this.ticketDetailModal = page.locator('[data-testid="ticket-detail-modal"], [role="dialog"]');
    this.ticketSubject = page.locator('[data-testid="ticket-subject"]');
    this.ticketDescription = page.locator('[data-testid="ticket-description"]');
    this.ticketUserEmail = page.locator('[data-testid="ticket-user-email"]');
    this.ticketCategory = page.locator('[data-testid="ticket-category"]');
    this.ticketPriority = page.locator('[data-testid="ticket-priority"]');
    this.ticketStatus = page.locator('[data-testid="ticket-status"]');

    // Reply Section
    this.replyInput = page.locator('[data-testid="reply-input"], textarea[name="reply"]');
    this.replySubmitButton = page.locator('[data-testid="reply-submit"], button:has-text("Send Reply")');
    this.repliesList = page.locator('[data-testid="replies-list"]');

    // Status Update
    this.statusSelect = page.locator('[data-testid="status-select"], select[name="status"]');
    this.updateStatusButton = page.locator('[data-testid="update-status"], button:has-text("Update Status")');
    this.resolveButton = page.locator('[data-testid="resolve-ticket"], button:has-text("Resolve")');
    this.closeButton = page.locator('[data-testid="close-ticket"], button:has-text("Close")');

    // Toast
    this.successToast = page.locator('[data-testid="success-toast"], .toast-success');
    this.errorToast = page.locator('[data-testid="error-toast"], .toast-error');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/admin/tickets`);
  }

  async getTicketCount(): Promise<number> {
    return this.ticketRows.count();
  }

  async getOpenTicketsCount(): Promise<string | null> {
    return this.openTicketsCount.textContent();
  }

  async filterByCategory(category: TicketCategory) {
    await this.categoryFilter.selectOption(category);
  }

  async filterByPriority(priority: TicketPriority) {
    await this.priorityFilter.selectOption(priority);
  }

  async filterByStatus(status: TicketStatus) {
    await this.statusFilter.selectOption(status);
  }

  async searchTickets(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async openTicketBySubject(subject: string) {
    const row = this.page.locator(`[data-testid="ticket-row"]:has-text("${subject}")`);
    await row.click();
    await this.ticketDetailModal.waitFor({ state: 'visible' });
  }

  async replyToTicket(subject: string, replyMessage: string) {
    await this.openTicketBySubject(subject);
    await this.replyInput.fill(replyMessage);
    await this.replySubmitButton.click();
  }

  async updateTicketStatus(subject: string, newStatus: TicketStatus) {
    await this.openTicketBySubject(subject);
    await this.statusSelect.selectOption(newStatus);
    await this.updateStatusButton.click();
  }

  async resolveTicket(subject: string, resolutionMessage?: string) {
    await this.openTicketBySubject(subject);
    if (resolutionMessage) {
      await this.replyInput.fill(resolutionMessage);
      await this.replySubmitButton.click();
    }
    await this.resolveButton.click();
  }

  async closeTicket(subject: string) {
    await this.openTicketBySubject(subject);
    await this.closeButton.click();
  }

  async getReplyCount(): Promise<number> {
    return this.repliesList.locator('[data-testid="reply-item"]').count();
  }
}
