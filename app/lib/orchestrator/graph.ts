/**
 * Orchestrator Graph
 * 
 * Defines the LangGraph StateGraph for the workflow orchestrator.
 * The graph uses conditional edges to route between nodes based on state.
 * 
 * Graph Structure:
 * 
 *   START
 *     │
 *     ▼
 * [analyzeInput]  ← Uses LLM or rules to parse intent
 *     │
 *     ▼
 * [routeDecision] ← Determines action: execute, list, check, or unknown
 *     │
 *     ├──→ executeWorkflow ──→ generateResponse ──→ END
 *     │      (runs workflow)
 *     ├──→ generateResponse ──→ END  
 *     │      (for list/check/unknown)
 *     └──→ error ──→ END
 *            (if route failed)
 */

import { StateGraph, END } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import type { OrchestratorStateType } from './state';
import {
  createAnalyzeInputNode,
  createRouteDecisionNode,
  createExecuteWorkflowNode,
  createGenerateResponseNode,
} from './nodes';

/**
 * Define the graph state schema using LangGraph's Annotation API.
 * This provides type-safe state management through the graph.
 */
const OrchestratorAnnotation = Annotation.Root({
  input: Annotation<string>,
  messages: Annotation<any[]>({
    reducer: (a: any[], b: any[]) => [...a, ...b],
  }),
  analysis: Annotation<OrchestratorStateType['analysis'] | undefined>,
  route: Annotation<OrchestratorStateType['route'] | undefined>,
  executionResults: Annotation<any[]>({
    reducer: (a: any[], b: any[]) => [...a, ...b],
  }),
  error: Annotation<string | undefined>,
  completed: Annotation<boolean>,
  finalResponse: Annotation<string | undefined>,
  currentStep: Annotation<OrchestratorStateType['currentStep']>,
});

/**
 * Create the LangGraph state graph for the orchestrator.
 * 
 * @returns A compiled LangGraph StateGraph
 */
export function createOrchestratorGraph() {
  // Create node instances
  const analyzeInput = createAnalyzeInputNode();
  const routeDecision = createRouteDecisionNode();
  const executeWorkflow = createExecuteWorkflowNode();
  const generateResponse = createGenerateResponseNode();

  // Build the graph
  const graph = new StateGraph(OrchestratorAnnotation)
    // Add all nodes
    .addNode('analyzeInput', analyzeInput)
    .addNode('routeDecision', routeDecision)
    .addNode('executeWorkflow', executeWorkflow)
    .addNode('generateResponse', generateResponse)
    .addNode('error', async (state: typeof OrchestratorAnnotation.State) => ({
      ...state,
      currentStep: 'error' as const,
      completed: true,
      finalResponse: state.error || 'An unknown error occurred during orchestration.',
    }))
    // Define the flow
    .addEdge('__start__', 'analyzeInput')
    .addEdge('analyzeInput', 'routeDecision')
    // Conditional routing based on route decision
    .addConditionalEdges('routeDecision', (state: typeof OrchestratorAnnotation.State) => {
      const route = state.route;
      if (!route || route.action === 'unknown') {
        return 'generateResponse';
      }
      if (route.action === 'execute_workflow') {
        return 'executeWorkflow';
      }
      // list_workflows and check_status go directly to response generation
      return 'generateResponse';
    })
    .addEdge('executeWorkflow', 'generateResponse')
    .addEdge('generateResponse', '__end__');

  // Compile the graph
  return graph.compile();
}

/**
 * Type for the compiled graph.
 */
export type OrchestratorGraph = ReturnType<typeof createOrchestratorGraph>;
