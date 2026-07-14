import { query, queryOne } from './db';

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

export async function saveWorkflowExecution(
  execution: Omit<WorkflowExecution, 'id' | 'created_at'>
): Promise<WorkflowExecution | null> {
  try {
    const result = await queryOne<WorkflowExecution>(
      `INSERT INTO workflow_executions (workflow_name, workflow_id, status, completed_at, input_data, output_data, error_message, retry_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        execution.workflow_name,
        execution.workflow_id,
        execution.status,
        execution.completed_at || null,
        execution.input_data ? JSON.stringify(execution.input_data) : null,
        execution.output_data ? JSON.stringify(execution.output_data) : null,
        execution.error_message || null,
        execution.retry_count || 0,
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

export async function getWorkflowStats(): Promise<WorkflowStats> {
  try {
    const rows = await query<{
      status: string;
      completed_at: string | null;
      created_at: string;
    }>('SELECT status, completed_at, created_at FROM workflow_executions');

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
      success_rate:
        total > 0 ? Math.round((success / total) * 100) : 0,
    };
  } catch (error) {
    console.error('Error getting workflow stats:', error);
    return { total: 0, success: 0, pending: 0, error: 0, success_rate: 0 };
  }
}

export async function getWorkflowById(
  id: string
): Promise<WorkflowExecution | null> {
  try {
    return await queryOne<WorkflowExecution>(
      'SELECT * FROM workflow_executions WHERE id = $1',
      [id]
    );
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
    const now = new Date().toISOString();
    const completedAt =
      status === 'SUCCESS' || status === 'ERROR' ? now : null;

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
      if (additionalData.retry_count !== undefined) {
        fields.push(`retry_count = $${paramIndex++}`);
        values.push(additionalData.retry_count);
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
    console.error('Error updating workflow status:', error);
    return false;
  }
}
