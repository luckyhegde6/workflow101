/**
 * Orchestrator Unit Tests
 * 
 * Tests for the LangGraph orchestrator agent and its components.
 * Covers: state management, node logic, routing decisions, and tools.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInitialState } from '../../app/lib/orchestrator/state';
import { createRouteDecisionNode, createGenerateResponseNode } from '../../app/lib/orchestrator/nodes';
import type { OrchestratorStateType } from '../../app/lib/orchestrator/state';

// ── Mocks ────────────────────────────────────────────────────────────

// Mock the LLM module
vi.mock('../../app/lib/llm/openrouter', () => ({
  isLLMConfigured: vi.fn(() => false),
  createOpenRouterModel: vi.fn(() => ({
    invoke: vi.fn().mockResolvedValue({ content: '{}' }),
  })),
}));

// Mock the workflow actions
vi.mock('../../app/actions', () => ({
  enqueueWorkflow: vi.fn().mockResolvedValue({ success: true, workflowId: 'test-wf-123' }),
  listWorkflows: vi.fn().mockResolvedValue({
    success: true,
    workflows: [
      { workflowId: '1', workflowName: 'exampleWorkflow', status: 'SUCCESS', createdAt: Date.now() },
    ],
  }),
  getWorkflowStatus: vi.fn().mockResolvedValue({
    success: true,
    workflow: { workflowId: '1', workflowName: 'exampleWorkflow', status: 'SUCCESS', createdAt: Date.now() },
  }),
}));

// ── Tests ────────────────────────────────────────────────────────────

describe('Orchestrator State', () => {
  it('creates initial state from input', () => {
    const state = createInitialState('Send an email');
    expect(state.input).toBe('Send an email');
    expect(state.currentStep).toBe('analyzing');
    expect(state.completed).toBe(false);
    expect(state.executionResults).toEqual([]);
    expect(state.messages).toEqual([]);
  });

  it('handles empty input gracefully', () => {
    const state = createInitialState('');
    expect(state.input).toBe('');
    expect(state.currentStep).toBe('analyzing');
  });
});

describe('Route Decision Node', () => {
  const routeDecision = createRouteDecisionNode();

  it('routes to unknown when no analysis is present', () => {
    const state: OrchestratorStateType = {
      input: 'test',
      messages: [],
      currentStep: 'analyzing',
      completed: false,
    };

    const result = routeDecision(state);
    expect(result.route?.action).toBe('unknown');
    expect(result.currentStep).toBe('completing');
  });

  it('routes to execute_workflow with suggested workflows', () => {
    const state: OrchestratorStateType = {
      input: 'Send an email notification',
      messages: [],
      currentStep: 'routing',
      completed: false,
      analysis: {
        intent: 'Send email notification',
        confidence: 0.8,
        suggestedWorkflows: ['emailNotificationWorkflow'],
        parameters: { to: 'user@example.com' },
      },
    };

    const result = routeDecision(state);
    expect(result.route?.action).toBe('execute_workflow');
    expect(result.route?.workflowName).toBe('emailNotificationWorkflow');
    expect(result.currentStep).toBe('executing');
  });

  it('routes to list_workflows when intent is to list', () => {
    const state: OrchestratorStateType = {
      input: 'Show me all workflows',
      messages: [],
      currentStep: 'routing',
      completed: false,
      analysis: {
        intent: 'List all workflows',
        confidence: 0.9,
        suggestedWorkflows: [],
        parameters: {},
      },
    };

    const result = routeDecision(state);
    expect(result.route?.action).toBe('list_workflows');
    expect(result.currentStep).toBe('executing');
  });

  it('routes to unknown with low confidence', () => {
    const state: OrchestratorStateType = {
      input: 'Do something',
      messages: [],
      currentStep: 'routing',
      completed: false,
      analysis: {
        intent: 'Unknown',
        confidence: 0.2,
        suggestedWorkflows: [],
        parameters: {},
      },
    };

    const result = routeDecision(state);
    expect(result.route?.action).toBe('unknown');
    expect(result.route?.reason).toContain('confidence');
  });
});

describe('Generate Response Node', () => {
  const generateResponse = createGenerateResponseNode();

  it('generates fallback response when no results', async () => {
    const state: OrchestratorStateType = {
      input: 'Do something weird',
      messages: [],
      currentStep: 'completing',
      completed: false,
    };

    const result = await generateResponse(state);
    expect(result.finalResponse).toContain("I couldn't determine");
    expect(result.completed).toBe(true);
  });

  it('generates success response when execution succeeded', async () => {
    const state: OrchestratorStateType = {
      input: 'Send an email',
      messages: [],
      currentStep: 'completing',
      completed: false,
      analysis: {
        intent: 'Send email',
        confidence: 0.9,
        suggestedWorkflows: ['emailNotificationWorkflow'],
        parameters: {},
      },
      route: {
        action: 'execute_workflow',
        workflowName: 'emailNotificationWorkflow',
        reason: 'User wants email',
      },
      executionResults: [
        {
          step: 'execute:emailNotificationWorkflow',
          status: 'success',
          data: { status: 'enqueued', workflowId: 'wf-123' },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const result = await generateResponse(state);
    expect(result.finalResponse).toContain('enqueued');
    expect(result.finalResponse).toContain('emailNotificationWorkflow');
    expect(result.completed).toBe(true);
  });

  it('generates error response when all steps failed', async () => {
    const state: OrchestratorStateType = {
      input: 'test',
      messages: [],
      currentStep: 'completing',
      completed: false,
      executionResults: [
        {
          step: 'execute',
          status: 'error',
          error: 'Workflow not found',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const result = await generateResponse(state);
    expect(result.finalResponse).toContain('encountered an error');
    expect(result.finalResponse).toContain('Workflow not found');
    expect(result.completed).toBe(true);
  });
});

// ── Integration-like orchestrator test ───────────────────────────────

describe('Orchestrator Agent (with mocked deps)', () => {
  it('routes email requests correctly', async () => {
    const { createAnalyzeInputNode } = await import('../../app/lib/orchestrator/nodes');
    const analyzeInput = createAnalyzeInputNode();
    const localRouteDecision = createRouteDecisionNode();

    // Since LLM is mocked to return false, it will use rule-based analysis
    const state: OrchestratorStateType = {
      input: 'Send an email notification to user@example.com about the weekly report',
      messages: [],
      currentStep: 'analyzing',
      completed: false,
    };

    const analysisResult = await analyzeInput(state);
    expect(analysisResult.analysis?.intent).toBe('Send email notification');
    expect(analysisResult.analysis?.suggestedWorkflows).toContain('emailNotificationWorkflow');
    expect(analysisResult.currentStep).toBe('routing');

    // Route the analysis
    const routeResult = localRouteDecision({
      ...state,
      ...analysisResult,
    } as OrchestratorStateType);

    expect(routeResult.route?.action).toBe('execute_workflow');
    expect(routeResult.route?.workflowName).toBe('emailNotificationWorkflow');
  });

  it('handles analysis requests correctly', async () => {
    const { createAnalyzeInputNode } = await import('../../app/lib/orchestrator/nodes');
    const analyzeInput = createAnalyzeInputNode();

    const state: OrchestratorStateType = {
      input: 'Analyze the sentiment of this text: I love this product, it is amazing!',
      messages: [],
      currentStep: 'analyzing',
      completed: false,
    };

    const analysisResult = await analyzeInput(state);
    expect(analysisResult.analysis?.intent).toBe('Perform AI content analysis');
    expect(analysisResult.analysis?.suggestedWorkflows).toContain('aiAnalysisWorkflow');
  });
});
