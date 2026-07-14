import { Pool } from 'pg';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DBOS_SYSTEM_DATABASE_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/workflow101';

    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function query<T extends Row = Row>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query<T>(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function queryOne<T extends Row = Row>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export async function initializeDatabase(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS workflow_executions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      workflow_name TEXT NOT NULL,
      workflow_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      input_data JSONB,
      output_data JSONB,
      error_message TEXT,
      retry_count INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS workflow_configs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      workflow_name TEXT NOT NULL,
      config_name TEXT NOT NULL,
      description TEXT,
      params JSONB DEFAULT '{}',
      schedule_type TEXT DEFAULT 'immediate',
      scheduled_at TIMESTAMPTZ,
      cron_expression TEXT,
      enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      last_triggered_at TIMESTAMPTZ,
      trigger_count INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
      workflow_name TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      requested_by TEXT,
      requested_by_email TEXT,
      comment TEXT,
      resolved_by TEXT,
      resolved_at TIMESTAMPTZ,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      user_id TEXT,
      user_agent TEXT,
      ip_address TEXT,
      details JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
    CREATE INDEX IF NOT EXISTS idx_workflow_executions_created_at ON workflow_executions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_name ON workflow_executions(workflow_name);
    CREATE INDEX IF NOT EXISTS idx_workflow_configs_workflow_name ON workflow_configs(workflow_name);
    CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
    CREATE INDEX IF NOT EXISTS idx_approvals_workflow_execution_id ON approvals(workflow_execution_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
  `);
}
