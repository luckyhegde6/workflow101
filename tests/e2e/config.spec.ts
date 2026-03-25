import { test, expect } from './fixtures';

test.describe('Config Page', () => {
  test.beforeEach(async ({ config }) => {
    await config.goto();
  });

  test('should display config page', async ({ config }) => {
    await expect(config.title).toContainText('Workflow');
  });

  test('should have workflow select', async ({ config }) => {
    await expect(config.workflowSelect).toBeVisible();
  });

  test('should have submit button', async ({ config }) => {
    await expect(config.submitButton).toBeVisible();
  });

  test('should display workflow description when selected', async ({ config }) => {
    await expect(config.workflowDescription).toBeVisible();
  });

  test.describe('Workflow Options', () => {
    test('should show all workflow types', async ({ config }) => {
      const workflows = [
        'exampleWorkflow',
        'emailNotificationWorkflow',
        'dataProcessingWorkflow',
        'onboardingWorkflow',
        'scheduledReportWorkflow',
        'webhookHandlerWorkflow',
      ];

      for (const workflow of workflows) {
        await config.selectWorkflow(workflow);
        await config.page.waitForTimeout(100);
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to dashboard', async ({ config }) => {
      await config.backLink.click();
      await expect(config.page).toHaveURL('/');
    });
  });
});
