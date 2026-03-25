export class WorkflowError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

export class ValidationError extends WorkflowError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class TimeoutError extends WorkflowError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TIMEOUT_ERROR', context);
    this.name = 'TimeoutError';
  }
}

export class RetryExhaustedError extends WorkflowError {
  constructor(
    message: string,
    public attempts: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'RETRY_EXHAUSTED', context);
    this.name = 'RetryExhaustedError';
  }
}

export class CircuitBreakerError extends WorkflowError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CIRCUIT_BREAKER_OPEN', context);
    this.name = 'CircuitBreakerError';
  }
}

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: WorkflowError;
}

export function successResult<T>(data: T): Result<T> {
  return { success: true, data };
}

export function errorResult<T>(error: WorkflowError): Result<T> {
  return { success: false, error };
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => WorkflowError
): Promise<Result<T>> {
  try {
    const data = await fn();
    return successResult(data);
  } catch (error) {
    const workflowError = errorHandler
      ? errorHandler(error)
      : new WorkflowError(
          error instanceof Error ? error.message : String(error),
          'UNKNOWN_ERROR'
        );
    return errorResult<T>(workflowError);
  }
}

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown) => boolean;
}

export const defaultRetryOptions: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts: RetryOptions = { ...defaultRetryOptions, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === opts.maxAttempts) {
        throw new RetryExhaustedError(
          `Failed after ${attempt} attempts`,
          attempt,
          { lastError: String(error) }
        );
      }

      if (opts.shouldRetry && !opts.shouldRetry(error)) {
        throw error;
      }

      const delay = calculateBackoffDelay(attempt, opts);
      await sleep(delay);
    }
  }

  throw lastError;
}

function calculateBackoffDelay(attempt: number, options: RetryOptions): number {
  const exponentialDelay = options.baseDelayMs * Math.pow(options.backoffMultiplier!, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  const delay = exponentialDelay + jitter;

  return options.maxDelayMs ? Math.min(delay, options.maxDelayMs) : delay;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeoutMs: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.timeoutMs) {
        this.state = 'half-open';
      } else {
        throw new CircuitBreakerError('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  getState(): string {
    return this.state;
  }
}

export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private requests: number[] = [];

  constructor(private config: RateLimiterConfig) {}

  async acquire(): Promise<boolean> {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.config.windowMs);

    if (this.requests.length >= this.config.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  async waitForSlot(): Promise<void> {
    while (!(await this.acquire())) {
      await sleep(100);
    }
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new TimeoutError(
              errorMessage || `Operation timed out after ${timeoutMs}ms`
            )
          ),
        timeoutMs
      )
    ),
  ]);
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof WorkflowError) {
    return ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'SERVICE_UNAVAILABLE'].includes(
      error.code
    );
  }

  if (error instanceof Error) {
    return (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('network')
    );
  }

  return false;
}

export function formatError(error: unknown): {
  message: string;
  code?: string;
  stack?: string;
} {
  if (error instanceof WorkflowError) {
    return {
      message: error.message,
      code: error.code,
      stack: error.stack,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}
