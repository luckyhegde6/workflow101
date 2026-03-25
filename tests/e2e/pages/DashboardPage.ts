import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly workflowCards: Locator;
  readonly workflowSelect: Locator;
  readonly enqueueButton: Locator;
  readonly backLink: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1');
    this.subtitle = page.locator('p');
    this.workflowCards = page.locator('[data-testid="workflow-card"]');
    this.workflowSelect = page.locator('[data-testid="workflow-select"]');
    this.enqueueButton = page.locator('[data-testid="enqueue-button"]');
    this.backLink = page.locator('a:has-text("Back")');
    this.refreshButton = page.locator('[data-testid="refresh-button"]');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async getWorkflowCount(): Promise<number> {
    return this.workflowCards.count();
  }

  async selectWorkflow(workflowName: string) {
    await this.workflowSelect.selectOption(workflowName);
    await this.page.waitForLoadState('networkidle');
  }

  async clickEnqueue() {
    await this.enqueueButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickWorkflowByName(name: string) {
    const card = this.page.locator(`[data-testid="workflow-card"]:has-text("${name}")`);
    await card.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getStatusFilter() {
    return this.page.locator('[data-testid="status-filter"]');
  }

  async filterByStatus(status: string) {
    await this.getStatusFilter().selectOption(status);
    await this.page.waitForLoadState('networkidle');
  }
}
