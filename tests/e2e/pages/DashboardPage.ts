import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly workflowCards: Locator;
  readonly workflowSelect: Locator;
  readonly enqueueButton: Locator;
  readonly workflowList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1');
    this.subtitle = page.locator('p');
    this.workflowCards = page.locator('[data-testid^="workflow-card-"]');
    this.workflowSelect = page.locator('[data-testid="workflow-select"]');
    this.enqueueButton = page.locator('[data-testid="enqueue-button"]');
    this.workflowList = page.locator('[data-testid="workflow-list"]');
  }

  async goto() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  async getWorkflowCount(): Promise<number> {
    return this.workflowCards.count();
  }

  async selectWorkflow(workflowName: string) {
    await this.workflowSelect.selectOption(workflowName);
  }

  async clickEnqueue() {
    await this.enqueueButton.click();
  }

  async clickWorkflowByName(name: string) {
    const card = this.page.locator(`[data-testid^="workflow-card-"]:has-text("${name}")`);
    await card.click();
  }

  async getStatusFilter() {
    return this.page.locator('text=Filter by Status');
  }
}
