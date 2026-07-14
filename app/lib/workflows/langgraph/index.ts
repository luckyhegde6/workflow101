/**
 * LangGraph Workflows
 * 
 * LangGraph-based workflow definitions that wrap the DBOS workflow system.
 * Each workflow is a LangGraph StateGraph that provides:
 * - Durable execution with checkpointing
 * - Human-in-the-loop approval steps
 * - Conditional branching
 * - Parallel execution
 * - Streaming intermediate results
 * 
 * These workflows integrate with the existing DBOS workflow system
 * by delegating actual execution to the registered DBOS workflows.
 */

export { createAnalysisWorkflow, type AnalysisWorkflowInput } from './analysis-workflow';
export { createEmailWorkflow, type EmailWorkflowInput } from './email-workflow';
export { createDataPipelineWorkflow, type DataPipelineInput } from './data-pipeline-workflow';
