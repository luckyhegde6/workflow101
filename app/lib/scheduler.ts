import type { ScheduledWorkflow, ScheduleConfig, AuditEntry } from './scheduling';
import { auditLogger } from './audit-logging';
import { logger } from './logging';

class WorkflowScheduler {
  private scheduledWorkflows: Map<string, ScheduledWorkflow> = new Map();
  private pendingExecutions: Map<string, NodeJS.Timeout> = new Map();

  private generateId(): string {
    return `sched-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  async scheduleWorkflow(
    workflowName: string,
    params: Record<string, unknown>,
    config: ScheduleConfig,
    userId?: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<ScheduledWorkflow> {
    const id = this.generateId();
    const now = new Date();

    let scheduledAt = config.scheduledAt || now;

    if (config.type === 'recurring' && config.cronExpression) {
      scheduledAt = this.getNextCronRun(config.cronExpression, now);
    }

    const workflow: ScheduledWorkflow = {
      id,
      workflowName,
      params,
      scheduledAt,
      scheduledBy: userId,
      cronExpression: config.type === 'recurring' ? config.cronExpression : undefined,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
      metadata: config.metadata,
    };

    this.scheduledWorkflows.set(id, workflow);

    auditLogger.logSchedule(workflow, userId, userAgent, ipAddress);

    logger.info(`Workflow scheduled: ${workflowName}`, {
      workflow: {
        id,
        workflowName,
        scheduledAt,
        type: config.type,
        cronExpression: config.cronExpression,
      },
    });

    if (config.type === 'immediate' || scheduledAt <= now) {
      this.scheduleExecution(id, 0);
    } else {
      const delay = scheduledAt.getTime() - now.getTime();
      this.scheduleExecution(id, delay);
    }

    return workflow;
  }

  private scheduleExecution(workflowId: string, delayMs: number): void {
    if (this.pendingExecutions.has(workflowId)) {
      clearTimeout(this.pendingExecutions.get(workflowId));
    }

    const timeout = setTimeout(async () => {
      await this.executeWorkflow(workflowId);
      this.pendingExecutions.delete(workflowId);
    }, delayMs);

    this.pendingExecutions.set(workflowId, timeout);
  }

  private async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.scheduledWorkflows.get(workflowId);
    if (!workflow) {
      logger.warn(`Workflow not found for execution: ${workflowId}`);
      return;
    }

    if (workflow.status === 'cancelled') {
      logger.info(`Skipping cancelled workflow: ${workflowId}`);
      return;
    }

    workflow.status = 'running';
    workflow.updatedAt = new Date();
    this.scheduledWorkflows.set(workflowId, workflow);

    auditLogger.logStart(workflowId, workflow.workflowName, workflow.scheduledBy);

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowName: workflow.workflowName,
          params: workflow.params,
          scheduledId: workflowId,
        }),
      });

      if (response.ok) {
        workflow.status = 'completed';
        auditLogger.logComplete(workflowId, workflow.workflowName);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

      if (workflow.cronExpression) {
        const nextRun = this.getNextCronRun(workflow.cronExpression, new Date());
        workflow.scheduledAt = nextRun;
        workflow.status = 'scheduled';
        workflow.updatedAt = new Date();
        this.scheduledWorkflows.set(workflowId, workflow);

        const nextDelay = nextRun.getTime() - Date.now();
        this.scheduleExecution(workflowId, nextDelay);
      }
    } catch (error) {
      workflow.status = 'failed';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      auditLogger.logFailure(workflowId, workflow.workflowName, errorMessage);
      logger.error(`Workflow execution failed: ${workflowId}`, { error: errorMessage });
    }
  }

  cancelWorkflow(workflowId: string, userId?: string, reason?: string): boolean {
    const workflow = this.scheduledWorkflows.get(workflowId);
    if (!workflow) {
      return false;
    }

    if (workflow.status !== 'scheduled' && workflow.status !== 'running') {
      return false;
    }

    if (this.pendingExecutions.has(workflowId)) {
      clearTimeout(this.pendingExecutions.get(workflowId));
      this.pendingExecutions.delete(workflowId);
    }

    workflow.status = 'cancelled';
    workflow.updatedAt = new Date();
    this.scheduledWorkflows.set(workflowId, workflow);

    auditLogger.logCancel(workflowId, workflow.workflowName, userId, reason);

    logger.info(`Workflow cancelled: ${workflowId}`, { reason });

    return true;
  }

  updateWorkflow(
    workflowId: string,
    updates: Partial<Pick<ScheduledWorkflow, 'params' | 'scheduledAt' | 'metadata'>>,
    userId?: string
  ): boolean {
    const workflow = this.scheduledWorkflows.get(workflowId);
    if (!workflow) {
      return false;
    }

    if (workflow.status !== 'scheduled') {
      return false;
    }

    const previousState = { ...workflow };

    if (updates.params) {
      workflow.params = updates.params;
    }

    if (updates.scheduledAt) {
      workflow.scheduledAt = updates.scheduledAt;

      if (this.pendingExecutions.has(workflowId)) {
        clearTimeout(this.pendingExecutions.get(workflowId));
        const delay = updates.scheduledAt.getTime() - Date.now();
        this.scheduleExecution(workflowId, Math.max(0, delay));
      }
    }

    if (updates.metadata) {
      workflow.metadata = { ...workflow.metadata, ...updates.metadata };
    }

    workflow.updatedAt = new Date();
    this.scheduledWorkflows.set(workflowId, workflow);

    auditLogger.log({
      action: 'updated',
      workflowId,
      workflowName: workflow.workflowName,
      userId,
      details: {
        previousState: {
          params: previousState.params,
          scheduledAt: previousState.scheduledAt,
        },
        newState: {
          params: workflow.params,
          scheduledAt: workflow.scheduledAt,
        },
      },
    });

    return true;
  }

  getScheduledWorkflow(id: string): ScheduledWorkflow | undefined {
    return this.scheduledWorkflows.get(id);
  }

  getScheduledWorkflows(filter?: {
    workflowName?: string;
    status?: ScheduledWorkflow['status'];
    scheduledBy?: string;
  }): ScheduledWorkflow[] {
    let result = Array.from(this.scheduledWorkflows.values());

    if (filter?.workflowName) {
      result = result.filter((w) => w.workflowName === filter.workflowName);
    }

    if (filter?.status) {
      result = result.filter((w) => w.status === filter.status);
    }

    if (filter?.scheduledBy) {
      result = result.filter((w) => w.scheduledBy === filter.scheduledBy);
    }

    return result.sort(
      (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
    );
  }

  getUpcomingWorkflows(limit = 10): ScheduledWorkflow[] {
    const now = new Date();
    return this.getScheduledWorkflows({ status: 'scheduled' })
      .filter((w) => w.scheduledAt > now)
      .slice(0, limit);
  }

  getStats(): {
    total: number;
    byStatus: Record<string, number>;
    byWorkflow: Record<string, number>;
    upcoming: number;
  } {
    const byStatus: Record<string, number> = {};
    const byWorkflow: Record<string, number> = {};
    const now = new Date();

    this.scheduledWorkflows.forEach((workflow) => {
      byStatus[workflow.status] = (byStatus[workflow.status] || 0) + 1;
      byWorkflow[workflow.workflowName] = (byWorkflow[workflow.workflowName] || 0) + 1;
    });

    const upcoming = this.getScheduledWorkflows({ status: 'scheduled' }).filter(
      (w) => w.scheduledAt > now
    ).length;

    return {
      total: this.scheduledWorkflows.size,
      byStatus,
      byWorkflow,
      upcoming,
    };
  }

  private getNextCronRun(cronExpression: string, from: Date): Date {
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) {
      return from;
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const next = new Date(from);

    next.setSeconds(0);
    next.setMilliseconds(0);

    const addMinutes = (date: Date, mins: number) => {
      date.setMinutes(date.getMinutes() + mins);
    };

    if (cronExpression === '* * * * *') {
      addMinutes(next, 1);
      return next;
    }

    if (cronExpression === '*/5 * * * *') {
      const currentMin = next.getMinutes();
      const next5Min = Math.ceil((currentMin + 1) / 5) * 5;
      if (next5Min >= 60) {
        next.setHours(next.getHours() + 1);
        next.setMinutes(next5Min - 60);
      } else {
        next.setMinutes(next5Min);
      }
      return next;
    }

    next.setMinutes(next.getMinutes() + 1);
    return next;
  }
}

export const workflowScheduler = new WorkflowScheduler();

export function parseCronExpression(expression: string): {
  valid: boolean;
  description: string;
  nextRuns: Date[];
} {
  const parts = expression.split(' ');

  if (parts.length !== 5) {
    return {
      valid: false,
      description: 'Invalid cron expression (must have 5 parts)',
      nextRuns: [],
    };
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  let description = 'Runs ';

  if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    description += 'every minute';
  } else if (minute.startsWith('*/')) {
    const interval = minute.substring(2);
    description += `every ${interval} minutes`;
  } else if (hour === '*') {
    description += `at minute ${minute}`;
  } else if (dayOfMonth === '*' && month === '*') {
    if (dayOfWeek === '*') {
      description += `daily at ${hour}:${minute.padStart(2, '0')}`;
    } else {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      description += `every ${days[parseInt(dayOfWeek)] || 'Unknown'} at ${hour}:${minute.padStart(2, '0')}`;
    }
  } else {
    description += `at ${hour}:${minute.padStart(2, '0')}`;
  }

  const now = new Date();
  const nextRuns: Date[] = [];

  for (let i = 0; i < 5; i++) {
    const runDate = new Date(now);
    runDate.setMinutes(runDate.getMinutes() + (i + 1) * 5);
    nextRuns.push(runDate);
  }

  return {
    valid: true,
    description,
    nextRuns,
  };
}
