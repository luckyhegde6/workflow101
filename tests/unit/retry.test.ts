import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withRetry,
  defaultRetryConfig,
  retryConfigPresets,
  isTransientError,
} from '../../app/lib/retry';

describe('Retry Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('withRetry', () => {
    it('should return result on first success', async () => {
      vi.useRealTimers();
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn, {}, 'test');

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
    });

    it('should return failure after max attempts', async () => {
      vi.useRealTimers();
      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

      const result = await withRetry(fn, { maxAttempts: 2, initialDelayMs: 10 }, 'test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.attempts).toBe(2);
    }, 10000);
  });

  describe('defaultRetryConfig', () => {
    it('should have sensible defaults', () => {
      expect(defaultRetryConfig.maxAttempts).toBe(3);
      expect(defaultRetryConfig.initialDelayMs).toBe(1000);
      expect(defaultRetryConfig.maxDelayMs).toBe(30000);
      expect(defaultRetryConfig.backoffMultiplier).toBe(2);
    });
  });

  describe('retryConfigPresets', () => {
    it('should have network preset', () => {
      expect(retryConfigPresets.network.maxAttempts).toBe(5);
      expect(retryConfigPresets.network.initialDelayMs).toBe(500);
    });

    it('should have database preset', () => {
      expect(retryConfigPresets.database.maxAttempts).toBe(3);
      expect(retryConfigPresets.database.initialDelayMs).toBe(1000);
    });

    it('should have externalAPI preset', () => {
      expect(retryConfigPresets.externalAPI.maxAttempts).toBe(4);
      expect(retryConfigPresets.externalAPI.initialDelayMs).toBe(2000);
    });

    it('should have critical preset', () => {
      expect(retryConfigPresets.critical.maxAttempts).toBe(5);
      expect(retryConfigPresets.critical.initialDelayMs).toBe(5000);
    });
  });

  describe('isTransientError', () => {
    it('should detect connection errors', () => {
      expect(isTransientError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isTransientError(new Error('Connection refused'))).toBe(true);
    });

    it('should detect timeout errors', () => {
      expect(isTransientError(new Error('ETIMEDOUT'))).toBe(true);
      expect(isTransientError(new Error('Request timeout'))).toBe(true);
    });

    it('should detect network errors', () => {
      expect(isTransientError(new Error('Network error'))).toBe(true);
      expect(isTransientError(new Error('network unavailable'))).toBe(true);
    });

    it('should return false for non-transient errors', () => {
      expect(isTransientError(new Error('Invalid input'))).toBe(false);
      expect(isTransientError(new Error('Unauthorized'))).toBe(false);
    });
  });
});
