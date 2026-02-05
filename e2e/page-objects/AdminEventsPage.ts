import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminEventsPage extends BasePage {
  // Events List
  readonly eventsTable: Locator;
  readonly eventRows: Locator;
  readonly createEventButton: Locator;
  readonly searchInput: Locator;

  // Event Form Modal
  readonly eventModal: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly dateInput: Locator;
  readonly timeInput: Locator;
  readonly locationInput: Locator;
  readonly capacityInput: Locator;
  readonly imageInput: Locator;
  readonly submitButton: Locator;

  // Delete Confirmation
  readonly deleteConfirmModal: Locator;
  readonly deleteConfirmButton: Locator;

  // Toast
  readonly successToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    super(page);
    this.eventsTable = page.locator('[data-testid="events-table"]');
    this.eventRows = page.locator('[data-testid="event-row"]');
    this.createEventButton = page.locator('[data-testid="create-event-button"], button:has-text("Create Event")');
    this.searchInput = page.locator('[data-testid="event-search"], input[placeholder*="Search"]');

    // Event Form Modal
    this.eventModal = page.locator('[data-testid="event-modal"], [role="dialog"]:has-text("Event")');
    this.titleInput = page.locator('[data-testid="event-title"], input[name="title"]');
    this.descriptionInput = page.locator('[data-testid="event-description"], textarea[name="description"]');
    this.dateInput = page.locator('[data-testid="event-date"], input[name="date"], input[type="date"]');
    this.timeInput = page.locator('[data-testid="event-time"], input[name="time"], input[type="time"]');
    this.locationInput = page.locator('[data-testid="event-location"], input[name="location"]');
    this.capacityInput = page.locator('[data-testid="event-capacity"], input[name="capacity"]');
    this.imageInput = page.locator('[data-testid="event-image"], input[type="file"]');
    this.submitButton = page.locator('[data-testid="event-submit"], button[type="submit"]');

    // Delete Confirmation
    this.deleteConfirmModal = page.locator('[data-testid="delete-confirm-modal"], [role="dialog"]:has-text("Delete")');
    this.deleteConfirmButton = page.locator('[data-testid="delete-confirm"], button:has-text("Delete")');

    // Toast
    this.successToast = page.locator('[data-testid="success-toast"], .toast-success');
    this.errorToast = page.locator('[data-testid="error-toast"], .toast-error');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/admin/events`);
  }

  async getEventCount(): Promise<number> {
    return this.eventRows.count();
  }

  async openCreateEventModal() {
    await this.createEventButton.click();
    await this.eventModal.waitFor({ state: 'visible' });
  }

  async createEvent(options: {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    capacity?: number;
  }) {
    await this.openCreateEventModal();
    await this.titleInput.fill(options.title);
    await this.descriptionInput.fill(options.description);
    await this.dateInput.fill(options.date);
    await this.timeInput.fill(options.time);
    await this.locationInput.fill(options.location);
    
    if (options.capacity) {
      await this.capacityInput.fill(options.capacity.toString());
    }

    await this.submitButton.click();
  }

  async getEventRowByTitle(title: string): Promise<Locator> {
    return this.page.locator(`[data-testid="event-row"]:has-text("${title}")`);
  }

  async editEvent(title: string) {
    const row = await this.getEventRowByTitle(title);
    await row.locator('[data-testid="edit-event"], button:has-text("Edit")').click();
    await this.eventModal.waitFor({ state: 'visible' });
  }

  async deleteEvent(title: string) {
    const row = await this.getEventRowByTitle(title);
    await row.locator('[data-testid="delete-event"], button:has-text("Delete")').click();
    await this.deleteConfirmModal.waitFor({ state: 'visible' });
    await this.deleteConfirmButton.click();
  }

  async updateEvent(title: string, updates: Partial<{
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    capacity: number;
  }>) {
    await this.editEvent(title);

    if (updates.title) await this.titleInput.fill(updates.title);
    if (updates.description) await this.descriptionInput.fill(updates.description);
    if (updates.date) await this.dateInput.fill(updates.date);
    if (updates.time) await this.timeInput.fill(updates.time);
    if (updates.location) await this.locationInput.fill(updates.location);
    if (updates.capacity) await this.capacityInput.fill(updates.capacity.toString());

    await this.submitButton.click();
  }

  async searchEvents(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async isEventInList(title: string): Promise<boolean> {
    const row = await this.getEventRowByTitle(title);
    return (await row.count()) > 0;
  }
}
