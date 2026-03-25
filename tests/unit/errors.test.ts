import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  WorkflowError,
  ValidationError,
  TimeoutError,
  RetryExhaustedError,
  CircuitBreakerError,
  withErrorHandling,
  successResult,
  errorResult,
  withRetry,
  sleep,
  CircuitBreaker,
  RateLimiter,
  withTimeout,
  isRetryableError,
  formatError,
  type Result,
} from '../../app/lib/errors';

describe('Error Handling Utilities', () => {
  describe('Custom Error Classes', () => {
    it('should create WorkflowError with code and context', () => {
      const error = new WorkflowError('Test error', 'TEST_CODE', { key: 'value' });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(WorkflowError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.context).toEqual({ key: 'value' });
    });

    it('should create ValidationError with proper code', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });

      expect(error).toBeInstanceOf(WorkflowError);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.context).toEqual({ field: 'email' });
    });

    it('should create TimeoutError', () => {
      const error = new TimeoutError('Request timed out', { timeout: 5000 });

      expect(error).toBeInstanceOf(WorkflowError);
      expect(error.code).toBe('TIMEOUT_ERROR');
    });

    it('should create RetryExhaustedError with attempt count', () => {
      const error = new RetryExhaustedError('Max retries reached', 5, {
        lastError: 'Connection refused',
      });

      expect(error).toBeInstanceOf(WorkflowError);
      expect(error.code).toBe('RETRY_EXHAUSTED');
      expect(error.attempts).toBe(5);
    });

    it('should create CircuitBreakerError', () => {
      const error = new CircuitBreakerError('Circuit breaker open');

      expect(error).toBeInstanceOf(WorkflowError);
      expect(error.code).toBe('CIRCUIT_BREAKER_OPEN');
    });
  });

  describe('Result Type', () => {
    it('should create success result', () => {
      const result = successResult({ data: 'test' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: 'test' });
      expect(result.error).toBeUndefined();
    });

    it('should create error result', () => {
      const error = new WorkflowError('Test error', 'TEST');
      const result = errorResult<unknown>(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.data).toBeUndefined();
    });
  });

  describe('withErrorHandling', () => {
    it('should return success result on successful execution', async () => {
      const result = await withErrorHandling(async () => 'success');

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
    });

    it('should return error result on failure', async () => {
      const result = await withErrorHandling(async () => {
        throw new Error('Test error');
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Test error');
    });

    it('should use custom error handler', async () => {
      const result = await withErrorHandling(
        async () => {
          throw new Error('Custom error');
        },
        (error) => new ValidationError('Handled: ' + (error instanceof Error ? error.message : String(error)))
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error?.message).toBe('Handled: Custom error');
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const result = await withRetry(fn, {
        maxAttempts: 3,
        baseDelayMs: 10,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw RetryExhaustedError after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect(
        withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 })
      ).rejects.toThrow(RetryExhaustedError);

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should respect shouldRetry predicate', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Non-retryable'));

      await expect(
        withRetry(fn, {
          maxAttempts: 3,
          baseDelayMs: 10,
          shouldRetry: () => false,
        })
      ).rejects.toThrow('Non-retryable');

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('CircuitBreaker', () => {
    it('should allow requests when closed', async () => {
      const breaker = new CircuitBreaker(3, 60000);
      const fn = vi.fn().mockResolvedValue('success');

      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(breaker.getState()).toBe('closed');
    });

    it('should open after threshold failures', async () => {
      const breaker = new CircuitBreaker(2, 60000);
      const fn = vi.fn().mockRejectedValue(new Error('Fail'));

      await expect(breaker.execute(fn)).rejects.toThrow('Fail');
      await expect(breaker.execute(fn)).rejects.toThrow('Fail');

      await expect(breaker.execute(fn)).rejects.toThrow(CircuitBreakerError);
      expect(breaker.getState()).toBe('open');
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within limit', async () => {
      const limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });

      expect(await limiter.acquire()).toBe(true);
      expect(await limiter.acquire()).toBe(true);
      expect(await limiter.acquire()).toBe(true);
    });

    it('should deny requests over limit', async () => {
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 });

      await limiter.acquire();
      await limiter.acquire();
      expect(await limiter.acquire()).toBe(false);
    });
  });

  describe('withTimeout', () => {
    it('should resolve if operation completes in time', async () => {
      const promise = new Promise<string>((resolve) => setTimeout(() => resolve('done'), 10));

      const result = await withTimeout(promise, 100);

      expect(result).toBe('done');
    });

    it('should reject if operation times out', async () => {
      const promise = new Promise<string>((resolve) => setTimeout(() => resolve('done'), 200));

      await expect(withTimeout(promise, 50)).rejects.toThrow(TimeoutError);
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable WorkflowErrors', () => {
      expect(isRetryableError(new TimeoutError('Timeout'))).toBe(true);
      expect(
        isRetryableError(new WorkflowError('Network', 'NETWORK_ERROR'))
      ).toBe(true);
    });

    it('should identify network errors', () => {
      expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
    });

    it('should not identify non-retryable errors', () => {
      expect(isRetryableError(new ValidationError('Invalid'))).toBe(false);
      expect(isRetryableError(new Error('Invalid input'))).toBe(false);
    });
  });

  describe('formatError', () => {
    it('should format WorkflowError', () => {
      const error = new WorkflowError('Test error', 'TEST_CODE');
      const formatted = formatError(error);

      expect(formatted.message).toBe('Test error');
      expect(formatted.code).toBe('TEST_CODE');
    });

    it('should format standard Error', () => {
      const error = new Error('Standard error');
      const formatted = formatError(error);

      expect(formatted.message).toBe('Standard error');
      expect(formatted.stack).toBeDefined();
    });

    it('should format unknown error', () => {
      const formatted = formatError('Unknown error string');

      expect(formatted.message).toBe('Unknown error string');
    });
  });
});
