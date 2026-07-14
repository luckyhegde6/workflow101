/**
 * OpenRouter LLM Client
 * 
 * Configures LangChain's ChatOpenAI to work with OpenRouter's OpenAI-compatible API.
 * OpenRouter provides a unified interface to 200+ models (GPT, Claude, Llama, Mistral, etc.)
 * behind a single API key.
 * 
 * @see https://openrouter.ai/docs
 */

import { ChatOpenAI } from '@langchain/openai';
import type { LLMConfig } from './types';

/**
 * Create a LangChain ChatOpenAI instance configured for OpenRouter.
 * OpenRouter exposes an OpenAI-compatible API at https://openrouter.ai/api/v1
 * 
 * @param config - LLM configuration (model, temperature, etc.)
 * @returns Configured ChatOpenAI instance
 */
export function createOpenRouterModel(config: Partial<LLMConfig> = {}): ChatOpenAI {
  const model = config.model || process.env.OPENROUTER_MODEL || 'openrouter/auto';
  const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
  const baseURL = config.baseURL || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

  if (!apiKey) {
    console.warn(
      '[LLM] OPENROUTER_API_KEY not configured. LLM-powered workflows will use fallback behavior.\n' +
      'Set OPENROUTER_API_KEY in your .env.local file to enable real AI features.\n' +
      'Get a key at: https://openrouter.ai/keys'
    );
  }

  return new ChatOpenAI({
    model,
    temperature: config.temperature ?? 0.7,
    maxTokens: config.maxTokens ?? 4096,
    topP: config.topP ?? 1,
    configuration: {
      baseURL,
    },
    apiKey: apiKey || 'sk-placeholder',
    // OpenRouter specific headers
    modelKwargs: {
      // Send these headers for OpenRouter-specific features
      // 'HTTP-Referer': process.env.APP_URL || 'https://workflow101.vercel.app',
      // 'X-Title': 'Workflow101',
    },
  });
}

/**
 * Create a generic chat model with automatic provider detection.
 * 
 * Currently supports:
 * - OpenRouter (default): Uses ChatOpenAI with custom base URL
 * - Direct OpenAI: Uses standard ChatOpenAI
 * 
 * @param config - Model configuration
 * @returns Configured chat model instance
 */
export function createChatModel(config: Partial<LLMConfig> = {}): ChatOpenAI {
  const provider = config.provider || 'openrouter';

  switch (provider) {
    case 'openrouter':
      return createOpenRouterModel(config);
    case 'openai':
      return new ChatOpenAI({
        model: config.model || 'gpt-4o',
        temperature: config.temperature ?? 0.7,
        maxTokens: config.maxTokens ?? 4096,
        apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      });
    default:
      return createOpenRouterModel(config);
  }
}

/**
 * Check if the LLM is properly configured (has API key).
 */
export function isLLMConfigured(): boolean {
  return Boolean(
    process.env.OPENROUTER_API_KEY || 
    process.env.OPENAI_API_KEY
  );
}
