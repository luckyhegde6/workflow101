/**
 * Vercel Queue Producer Utilities
 * 
 * Provides utilities for publishing workflow messages to Vercel Queues.
 * Works with the daily cron trigger to queue workflow requests.
 */

import { send } from '@vercel/queue';

// Queue topic names
export const QUEUE_TOPICS = {
  WORKFLOWS: 'workflows',
  SCHEDULED_WORKFLOWS: 'scheduled-workflows',
  EMAIL_NOTIFICATIONS: 'email-notifications',
  DATA_PROCESSING: 'data-processing',
  APPROVALS: 'approvals',
} as const;

export type QueueTopic = typeof QUEUE_TOPICS[keyof typeof QUEUE_TOPICS];

/**
 * Message types for the queue
 */
export interface WorkflowMessage {
  type: 'workflow';
  workflowName: string;
  params: Record<string, unknown>;
  queuedAt: number;
  source: 'api' | 'cron' | 'scheduled' | 'manual';
  idempotencyKey?: string;
}

export interface ScheduledWorkflowMessage {
  type: 'scheduled';
  workflowName: string;
  params: Record<string, unknown>;
  scheduledFor: number;
  scheduledBy: string;
  idempotencyKey?: string;
}

export interface EmailNotificationMessage {
  type: 'email';
  to: string;
  subject: string;
  body: string;
  priority: 'low' | 'normal' | 'high';
}

export interface ApprovalMessage {
  type: 'approval';
  approvalId: string;
  workflowExecutionId?: string;
  action: 'approve' | 'reject';
  requestedBy?: string;
}

export type QueueMessage = 
  | WorkflowMessage 
  | ScheduledWorkflowMessage 
  | EmailNotificationMessage 
  | ApprovalMessage;

/**
 * Publish a workflow message to the queue
 */
export async function publishWorkflow(
  workflowName: string,
  params: Record<string, unknown> = {},
  options: {
    source?: WorkflowMessage['source'];
    delaySeconds?: number;
    idempotencyKey?: string;
  } = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const message: WorkflowMessage = {
      type: 'workflow',
      workflowName,
      params,
      queuedAt: Date.now(),
      source: options.source || 'manual',
      idempotencyKey: options.idempotencyKey,
    };

    const result = await send(QUEUE_TOPICS.WORKFLOWS, message, {
      delaySeconds: options.delaySeconds,
    });

    console.log(`[Queue] Published workflow: ${workflowName}`, {
      messageId: result.messageId ?? undefined,
      source: message.source,
    });

    return { success: true, messageId: result.messageId ?? undefined };
  } catch (error) {
    console.error('[Queue] Failed to publish workflow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Publish a scheduled workflow message
 */
export async function publishScheduledWorkflow(
  workflowName: string,
  params: Record<string, unknown>,
  scheduledFor: Date,
  scheduledBy: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Calculate delay in seconds
    const delaySeconds = Math.max(0, Math.floor((scheduledFor.getTime() - Date.now()) / 1000));
    
    // Create idempotency key based on workflow and scheduled time
    const idempotencyKey = `scheduled-${workflowName}-${scheduledFor.toISOString()}`;

    const message: ScheduledWorkflowMessage = {
      type: 'scheduled',
      workflowName,
      params,
      scheduledFor: scheduledFor.getTime(),
      scheduledBy,
      idempotencyKey,
    };

    const result = await send(QUEUE_TOPICS.SCHEDULED_WORKFLOWS, message, {
      delaySeconds,
    });

    console.log(`[Queue] Published scheduled workflow: ${workflowName}`, {
      scheduledFor: scheduledFor.toISOString(),
      delaySeconds,
      messageId: result.messageId ?? undefined,
    });

    return { success: true, messageId: result.messageId ?? undefined };
  } catch (error) {
    console.error('[Queue] Failed to publish scheduled workflow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Publish an email notification
 */
export async function publishEmail(
  to: string,
  subject: string,
  body: string,
  priority: EmailNotificationMessage['priority'] = 'normal'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const message: EmailNotificationMessage = {
      type: 'email',
      to,
      subject,
      body,
      priority,
    };

    const result = await send(QUEUE_TOPICS.EMAIL_NOTIFICATIONS, message);

    console.log(`[Queue] Published email to: ${to}`, { messageId: result.messageId ?? undefined });

    return { success: true, messageId: result.messageId ?? undefined };
  } catch (error) {
    console.error('[Queue] Failed to publish email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Publish an approval message
 */
export async function publishApproval(
  approvalId: string,
  workflowExecutionId?: string,
  requestedBy?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const message: ApprovalMessage = {
      type: 'approval',
      approvalId,
      workflowExecutionId,
      action: 'approve', // Will be determined by user response
      requestedBy,
    };

    const result = await send(QUEUE_TOPICS.APPROVALS, message);

    console.log(`[Queue] Published approval: ${approvalId}`, { messageId: result.messageId ?? undefined });

    return { success: true, messageId: result.messageId ?? undefined };
  } catch (error) {
    console.error('[Queue] Failed to publish approval:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Publish batch of workflows
 */
export async function publishBatchWorkflow(
  workflows: Array<{
    workflowName: string;
    params: Record<string, unknown>;
    delaySeconds?: number;
  }>
): Promise<{ success: boolean; results: Array<{ workflowName: string; messageId?: string; error?: string }> }> {
  const results = await Promise.all(
    workflows.map(async (wf) => {
      const result = await publishWorkflow(wf.workflowName, wf.params, {
        delaySeconds: wf.delaySeconds,
      });
      return {
        workflowName: wf.workflowName,
        ...result,
      };
    })
  );

  const allSuccess = results.every((r) => r.success);

  console.log(`[Queue] Published batch of ${workflows.length} workflows`, {
    successCount: results.filter((r) => r.success).length,
    failureCount: results.filter((r) => !r.success).length,
  });

  return { success: allSuccess, results };
}
