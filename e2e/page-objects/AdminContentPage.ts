import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminContentPage extends BasePage {
  // Pages List
  readonly pagesTable: Locator;
  readonly pageRows: Locator;
  readonly searchInput: Locator;

  // Page Editor
  readonly pageEditorModal: Locator;
  readonly componentsList: Locator;
  readonly addComponentButton: Locator;
  readonly componentTypeSelect: Locator;
  readonly savePageButton: Locator;
  readonly publishButton: Locator;

  // Component Editor
  readonly componentModal: Locator;
  readonly componentTitleInput: Locator;
  readonly componentSubtitleInput: Locator;
  readonly componentContentEditor: Locator;
  readonly componentImageInput: Locator;
  readonly componentSaveButton: Locator;

  // Announcements Tab
  readonly announcementsTab: Locator;
  readonly announcementsList: Locator;
  readonly createAnnouncementButton: Locator;
  readonly announcementModal: Locator;
  readonly announcementMessageInput: Locator;
  readonly announcementLinkInput: Locator;
  readonly announcementActiveCheckbox: Locator;
  readonly announcementSaveButton: Locator;

  // Images Tab
  readonly imagesTab: Locator;
  readonly imageGallery: Locator;
  readonly uploadImageButton: Locator;
  readonly imageUploadInput: Locator;

  // Toast
  readonly successToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    super(page);
    // Pages List
    this.pagesTable = page.locator('[data-testid="pages-table"]');
    this.pageRows = page.locator('[data-testid="page-row"]');
    this.searchInput = page.locator('[data-testid="page-search"], input[placeholder*="Search"]');

    // Page Editor
    this.pageEditorModal = page.locator('[data-testid="page-editor-modal"], [role="dialog"]');
    this.componentsList = page.locator('[data-testid="components-list"]');
    this.addComponentButton = page.locator('[data-testid="add-component"], button:has-text("Add Component")');
    this.componentTypeSelect = page.locator('[data-testid="component-type"], select[name="componentType"]');
    this.savePageButton = page.locator('[data-testid="save-page"], button:has-text("Save")');
    this.publishButton = page.locator('[data-testid="publish-page"], button:has-text("Publish")');

    // Component Editor
    this.componentModal = page.locator('[data-testid="component-modal"], [role="dialog"]:has-text("Component")');
    this.componentTitleInput = page.locator('[data-testid="component-title"], input[name="title"]');
    this.componentSubtitleInput = page.locator('[data-testid="component-subtitle"], input[name="subtitle"]');
    this.componentContentEditor = page.locator('[data-testid="component-content"], [contenteditable="true"], textarea[name="content"]');
    this.componentImageInput = page.locator('[data-testid="component-image"], input[type="file"]');
    this.componentSaveButton = page.locator('[data-testid="component-save"], button[type="submit"]');

    // Announcements Tab
    this.announcementsTab = page.locator('[data-testid="announcements-tab"], [role="tab"]:has-text("Announcements")');
    this.announcementsList = page.locator('[data-testid="announcements-list"]');
    this.createAnnouncementButton = page.locator('[data-testid="create-announcement"], button:has-text("Create Announcement")');
    this.announcementModal = page.locator('[data-testid="announcement-modal"]');
    this.announcementMessageInput = page.locator('[data-testid="announcement-message"], input[name="message"], textarea[name="message"]');
    this.announcementLinkInput = page.locator('[data-testid="announcement-link"], input[name="link"]');
    this.announcementActiveCheckbox = page.locator('[data-testid="announcement-active"], input[name="isActive"]');
    this.announcementSaveButton = page.locator('[data-testid="announcement-save"], button[type="submit"]');

    // Images Tab
    this.imagesTab = page.locator('[data-testid="images-tab"], [role="tab"]:has-text("Images")');
    this.imageGallery = page.locator('[data-testid="image-gallery"]');
    this.uploadImageButton = page.locator('[data-testid="upload-image"], button:has-text("Upload Image")');
    this.imageUploadInput = page.locator('[data-testid="image-upload-input"], input[type="file"]');

    // Toast
    this.successToast = page.locator('[data-testid="success-toast"], .toast-success');
    this.errorToast = page.locator('[data-testid="error-toast"], .toast-error');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/admin/content`);
  }

  async getPageCount(): Promise<number> {
    return this.pageRows.count();
  }

  async openPageEditor(pageId: string) {
    const row = this.page.locator(`[data-testid="page-row"]:has-text("${pageId}")`);
    await row.locator('[data-testid="edit-page"], button:has-text("Edit")').click();
    await this.pageEditorModal.waitFor({ state: 'visible' });
  }

  async addComponent(type: string, content: {
    title?: string;
    subtitle?: string;
    content?: string;
    imagePath?: string;
  }) {
    await this.addComponentButton.click();
    await this.componentModal.waitFor({ state: 'visible' });
    await this.componentTypeSelect.selectOption(type);

    if (content.title) await this.componentTitleInput.fill(content.title);
    if (content.subtitle) await this.componentSubtitleInput.fill(content.subtitle);
    if (content.content) await this.componentContentEditor.fill(content.content);
    if (content.imagePath) await this.componentImageInput.setInputFiles(content.imagePath);

    await this.componentSaveButton.click();
  }

  async editComponent(index: number, content: {
    title?: string;
    subtitle?: string;
    content?: string;
    imagePath?: string;
  }) {
    const component = this.componentsList.locator('[data-testid="component-item"]').nth(index);
    await component.locator('[data-testid="edit-component"], button:has-text("Edit")').click();
    await this.componentModal.waitFor({ state: 'visible' });

    if (content.title) await this.componentTitleInput.fill(content.title);
    if (content.subtitle) await this.componentSubtitleInput.fill(content.subtitle);
    if (content.content) await this.componentContentEditor.fill(content.content);
    if (content.imagePath) await this.componentImageInput.setInputFiles(content.imagePath);

    await this.componentSaveButton.click();
  }

  async savePage() {
    await this.savePageButton.click();
  }

  async publishPage() {
    await this.publishButton.click();
  }

  async goToAnnouncementsTab() {
    await this.announcementsTab.click();
  }

  async createAnnouncement(message: string, link?: string, isActive: boolean = true) {
    await this.goToAnnouncementsTab();
    await this.createAnnouncementButton.click();
    await this.announcementModal.waitFor({ state: 'visible' });

    await this.announcementMessageInput.fill(message);
    if (link) await this.announcementLinkInput.fill(link);
    
    if (isActive) {
      await this.announcementActiveCheckbox.check();
    } else {
      await this.announcementActiveCheckbox.uncheck();
    }

    await this.announcementSaveButton.click();
  }

  async goToImagesTab() {
    await this.imagesTab.click();
  }

  async uploadImage(filePath: string) {
    await this.goToImagesTab();
    await this.uploadImageButton.click();
    await this.imageUploadInput.setInputFiles(filePath);
  }

  async getImageCount(): Promise<number> {
    await this.goToImagesTab();
    return this.imageGallery.locator('[data-testid="image-item"]').count();
  }
}
