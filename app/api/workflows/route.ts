import { NextRequest, NextResponse } from 'next/server';
import { enqueueWorkflow, listWorkflows, retryWorkflow } from '../../actions';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workflowName = searchParams.get('name') || undefined;

  const result = await listWorkflows(workflowName);

  return NextResponse.json(result, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowName, params } = body;

    if (!workflowName) {
      return NextResponse.json(
        { success: false, error: 'workflowName is required' },
        { status: 400 }
      );
    }

    const result = await enqueueWorkflow(workflowName, params);

    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

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
