/**
 * AI Analysis Workflow (LangGraph)
 * 
 * A LangGraph-based workflow for AI-powered content analysis.
 * Uses LLM to perform sentiment analysis, summarization, categorization,
 * and entity extraction with real AI (not simulated).
 * 
 * Graph Structure:
 * 
 *   START
 *     │
 *     ▼
 * [validateContent]  ← Check input validity
 *     │
 *     ├── (invalid) ──→ [error] ──→ END
 *     │
 *     ▼
 * [performAnalysis]  ← LLM-powered analysis based on type
 *     │
 *     ▼
 * [formatResults]    ← Structure the response
 *     │
 *     ▼
 *   END
 */

import { StateGraph, END } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import { createOpenRouterModel } from '../../llm/openrouter';
import { isLLMConfigured } from '../../llm/openrouter';

// ── Types ────────────────────────────────────────────────────────────

export interface AnalysisWorkflowInput {
  content: string;
  analysisType: 'sentiment' | 'summary' | 'categorize' | 'extract';
}

interface AnalysisState {
  input: AnalysisWorkflowInput;
  validationResult?: { isValid: boolean; reason?: string };
  analysisResult?: {
    analysis: string;
    confidence: number;
    categories?: string[];
    usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  };
  error?: string;
  completed: boolean;
}

// ── Annotation ───────────────────────────────────────────────────────

const AnalysisAnnotation = Annotation.Root({
  input: Annotation<AnalysisWorkflowInput>(),
  validationResult: Annotation<AnalysisState['validationResult'] | undefined>(),
  analysisResult: Annotation<AnalysisState['analysisResult'] | undefined>(),
  error: Annotation<string | undefined>(),
  completed: Annotation<boolean>(),
});

// ── Node Functions ───────────────────────────────────────────────────

/**
 * Validate the input content.
 */
async function validateContent(state: typeof AnalysisAnnotation.State) {
  const { content } = state.input;

  if (!content || content.trim().length === 0) {
    return {
      validationResult: { isValid: false, reason: 'Content is empty' },
      error: 'Content validation failed: empty content',
      completed: true,
    };
  }

  if (content.length > 50000) {
    return {
      validationResult: { isValid: false, reason: 'Content exceeds maximum length of 50000 characters' },
      error: 'Content validation failed: too long',
      completed: true,
    };
  }

  return {
    validationResult: { isValid: true },
  };
}

/**
 * Perform LLM-powered analysis.
 * Falls back to rule-based analysis if LLM is not configured.
 */
async function performAnalysis(state: typeof AnalysisAnnotation.State) {
  const { content, analysisType } = state.input;

  if (!state.validationResult?.isValid) {
    return {
      error: state.validationResult?.reason || 'Invalid content',
      completed: true,
    };
  }

  try {
    let result: AnalysisState['analysisResult'];

    if (isLLMConfigured()) {
      result = await analyzeWithLLM(content, analysisType);
    } else {
      result = analyzeWithRules(content, analysisType);
    }

    return { analysisResult: result };
  } catch (error) {
    return {
      error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      completed: true,
    };
  }
}

/**
 * Format the final results.
 */
async function formatResults(state: typeof AnalysisAnnotation.State) {
  if (state.error) {
    return {
      completed: true,
    };
  }

  return {
    completed: true,
  };
}

// ── LLM Analysis ─────────────────────────────────────────────────────

async function analyzeWithLLM(
  content: string,
  analysisType: string
): Promise<AnalysisState['analysisResult']> {
  const model = createOpenRouterModel({ temperature: 0.3 });

  const prompts: Record<string, string> = {
    sentiment: `Analyze the sentiment of this content. Return a JSON object with:
- analysis: "POSITIVE", "NEGATIVE", or "NEUTRAL"
- confidence: 0-1 score
- categories: array of key emotional tones detected

Content: "${content.slice(0, 8000)}"`,

    summary: `Summarize this content concisely. Return a JSON object with:
- analysis: the summary text (2-4 sentences)
- confidence: 0-1 score
- categories: array of key topics

Content: "${content.slice(0, 8000)}"`,

    categorize: `Categorize this content. Return a JSON object with:
- analysis: brief description of the categories
- confidence: 0-1 score
- categories: array of relevant categories (Technology, Business, Science, Health, Entertainment, etc.)

Content: "${content.slice(0, 8000)}"`,

    extract: `Extract entities from this content. Return a JSON object with:
- analysis: summary of entities found
- confidence: 0-1 score
- categories: array of extracted entities (emails, URLs, phone numbers, names, etc.)

Content: "${content.slice(0, 8000)}"`,
  };

  const prompt = prompts[analysisType] || prompts.summary;

  try {
    const response = await model.invoke([{ role: 'user', content: prompt }]);
    const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        analysis: parsed.analysis || text,
        confidence: parsed.confidence ?? 0.85,
        categories: parsed.categories,
        usage: response.usage_metadata
          ? {
              promptTokens: response.usage_metadata.input_tokens || 0,
              completionTokens: response.usage_metadata.output_tokens || 0,
              totalTokens: response.usage_metadata.total_tokens || 0,
            }
          : undefined,
      };
    }

    return {
      analysis: text,
      confidence: 0.8,
    };
  } catch {
    return analyzeWithRules(content, analysisType);
  }
}

// ── Rule-based Analysis (fallback) ───────────────────────────────────

function analyzeWithRules(
  content: string,
  analysisType: string
): AnalysisState['analysisResult'] {
  const lowerContent = content.toLowerCase();

  switch (analysisType) {
    case 'sentiment': {
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'happy', 'love', 'best'];
      const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'sad', 'hate', 'worst'];
      const positiveCount = positiveWords.filter((w) => lowerContent.includes(w)).length;
      const negativeCount = negativeWords.filter((w) => lowerContent.includes(w)).length;

      return {
        analysis: positiveCount > negativeCount ? 'POSITIVE' : negativeCount > positiveCount ? 'NEGATIVE' : 'NEUTRAL',
        confidence: 0.7,
      };
    }

    case 'summary': {
      const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const summary = sentences.length <= 2
        ? content
        : `${sentences[0].trim()}. ${sentences[sentences.length - 1].trim()}.`;
      return { analysis: summary, confidence: 0.65 };
    }

    case 'categorize': {
      const categoryMap: Record<string, string[]> = {
        Technology: ['software', 'computer', 'code', 'api', 'database', 'tech'],
        Business: ['revenue', 'profit', 'sales', 'marketing', 'customer'],
        Science: ['research', 'experiment', 'data', 'study', 'analysis'],
        Health: ['health', 'medical', 'patient', 'treatment', 'doctor'],
        Entertainment: ['movie', 'music', 'game', 'show', 'film'],
      };
      const categories = Object.entries(categoryMap)
        .filter(([, keywords]) => keywords.some((k) => lowerContent.includes(k)))
        .map(([category]) => category);

      return {
        analysis: `Content categorized into ${categories.length || 1} categories`,
        confidence: 0.65,
        categories: categories.length > 0 ? categories : ['General'],
      };
    }

    case 'extract': {
      const entities: string[] = [];
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
      const urlRegex = /https?:\/\/[^\s]+/g;
      const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;

      const emails = content.match(emailRegex);
      const urls = content.match(urlRegex);
      const phones = content.match(phoneRegex);

      if (emails) entities.push(...emails.map((e) => `Email: ${e}`));
      if (urls) entities.push(...urls.map((u) => `URL: ${u}`));
      if (phones) entities.push(...phones.map((p) => `Phone: ${p}`));

      return {
        analysis: `Extracted ${entities.length} entities`,
        confidence: 0.75,
        categories: entities.length > 0 ? entities : ['No entities found'],
      };
    }

    default:
      return { analysis: 'Unknown analysis type', confidence: 0 };
  }
}

// ── Graph Builder ────────────────────────────────────────────────────

export function createAnalysisWorkflow() {
  const graph = new StateGraph(AnalysisAnnotation)
    .addNode('validateContent', validateContent)
    .addNode('performAnalysis', performAnalysis)
    .addNode('formatResults', formatResults)
    .addNode('error', async (state: typeof AnalysisAnnotation.State) => ({
      ...state,
      completed: true,
      error: state.error || 'Analysis workflow encountered an error',
    }))
    .addEdge('__start__', 'validateContent')
    .addConditionalEdges('validateContent', (state: typeof AnalysisAnnotation.State) => {
      if (state.validationResult?.isValid === false) {
        return 'error';
      }
      return 'performAnalysis';
    })
    .addEdge('performAnalysis', 'formatResults')
    .addEdge('formatResults', '__end__')
    .addEdge('error', '__end__');

  return graph.compile();
}

export type AnalysisWorkflow = ReturnType<typeof createAnalysisWorkflow>;
