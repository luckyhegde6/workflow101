import type { AuditEntry, ScheduledWorkflow } from './scheduling';
import { logger } from './logging';

class AuditLogger {
  private entries: AuditEntry[] = [];
  private maxEntries = 1000;

  private generateId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const fullEntry: AuditEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date(),
    };

    this.entries.push(fullEntry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    logger.info(`Audit: ${entry.action} - ${entry.workflowName}`, {
      audit: {
        action: entry.action,
        workflowId: entry.workflowId,
        userId: entry.userId,
      },
    });

    return fullEntry;
  }

  logSchedule(
    workflow: ScheduledWorkflow,
    userId?: string,
    userAgent?: string,
    ipAddress?: string
  ): AuditEntry {
    return this.log({
      action: 'scheduled',
      workflowId: workflow.id,
      workflowName: workflow.workflowName,
      userId,
      userAgent,
      ipAddress,
      details: {
        scheduledTime: workflow.scheduledAt,
        cronExpression: workflow.cronExpression,
        params: workflow.params,
        newState: {
          status: workflow.status,
          scheduledAt: workflow.scheduledAt,
          cronExpression: workflow.cronExpression,
        },
      },
    });
  }

  logEnqueue(
    workflowId: string,
    workflowName: string,
    params: Record<string, unknown>,
    userId?: string
  ): AuditEntry {
    return this.log({
      action: 'enqueued',
      workflowId,
      workflowName,
      userId,
      details: {
        params,
        newState: { status: 'ENQUEUED' },
      },
    });
  }

  logStart(
    workflowId: string,
    workflowName: string,
    userId?: string
  ): AuditEntry {
    return this.log({
      action: 'started',
      workflowId,
      workflowName,
      userId,
      details: {
        newState: { status: 'RUNNING' },
      },
    });
  }

  logComplete(
    workflowId: string,
    workflowName: string,
    result?: Record<string, unknown>
  ): AuditEntry {
    return this.log({
      action: 'completed',
      workflowId,
      workflowName,
      details: {
        newState: { status: 'SUCCESS' },
      },
    });
  }

  logFailure(
    workflowId: string,
    workflowName: string,
    error: string
  ): AuditEntry {
    return this.log({
      action: 'failed',
      workflowId,
      workflowName,
      details: {
        error,
        newState: { status: 'ERROR' },
      },
    });
  }

  logCancel(
    workflowId: string,
    workflowName: string,
    userId?: string,
    reason?: string
  ): AuditEntry {
    return this.log({
      action: 'cancelled',
      workflowId,
      workflowName,
      userId,
      details: {
        previousState: { status: 'SCHEDULED' },
        newState: { status: 'CANCELLED' },
        error: reason,
      },
    });
  }

  getEntries(filter?: {
    workflowId?: string;
    workflowName?: string;
    action?: AuditEntry['action'];
    userId?: string;
    startTime?: Date;
    endTime?: Date;
  }): AuditEntry[] {
    let result = [...this.entries];

    if (filter?.workflowId) {
      result = result.filter((e) => e.workflowId === filter.workflowId);
    }

    if (filter?.workflowName) {
      result = result.filter((e) => e.workflowName === filter.workflowName);
    }

    if (filter?.action) {
      result = result.filter((e) => e.action === filter.action);
    }

    if (filter?.userId) {
      result = result.filter((e) => e.userId === filter.userId);
    }

    if (filter?.startTime) {
      result = result.filter((e) => e.timestamp >= filter.startTime!);
    }

    if (filter?.endTime) {
      result = result.filter((e) => e.timestamp <= filter.endTime!);
    }

    return result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getStats(): {
    total: number;
    byAction: Record<string, number>;
    byWorkflow: Record<string, number>;
    recentCount: number;
  } {
    const byAction: Record<string, number> = {};
    const byWorkflow: Record<string, number> = {};

    this.entries.forEach((entry) => {
      byAction[entry.action] = (byAction[entry.action] || 0) + 1;
      byWorkflow[entry.workflowName] = (byWorkflow[entry.workflowName] || 0) + 1;
    });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = this.entries.filter((e) => e.timestamp >= oneHourAgo).length;

    return {
      total: this.entries.length,
      byAction,
      byWorkflow,
      recentCount,
    };
  }

  clearLogs(): void {
    this.entries = [];
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.entries, null, 2);
    }

    const headers = [
      'ID',
      'Timestamp',
      'Action',
      'Workflow ID',
      'Workflow Name',
      'User ID',
      'Details',
    ].join(',');

    const rows = this.entries.map((entry) =>
      [
        entry.id,
        entry.timestamp.toISOString(),
        entry.action,
        entry.workflowId,
        entry.workflowName,
        entry.userId || '',
        JSON.stringify(entry.details).replace(/,/g, ';'),
      ].join(',')
    );

    return [headers, ...rows].join('\n');
  }
}

export const auditLogger = new AuditLogger();

export function formatAuditEntry(entry: AuditEntry): string {
  const parts = [
    `[${entry.timestamp.toISOString()}]`,
    `[${entry.action.toUpperCase()}]`,
    entry.workflowName,
    `(${entry.workflowId.slice(0, 8)}...)`,
  ];

  if (entry.userId) {
    parts.push(`by ${entry.userId}`);
  }

  if (entry.details.error) {
    parts.push(`Error: ${entry.details.error}`);
  }

  return parts.join(' ');
}
