import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '../../actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowName = searchParams.get('workflowName') || undefined;
    
    const result = await getAuditLogs(workflowName);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      entries: result.entries 
    });
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
