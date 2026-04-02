import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the CMS Admin page (/[locale]/admin/cms)
 */
export class AdminCMSPage extends BasePage {
  // Page list
  readonly addPageButton: Locator;
  readonly pageListItems: Locator;

  // Page form (Add Page modal)
  readonly pageTitleInput: Locator;
  readonly pageTitleHiInput: Locator;
  readonly pageSlugInput: Locator;
  readonly savePageButton: Locator;

  // Component management
  readonly addComponentButton: Locator;
  readonly componentList: Locator;
  readonly componentTemplateSelect: Locator;
  readonly saveComponentButton: Locator;
  readonly deleteComponentButton: Locator;

  // Language toggle
  readonly englishTab: Locator;
  readonly hindiTab: Locator;

  // Actions
  readonly deletePageButton: Locator;
  readonly editButton: Locator;

  // Status messages
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Page list
    this.addPageButton = page.locator('button:has-text("Add Page")');
    this.pageListItems = page.locator('[class*="cursor-pointer"][class*="border"], [class*="hover\\:bg"]');

    // Page form
    this.pageTitleInput = page.locator('input[aria-label*="Title"], input[placeholder*="title"], input[placeholder*="Title"]').first();
    this.pageTitleHiInput = page.locator('input[aria-label*="Title (HI)"]');
    this.pageSlugInput = page.locator('input[aria-label*="Slug"], input[placeholder*="slug"], input[placeholder*="Slug"]');
    this.savePageButton = page.locator('button:has-text("Save")').first();

    // Component management
    this.addComponentButton = page.locator('button:has-text("Add Component")');
    this.componentList = page.locator('[class*="component"]');
    this.componentTemplateSelect = page.locator('select').first();
    this.saveComponentButton = page.locator('button:has-text("Save")');
    this.deleteComponentButton = page.locator('button:has-text("Delete")');

    // Language toggle
    this.englishTab = page.locator('button:has-text("English")');
    this.hindiTab = page.locator('button:has-text("हिंदी")');

    // Actions
    this.deletePageButton = page.locator('button:has-text("Delete")');
    this.editButton = page.locator('button:has-text("Edit")');

    // Status
    this.successMessage = page.locator('.bg-green-50, .text-green-700, [class*="bg-green"]');
    this.errorMessage = page.locator('.bg-red-50, .text-red-600, [class*="bg-red"]');
  }

  async gotoCMS(locale = 'en') {
    await this.goto(`/${locale}/admin/cms`);
  }

  async createPage(title: string, slug: string) {
    await this.addPageButton.click();
    await this.page.waitForTimeout(500);
    await this.pageTitleInput.fill(title);
    await this.pageSlugInput.fill(slug);
    await this.savePageButton.click();
    await this.page.waitForTimeout(1000);
  }

  async selectPage(titleOrSlug: string) {
    const item = this.page.locator(`text=${titleOrSlug}`).first();
    if (await item.isVisible()) {
      await item.click();
      await this.page.waitForTimeout(500);
    }
  }

  async deletePage() {
    await this.deletePageButton.click();
    // Handle confirmation dialog
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.page.waitForTimeout(1000);
  }

  async addComponent(templateType: string) {
    await this.addComponentButton.click();
    await this.page.waitForTimeout(500);
    // Select template type from dropdown
    if (await this.componentTemplateSelect.isVisible()) {
      await this.componentTemplateSelect.selectOption({ label: templateType });
    }
  }

  async saveComponent() {
    await this.saveComponentButton.click();
    await this.page.waitForTimeout(1000);
  }

  async getPageCount(): Promise<number> {
    return this.pageListItems.count();
  }

  async hasSuccessMessage(): Promise<boolean> {
    return this.successMessage.isVisible();
  }

  async hasErrorMessage(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  async isPageInList(titleOrSlug: string): Promise<boolean> {
    return this.page.locator(`text=${titleOrSlug}`).isVisible();
  }
}
