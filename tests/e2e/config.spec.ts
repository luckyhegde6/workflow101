import { test, expect } from './fixtures';

test.describe('Config Page', () => {
  test.beforeEach(async ({ config }) => {
    await config.goto();
  });

  test('should display config page', async ({ config }) => {
    await expect(config.title).toContainText('Workflow');
  });

  test('should have workflow selection grid', async ({ config }) => {
    await expect(config.workflowSelect).toBeVisible();
  });

  test('should have submit button', async ({ config }) => {
    await expect(config.submitButton).toBeVisible();
  });

  test('should display workflow description', async ({ config }) => {
    await expect(config.workflowDescription).toBeVisible();
  });

  test.describe('Workflow Options', () => {
    test('should allow selecting different workflow types', async ({ config }) => {
      const workflows = [
        'exampleWorkflow',
        'emailNotificationWorkflow',
        'dataProcessingWorkflow',
      ];

      for (const workflow of workflows) {
        await config.selectWorkflow(workflow);
        await config.page.waitForTimeout(100);
      }
    });
  });

  test.describe('Navigation', () => {
    test('should have back button', async ({ config }) => {
      await expect(config.backButton).toBeVisible();
    });
  });
});
