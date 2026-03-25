-- Migration: 20260325000000_initial_schema
-- Description: Initial schema for workflow executions and approvals

-- Create workflow_executions table
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

-- Create workflow_configs table for storing workflow configurations
CREATE TABLE IF NOT EXISTS workflow_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  config_name TEXT NOT NULL,
  description TEXT,
  params JSONB DEFAULT '{}',
  schedule_type TEXT DEFAULT 'immediate' CHECK (schedule_type IN ('immediate', 'scheduled', 'recurring')),
  scheduled_at TIMESTAMPTZ,
  cron_expression TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ,
  trigger_count INT DEFAULT 0
);

-- Create approvals table
CREATE TABLE IF NOT EXISTS approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
  workflow_name TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by TEXT,
  requested_by_email TEXT,
  comment TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created_at ON workflow_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_name ON workflow_executions(workflow_name);
CREATE INDEX IF NOT EXISTS idx_workflow_configs_workflow_name ON workflow_configs(workflow_name);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_workflow_execution_id ON approvals(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust for production)
CREATE POLICY "Allow all on workflow_executions" ON workflow_executions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on workflow_configs" ON workflow_configs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on approvals" ON approvals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on audit_logs" ON audit_logs
  FOR ALL USING (true) WITH CHECK (true);
