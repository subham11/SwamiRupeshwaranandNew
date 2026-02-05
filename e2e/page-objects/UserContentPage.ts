import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class UserContentPage extends BasePage {
  // Content List
  readonly contentGrid: Locator;
  readonly contentItems: Locator;
  readonly filterByType: Locator;
  readonly searchInput: Locator;

  // Content Viewer
  readonly contentViewer: Locator;
  readonly contentTitle: Locator;
  readonly contentDescription: Locator;
  readonly pdfViewer: Locator;
  readonly videoPlayer: Locator;
  readonly imageViewer: Locator;
  readonly downloadButton: Locator;

  // Access Restricted
  readonly lockedContent: Locator;
  readonly upgradePrompt: Locator;
  readonly upgradeLink: Locator;

  constructor(page: Page) {
    super(page);
    // Content List
    this.contentGrid = page.locator('[data-testid="content-grid"]');
    this.contentItems = page.locator('[data-testid="content-item"]');
    this.filterByType = page.locator('[data-testid="filter-type"]');
    this.searchInput = page.locator('[data-testid="content-search"], input[placeholder*="Search"]');

    // Content Viewer
    this.contentViewer = page.locator('[data-testid="content-viewer"]');
    this.contentTitle = page.locator('[data-testid="content-title"]');
    this.contentDescription = page.locator('[data-testid="content-description"]');
    this.pdfViewer = page.locator('[data-testid="pdf-viewer"], iframe[src*="pdf"]');
    this.videoPlayer = page.locator('[data-testid="video-player"], video');
    this.imageViewer = page.locator('[data-testid="image-viewer"], img');
    this.downloadButton = page.locator('[data-testid="download-button"], button:has-text("Download")');

    // Access Restricted
    this.lockedContent = page.locator('[data-testid="locked-content"]');
    this.upgradePrompt = page.locator('[data-testid="upgrade-prompt"]');
    this.upgradeLink = page.locator('[data-testid="upgrade-link"], a:has-text("Upgrade")');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/dashboard/content`);
  }

  async getContentCount(): Promise<number> {
    return this.contentItems.count();
  }

  async filterByContentType(type: 'all' | 'pdf' | 'video' | 'image') {
    await this.filterByType.selectOption(type);
  }

  async searchContent(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async openContent(index: number) {
    await this.contentItems.nth(index).click();
    await this.contentViewer.waitFor({ state: 'visible' });
  }

  async openContentByTitle(title: string) {
    const item = this.page.locator(`[data-testid="content-item"]:has-text("${title}")`);
    await item.click();
  }

  async isContentLocked(title: string): Promise<boolean> {
    const item = this.page.locator(`[data-testid="content-item"]:has-text("${title}")`);
    return (await item.locator('[data-testid="locked-icon"]').count()) > 0;
  }

  async downloadContent() {
    await this.downloadButton.click();
  }

  async getLockedContentCount(): Promise<number> {
    return this.lockedContent.count();
  }

  async clickUpgradeFromPrompt() {
    await this.upgradeLink.click();
  }
}
