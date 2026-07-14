/**
 * Orchestrator State
 * 
 * Defines the state graph for the LangGraph orchestrator agent.
 * Uses LangGraph's StateGraph with a typed state schema.
 * 
 * The state flows through these stages:
 * 1. INPUT → User provides natural language request
 * 2. ANALYZE → LLM analyzes intent and extracts parameters
 * 3. ROUTE → Orchestrator decides which workflow(s) to execute
 * 4. EXECUTE → Workflow(s) are executed with tool calls
 * 5. COMPLETE → Final response is generated
 */

import type { BaseMessage } from '@langchain/core/messages';

/**
 * Orchestrator state schema.
 * Each key represents a piece of state that flows through the graph.
 * LangGraph automatically merges state updates from each node.
 */
export interface OrchestratorStateType {
  /** The original user input / request */
  input: string;

  /** Chat messages accumulated through the conversation */
  messages: BaseMessage[];

  /** Parsed analysis of the user's intent */
  analysis?: {
    intent: string;
    confidence: number;
    suggestedWorkflows: string[];
    parameters: Record<string, unknown>;
  };

  /** Decision made by the router */
  route?: {
    action: 'execute_workflow' | 'list_workflows' | 'check_status' | 'schedule' | 'unknown';
    workflowName?: string;
    reason: string;
    parameters?: Record<string, unknown>;
  };

  /** Results from workflow execution */
  executionResults?: Array<{
    step: string;
    status: 'success' | 'error' | 'pending';
    data?: unknown;
    error?: string;
    timestamp: string;
  }>;

  /** Error state if something goes wrong */
  error?: string;

  /** Whether the orchestrator has completed */
  completed: boolean;

  /** Final response to the user */
  finalResponse?: string;

  /** Current step in the orchestration flow */
  currentStep: 'idle' | 'analyzing' | 'routing' | 'executing' | 'completing' | 'error';
}

/**
 * Default initial state for the orchestrator.
 */
export function createInitialState(input: string): Partial<OrchestratorStateType> {
  return {
    input,
    messages: [],
    currentStep: 'analyzing',
    completed: false,
    executionResults: [],
  };
}
