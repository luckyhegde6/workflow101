import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowStatus, retryWorkflow } from '../../../actions';

interface RouteParams {
  params: Promise<{ workflowId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { workflowId } = await params;
  
  const result = await getWorkflowStatus(workflowId);
  
  return NextResponse.json(result, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { workflowId } = await params;
  
  const result = await retryWorkflow(workflowId);
  
  return NextResponse.json(result, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
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
