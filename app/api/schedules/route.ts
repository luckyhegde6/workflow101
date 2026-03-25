import { NextResponse } from 'next/server';
import { getScheduledWorkflows, scheduleWorkflow } from '../../actions';

export async function GET() {
  try {
    const result = await getScheduledWorkflows();
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      workflows: result.workflows 
    });
  } catch (error) {
    console.error('Failed to list scheduled workflows:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workflowName, params, config } = body;
    
    if (!workflowName) {
      return NextResponse.json(
        { error: 'workflowName is required' },
        { status: 400 }
      );
    }
    
    const result = await scheduleWorkflow(workflowName, params, config);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      auditId: result.auditId 
    });
  } catch (error) {
    console.error('Failed to schedule workflow:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
