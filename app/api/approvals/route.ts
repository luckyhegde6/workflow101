import { NextResponse } from 'next/server';
import { 
  requestApproval, 
  getPendingApprovals, 
  getAllApprovals 
} from '../../lib/approvals';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    const workflowName = searchParams.get('workflowName');

    let approvals;
    if (status === 'pending') {
      approvals = getPendingApprovals();
    } else if (status) {
      approvals = getAllApprovals({ status });
    } else {
      approvals = getAllApprovals(workflowName ? { workflowName } : undefined);
    }

    return NextResponse.json({ 
      success: true, 
      approvals 
    });
  } catch (error) {
    console.error('Failed to get approvals:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workflowName, action, description, requestedBy, requestedByEmail, expiresInMinutes, metadata } = body;

    if (!workflowName || !action || !description) {
      return NextResponse.json(
        { error: 'workflowName, action, and description are required' },
        { status: 400 }
      );
    }

    const result = await requestApproval({
      workflowName,
      action,
      description,
      requestedBy,
      requestedByEmail,
      expiresInMinutes,
      metadata,
    });

    return NextResponse.json({ 
      success: true, 
      ...result 
    });
  } catch (error) {
    console.error('Failed to request approval:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
