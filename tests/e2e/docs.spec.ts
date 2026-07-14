import { test, expect } from './fixtures';

test.describe('Docs Page', () => {
  test.beforeEach(async ({ docs }) => {
    await docs.goto();
  });

  test('should display docs page', async ({ docs }) => {
    await expect(docs.title).toContainText('API Documentation');
  });

  test('should display Swagger UI', async ({ docs }) => {
    await test.step('Swagger UI should be visible', async () => {
      await expect(docs.swaggerUi).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to dashboard', async ({ docs }) => {
      await docs.backLink.click();
      await expect(docs.page).toHaveURL('/');
    });
  });
});

test.describe('OpenAPI Spec', () => {
  test('should return valid OpenAPI spec', async ({ page }) => {
    const response = await page.request.get('/api/docs');
    expect(response.status()).toBe(200);
    
    const spec = await response.json();
    expect(spec).toHaveProperty('openapi');
    expect(spec).toHaveProperty('info');
    expect(spec).toHaveProperty('paths');
    expect(spec.info.title).toContain('Workflow');
  });

  test('should include workflow endpoints', async ({ page }) => {
    const response = await page.request.get('/api/docs');
    const spec = await response.json();
    
    expect(spec.paths).toHaveProperty('/dbos');
    expect(spec.paths).toHaveProperty('/workflows');
  });
});
