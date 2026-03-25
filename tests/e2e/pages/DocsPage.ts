import { Page, Locator } from '@playwright/test';

export class DocsPage {
  readonly page: Page;
  readonly title: Locator;
  readonly swaggerUi: Locator;
  readonly openApiTab: Locator;
  readonly tryItTab: Locator;
  readonly endpointList: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1');
    this.swaggerUi = page.locator('.swagger-ui');
    this.openApiTab = page.locator('button:has-text("OpenAPI Spec")');
    this.tryItTab = page.locator('button:has-text("Try It Out")');
    this.endpointList = page.locator('[data-testid="endpoint-item"]');
    this.backLink = page.locator('a:has-text("Back")');
  }

  async goto() {
    await this.page.goto('/docs');
    await this.page.waitForLoadState('networkidle');
  }

  async isSwaggerUILoaded(): Promise<boolean> {
    await this.page.waitForSelector('.swagger-ui', { timeout: 10000 });
    return this.swaggerUi.isVisible();
  }

  async clickOpenApiTab() {
    await this.openApiTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickTryItTab() {
    await this.tryItTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getEndpointCount(): Promise<number> {
    return this.endpointList.count();
  }
}
