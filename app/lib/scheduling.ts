export interface ScheduledWorkflow {
  id: string;
  workflowName: string;
  params: Record<string, unknown>;
  scheduledAt: Date;
  scheduledBy?: string;
  cronExpression?: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    retries?: number;
    timeout?: number;
    priority?: 'low' | 'normal' | 'high';
    tags?: string[];
  };
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: 'scheduled' | 'enqueued' | 'started' | 'completed' | 'failed' | 'cancelled' | 'updated' | 'deleted';
  workflowId: string;
  workflowName: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  details: {
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
    scheduledTime?: Date;
    cronExpression?: string;
    params?: Record<string, unknown>;
    error?: string;
  };
}

export interface ScheduleConfig {
  type: 'immediate' | 'scheduled' | 'recurring';
  scheduledAt?: Date;
  cronExpression?: string;
  timezone?: string;
  metadata?: ScheduledWorkflow['metadata'];
}

export interface CronConfig {
  expression: string;
  enabled: boolean;
  timezone?: string;
  description?: string;
  lastRun?: Date;
  nextRun?: Date;
}

export const CRON_PRESETS = {
  everyMinute: { expression: '* * * * *', description: 'Every minute' },
  every5Minutes: { expression: '*/5 * * * *', description: 'Every 5 minutes' },
  every15Minutes: { expression: '*/15 * * * *', description: 'Every 15 minutes' },
  every30Minutes: { expression: '*/30 * * * *', description: 'Every 30 minutes' },
  hourly: { expression: '0 * * * *', description: 'Every hour' },
  daily: { expression: '0 0 * * *', description: 'Daily at midnight' },
  dailyNoon: { expression: '0 12 * * *', description: 'Daily at noon' },
  weekly: { expression: '0 0 * * 0', description: 'Weekly on Sunday' },
  monthly: { expression: '0 0 1 * *', description: 'Monthly on the 1st' },
} as const;

export const SCHEDULE_TYPES = {
  IMMEDIATE: 'immediate',
  SCHEDULED: 'scheduled',
  RECURRING: 'recurring',
} as const;

export type ScheduleType = (typeof SCHEDULE_TYPES)[keyof typeof SCHEDULE_TYPES];
