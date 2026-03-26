/**
 * Sentry Metrics Utilities for Workflow Monitoring
 * 
 * Provides metrics for:
 * - Workflow status tracking (SUCCESS, ERROR, PENDING, ENQUEUED)
 * - Workflow runtime tracking (duration)
 * - Workflow type distribution
 * - Workflow volume metrics
 * 
 * @see https://docs.sentry.io/product/metrics/
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Workflow status type
 */
export type WorkflowStatus = 'SUCCESS' | 'ERROR' | 'PENDING' | 'ENQUEUED';

/**
 * Track workflow status
 */
export function trackWorkflowStatus(
  workflowName: string,
  status: WorkflowStatus,
  metadata?: Record<string, string | number>
): void {
  // Increment counter for this status
  Sentry.metrics.incr('workflow_status_count', 1, {
    tags: {
      workflow_name: workflowName,
      status: status.toLowerCase(),
      ...(metadata?.workflow_type && { workflow_type: String(metadata.workflow_type) }),
    },
  });
}

/**
 * Track workflow runtime (duration)
 */
export function trackWorkflowRuntime(
  workflowName: string,
  durationMs: number,
  status: WorkflowStatus,
  metadata?: Record<string, string | number>
): void {
  // Add timing distribution
  Sentry.metrics.distribution('workflow_runtime_ms', durationMs, {
    tags: {
      workflow_name: workflowName,
      status: status.toLowerCase(),
      ...(metadata?.workflow_type && { workflow_type: String(metadata.workflow_type) }),
    },
  });

  // Also add a gauge for current queue depth by status
  if (status === 'PENDING' || status === 'ENQUEUED') {
    Sentry.metrics.gauge('workflow_queue_depth', 1, {
      tags: {
        workflow_name: workflowName,
        status: status.toLowerCase(),
      },
    });
  }
}

/**
 * Track workflow type distribution
 */
export function trackWorkflowType(
  workflowName: string,
  metadata?: Record<string, string | number>
): void {
  Sentry.metrics.incr('workflow_type_count', 1, {
    tags: {
      workflow_name: workflowName,
      ...(metadata?.schedule_type && { schedule_type: String(metadata.schedule_type) }),
    },
  });
}

/**
 * Track workflow enqueue
 */
export function trackWorkflowEnqueue(
  workflowName: string,
  queueName: string,
  metadata?: Record<string, string | number>
): void {
  Sentry.metrics.incr('workflow_enqueued', 1, {
    tags: {
      workflow_name: workflowName,
      queue_name: queueName,
    },
  });
}

/**
 * Track workflow completion
 */
export function trackWorkflowComplete(
  workflowName: string,
  success: boolean,
  durationMs?: number,
  error?: string,
  metadata?: Record<string, string | number>
): void {
  // Track as gauge for completion rate
  Sentry.metrics.gauge('workflow_completion', success ? 1 : 0, {
    tags: {
      workflow_name: workflowName,
      status: success ? 'success' : 'error',
      ...(error && { error_type: error.substring(0, 50) }),
    },
  });

  // If we have duration, track it
  if (durationMs !== undefined) {
    Sentry.metrics.distribution('workflow_completion_time_ms', durationMs, {
      tags: {
        workflow_name: workflowName,
        success: String(success),
      },
    });
  }
}

/**
 * Track API response time
 */
export function trackApiResponseTime(
  endpoint: string,
  method: string,
  statusCode: number,
  durationMs: number
): void {
  Sentry.metrics.distribution('api_response_time_ms', durationMs, {
    tags: {
      endpoint,
      method,
      status_class: `${Math.floor(statusCode / 100)}xx`,
    },
  });
}

/**
 * Track database operations
 */
export function trackDatabaseOperation(
  operation: string,
  success: boolean,
  durationMs?: number,
  metadata?: Record<string, string | number>
): void {
  Sentry.metrics.incr('database_operation_count', 1, {
    tags: {
      operation,
      success: String(success),
    },
  });

  if (durationMs !== undefined) {
    Sentry.metrics.distribution('database_operation_time_ms', durationMs, {
      tags: {
        operation,
        success: String(success),
      },
    });
  }
}

/**
 * Track queue depth
 */
export function trackQueueDepth(
  queueName: string,
  depth: number,
  metadata?: Record<string, string | number>
): void {
  Sentry.metrics.gauge('queue_depth', depth, {
    tags: {
      queue_name: queueName,
      ...metadata,
    },
  });
}

/**
 * Track retry attempts
 */
export function trackRetryAttempt(
  workflowName: string,
  attemptNumber: number,
  success: boolean
): void {
  Sentry.metrics.incr('workflow_retry_attempt', 1, {
    tags: {
      workflow_name: workflowName,
      attempt: String(attemptNumber),
      success: String(success),
    },
  });
}

/**
 * Wrapper to track any function execution with metrics
 */
export async function withMetrics<T>(
  metricName: string,
  operation: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    Sentry.metrics.distribution(`${metricName}_duration_ms`, duration, {
      tags: { ...tags, status: 'success' },
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    Sentry.metrics.distribution(`${metricName}_duration_ms`, duration, {
      tags: { ...tags, status: 'error' },
    });
    
    Sentry.metrics.incr(`${metricName}_error_count`, 1, {
      tags: { ...tags },
    });
    
    throw error;
  }
}
