import { createClient } from '../utils/supabase/server';

export interface WorkflowExecution {
  id: string;
  workflow_name: string;
  workflow_id: string;
  status: 'PENDING' | 'SUCCESS' | 'ERROR' | 'ENQUEUED';
  created_at: string;
  completed_at?: string;
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  error_message?: string;
  retry_count?: number;
}

export interface WorkflowStats {
  total: number;
  success: number;
  pending: number;
  error: number;
  success_rate: number;
  avg_duration_ms?: number;
}

export async function saveWorkflowExecution(execution: Omit<WorkflowExecution, 'id' | 'created_at'>): Promise<WorkflowExecution | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_name: execution.workflow_name,
        workflow_id: execution.workflow_id,
        status: execution.status,
        completed_at: execution.completed_at,
        input_data: execution.input_data,
        output_data: execution.output_data,
        error_message: execution.error_message,
        retry_count: execution.retry_count,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save workflow execution:', error);
      return null;
    }

    return data as WorkflowExecution;
  } catch (error) {
    console.error('Error saving workflow execution:', error);
    return null;
  }
}

export async function getWorkflowExecutions(
  limit = 50,
  offset = 0
): Promise<{ executions: WorkflowExecution[]; total: number }> {
  try {
    const supabase = await createClient();
    
    const { data, error, count } = await supabase
      .from('workflow_executions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to get workflow executions:', error);
      return { executions: [], total: 0 };
    }

    return { 
      executions: (data || []) as WorkflowExecution[], 
      total: count || 0 
    };
  } catch (error) {
    console.error('Error getting workflow executions:', error);
    return { executions: [], total: 0 };
  }
}

export async function getWorkflowStats(): Promise<WorkflowStats> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('status, completed_at, created_at');

    if (error) {
      console.error('Failed to get workflow stats:', error);
      return { total: 0, success: 0, pending: 0, error: 0, success_rate: 0 };
    }

    const executions = data || [];
    const stats = {
      total: executions.length,
      success: executions.filter((e) => e.status === 'SUCCESS').length,
      pending: executions.filter((e) => e.status === 'PENDING' || e.status === 'ENQUEUED').length,
      error: executions.filter((e) => e.status === 'ERROR').length,
      success_rate: executions.length > 0 
        ? Math.round((executions.filter((e) => e.status === 'SUCCESS').length / executions.length) * 100)
        : 0,
    };

    return stats;
  } catch (error) {
    console.error('Error getting workflow stats:', error);
    return { total: 0, success: 0, pending: 0, error: 0, success_rate: 0 };
  }
}

export async function getWorkflowById(id: string): Promise<WorkflowExecution | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to get workflow by id:', error);
      return null;
    }

    return data as WorkflowExecution;
  } catch (error) {
    console.error('Error getting workflow by id:', error);
    return null;
  }
}

export async function updateWorkflowStatus(
  id: string,
  status: WorkflowExecution['status'],
  additionalData?: Partial<WorkflowExecution>
): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const updateData: Partial<WorkflowExecution> = { 
      ...additionalData,
      status,
      ...(status === 'SUCCESS' || status === 'ERROR' ? { completed_at: new Date().toISOString() } : {}),
    };

    const { error } = await supabase
      .from('workflow_executions')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Failed to update workflow status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating workflow status:', error);
    return false;
  }
}
