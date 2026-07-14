/**
 * Orchestrator API Route
 * 
 * Next.js API route that exposes the LangGraph orchestrator agent.
 * Accepts natural language requests and returns workflow orchestration results.
 * 
 * POST /api/orchestrator
 * {
 *   "input": "Send an email notification to user@example.com",
 *   "stream": false
 * }
 * 
 * GET /api/orchestrator
 * Returns orchestrator status and available workflows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { OrchestratorAgent } from '@/app/lib/orchestrator/agent';
import { isLLMConfigured } from '@/app/lib/llm/openrouter';
import { enqueueWorkflow } from '@/app/actions';

/**
 * POST /api/orchestrator
 * 
 * Run the orchestrator with a natural language request.
 * Optionally stream results for real-time UI updates.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, stream = false } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Input is required and must be a string' },
        { status: 400 }
      );
    }

    // If streaming is requested, use SSE
    if (stream) {
      const agent = new OrchestratorAgent();
      const streamGenerator = agent.stream({ input });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamGenerator) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
              );
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (error) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  step: 'error',
                  state: { error: error instanceof Error ? error.message : 'Stream error' },
                })}\n\n`
              )
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming: run the full orchestrator and return results
    const agent = new OrchestratorAgent();
    const result = await agent.run({ input });

    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        response: `Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orchestrator
 * 
 * Returns orchestrator status, configuration, and available workflows.
 */
export async function GET() {
  const llmConfigured = isLLMConfigured();

  return NextResponse.json({
    status: 'operational',
    llm: {
      configured: llmConfigured,
      provider: 'openrouter',
      model: process.env.OPENROUTER_MODEL || 'openrouter/auto',
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    },
    workflows: {
      available: [
        { name: 'exampleWorkflow', description: 'Basic workflow for testing' },
        { name: 'emailNotificationWorkflow', description: 'Send email notifications' },
        { name: 'dataProcessingWorkflow', description: 'Process and transform data' },
        { name: 'onboardingWorkflow', description: 'User onboarding flow' },
        { name: 'scheduledReportWorkflow', description: 'Generate scheduled reports' },
        { name: 'webhookHandlerWorkflow', description: 'Handle webhook events' },
        { name: 'aiAnalysisWorkflow', description: 'AI content analysis (sentiment, summary, categorization)' },
      ],
    },
    capabilities: [
      'Natural language workflow execution',
      'Workflow status checking',
      'Workflow listing',
      'Content analysis (with LLM configured)',
    ],
  });
}

/**
 * OPTIONS /api/orchestrator
 * 
 * CORS preflight handling.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
