import { query, queryOne } from './db';
import type {
  WorkflowExecution,
  Approval,
  AuditLog,
  WorkflowConfig,
  WorkflowParams,
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
    const result = await queryOne<WorkflowExecution>(
      `INSERT INTO workflow_executions (workflow_name, workflow_id, status, input_data, output_data, error_message, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        execution.workflow_name,
        execution.workflow_id,
        execution.status,
        execution.input_data ? JSON.stringify(execution.input_data) : null,
        execution.output_data ? JSON.stringify(execution.output_data) : null,
        execution.error_message || null,
        execution.completed_at || null,
      ]
    );
    return result;
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
    const executions = await query<WorkflowExecution>(
      `SELECT * FROM workflow_executions
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM workflow_executions'
    );

    return {
      executions,
      total: parseInt(countResult?.count || '0', 10),
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
    const now = new Date().toISOString();
    const completedAt = status === 'SUCCESS' || status === 'ERROR' ? now : null;

    const fields: string[] = ['status = $1'];
    const values: unknown[] = [status];
    let paramIndex = 2;

    if (additionalData) {
      if (additionalData.error_message !== undefined) {
        fields.push(`error_message = $${paramIndex++}`);
        values.push(additionalData.error_message);
      }
      if (additionalData.output_data !== undefined) {
        fields.push(`output_data = $${paramIndex++}`);
        values.push(JSON.stringify(additionalData.output_data));
      }
    }

    if (completedAt) {
      fields.push(`completed_at = $${paramIndex++}`);
      values.push(completedAt);
    }

    values.push(id);
    await query(
      `UPDATE workflow_executions SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

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
    const result = await queryOne<Approval>(
      `INSERT INTO approvals (workflow_execution_id, workflow_name, action, description, status, requested_by, requested_by_email, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        approval.workflow_execution_id || null,
        approval.workflow_name,
        approval.action,
        approval.description,
        approval.status || 'pending',
        approval.requested_by || null,
        approval.requested_by_email || null,
        approval.metadata ? JSON.stringify(approval.metadata) : null,
      ]
    );
    return result;
  } catch (error) {
    console.error('Error saving approval:', error);
    return null;
  }
}

export async function getApprovals(
  status?: 'pending' | 'approved' | 'rejected'
): Promise<Approval[]> {
  try {
    if (status) {
      return await query<Approval>(
        `SELECT * FROM approvals
         WHERE status = $1
         ORDER BY created_at DESC`,
        [status]
      );
    }
    return await query<Approval>(
      'SELECT * FROM approvals ORDER BY created_at DESC'
    );
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
    await query(
      `UPDATE approvals
       SET status = $1, comment = $2, resolved_by = $3, resolved_at = $4
       WHERE id = $5`,
      [status, comment || null, resolved_by || null, new Date().toISOString(), id]
    );
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
    const result = await queryOne<AuditLog>(
      `INSERT INTO audit_logs (action, resource_type, resource_id, user_id, user_agent, ip_address, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        log.action,
        log.resource_type,
        log.resource_id || null,
        log.user_id || null,
        log.user_agent || null,
        log.ip_address || null,
        log.details ? JSON.stringify(log.details) : null,
      ]
    );
    return result;
  } catch (error) {
    console.error('Error saving audit log:', error);
    return null;
  }
}

export async function getAuditLogs(
  limit = 100
): Promise<AuditLog[]> {
  try {
    return await query<AuditLog>(
      `SELECT * FROM audit_logs
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
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
    const result = await queryOne<WorkflowConfig>(
      `INSERT INTO workflow_configs (workflow_name, config_name, description, params, schedule_type, scheduled_at, cron_expression, enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        config.workflow_name,
        config.config_name,
        config.description || null,
        JSON.stringify(config.params),
        config.schedule_type,
        config.scheduled_at || null,
        config.cron_expression || null,
        config.enabled !== undefined ? config.enabled : true,
      ]
    );
    return result;
  } catch (error) {
    console.error('Error saving workflow config:', error);
    return null;
  }
}

export async function getWorkflowConfigs(
  workflowName?: string
): Promise<WorkflowConfig[]> {
  try {
    if (workflowName) {
      return await query<WorkflowConfig>(
        `SELECT * FROM workflow_configs
         WHERE workflow_name = $1
         ORDER BY created_at DESC`,
        [workflowName]
      );
    }
    return await query<WorkflowConfig>(
      'SELECT * FROM workflow_configs ORDER BY created_at DESC'
    );
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
    const rows = await query<{ status: string }>(
      'SELECT status FROM workflow_executions'
    );

    const total = rows.length;
    const success = rows.filter((r) => r.status === 'SUCCESS').length;
    const pending = rows.filter(
      (r) => r.status === 'PENDING' || r.status === 'ENQUEUED'
    ).length;
    const errorCount = rows.filter((r) => r.status === 'ERROR').length;

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
