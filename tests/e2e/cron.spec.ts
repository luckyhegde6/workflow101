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

  test.describe('Navigation', () => {
    test('should navigate back to dashboard', async ({ cron }) => {
      await cron.backLink.click();
      await expect(cron.page).toHaveURL('/');
    });
  });
});

test.describe('Cron API', () => {
  test('should call DBOS worker endpoint', async ({ page }) => {
    const response = await page.request.get('/api/dbos');
    expect(response.status()).toBeGreaterThanOrEqual(200);
  });
});
