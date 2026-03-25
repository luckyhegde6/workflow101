export interface ChainStep {
  name: string;
  workflowName: string;
  params?: Record<string, unknown>;
  condition?: (previousResult: unknown) => boolean;
}

export interface ChainResult {
  success: boolean;
  completedSteps: string[];
  failedStep?: string;
  error?: string;
  results: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
}

export interface ParallelBranch {
  name: string;
  workflowName: string;
  params?: Record<string, unknown>;
}

export interface ParallelResult {
  success: boolean;
  branches: Record<string, { success: boolean; result?: unknown; error?: string }>;
  startedAt: string;
  completedAt?: string;
}

export interface ConditionalBranch {
  name: string;
  condition: (context: Record<string, unknown>) => boolean;
  workflowName: string;
  params?: Record<string, unknown>;
}

export function isSuccessResult(result: unknown): boolean {
  if (typeof result === 'object' && result !== null) {
    return 'success' in result && (result as Record<string, unknown>).success === true;
  }
  return result !== null && result !== undefined;
}

export function extractResultValue(result: unknown): unknown {
  if (typeof result === 'object' && result !== null) {
    if ('data' in result) {
      return (result as Record<string, unknown>).data;
    }
    if ('result' in result) {
      return (result as Record<string, unknown>).result;
    }
  }
  return result;
}

export function buildChainParams(
  steps: ChainStep[],
  previousResults: Record<string, unknown>
): Record<string, unknown> {
  const values = Object.values(previousResults);
  const lastResult = values.length > 0 ? extractResultValue(values[values.length - 1]) : {};
  return {
    ...(typeof lastResult === 'object' && lastResult !== null ? lastResult : {}),
    previousResults,
  };
}

export function shouldExecuteStep(
  step: ChainStep,
  previousResult: unknown
): boolean {
  if (!step.condition) return true;
  return step.condition(previousResult);
}
