import { DBOS } from '@dbos-inc/dbos-sdk';

export interface AIAnalysisInput {
  content: string;
  analysisType: 'sentiment' | 'summary' | 'categorize' | 'extract';
}

export interface AIAnalysisResult {
  success: boolean;
  analysis: string;
  confidence?: number;
  categories?: string[];
}

async function sleepStep(seconds: number) {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export async function aiAnalysisWorkflow(input: AIAnalysisInput): Promise<{
  workflowId: string;
  result: AIAnalysisResult;
  processedAt: string;
}> {
  'use workflow';

  const workflowId = `ai-${Date.now()}`;

  DBOS.logger.info(`Starting AI analysis workflow: ${workflowId}`);
  DBOS.logger.info(`Analysis type: ${input.analysisType}`);

  await sleepStep(1);

  const validationResult = await validateContentStep(input.content);
  if (!validationResult.isValid) {
    DBOS.logger.error('Content validation failed');
    return {
      workflowId,
      result: {
        success: false,
        analysis: 'Content validation failed',
      },
      processedAt: new Date().toISOString(),
    };
  }

  await sleepStep(1);

  const analysisResult = await performAnalysisStep(input);

  DBOS.logger.info(`AI analysis completed: ${workflowId}`);

  return {
    workflowId,
    result: {
      success: true,
      analysis: analysisResult.analysis,
      confidence: analysisResult.confidence,
      categories: analysisResult.categories,
    },
    processedAt: new Date().toISOString(),
  };
}

async function validateContentStep(content: string): Promise<{ isValid: boolean; reason?: string }> {
  'use step';

  await sleepStep(0.5);

  if (!content || content.trim().length === 0) {
    return { isValid: false, reason: 'Content is empty' };
  }

  if (content.length > 10000) {
    return { isValid: false, reason: 'Content exceeds maximum length' };
  }

  return { isValid: true };
}

async function performAnalysisStep(input: AIAnalysisInput): Promise<{
  analysis: string;
  confidence: number;
  categories?: string[];
}> {
  'use step';

  await sleepStep(1);

  switch (input.analysisType) {
    case 'sentiment':
      return {
        analysis: simulateSentimentAnalysis(input.content),
        confidence: 0.92,
      };

    case 'summary':
      return {
        analysis: simulateSummarization(input.content),
        confidence: 0.88,
      };

    case 'categorize':
      const categories = simulateCategorization(input.content);
      return {
        analysis: `Content categorized into ${categories.length} categories`,
        confidence: 0.85,
        categories,
      };

    case 'extract':
      const entities = simulateEntityExtraction(input.content);
      return {
        analysis: `Extracted ${entities.length} entities`,
        confidence: 0.90,
        categories: entities,
      };

    default:
      return {
        analysis: 'Unknown analysis type',
        confidence: 0,
      };
  }
}

function simulateSentimentAnalysis(content: string): string {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'love', 'best'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'sad', 'hate', 'worst', 'poor'];

  const lowerContent = content.toLowerCase();
  const positiveCount = positiveWords.filter((word) => lowerContent.includes(word)).length;
  const negativeCount = negativeWords.filter((word) => lowerContent.includes(word)).length;

  if (positiveCount > negativeCount) {
    return 'POSITIVE';
  } else if (negativeCount > positiveCount) {
    return 'NEGATIVE';
  }
  return 'NEUTRAL';
}

function simulateSummarization(content: string): string {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  if (sentences.length <= 2) {
    return content;
  }

  const firstSentence = sentences[0].trim();
  const lastSentence = sentences[sentences.length - 1].trim();

  return `${firstSentence}. ${lastSentence}.`;
}

function simulateCategorization(content: string): string[] {
  const categories: string[] = [];
  const lowerContent = content.toLowerCase();

  const categoryMap: Record<string, string[]> = {
    Technology: ['software', 'computer', 'code', 'programming', 'api', 'database'],
    Business: ['revenue', 'profit', 'sales', 'marketing', 'customer', 'company'],
    Science: ['research', 'experiment', 'data', 'study', 'analysis', 'results'],
    Health: ['health', 'medical', 'patient', 'treatment', 'doctor', 'hospital'],
    Entertainment: ['movie', 'music', 'game', 'show', 'artist', 'film'],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((keyword) => lowerContent.includes(keyword))) {
      categories.push(category);
    }
  }

  if (categories.length === 0) {
    categories.push('General');
  }

  return categories;
}

function simulateEntityExtraction(content: string): string[] {
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

  return entities;
}

export async function aiBatchAnalysisWorkflow(inputs: AIAnalysisInput[]): Promise<{
  workflowId: string;
  results: AIAnalysisResult[];
  processedAt: string;
}> {
  'use workflow';

  const workflowId = `ai-batch-${Date.now()}`;

  DBOS.logger.info(`Starting batch AI analysis: ${workflowId} with ${inputs.length} items`);

  await sleepStep(1);

  const results: AIAnalysisResult[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];

    DBOS.logger.info(`Processing item ${i + 1}/${inputs.length}`);

    const validationResult = await validateContentStep(input.content);
    if (!validationResult.isValid) {
      results.push({
        success: false,
        analysis: validationResult.reason || 'Validation failed',
      });
      continue;
    }

    const analysisResult = await performAnalysisStep(input);

    results.push({
      success: true,
      analysis: analysisResult.analysis,
      confidence: analysisResult.confidence,
      categories: analysisResult.categories,
    });

    await sleepStep(0.5);
  }

  DBOS.logger.info(`Batch analysis completed: ${workflowId}`);

  return {
    workflowId,
    results,
    processedAt: new Date().toISOString(),
  };
}

export async function aiChainAnalysisWorkflow(
  initialContent: string
): Promise<{
  workflowId: string;
  steps: {
    sentiment: string;
    summary: string;
    categories: string[];
    finalAnalysis: string;
  };
  processedAt: string;
}> {
  'use workflow';

  const workflowId = `ai-chain-${Date.now()}`;

  DBOS.logger.info(`Starting chained AI analysis: ${workflowId}`);

  await sleepStep(1);

  const sentimentResult = await performAnalysisStep({
    content: initialContent,
    analysisType: 'sentiment',
  });

  await sleepStep(0.5);

  const summaryResult = await performAnalysisStep({
    content: initialContent,
    analysisType: 'summary',
  });

  await sleepStep(0.5);

  const categoryResult = await performAnalysisStep({
    content: initialContent,
    analysisType: 'categorize',
  });

  await sleepStep(0.5);

  const finalAnalysis = generateChainAnalysis(
    sentimentResult.analysis,
    summaryResult.analysis,
    categoryResult.categories || []
  );

  DBOS.logger.info(`Chained analysis completed: ${workflowId}`);

  return {
    workflowId,
    steps: {
      sentiment: sentimentResult.analysis,
      summary: summaryResult.analysis,
      categories: categoryResult.categories || [],
      finalAnalysis,
    },
    processedAt: new Date().toISOString(),
  };
}

function generateChainAnalysis(
  sentiment: string,
  summary: string,
  categories: string[]
): string {
  const categoryList = categories.join(', ');
  const confidenceLevel = sentiment === 'POSITIVE' ? 'high' : sentiment === 'NEGATIVE' ? 'moderate concern' : 'neutral';

  return `This ${categoryList} content has a ${sentiment.toLowerCase()} tone with ${confidenceLevel} overall sentiment. Key points: ${summary}`;
}

DBOS.registerWorkflow(aiAnalysisWorkflow, { name: 'aiAnalysisWorkflow' });
DBOS.registerWorkflow(aiBatchAnalysisWorkflow, { name: 'aiBatchAnalysisWorkflow' });
DBOS.registerWorkflow(aiChainAnalysisWorkflow, { name: 'aiChainAnalysisWorkflow' });
