import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { UserRole } from '../fixtures/test-data';

export class AdminUsersPage extends BasePage {
  // Locators
  readonly usersTable: Locator;
  readonly userRows: Locator;
  readonly searchInput: Locator;
  readonly inviteUserButton: Locator;
  readonly roleFilter: Locator;
  readonly statusFilter: Locator;

  // Invite Modal
  readonly inviteModal: Locator;
  readonly inviteEmailInput: Locator;
  readonly inviteNameInput: Locator;
  readonly inviteRoleSelect: Locator;
  readonly inviteSubmitButton: Locator;
  readonly inviteSuccessMessage: Locator;

  // Role Change Modal
  readonly roleChangeModal: Locator;
  readonly roleSelect: Locator;
  readonly roleChangeConfirmButton: Locator;

  // Delete Confirmation
  readonly deleteConfirmModal: Locator;
  readonly deleteConfirmButton: Locator;

  // Toast/Notifications
  readonly successToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    super(page);
    this.usersTable = page.locator('[data-testid="users-table"], table.users-table');
    this.userRows = page.locator('[data-testid="user-row"], tbody tr');
    this.searchInput = page.locator('[data-testid="user-search"], input[placeholder*="Search"]');
    this.inviteUserButton = page.locator('[data-testid="invite-user-button"], button:has-text("Invite")');
    this.roleFilter = page.locator('[data-testid="role-filter"]');
    this.statusFilter = page.locator('[data-testid="status-filter"]');

    // Invite Modal
    this.inviteModal = page.locator('[data-testid="invite-modal"], [role="dialog"]:has-text("Invite")');
    this.inviteEmailInput = page.locator('[data-testid="invite-email"], input[name="email"]');
    this.inviteNameInput = page.locator('[data-testid="invite-name"], input[name="name"]');
    this.inviteRoleSelect = page.locator('[data-testid="invite-role"], select[name="role"]');
    this.inviteSubmitButton = page.locator('[data-testid="invite-submit"], button[type="submit"]:has-text("Invite")');
    this.inviteSuccessMessage = page.locator('[data-testid="invite-success"]');

    // Role Change
    this.roleChangeModal = page.locator('[data-testid="role-change-modal"], [role="dialog"]:has-text("Role")');
    this.roleSelect = page.locator('[data-testid="role-select"], select[name="role"]');
    this.roleChangeConfirmButton = page.locator('[data-testid="role-confirm"], button:has-text("Confirm")');

    // Delete
    this.deleteConfirmModal = page.locator('[data-testid="delete-confirm-modal"], [role="dialog"]:has-text("Delete")');
    this.deleteConfirmButton = page.locator('[data-testid="delete-confirm"], button:has-text("Delete")');

    // Toast
    this.successToast = page.locator('[data-testid="success-toast"], .toast-success, [role="alert"]:has-text("success")');
    this.errorToast = page.locator('[data-testid="error-toast"], .toast-error, [role="alert"]:has-text("error")');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/admin/users`);
  }

  async getUserCount(): Promise<number> {
    return this.userRows.count();
  }

  async searchUser(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async filterByRole(role: UserRole) {
    await this.roleFilter.selectOption(role);
  }

  async openInviteModal() {
    await this.inviteUserButton.click();
    await this.inviteModal.waitFor({ state: 'visible' });
  }

  async inviteUser(email: string, name: string, role: UserRole) {
    await this.openInviteModal();
    await this.inviteEmailInput.fill(email);
    await this.inviteNameInput.fill(name);
    await this.inviteRoleSelect.selectOption(role);
    await this.inviteSubmitButton.click();
  }

  async getUserRowByEmail(email: string): Promise<Locator> {
    return this.page.locator(`[data-testid="user-row"]:has-text("${email}"), tbody tr:has-text("${email}")`);
  }

  async openRoleChangeForUser(email: string) {
    const row = await this.getUserRowByEmail(email);
    await row.locator('[data-testid="change-role-button"], button:has-text("Role")').click();
    await this.roleChangeModal.waitFor({ state: 'visible' });
  }

  async changeUserRole(email: string, newRole: UserRole) {
    await this.openRoleChangeForUser(email);
    await this.roleSelect.selectOption(newRole);
    await this.roleChangeConfirmButton.click();
  }

  async deleteUser(email: string) {
    const row = await this.getUserRowByEmail(email);
    await row.locator('[data-testid="delete-user-button"], button:has-text("Delete")').click();
    await this.deleteConfirmModal.waitFor({ state: 'visible' });
    await this.deleteConfirmButton.click();
  }

  async getUserRole(email: string): Promise<string | null> {
    const row = await this.getUserRowByEmail(email);
    return row.locator('[data-testid="user-role"]').textContent();
  }

  async isUserInList(email: string): Promise<boolean> {
    const row = await this.getUserRowByEmail(email);
    return (await row.count()) > 0;
  }
}
