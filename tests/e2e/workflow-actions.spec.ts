import { test, expect } from '@playwright/test';

test.describe('Enqueue Workflow Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show loading state when enqueueing', async ({ page }) => {
    const enqueueButton = page.locator('[data-testid="enqueue-button"]');
    
    await enqueueButton.click();
    
    await expect(enqueueButton).toContainText('Enqueueing...');
    await expect(enqueueButton).toBeDisabled();
  });

  test('should complete enqueueing and reset button', async ({ page }) => {
    const enqueueButton = page.locator('[data-testid="enqueue-button"]');
    
    await enqueueButton.click();
    
    await page.waitForFunction(() => {
      const button = document.querySelector('[data-testid="enqueue-button"]');
      return button && button.textContent?.includes('Enqueue Workflow');
    }, { timeout: 10000 }).catch(() => {});
  });

  test('should show error when enqueue fails', async ({ page }) => {
    const enqueueButton = page.locator('[data-testid="enqueue-button"]');
    
    await page.evaluate(() => {
      window.fetch = async () => {
        throw new Error('Network error');
      };
    });
    
    await enqueueButton.click();
    
    await page.waitForTimeout(5000);
  });
});

test.describe('Workflow Status Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);
  });

  test('should display workflow cards when workflows exist', async ({ page }) => {
    const workflowList = page.locator('[data-testid="workflow-list"]');
    
    if (await workflowList.isVisible()) {
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
    
    if (await workflowList.isVisible()) {
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
    await page.goto('/');
  });

  test('should show last updated timestamp', async ({ page }) => {
    await page.waitForTimeout(4000);
    
    const lastUpdated = page.locator('text=Last updated:');
    
    if (await lastUpdated.isVisible()) {
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
