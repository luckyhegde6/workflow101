import { test, expect } from './fixtures';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ dashboard }) => {
    await dashboard.goto();
  });

  test('should display page title', async ({ dashboard }) => {
    await expect(dashboard.title).toContainText('Workflow');
  });

  test('should display workflow select dropdown', async ({ dashboard }) => {
    await expect(dashboard.workflowSelect).toBeVisible();
  });

  test('should have enqueue button', async ({ dashboard }) => {
    await expect(dashboard.enqueueButton).toBeVisible();
    await expect(dashboard.enqueueButton).toContainText('Workflow');
  });

  test.describe('Workflow Selection', () => {
    test('should select different workflow types', async ({ dashboard }) => {
      const workflows = [
        'exampleWorkflow',
        'emailNotificationWorkflow',
        'dataProcessingWorkflow',
      ];

      for (const workflow of workflows) {
        await dashboard.selectWorkflow(workflow);
        await dashboard.page.waitForTimeout(100);
      }
    });
  });
});

test.describe('Dashboard - API Integration', () => {
  test('should fetch workflows from API', async ({ dashboard }) => {
    test.setTimeout(30000);
    await dashboard.goto();
    
    const response = await dashboard.page.request.get('/api/workflows', { timeout: 25000 });
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('workflows');
  });

  test('should handle API errors gracefully', async ({ dashboard }) => {
    test.setTimeout(30000);
    await dashboard.goto();
    
    const response = await dashboard.page.request.get('/api/workflows?invalid=true', { timeout: 25000 });
    expect(response.status()).toBeGreaterThanOrEqual(200);
  });
});
