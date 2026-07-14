import { Page, Locator } from '@playwright/test';

export class CronPage {
  readonly page: Page;
  readonly title: Locator;
  readonly statusIndicator: Locator;
  readonly triggerButton: Locator;
  readonly statsCards: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1');
    this.statusIndicator = page.locator('[data-testid="worker-status"]');
    this.triggerButton = page.locator('[data-testid="trigger-worker-button"]');
    this.statsCards = page.locator('[data-testid="stat-card"]');
    this.backLink = page.locator('a:has-text("Back to Dashboard")');
  }

  async goto() {
    await this.page.goto('/cron');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async isWorkerRunning(): Promise<boolean> {
    const status = await this.statusIndicator.textContent();
    return status?.toLowerCase().includes('active') || false;
  }

  async triggerWorker() {
    await this.triggerButton.click();
  }

  async getStatValue(statName: string): Promise<string> {
    const stat = this.page.locator(`text=${statName}`).locator('..');
    return (await stat.textContent()) || '';
  }
}
