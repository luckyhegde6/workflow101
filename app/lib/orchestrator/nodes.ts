/**
 * Orchestrator Nodes
 * 
 * LangGraph node functions that process state at each step.
 * Each node receives the current state and returns state updates.
 * 
 * Nodes:
 * 1. analyzeInput - Uses LLM to parse user intent
 * 2. routeDecision - Routes to the right workflow based on analysis
 * 3. executeWorkflow - Executes the workflow with tools
 * 4. generateResponse - Creates the final user-facing response
 */

import type { OrchestratorStateType } from './state';
import { createOpenRouterModel } from '../llm/openrouter';
import { createWorkflowTools } from './tools';
import { isLLMConfigured } from '../llm/openrouter';

/**
 * Analyze Input Node
 * 
 * Uses the LLM to analyze user input and extract:
 * - Intent (what the user wants to do)
 * - Suggested workflow type
 * - Parameters
 * - Confidence score
 * 
 * Falls back to rule-based analysis if LLM is not configured.
 */
export function createAnalyzeInputNode() {
  return async (state: OrchestratorStateType): Promise<Partial<OrchestratorStateType>> => {
    const { input } = state;

    if (!input || input.trim().length === 0) {
      return {
        currentStep: 'error',
        error: 'No input provided',
        completed: true,
        finalResponse: 'Please provide a description of what you want to do.',
      };
    }

    let analysis;

    if (isLLMConfigured()) {
      analysis = await analyzeWithLLM(input);
    } else {
      analysis = analyzeWithRules(input);
    }

    return {
      analysis,
      currentStep: 'routing',
      messages: [
        ...state.messages,
        {
          type: 'ai',
          data: { content: `Analysis complete: ${analysis.intent}` },
        } as any,
      ],
    };
  };
}

/**
 * Route Decision Node
 * 
 * Determines which workflow action to take based on the analysis.
 * Returns the route decision which determines the next graph edge.
 */
export function createRouteDecisionNode() {
  return (state: OrchestratorStateType): Partial<OrchestratorStateType> => {
    const { analysis } = state;

    if (!analysis) {
      return {
        route: {
          action: 'unknown',
          reason: 'Could not analyze input',
        },
        currentStep: 'completing',
      };
    }

    const route = determineRoute(analysis);
    return {
      route,
      currentStep: route.action === 'unknown' ? 'completing' : 'executing',
    };
  };
}

/**
 * Execute Workflow Node
 * 
 * Executes the selected workflow using the tool registry.
 * Tracks execution results in state.
 */
export function createExecuteWorkflowNode() {
  return async (state: OrchestratorStateType): Promise<Partial<OrchestratorStateType>> => {
    const { route } = state;
    const tools = createWorkflowTools();
    const results = state.executionResults || [];

    if (!route || route.action === 'unknown') {
      return {
        currentStep: 'completing',
        executionResults: [
          ...results,
          {
            step: 'execute',
            status: 'error',
            error: 'No valid route determined',
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }

    try {
      switch (route.action) {
        case 'execute_workflow': {
          if (!route.workflowName) {
            throw new Error('No workflow name specified for execution');
          }
          const result = await tools.enqueueTool.invoke({
            workflowName: route.workflowName as any,
            params: route.parameters || {},
          });
          results.push({
            step: `execute:${route.workflowName}`,
            status: 'success',
            data: JSON.parse(result),
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'list_workflows': {
          const result = await tools.listWorkflowsTool.invoke({
            workflowName: route.workflowName,
          });
          results.push({
            step: 'list_workflows',
            status: 'success',
            data: JSON.parse(result),
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'check_status': {
          if (!route.parameters?.workflowId) {
            throw new Error('No workflow ID provided for status check');
          }
          const result = await tools.checkStatusTool.invoke({
            workflowId: String(route.parameters.workflowId),
          });
          results.push({
            step: 'check_status',
            status: 'success',
            data: JSON.parse(result),
            timestamp: new Date().toISOString(),
          });
          break;
        }

        default:
          results.push({
            step: 'execute',
            status: 'error',
            error: `Unknown action: ${route.action}`,
            timestamp: new Date().toISOString(),
          });
      }
    } catch (error) {
      results.push({
        step: 'execute',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown execution error',
        timestamp: new Date().toISOString(),
      });
    }

    return {
      executionResults: results,
      currentStep: 'completing',
    };
  };
}

/**
 * Generate Response Node
 * 
 * Creates the final user-facing response based on execution results.
 * Uses LLM when available, otherwise generates a structured text response.
 */
export function createGenerateResponseNode() {
  return async (state: OrchestratorStateType): Promise<Partial<OrchestratorStateType>> => {
    const results = state.executionResults || [];
    const route = state.route;

    let finalResponse: string;

    if (results.length === 0) {
      finalResponse = "I couldn't determine what workflow action to take. Please provide more details about what you'd like to do.\n\nAvailable workflows:\n- Example Workflow (basic testing)\n- Email Notification\n- Data Processing\n- User Onboarding\n- Scheduled Report\n- Webhook Handler\n- AI Analysis (sentiment, summary, categorization, entity extraction)";
    } else {
      const successful = results.filter((r) => r.status === 'success');
      const failed = results.filter((r) => r.status === 'error');

      if (failed.length > 0 && successful.length === 0) {
        finalResponse = `I encountered an error while processing your request:\n${failed.map((f) => `- ${f.error}`).join('\n')}\n\nPlease try again or check the workflow configuration.`;
      } else {
        const summaries = successful.map((r) => {
          if (typeof r.data === 'object' && r.data !== null) {
            const d = r.data as Record<string, unknown>;
            if (d.status === 'enqueued') {
              return `✅ Workflow **${r.step.replace('execute:', '')}** has been enqueued (ID: ${d.workflowId})`;
            }
            if (d.status === 'success' && d.workflows) {
              const wfs = d.workflows as Array<Record<string, unknown>>;
              return `📋 Found **${d.count}** workflow(s):\n${wfs.map((w: any) => `  - **${w.name}** (${w.status}) [${w.id}]`).join('\n')}`;
            }
          }
          return `✅ ${r.step}: Completed successfully`;
        });

        finalResponse = [
          '## Orchestration Results\n',
          ...summaries,
          '',
          failed.length > 0 ? `⚠️ ${failed.length} step(s) had errors:\n${failed.map((f) => `- ${f.error}`).join('\n')}` : '',
          route ? `\n*Decision: ${route.reason}*` : '',
        ]
          .filter(Boolean)
          .join('\n');
      }
    }

    return {
      finalResponse,
      completed: true,
      currentStep: 'completing',
    };
  };
}

// ── Helper Functions ─────────────────────────────────────────────────

/**
 * Analyze user input using LLM.
 * When OpenRouter API key is configured, uses real AI to parse intent.
 */
async function analyzeWithLLM(input: string): Promise<OrchestratorStateType['analysis']> {
  try {
    const model = createOpenRouterModel({ temperature: 0.3 });
    const prompt = `Analyze this user request and extract workflow intent. 
Return a JSON object with:
- intent: brief description of what the user wants
- confidence: 0-1 score
- suggestedWorkflows: array of matching workflow names from: exampleWorkflow, emailNotificationWorkflow, dataProcessingWorkflow, onboardingWorkflow, scheduledReportWorkflow, webhookHandlerWorkflow, aiAnalysisWorkflow
- parameters: relevant parameters as key-value pairs

User request: "${input}"`;

    const response = await model.invoke([{ role: 'user', content: prompt }]);
    const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Try to parse JSON from the response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fall through to rule-based
    }

    return analyzeWithRules(input);
  } catch {
    return analyzeWithRules(input);
  }
}

/**
 * Rule-based analysis fallback.
 * Used when LLM is not configured or LLM call fails.
 */
function analyzeWithRules(input: string): OrchestratorStateType['analysis'] {
  const lower = input.toLowerCase();

  // Detect workflow type from keywords
  const workflowPatterns: Array<{
    keywords: string[];
    workflow: string;
    intent: string;
  }> = [
    { keywords: ['email', 'mail', 'notify', 'notification', 'send'], workflow: 'emailNotificationWorkflow', intent: 'Send email notification' },
    { keywords: ['process', 'data', 'analyze', 'transform', 'etl'], workflow: 'dataProcessingWorkflow', intent: 'Process data' },
    { keywords: ['onboard', 'user', 'signup', 'register', 'welcome'], workflow: 'onboardingWorkflow', intent: 'User onboarding' },
    { keywords: ['report', 'schedule', 'daily', 'weekly', 'monthly', 'summary'], workflow: 'scheduledReportWorkflow', intent: 'Generate scheduled report' },
    { keywords: ['webhook', 'event', 'callback', 'incoming'], workflow: 'webhookHandlerWorkflow', intent: 'Handle webhook event' },
    { keywords: ['sentiment', 'analyze', 'summarize', 'categorize', 'extract', 'ai', 'llm'], workflow: 'aiAnalysisWorkflow', intent: 'Perform AI content analysis' },
    { keywords: ['example', 'test', 'demo', 'hello'], workflow: 'exampleWorkflow', intent: 'Run example workflow' },
  ];

  const matches = workflowPatterns
    .map((p) => ({
      ...p,
      score: p.keywords.filter((k) => lower.includes(k)).length,
    }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);

  // Extract potential parameters
  const params: Record<string, unknown> = {};

  // Email pattern
  const emailMatch = input.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) params.to = emailMatch[0];

  // URL pattern
  const urlMatch = input.match(/https?:\/\/[^\s]+/);
  if (urlMatch) params.url = urlMatch[0];

  if (matches.length > 0) {
    return {
      intent: matches[0].intent,
      confidence: matches[0].score / Math.max(...workflowPatterns.map((p) => p.keywords.length)),
      suggestedWorkflows: matches.map((m) => m.workflow),
      parameters: params,
    };
  }

  return {
    intent: 'Unknown or general request',
    confidence: 0.1,
    suggestedWorkflows: ['exampleWorkflow'],
    parameters: params,
  };
}

/**
 * Determine route based on analysis results.
 */
function determineRoute(
  analysis: NonNullable<OrchestratorStateType['analysis']>
): NonNullable<OrchestratorStateType['route']> {
  if (analysis.confidence < 0.3) {
    return {
      action: 'unknown',
      reason: `Could not confidently determine intent (confidence: ${(analysis.confidence * 100).toFixed(0)}%)`,
    };
  }

  // Check for status/list requests
  const intentLower = analysis.intent.toLowerCase();
  if (intentLower.includes('list') || intentLower.includes('show') || intentLower.includes('find')) {
    return {
      action: 'list_workflows',
      reason: 'User wants to list workflows',
      parameters: analysis.parameters,
    };
  }

  if (intentLower.includes('status') || intentLower.includes('check') || intentLower.includes('progress')) {
    return {
      action: 'check_status',
      reason: 'User wants to check workflow status',
      parameters: analysis.parameters,
    };
  }

  if (analysis.suggestedWorkflows.length > 0) {
    return {
      action: 'execute_workflow',
      workflowName: analysis.suggestedWorkflows[0],
      reason: `Selected workflow: ${analysis.suggestedWorkflows[0]}`,
      parameters: analysis.parameters,
    };
  }

  return {
    action: 'unknown',
    reason: 'No matching workflow found',
    parameters: analysis.parameters,
  };
}
