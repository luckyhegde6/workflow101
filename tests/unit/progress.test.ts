import { describe, it, expect } from 'vitest';
import {
  createProgressTracker,
  createBatchTracker,
  updateBatchProgress,
  getBatchSummary,
} from '../../app/lib/progress';

describe('Progress Utilities', () => {
  describe('createProgressTracker', () => {
    it('should create a progress tracker function', () => {
      const tracker = createProgressTracker('workflow-1', 5);
      const progress = tracker(1, 'Step 1 completed');

      expect(progress.workflowId).toBe('workflow-1');
      expect(progress.step).toBe(1);
      expect(progress.totalSteps).toBe(5);
      expect(progress.percent).toBe(20);
      expect(progress.message).toBe('Step 1 completed');
    });

    it('should calculate correct percentages', () => {
      const tracker = createProgressTracker('workflow-1', 4);

      expect(tracker(1, '').percent).toBe(25);
      expect(tracker(2, '').percent).toBe(50);
      expect(tracker(3, '').percent).toBe(75);
      expect(tracker(4, '').percent).toBe(100);
    });
  });

  describe('createBatchTracker', () => {
    it('should create batch tracker with initial state', () => {
      const tracker = createBatchTracker(10);

      expect(tracker.total).toBe(10);
      expect(tracker.processed).toBe(0);
      expect(tracker.failed).toBe(0);
      expect(tracker.skipped).toBe(0);
      expect(tracker.results).toHaveLength(0);
    });
  });

  describe('updateBatchProgress', () => {
    it('should increment processed count on success', () => {
      const tracker = createBatchTracker(5);
      const updated = updateBatchProgress(tracker, 'item-1', 'success');

      expect(updated.processed).toBe(1);
      expect(updated.failed).toBe(0);
      expect(updated.currentItem).toBe('item-1');
      expect(updated.results).toHaveLength(1);
    });

    it('should increment failed count on failure', () => {
      const tracker = createBatchTracker(5);
      const updated = updateBatchProgress(tracker, 'item-1', 'failed', 'Network error');

      expect(updated.processed).toBe(0);
      expect(updated.failed).toBe(1);
      expect(updated.results[0].error).toBe('Network error');
    });

    it('should increment skipped count on skip', () => {
      const tracker = createBatchTracker(5);
      const updated = updateBatchProgress(tracker, 'item-1', 'skipped');

      expect(updated.processed).toBe(0);
      expect(updated.failed).toBe(0);
      expect(updated.skipped).toBe(1);
    });

    it('should accumulate results', () => {
      let tracker = createBatchTracker(3);
      tracker = updateBatchProgress(tracker, 'item-1', 'success');
      tracker = updateBatchProgress(tracker, 'item-2', 'failed', 'Error');
      tracker = updateBatchProgress(tracker, 'item-3', 'skipped');

      expect(tracker.processed).toBe(1);
      expect(tracker.failed).toBe(1);
      expect(tracker.skipped).toBe(1);
      expect(tracker.results).toHaveLength(3);
    });
  });

  describe('getBatchSummary', () => {
    it('should return processed count', () => {
      const tracker = createBatchTracker(10);
      const summary = getBatchSummary(tracker);

      expect(summary).toBe('Processed 0/10 items');
    });

    it('should include failed count', () => {
      const tracker = { ...createBatchTracker(10), processed: 5, failed: 2 };
      const summary = getBatchSummary(tracker);

      expect(summary).toContain('5/10');
      expect(summary).toContain('2 failed');
    });

    it('should include skipped count', () => {
      const tracker = { ...createBatchTracker(10), processed: 5, skipped: 1 };
      const summary = getBatchSummary(tracker);

      expect(summary).toContain('5/10');
      expect(summary).toContain('1 skipped');
    });
  });
});
