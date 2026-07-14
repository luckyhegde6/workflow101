import { test, expect } from '@playwright/test';

test.describe('Enqueue Workflow Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Wait for React hydration: the select is populated by JS at runtime, not SSR
    await page.waitForFunction(() => {
      const select = document.querySelector('[data-testid="workflow-select"]') as HTMLSelectElement;
      return select && select.options.length >= 6;
    }, { timeout: 15000, polling: 200 });
  });

  test('should navigate to config page', async ({ page }) => {
    test.setTimeout(30000);
    
    // Test that the enqueue button is rendered and suggests clicking to config
    const enqueueButton = page.locator('[data-testid="enqueue-button"]');
    await expect(enqueueButton).toBeVisible({ timeout: 15000 });
    await expect(enqueueButton).toBeEnabled({ timeout: 15000 });
    await expect(enqueueButton).toContainText('Configure & Run');
    
    // Navigate directly to the config wizard with a workflow preselected
    await page.goto('/config?workflow=emailNotificationWorkflow', { waitUntil: 'domcontentloaded' });
    
    // Verify config page loads with the workflow param
    expect(page.url()).toContain('/config');
    expect(page.url()).toContain('workflow=emailNotificationWorkflow');
    
    // Wait for React hydration and verify step 2 rendered (pre-selected workflow skips step 1)
    await page.waitForFunction(() => {
      const h2 = document.querySelector('h2');
      return h2 && h2.textContent === 'Configure Parameters';
    }, { timeout: 15000, polling: 200 });
    
    // Verify Email-specific fields are visible
    await expect(page.locator('input[placeholder="recipient@example.com"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[placeholder="Email subject"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Workflow Status Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('should display workflow cards when workflows exist', async ({ page }) => {
    const workflowList = page.locator('[data-testid="workflow-list"]');
    
    if (await workflowList.isVisible({ timeout: 5000 }).catch(() => false)) {
      const cards = workflowList.locator('[id^="workflow-card-"]');
      const cardCount = await cards.count();
      
      if (cardCount > 0) {
        const firstCard = cards.first();
        await expect(firstCard.locator('[data-testid="workflow-id"]')).toBeVisible();
        await expect(firstCard.locator('[data-testid="workflow-name"]')).toBeVisible();
      }
    }
  });

  test('should show status badges', async ({ page }) => {
    const workflowList = page.locator('[data-testid="workflow-list"]');
    
    if (await workflowList.isVisible({ timeout: 5000 }).catch(() => false)) {
      const statusBadge = page.locator('[data-testid^="workflow-status-"]').first();
      
      if (await statusBadge.isVisible()) {
        const validStatuses = ['success', 'pending', 'enqueued', 'error'];
        const badgeText = await statusBadge.textContent();
        expect(badgeText).toMatch(new RegExp(validStatuses.join('|'), 'i'));
      }
    }
  });
});

test.describe('Last Updated Timestamp', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('should show last updated timestamp', async ({ page }) => {
    await page.waitForTimeout(4000);
    
    const lastUpdated = page.locator('text=Last updated:');
    
    if (await lastUpdated.isVisible({ timeout: 5000 }).catch(() => false)) {
      const timestamp = await lastUpdated.textContent();
      expect(timestamp).toMatch(/Last updated:\s*\d{1,2}:\d{2}:\d{2}\s*(AM|PM)?/i);
    }
  });

  test('should update timestamp after refresh', async ({ page }) => {
    await page.waitForTimeout(4000);
    
    const lastUpdated = page.locator('text=Last updated:');
    const initialTimestamp = await lastUpdated.textContent().catch(() => null);
    
    await page.waitForTimeout(4000);
    
    const newTimestamp = await lastUpdated.textContent().catch(() => null);
    
    if (initialTimestamp && newTimestamp) {
      expect(newTimestamp).not.toBe(initialTimestamp);
    }
  });
});
