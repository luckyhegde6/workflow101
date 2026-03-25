import { NextResponse } from 'next/server';
import { approveRequest } from '../../../../lib/approvals';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { comment, resolvedBy } = body;

    const approval = await approveRequest(id, comment, resolvedBy);

    return NextResponse.json({ 
      success: true, 
      approval 
    });
  } catch (error) {
    console.error('Failed to approve request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    );
  }
}
