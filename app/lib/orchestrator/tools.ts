/**
 * Orchestrator Tools
 * 
 * Defines the tool registry for the LangGraph orchestrator agent.
 * Tools allow the LLM to interact with the workflow system:
 * - Enqueue new workflows
 * - List existing workflows and their status
 * - Check specific workflow status
 * - Schedule future workflows
 * 
 * Each tool is a LangChain StructuredTool that the agent can call.
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

// Import existing workflow actions
import { enqueueWorkflow, listWorkflows, getWorkflowStatus } from '../../actions';

/** Available workflow types that can be executed */
const AVAILABLE_WORKFLOWS = [
  'exampleWorkflow',
  'emailNotificationWorkflow',
  'dataProcessingWorkflow',
  'onboardingWorkflow',
  'scheduledReportWorkflow',
  'webhookHandlerWorkflow',
  'aiAnalysisWorkflow',
  'aiBatchAnalysisWorkflow',
  'aiChainAnalysisWorkflow',
] as const;

export type WorkflowToolSet = ReturnType<typeof createWorkflowTools>;

/**
 * Create the workspace for tools the orchestrator agent can use.
 * Each tool wraps an existing workflow action with LLM-friendly metadata.
 */
export function createWorkflowTools() {
  // ── Tool: Enqueue a workflow ──────────────────────────────────────
  const enqueueTool = new DynamicStructuredTool({
    name: 'enqueue_workflow',
    description: `Enqueue a workflow for execution. Available workflows: ${AVAILABLE_WORKFLOWS.join(', ')}. Use this to start a new workflow run.`,
    schema: z.object({
      workflowName: z
        .enum(AVAILABLE_WORKFLOWS)
        .describe('The name of the workflow to execute'),
      params: z
        .record(z.unknown())
        .optional()
        .default({})
        .describe('Parameters to pass to the workflow'),
    }),
    func: async ({ workflowName, params }) => {
      const result = await enqueueWorkflow(workflowName, params);
      if (result.success) {
        return JSON.stringify({
          status: 'enqueued',
          workflowId: result.workflowId,
          message: `Successfully enqueued workflow '${workflowName}'`,
        });
      }
      return JSON.stringify({
        status: 'error',
        error: result.error || 'Failed to enqueue workflow',
      });
    },
  });

  // ── Tool: List workflows ─────────────────────────────────────────
  const listWorkflowsTool = new DynamicStructuredTool({
    name: 'list_workflows',
    description: 'List all workflows and their current status. Optionally filter by workflow name.',
    schema: z.object({
      workflowName: z
        .string()
        .optional()
        .describe('Optional workflow name to filter by'),
    }),
    func: async ({ workflowName }) => {
      const result = await listWorkflows(workflowName);
      if (result.success && result.workflows) {
        return JSON.stringify({
          status: 'success',
          count: result.workflows.length,
          workflows: result.workflows.map((wf) => ({
            id: wf.workflowId,
            name: wf.workflowName,
            status: wf.status,
            createdAt: new Date(wf.createdAt).toISOString(),
          })),
        });
      }
      return JSON.stringify({
        status: 'error',
        error: result.error || 'Failed to list workflows',
      });
    },
  });

  // ── Tool: Check workflow status ───────────────────────────────────
  const checkStatusTool = new DynamicStructuredTool({
    name: 'check_workflow_status',
    description: 'Get the current status of a specific workflow by its ID.',
    schema: z.object({
      workflowId: z.string().describe('The workflow ID to check status for'),
    }),
    func: async ({ workflowId }) => {
      const result = await getWorkflowStatus(workflowId);
      if (result.success && result.workflow) {
        return JSON.stringify({
          status: 'success',
          workflow: {
            id: result.workflow.workflowId,
            name: result.workflow.workflowName,
            status: result.workflow.status,
            createdAt: new Date(result.workflow.createdAt).toISOString(),
          },
        });
      }
      return JSON.stringify({
        status: 'not_found',
        error: result.error || 'Workflow not found',
      });
    },
  });

  // ── Tool: Analyze with LLM ───────────────────────────────────────
  const analyzeTool = new DynamicStructuredTool({
    name: 'analyze_content',
    description: 'Perform AI analysis on content (sentiment, summarization, categorization, entity extraction). Use this when the user asks for content analysis.',
    schema: z.object({
      content: z.string().describe('The content to analyze'),
      analysisType: z
        .enum(['sentiment', 'summary', 'categorize', 'extract'])
        .describe('The type of analysis to perform'),
    }),
    func: async ({ content, analysisType }) => {
      // This will be handled by the LangGraph workflow node
      return JSON.stringify({
        status: 'delegated',
        message: `Analysis request for '${analysisType}' has been delegated to the AI analysis workflow`,
        analysisType,
        contentLength: content.length,
      });
    },
  });

  return {
    enqueueTool,
    listWorkflowsTool,
    checkStatusTool,
    analyzeTool,
    /** All tools as an array for binding to the LLM */
    getAllTools: () => [enqueueTool, listWorkflowsTool, checkStatusTool, analyzeTool],
  };
}
