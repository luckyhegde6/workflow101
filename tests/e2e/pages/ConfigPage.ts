import { Page, Locator } from '@playwright/test';

export class ConfigPage {
  readonly page: Page;
  readonly title: Locator;
  readonly workflowSelect: Locator;
  readonly workflowDescription: Locator;
  readonly submitButton: Locator;
  readonly formInputs: Locator;
  readonly backLink: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1');
    this.workflowSelect = page.locator('[data-testid="config-workflow-select"]');
    this.workflowDescription = page.locator('[data-testid="workflow-description"]');
    this.submitButton = page.locator('[data-testid="submit-button"]');
    this.formInputs = page.locator('[data-testid="form-input"]');
    this.backLink = page.locator('a:has-text("Back")');
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async goto() {
    await this.page.goto('/config');
    await this.page.waitForLoadState('networkidle');
  }

  async selectWorkflow(workflowName: string) {
    await this.workflowSelect.selectOption(workflowName);
    await this.page.waitForLoadState('networkidle');
  }

  async fillInput(name: string, value: string) {
    const input = this.page.locator(`[data-testid="form-input-${name}"]`);
    await input.fill(value);
  }

  async submit() {
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getWorkflowDescription(): Promise<string> {
    return this.workflowDescription.textContent() || '';
  }
}
