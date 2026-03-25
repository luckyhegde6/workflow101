/**
 * Daily Cron Handler
 * 
 * Runs daily (configurable in vercel.json)
 * Collects all due scheduled workflows and publishes them to the queue.
 * 
 * This workaround addresses Vercel's free tier limitation of once-per-day cron.
 * Instead of triggering workflows directly, we queue them for processing.
 */

import { NextResponse } from 'next/server';
import { publishWorkflow, QUEUE_TOPICS } from '../../../lib/queue-producer';
import { getScheduledWorkflows } from '../../../actions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Maximum for Vercel Pro

/**
 * GET /api/cron/daily
 * 
 * Triggered by Vercel cron at the scheduled time (default: 6:00 AM daily).
 * Collects all due scheduled workflows and publishes them to the queue.
 */
export async function GET() {
  console.log('[Cron] Daily cron triggered at', new Date().toISOString());
  
  try {
    // Get all scheduled workflows
    const scheduledResult = await getScheduledWorkflows();
    
    if (!scheduledResult.success || !scheduledResult.workflows) {
      console.log('[Cron] No scheduled workflows found or error:', scheduledResult.error);
      return NextResponse.json({
        success: true,
        message: 'No scheduled workflows to process',
        processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    const now = Date.now();
    let processedCount = 0;
    let skippedCount = 0;
    const results: Array<{ workflowName: string; status: string; message?: string }> = [];

    for (const workflow of scheduledResult.workflows) {
      try {
        // Check if scheduled time has passed
        if (workflow.scheduledAt) {
          const scheduledTime = new Date(workflow.scheduledAt).getTime();
          
          if (scheduledTime > now) {
            // Future scheduled - skip for now
            console.log(`[Cron] Skipping future scheduled workflow: ${workflow.workflowName}`, {
              scheduledFor: workflow.scheduledAt,
            });
            skippedCount++;
            results.push({
              workflowName: workflow.workflowName,
              status: 'skipped',
              message: 'Scheduled for future',
            });
            continue;
          }
        }

        // Publish to queue for immediate processing
        const publishResult = await publishWorkflow(workflow.workflowName, {
          scheduledId: workflow.id,
          cronSource: 'daily',
          triggeredAt: new Date().toISOString(),
        }, {
          source: 'cron',
          idempotencyKey: `cron-${workflow.id}-${now}`,
        });

        if (publishResult.success) {
          console.log(`[Cron] Queued workflow: ${workflow.workflowName}`, {
            messageId: publishResult.messageId,
          });
          processedCount++;
          results.push({
            workflowName: workflow.workflowName,
            status: 'queued',
            message: publishResult.messageId,
          });
        } else {
          console.error(`[Cron] Failed to queue workflow: ${workflow.workflowName}`, {
            error: publishResult.error,
          });
          results.push({
            workflowName: workflow.workflowName,
            status: 'error',
            message: publishResult.error,
          });
        }
      } catch (error) {
        console.error(`[Cron] Error processing workflow: ${workflow.workflowName}`, error);
        results.push({
          workflowName: workflow.workflowName,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`[Cron] Daily cron completed:`, {
      processed: processedCount,
      skipped: skippedCount,
      total: scheduledResult.workflows.length,
    });

    return NextResponse.json({
      success: true,
      message: `Daily cron completed. Processed: ${processedCount}, Skipped: ${skippedCount}`,
      processed: processedCount,
      skipped: skippedCount,
      queueTopic: QUEUE_TOPICS.WORKFLOWS,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Daily cron failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
