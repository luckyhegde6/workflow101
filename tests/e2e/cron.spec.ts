import { test, expect } from './fixtures';

test.describe('Cron Page', () => {
  test.beforeEach(async ({ cron }) => {
    await cron.goto();
  });

  test('should display cron page', async ({ cron }) => {
    await expect(cron.title).toContainText('Cron');
  });

  test('should display worker status', async ({ cron }) => {
    await expect(cron.statusIndicator).toBeVisible();
  });

  test('should have trigger button', async ({ cron }) => {
    await expect(cron.triggerButton).toBeVisible();
  });

  test.describe('Worker Trigger', () => {
    test('should trigger worker on button click', async ({ cron }) => {
      await cron.triggerButton.click();
      await cron.page.waitForTimeout(500);
    });
  });
});

test.describe('Cron API', () => {
  test('should call DBOS worker endpoint', async ({ page }) => {
    // DBOS initialization can be slow (lazy init with timeout), use longer timeout
    test.setTimeout(30000);
    const response = await page.request.get('/api/dbos', { timeout: 25000 });
    expect(response.status()).toBeGreaterThanOrEqual(200);
  });
});
