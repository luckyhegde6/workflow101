import { Page, Locator } from '@playwright/test';

export class ConfigPage {
  readonly page: Page;
  readonly title: Locator;
  readonly workflowSelect: Locator;
  readonly workflowDescription: Locator;
  readonly submitButton: Locator;
  readonly formInputs: Locator;
  readonly backButton: Locator;
  readonly previewButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h2');
    this.workflowSelect = page.locator('[data-testid="config-workflow-select"]');
    this.workflowDescription = page.locator('[data-testid="config-description"]');
    this.submitButton = page.locator('[data-testid="submit-button"]');
    this.formInputs = page.locator('input, textarea, select');
    this.backButton = page.locator('button:has-text("Back")');
    this.previewButton = page.locator('button:has-text("Preview")');
  }

  async goto() {
    await this.page.goto('/config');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async selectWorkflow(workflowName: string) {
    // Config page uses buttons, not select - click the matching option
    await this.page.locator(`[data-testid="wf-option-${workflowName}"]`).click();
  }

  async fillInput(name: string, value: string) {
    const input = this.page.locator(`input[placeholder*="${name}"], textarea[placeholder*="${name}"]`).first();
    await input.fill(value);
  }

  async submit() {
    await this.submitButton.click();
  }

  async getWorkflowDescription(): Promise<string> {
    return (await this.workflowDescription.textContent()) || '';
  }
}
