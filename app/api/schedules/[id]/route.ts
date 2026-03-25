import { NextResponse } from 'next/server';
import { cancelScheduledWorkflow } from '../../../actions';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }
    
    const result = await cancelScheduledWorkflow(id);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to cancel scheduled workflow:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
