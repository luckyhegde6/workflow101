/**
 * LLM Module Index
 * 
 * Central export point for all LLM-related utilities.
 * Provides OpenRouter-backed chat model configuration for the LangGraph orchestrator.
 */

export { createChatModel, createOpenRouterModel } from './openrouter';
export type { LLMConfig, LLMResponse, ChatMessage, ModelProvider } from './types';
