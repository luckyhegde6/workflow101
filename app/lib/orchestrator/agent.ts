/**
 * Orchestrator Agent
 * 
 * The main entry point for the LangGraph-powered workflow orchestrator.
 * Handles the complete lifecycle: input → analysis → routing → execution → response.
 * 
 * Usage:
 * ```typescript
 * import { createOrchestratorAgent } from '@/lib/orchestrator';
 * 
 * const agent = createOrchestratorAgent();
 * const response = await agent.run('Send an email notification to user@example.com');
 * ```
 */

import { createOrchestratorGraph, type OrchestratorGraph } from './graph';
import { createInitialState } from './state';
import type { OrchestratorStateType } from './state';

export interface OrchestratorInput {
  /** The user's natural language request */
  input: string;
}

export interface OrchestratorOutput {
  /** Whether the orchestration was successful */
  success: boolean;
  /** The final response to the user */
  response: string;
  /** Execution details for debugging */
  details?: {
    analysis?: OrchestratorStateType['analysis'];
    route?: OrchestratorStateType['route'];
    results?: OrchestratorStateType['executionResults'];
    steps: OrchestratorStateType['currentStep'][];
  };
}

/**
 * Orchestrator Agent class.
 * Wraps the LangGraph and provides a simple run interface.
 */
export class OrchestratorAgent {
  private graph: OrchestratorGraph;
  private stepLog: OrchestratorStateType['currentStep'][] = [];

  constructor() {
    this.graph = createOrchestratorGraph();
  }

  /**
   * Execute the orchestration pipeline for a user request.
   * 
   * @param input - User's natural language workflow request
   * @returns Orchestration result with response and details
   */
  async run(input: OrchestratorInput): Promise<OrchestratorOutput> {
    try {
      const initialState = createInitialState(input.input);

      // Track progress through steps by listening to state changes
      const config = {
        callbacks: [
          {
            handleNodeStart: (_nodeId: string) => {
              // Called when each node starts execution
            },
          },
        ],
      };

      // Run the graph
      const finalState = await this.graph.invoke(initialState, config);

      return {
        success: !finalState.error && finalState.completed,
        response: finalState.finalResponse || 'Orchestration completed but no response was generated.',
        details: {
          analysis: finalState.analysis,
          route: finalState.route,
          results: finalState.executionResults,
          steps: this.stepLog,
        },
      };
    } catch (error) {
      return {
        success: false,
        response: `Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          steps: this.stepLog,
        },
      };
    }
  }

  /**
   * Stream the orchestration execution for real-time UI updates.
   * Yields state updates as the graph executes each node.
   */
  async *stream(input: OrchestratorInput): AsyncGenerator<{
    step: string;
    state: Partial<OrchestratorStateType>;
  }> {
    const initialState = createInitialState(input.input);

    try {
      const stream = await this.graph.stream(initialState);

      for await (const chunk of stream) {
        const [nodeId, nodeState] = Object.entries(chunk)[0] || [];
        if (nodeId && nodeState) {
          this.stepLog.push(nodeState.currentStep);
          yield {
            step: nodeId,
            state: nodeState as Partial<OrchestratorStateType>,
          };
        }
      }
    } catch (error) {
      yield {
        step: 'error',
        state: {
          currentStep: 'error',
          error: error instanceof Error ? error.message : 'Stream error',
          completed: true,
        },
      };
    }
  }
}

/**
 * Convenience function to create and run the orchestrator in one call.
 */
export async function createOrchestratorAgent(input: string): Promise<OrchestratorOutput> {
  const agent = new OrchestratorAgent();
  return agent.run({ input });
}

export default OrchestratorAgent;
