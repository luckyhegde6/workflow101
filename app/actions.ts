'use server';

import { DBOSClient, WorkflowStatus } from '@dbos-inc/dbos-sdk';
import { ScheduleConfig, AuditEntry, SCHEDULE_TYPES } from './lib/scheduling';
import { getDatabaseConfig, getEnvironmentInfo } from './lib/database-config';
import { randomUUID } from 'crypto';

export type WorkflowStatusType = 'SUCCESS' | 'PENDING' | 'ENQUEUED' | 'ERROR';

export interface WorkflowInfo {
  workflowId: string;
  workflowName: string;
  status: WorkflowStatusType;
  createdAt: number;
  completedAt?: number;
}

export interface WorkflowResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

const queueName = 'exampleQueue';

async function withClient<T>(callback: (client: DBOSClient) => Promise<T>): Promise<T> {
  const dbConfig = getDatabaseConfig();
  const databaseURL = dbConfig.url.replace('?sslmode=require', '');
  
  if (!databaseURL) {
    const envInfo = getEnvironmentInfo();
    throw new Error(
      `Database URL not defined. Current config: ${JSON.stringify(envInfo)}\n` +
      'Run: npm run db:start (to start local PostgreSQL with docker-compose)\n' +
      'Or set USE_REMOTE=true to use Supabase'
    );
  }
  
  const client = await DBOSClient.create({ systemDatabaseUrl: databaseURL });
  try {
    return await callback(client);
  } finally {
    await client.destroy();
  }
}

export async function enqueueWorkflow(
  workflowName: string,
  params?: Record<string, unknown>
): Promise<{ success: boolean; workflowId?: string; error?: string }> {
  try {
    console.log(`Enqueueing workflow: ${workflowName}`, params);
    
    return await withClient(async (client) => {
      const result = await client.enqueue({
        workflowName,
        queueName,
      });
      
      console.log('Workflow enqueued:', result);
      return { success: true, workflowId: String(result) };
    });
  } catch (error) {
    console.error('Failed to enqueue workflow:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function listWorkflows(
  workflowName?: string
): Promise<{ success: boolean; workflows?: WorkflowInfo[]; error?: string }> {
  try {
    console.log('Listing workflows:', workflowName);
    
    return await withClient(async (client) => {
      const results = await client.listWorkflows({
        workflowName,
        sortDesc: true,
      });
      
      const workflows: WorkflowInfo[] = results.map((wf) => ({
        workflowId: wf.workflowID,
        workflowName: wf.workflowName,
        status: wf.status as WorkflowStatusType,
        createdAt: wf.createdAt,
      }));
      
      return { success: true, workflows };
    });
  } catch (error) {
    console.error('Failed to list workflows:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function getWorkflowStatus(
  workflowId: string
): Promise<{ success: boolean; workflow?: WorkflowInfo; error?: string }> {
  try {
    return await withClient(async (client) => {
      const results = await client.listWorkflows({
        sortDesc: true,
      });
      
      const result = results.find(wf => wf.workflowID === workflowId);
      
      if (!result) {
        return { success: false, error: 'Workflow not found' };
      }
      
      const workflow: WorkflowInfo = {
        workflowId: result.workflowID,
        workflowName: result.workflowName,
        status: result.status as WorkflowStatusType,
        createdAt: result.createdAt,
      };
      
      return { success: true, workflow };
    });
  } catch (error) {
    console.error('Failed to get workflow status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function retryWorkflow(
  _workflowId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    return await withClient(async (client) => {
      await client.enqueue({
        workflowName: 'exampleWorkflow',
        queueName,
      });
      return { success: true };
    });
  } catch (error) {
    console.error('Failed to retry workflow:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function getWorkflowResult(
  workflowId: string
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  try {
    return await withClient(async (client) => {
      const results = await client.listWorkflows({});
      const workflow = results.find(wf => wf.workflowID === workflowId);
      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }
      return { success: true, result: workflow };
    });
  } catch (error) {
    console.error('Failed to get workflow result:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function triggerWorker(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch('/api/dbos', { method: 'GET' });
    if (response.ok) {
      const text = await response.text();
      return { success: true, message: text };
    }
    return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
  } catch (error) {
    console.error('Failed to trigger worker:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

const auditLogStore: AuditEntry[] = [];

export async function scheduleWorkflow(
  workflowName: string,
  params?: Record<string, unknown>,
  config?: ScheduleConfig
): Promise<{ success: boolean; auditId?: string; error?: string }> {
  try {
    console.log(`Scheduling workflow: ${workflowName}`, { params, config });
    
    const auditId = randomUUID();
    const now = new Date();
    
    const auditEntry: AuditEntry = {
      id: auditId,
      timestamp: now,
      action: 'scheduled',
      workflowId: randomUUID(),
      workflowName,
      details: {
        scheduledTime: config?.type === SCHEDULE_TYPES.SCHEDULED ? config.scheduledAt : undefined,
        cronExpression: config?.type === SCHEDULE_TYPES.RECURRING ? config.cronExpression : undefined,
        params,
      },
    };
    
    auditLogStore.push(auditEntry);
    
    if (config?.type === SCHEDULE_TYPES.IMMEDIATE) {
      return await enqueueWorkflow(workflowName, params);
    }
    
    return { success: true, auditId };
  } catch (error) {
    console.error('Failed to schedule workflow:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function getAuditLogs(
  workflowName?: string
): Promise<{ success: boolean; entries?: AuditEntry[]; error?: string }> {
  try {
    let entries = [...auditLogStore].reverse();
    
    if (workflowName) {
      entries = entries.filter(e => e.workflowName === workflowName);
    }
    
    return { success: true, entries };
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function getScheduledWorkflows(): Promise<{ 
  success: boolean; 
  workflows?: Array<{
    id: string;
    workflowName: string;
    scheduledAt?: Date;
    cronExpression?: string;
    status: string;
  }>; 
  error?: string 
}> {
  try {
    const scheduled = auditLogStore
      .filter(e => e.action === 'scheduled')
      .map(e => ({
        id: e.id,
        workflowName: e.workflowName,
        scheduledAt: e.details.scheduledTime,
        cronExpression: e.details.cronExpression,
        status: 'scheduled',
      }));
    
    return { success: true, workflows: scheduled };
  } catch (error) {
    console.error('Failed to get scheduled workflows:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function cancelScheduledWorkflow(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const index = auditLogStore.findIndex(e => e.id === id && e.action === 'scheduled');
    if (index === -1) {
      return { success: false, error: 'Scheduled workflow not found' };
    }
    
    auditLogStore[index] = {
      ...auditLogStore[index],
      action: 'cancelled',
      details: {
        ...auditLogStore[index].details,
        previousState: { status: 'scheduled' },
        newState: { status: 'cancelled' },
      },
    };
    
    return { success: true };
  } catch (error) {
    console.error('Failed to cancel scheduled workflow:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
