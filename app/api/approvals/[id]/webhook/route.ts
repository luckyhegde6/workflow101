import { NextResponse } from 'next/server';
import { approveRequest, rejectRequest } from '../../../../lib/approvals';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { approved, comment, resolvedBy } = body;

    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'approved (boolean) is required' },
        { status: 400 }
      );
    }

    let approval;
    if (approved) {
      approval = await approveRequest(id, comment, resolvedBy);
    } else {
      approval = await rejectRequest(id, comment, resolvedBy);
    }

    return NextResponse.json({ 
      success: true, 
      approval 
    });
  } catch (error) {
    console.error('Failed to process webhook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    );
  }
}
