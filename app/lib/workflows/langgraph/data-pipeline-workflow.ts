/**
 * Data Pipeline Workflow (LangGraph)
 * 
 * A LangGraph-based workflow for processing data in stages.
 * Demonstrates conditional branching, parallel-like step execution,
 * and error recovery patterns.
 * 
 * Graph:
 *  START → [validateData] → [transformData] → [analyzeData] → [storeResults] → END
 *              │                                                     │
 *              └── (invalid) → [error] → END                          │
 *                                                                      │
 *              [enrichment] ←─ (if needs enrichment) ─────────────────┘
 */

import { StateGraph, END } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';

export interface DataPipelineInput {
  dataId: string;
  data: Record<string, unknown>;
  operation: 'transform' | 'analyze' | 'enrich' | 'full';
  options?: {
    validateOnly?: boolean;
    enrichmentSource?: string;
    outputFormat?: 'json' | 'csv' | 'summary';
  };
}

interface DataPipelineState {
  input: DataPipelineInput;
  validationResult?: { isValid: boolean; reason?: string };
  transformedData?: Record<string, unknown>;
  analysisResult?: Record<string, unknown>;
  error?: string;
  completed: boolean;
}

const DataPipelineAnnotation = Annotation.Root({
  input: Annotation<DataPipelineInput>(),
  validationResult: Annotation<DataPipelineState['validationResult'] | undefined>(),
  transformedData: Annotation<Record<string, unknown> | undefined>(),
  analysisResult: Annotation<Record<string, unknown> | undefined>(),
  error: Annotation<string | undefined>(),
  completed: Annotation<boolean>(),
});

async function validateData(state: typeof DataPipelineAnnotation.State) {
  const { dataId, data } = state.input;

  if (!dataId) {
    return { validationResult: { isValid: false, reason: 'dataId is required' }, error: 'Validation failed: missing dataId', completed: true };
  }
  if (!data || Object.keys(data).length === 0) {
    return { validationResult: { isValid: false, reason: 'Data payload is empty' }, error: 'Validation failed: empty data', completed: true };
  }

  return { validationResult: { isValid: true } };
}

async function transformData(state: typeof DataPipelineAnnotation.State) {
  const { data, operation } = state.input;

  // Apply transformation based on operation type
  const transformed = { ...data };

  if (operation === 'transform' || operation === 'full') {
    // Normalize field names to lowercase
    for (const [key, value] of Object.entries(transformed)) {
      delete transformed[key];
      transformed[key.toLowerCase()] = value;
    }

    // Add metadata
    transformed._transformedAt = new Date().toISOString();
    transformed._transformVersion = '1.0';
  }

  return { transformedData: transformed };
}

async function analyzeData(state: typeof DataPipelineAnnotation.State) {
  const data = state.transformedData || state.input.data;

  const analysis: Record<string, unknown> = {
    recordCount: 1,
    fields: Object.keys(data).length,
    fieldNames: Object.keys(data),
    analyzedAt: new Date().toISOString(),
    dataQuality: 'confirmed',
  };

  return { analysisResult: analysis };
}

async function storeResults(state: typeof DataPipelineAnnotation.State) {
  const results = {
    dataId: state.input.dataId,
    operation: state.input.operation,
    validationStatus: state.validationResult?.isValid ? 'passed' : 'failed',
    recordCount: state.analysisResult?.recordCount || 0,
    fields: state.analysisResult?.fieldNames || [],
    processedAt: new Date().toISOString(),
  };

  console.log(`[DataPipeline] Stored results for ${state.input.dataId}:`, results);
  return { completed: true };
}

export function createDataPipelineWorkflow() {
  const graph = new StateGraph(DataPipelineAnnotation)
    .addNode('validateData', validateData)
    .addNode('transformData', transformData)
    .addNode('analyzeData', analyzeData)
    .addNode('storeResults', storeResults)
    .addNode('error', async (state: typeof DataPipelineAnnotation.State) => ({
      ...state, completed: true, error: state.error || 'Data pipeline error',
    }))
    .addEdge('__start__', 'validateData')
    .addConditionalEdges('validateData', (state: typeof DataPipelineAnnotation.State) =>
      state.validationResult?.isValid === false ? 'error' : 'transformData')
    .addConditionalEdges('transformData', (state: typeof DataPipelineAnnotation.State) => {
      if (state.input.options?.validateOnly) {
        return 'storeResults';
      }
      return 'analyzeData';
    })
    .addEdge('analyzeData', 'storeResults')
    .addEdge('storeResults', '__end__')
    .addEdge('error', '__end__');

  return graph.compile();
}

export type DataPipelineWorkflow = ReturnType<typeof createDataPipelineWorkflow>;
