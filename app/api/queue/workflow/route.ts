/**
 * Vercel Queue Workflow Consumer
 * 
 * Processes workflow messages from Vercel Queues.
 * This route is triggered by the queue infrastructure, not HTTP requests.
 */

import { handleCallback, type MessageMetadata } from '@vercel/queue';
import { WorkflowMessage, ScheduledWorkflowMessage, publishScheduledWorkflow } from '../../../lib/queue-producer';
import { enqueueWorkflow } from '../../../actions';

/**
 * Handle regular workflow messages
 */
async function handleWorkflowMessage(
  message: WorkflowMessage
): Promise<void> {
  console.log(`[Queue] Processing workflow: ${message.workflowName}`, {
    source: message.source,
    params: message.params,
  });

  // Enqueue the workflow using our existing action
  const result = await enqueueWorkflow(message.workflowName, message.params);

  if (!result.success) {
    throw new Error(`Failed to enqueue workflow: ${result.error}`);
  }

  console.log(`[Queue] Workflow enqueued:`, {
    workflowId: result.workflowId,
    source: message.source,
  });
}

/**
 * Handle scheduled workflow messages
 */
async function handleScheduledMessage(
  message: ScheduledWorkflowMessage
): Promise<void> {
  console.log(`[Queue] Processing scheduled workflow: ${message.workflowName}`, {
    scheduledFor: new Date(message.scheduledFor).toISOString(),
    scheduledBy: message.scheduledBy,
  });

  const now = Date.now();
  const timeUntilScheduled = message.scheduledFor - now;

  if (timeUntilScheduled > 0) {
    // Still waiting - re-publish with remaining delay
    console.log(`[Queue] Still waiting for scheduled time, re-queuing...`, {
      remainingDelay: Math.ceil(timeUntilScheduled / 1000),
    });

    await publishScheduledWorkflow(
      message.workflowName,
      message.params,
      new Date(message.scheduledFor),
      message.scheduledBy
    );
  } else {
    // Time has arrived - enqueue the workflow
    console.log(`[Queue] Scheduled time reached, enqueueing workflow`);

    const result = await enqueueWorkflow(message.workflowName, message.params);

    if (!result.success) {
      throw new Error(`Failed to enqueue scheduled workflow: ${result.error}`);
    }

    console.log(`[Queue] Scheduled workflow enqueued:`, {
      workflowId: result.workflowId,
    });
  }
}

/**
 * Main workflow queue handler
 * 
 * Uses default retry behavior from Vercel Queues.
 * Messages are retried automatically with exponential backoff.
 */
export const POST = handleCallback(
  async (message: unknown, metadata: MessageMetadata) => {
    console.log(`[Queue] Processing workflow message:`, {
      messageId: metadata.messageId,
      type: (message as { type: string })?.type,
      deliveryCount: metadata.deliveryCount,
    });

    const msg = message as { type: string };

    try {
      if (msg.type === 'workflow') {
        await handleWorkflowMessage(message as WorkflowMessage);
      } else if (msg.type === 'scheduled') {
        await handleScheduledMessage(message as ScheduledWorkflowMessage);
      } else {
        console.warn(`[Queue] Unknown message type: ${msg.type}`);
      }

      console.log(`[Queue] Successfully processed message: ${metadata.messageId}`);
    } catch (error) {
      // Re-throw to trigger retry
      console.error(`[Queue] Error processing message:`, error);
      throw error;
    }
  }
);
