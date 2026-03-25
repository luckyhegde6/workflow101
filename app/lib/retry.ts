export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: (error: Error) => boolean;
}

export const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDurationMs: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context?: string
): Promise<RetryResult<T>> {
  const fullConfig: RetryConfig = { ...defaultRetryConfig, ...config };
  const startTime = Date.now();
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
    try {
      const result = await fn();
      return {
        success: true,
        result,
        attempts: attempt,
        totalDurationMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (fullConfig.retryableErrors && !fullConfig.retryableErrors(lastError)) {
        throw lastError;
      }
      
      if (attempt < fullConfig.maxAttempts) {
        const delay = Math.min(
          fullConfig.initialDelayMs * Math.pow(fullConfig.backoffMultiplier, attempt - 1),
          fullConfig.maxDelayMs
        );
        
        console.log(
          `${context || 'Operation'} failed (attempt ${attempt}/${fullConfig.maxAttempts}): ${lastError.message}. Retrying in ${delay}ms...`
        );
        
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  return {
    success: false,
    error: lastError,
    attempts: fullConfig.maxAttempts,
    totalDurationMs: Date.now() - startTime,
  };
}

export const transientErrorPatterns = [
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'network',
  'timeout',
  'temporarily unavailable',
  'connection',
];

export function isTransientError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return transientErrorPatterns.some((pattern) =>
    message.includes(pattern.toLowerCase())
  );
}

export const retryConfigPresets = {
  network: {
    maxAttempts: 5,
    initialDelayMs: 500,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableErrors: isTransientError,
  } as RetryConfig,
  
  database: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableErrors: isTransientError,
  } as RetryConfig,
  
  externalAPI: {
    maxAttempts: 4,
    initialDelayMs: 2000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
    retryableErrors: isTransientError,
  } as RetryConfig,
  
  critical: {
    maxAttempts: 5,
    initialDelayMs: 5000,
    maxDelayMs: 120000,
    backoffMultiplier: 3,
    retryableErrors: isTransientError,
  } as RetryConfig,
};
