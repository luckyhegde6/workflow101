import { NextResponse } from 'next/server';
import { getApproval } from '../../../lib/approvals';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const approval = getApproval(id);

    if (!approval) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      approval 
    });
  } catch (error) {
    console.error('Failed to get approval:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
