import { Page, Locator } from '@playwright/test';

export class CronPage {
  readonly page: Page;
  readonly title: Locator;
  readonly statusIndicator: Locator;
  readonly triggerButton: Locator;
  readonly statsCards: Locator;
  readonly lastRunTime: Locator;
  readonly nextRunTime: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1');
    this.statusIndicator = page.locator('[data-testid="worker-status"]');
    this.triggerButton = page.locator('[data-testid="trigger-worker-button"]');
    this.statsCards = page.locator('[data-testid="stat-card"]');
    this.lastRunTime = page.locator('[data-testid="last-run-time"]');
    this.nextRunTime = page.locator('[data-testid="next-run-time"]');
    this.backLink = page.locator('a:has-text("Back")');
  }

  async goto() {
    await this.page.goto('/cron');
    await this.page.waitForLoadState('networkidle');
  }

  async isWorkerRunning(): Promise<boolean> {
    const status = await this.statusIndicator.textContent();
    return status?.toLowerCase().includes('running') || false;
  }

  async triggerWorker() {
    await this.triggerButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getStatValue(statName: string): Promise<string> {
    const stat = this.page.locator(`[data-testid="stat-${statName}"]`);
    return stat.textContent() || '';
  }
}
