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
    this.openApiTab = page.locator('.opblock-tag-section');
    this.tryItTab = page.locator('.btn.try-out__btn');
    this.endpointList = page.locator('.opblock');
    this.backLink = page.locator('a:has-text("Back to Dashboard")');
  }

  async goto() {
    await this.page.goto('/docs');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async isSwaggerUILoaded(): Promise<boolean> {
    await this.page.waitForSelector('.swagger-ui', { timeout: 15000 });
    return this.swaggerUi.isVisible();
  }

  async clickOpenApiTab() {
    // In Swagger UI, sections are expanded by default
    // No explicit tab clicking needed
  }

  async clickTryItTab() {
    // Click the "Try it out" button on the first endpoint
    await this.tryItTab.first().click();
  }

  async getEndpointCount(): Promise<number> {
    return this.endpointList.count();
  }
}
