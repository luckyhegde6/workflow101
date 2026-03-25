export type ScheduleType = 'immediate' | 'scheduled' | 'recurring';

export type WorkflowType = 
  | 'exampleWorkflow'
  | 'emailNotificationWorkflow'
  | 'dataProcessingWorkflow'
  | 'onboardingWorkflow'
  | 'scheduledReportWorkflow'
  | 'webhookHandlerWorkflow';

export interface WorkflowParams {
  [key: string]: unknown;
}

export interface WorkflowConfig {
  id?: string;
  workflowType: WorkflowType;
  workflowName: string;
  params: WorkflowParams;
  scheduleType: ScheduleType;
  scheduledAt?: Date;
  cronExpression?: string;
  enabled?: boolean;
}

export interface WorkflowConfigStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export const WORKFLOW_STEPS: WorkflowConfigStep[] = [
  { id: 1, title: 'Select Workflow', description: 'Choose the workflow type', completed: false, current: true },
  { id: 2, title: 'Configure Parameters', description: 'Set workflow parameters', completed: false, current: false },
  { id: 3, title: 'Schedule', description: 'Set execution schedule', completed: false, current: false },
  { id: 4, title: 'Review & Confirm', description: 'Review and submit', completed: false, current: false },
];

export interface CronPreset {
  expression: string;
  label: string;
  description: string;
}

export const CRON_PRESETS: Record<string, CronPreset> = {
  everyMinute: { expression: '* * * * *', label: 'Every minute', description: 'Runs every minute' },
  every5Minutes: { expression: '*/5 * * * *', label: 'Every 5 minutes', description: 'Runs every 5 minutes' },
  every15Minutes: { expression: '*/15 * * * *', label: 'Every 15 minutes', description: 'Runs every 15 minutes' },
  every30Minutes: { expression: '*/30 * * * *', label: 'Every 30 minutes', description: 'Runs every 30 minutes' },
  hourly: { expression: '0 * * * *', label: 'Hourly', description: 'Runs at the start of every hour' },
  daily: { expression: '0 0 * * *', label: 'Daily', description: 'Runs at midnight every day' },
  dailyNoon: { expression: '0 12 * * *', label: 'Daily at noon', description: 'Runs at noon every day' },
  weekly: { expression: '0 0 * * 0', label: 'Weekly', description: 'Runs at midnight every Sunday' },
  monthly: { expression: '0 0 1 * *', label: 'Monthly', description: 'Runs at midnight on the 1st of each month' },
};

export interface ConfirmationData {
  workflowType: WorkflowType;
  workflowName: string;
  params: WorkflowParams;
  scheduleType: ScheduleType;
  scheduledAt?: Date;
  cronExpression?: string;
  cronDescription?: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_name: string;
  workflow_id: string;
  status: 'PENDING' | 'SUCCESS' | 'ERROR' | 'ENQUEUED';
  created_at: string;
  completed_at?: string;
  input_data?: WorkflowParams;
  output_data?: WorkflowParams;
  error_message?: string;
  retry_count?: number;
}

export interface Approval {
  id: string;
  workflow_execution_id?: string;
  workflow_name: string;
  action: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by?: string;
  requested_by_email?: string;
  comment?: string;
  resolved_by?: string;
  resolved_at?: string;
  metadata?: WorkflowParams;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  user_id?: string;
  user_agent?: string;
  ip_address?: string;
  details?: WorkflowParams;
  created_at: string;
}
