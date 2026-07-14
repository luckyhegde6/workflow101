/**
 * LLM Types
 * 
 * Core type definitions for the LLM integration layer.
 * Used across the orchestrator, workflow agents, and API routes.
 */

/** Supported model providers */
export type ModelProvider = 'openai' | 'openrouter' | 'anthropic';

/** Configuration for creating a chat model instance */
export interface LLMConfig {
  /** Model identifier (e.g., 'openrouter/auto', 'gpt-4o', 'claude-sonnet-4') */
  model: string;
  /** Temperature for generation (0-2, default 0.7) */
  temperature?: number;
  /** Maximum tokens to generate (default 4096) */
  maxTokens?: number;
  /** Top-p sampling (0-1, default 1) */
  topP?: number;
  /** Provider-specific configuration */
  provider?: ModelProvider;
  /** Custom base URL (for OpenAI-compatible APIs like OpenRouter) */
  baseURL?: string;
  /** API key (falls back to OPENROUTER_API_KEY env var) */
  apiKey?: string;
}

/** Standardized chat message format */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool' | 'function';
  content: string;
  name?: string;
  tool_call_id?: string;
}

/** Standardized LLM response format */
export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

/**
 * Default model configuration.
 * Falls back to env vars with sensible defaults.
 */
export function getDefaultLLMConfig(): LLMConfig {
  return {
    model: process.env.OPENROUTER_MODEL || 'openrouter/auto',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    provider: 'openrouter',
    baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  };
}
