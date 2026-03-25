import { createClient } from '../utils/supabase/server';
import type { 
  WorkflowExecution, 
  Approval, 
  AuditLog, 
  WorkflowConfig,
  WorkflowParams 
} from './workflow-types';

export async function saveWorkflowExecution(execution: {
  workflow_name: string;
  workflow_id: string;
  status: 'PENDING' | 'SUCCESS' | 'ERROR' | 'ENQUEUED';
  input_data?: WorkflowParams;
  output_data?: WorkflowParams;
  error_message?: string;
  completed_at?: string;
}): Promise<WorkflowExecution | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('workflow_executions')
      .insert(execution)
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

export async function updateWorkflowExecutionStatus(
  id: string,
  status: WorkflowExecution['status'],
  additionalData?: Partial<WorkflowExecution>
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const updateData: Record<string, unknown> = { 
      ...additionalData,
      status,
    };

    if (status === 'SUCCESS' || status === 'ERROR') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('workflow_executions')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Failed to update workflow execution status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating workflow execution status:', error);
    return false;
  }
}

export async function saveApproval(approval: {
  workflow_execution_id?: string;
  workflow_name: string;
  action: string;
  description: string;
  status?: 'pending' | 'approved' | 'rejected';
  requested_by?: string;
  requested_by_email?: string;
  metadata?: WorkflowParams;
}): Promise<Approval | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('approvals')
      .insert(approval)
      .select()
      .single();

    if (error) {
      console.error('Failed to save approval:', error);
      return null;
    }

    return data as Approval;
  } catch (error) {
    console.error('Error saving approval:', error);
    return null;
  }
}

export async function getApprovals(
  status?: 'pending' | 'approved' | 'rejected'
): Promise<Approval[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('approvals')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get approvals:', error);
      return [];
    }

    return (data || []) as Approval[];
  } catch (error) {
    console.error('Error getting approvals:', error);
    return [];
  }
}

export async function updateApprovalStatus(
  id: string,
  status: 'approved' | 'rejected',
  comment?: string,
  resolved_by?: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('approvals')
      .update({
        status,
        comment,
        resolved_by,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to update approval status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating approval status:', error);
    return false;
  }
}

export async function saveAuditLog(log: {
  action: string;
  resource_type: string;
  resource_id?: string;
  user_id?: string;
  user_agent?: string;
  ip_address?: string;
  details?: WorkflowParams;
}): Promise<AuditLog | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('audit_logs')
      .insert(log)
      .select()
      .single();

    if (error) {
      console.error('Failed to save audit log:', error);
      return null;
    }

    return data as AuditLog;
  } catch (error) {
    console.error('Error saving audit log:', error);
    return null;
  }
}

export async function getAuditLogs(
  limit = 100
): Promise<AuditLog[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }

    return (data || []) as AuditLog[];
  } catch (error) {
    console.error('Error getting audit logs:', error);
    return [];
  }
}

export async function saveWorkflowConfig(config: {
  workflow_name: string;
  config_name: string;
  description?: string;
  params: WorkflowParams;
  schedule_type: 'immediate' | 'scheduled' | 'recurring';
  scheduled_at?: string;
  cron_expression?: string;
  enabled?: boolean;
}): Promise<WorkflowConfig | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('workflow_configs')
      .insert(config)
      .select()
      .single();

    if (error) {
      console.error('Failed to save workflow config:', error);
      return null;
    }

    return data as WorkflowConfig;
  } catch (error) {
    console.error('Error saving workflow config:', error);
    return null;
  }
}

export async function getWorkflowConfigs(
  workflowName?: string
): Promise<WorkflowConfig[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('workflow_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (workflowName) {
      query = query.eq('workflow_name', workflowName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get workflow configs:', error);
      return [];
    }

    return (data || []) as WorkflowConfig[];
  } catch (error) {
    console.error('Error getting workflow configs:', error);
    return [];
  }
}

export async function getWorkflowStats(): Promise<{
  total: number;
  success: number;
  pending: number;
  error: number;
  success_rate: number;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('status');

    if (error) {
      console.error('Failed to get workflow stats:', error);
      return { total: 0, success: 0, pending: 0, error: 0, success_rate: 0 };
    }

    const executions = data || [];
    const total = executions.length;
    const success = executions.filter((e) => e.status === 'SUCCESS').length;
    const pending = executions.filter((e) => e.status === 'PENDING' || e.status === 'ENQUEUED').length;
    const errorCount = executions.filter((e) => e.status === 'ERROR').length;

    return {
      total,
      success,
      pending,
      error: errorCount,
      success_rate: total > 0 ? Math.round((success / total) * 100) : 0,
    };
  } catch (error) {
    console.error('Error getting workflow stats:', error);
    return { total: 0, success: 0, pending: 0, error: 0, success_rate: 0 };
  }
}
