import { DBOS, WorkflowQueue } from '@dbos-inc/dbos-sdk';
import { waitUntil } from '@vercel/functions';
import { sleep } from 'workflow';
import { getDatabaseConfig, getEnvironmentInfo } from '../../lib/database-config';

const queue = new WorkflowQueue('exampleQueue');

async function exampleWorkflow(message: string) {
  'use workflow';
  
  DBOS.logger.info(`Starting workflow with message: ${message}`);
  
  await sleep('1s');
  DBOS.logger.info('Step 1 completed');
  
  await sleep('1s');
  DBOS.logger.info('Step 2 completed');
  
  DBOS.logger.info('Workflow completed successfully');
  return { success: true, message, completedAt: new Date().toISOString() };
}

async function emailNotificationWorkflow(params: {
  to: string;
  subject: string;
  body: string;
}) {
  'use workflow';
  
  DBOS.logger.info(`Sending email to ${params.to}`);
  
  await sleep('1s');
  DBOS.logger.info('Email content validated');
  
  await sleep('1s');
  DBOS.logger.info('Email sent successfully');
  
  return { 
    success: true, 
    to: params.to, 
    sentAt: new Date().toISOString() 
  };
}

async function dataProcessingWorkflow(params: {
  dataId: string;
  operation: string;
}) {
  'use workflow';
  
  DBOS.logger.info(`Processing data: ${params.dataId} with operation: ${params.operation}`);
  
  await sleep('1s');
  DBOS.logger.info('Data fetched');
  
  await sleep('1s');
  DBOS.logger.info('Data processed');
  
  await sleep('1s');
  DBOS.logger.info('Results stored');
  
  return { 
    success: true, 
    dataId: params.dataId,
    operation: params.operation,
    processedAt: new Date().toISOString()
  };
}

async function onboardingWorkflow(params: {
  userId: string;
  email: string;
}) {
  'use workflow';
  
  DBOS.logger.info(`Starting onboarding for user: ${params.userId}`);
  
  await sleep('5s');
  DBOS.logger.info('Welcome email sent');
  
  await sleep('1s');
  DBOS.logger.info('Account created');
  
  await sleep('3s');
  DBOS.logger.info('Onboarding completed');
  
  return { 
    success: true, 
    userId: params.userId,
    completedAt: new Date().toISOString()
  };
}

async function scheduledReportWorkflow(params: {
  reportType: string;
  recipients: string[];
}) {
  'use workflow';
  
  DBOS.logger.info(`Generating ${params.reportType} report`);
  
  await sleep('2s');
  DBOS.logger.info('Report generated');
  
  await sleep('1s');
  DBOS.logger.info('Report sent to recipients');
  
  return { 
    success: true, 
    reportType: params.reportType,
    recipientCount: params.recipients.length,
    generatedAt: new Date().toISOString()
  };
}

async function webhookHandlerWorkflow(params: {
  eventType: string;
  payload: Record<string, unknown>;
}) {
  'use workflow';
  
  DBOS.logger.info(`Processing webhook event: ${params.eventType}`);
  
  await sleep('1s');
  DBOS.logger.info('Payload validated');
  
  await sleep('1s');
  DBOS.logger.info('Event processed');
  
  return { 
    success: true, 
    eventType: params.eventType,
    processedAt: new Date().toISOString()
  };
}

DBOS.registerWorkflow(exampleWorkflow, { name: 'exampleWorkflow' });
DBOS.registerWorkflow(emailNotificationWorkflow, { name: 'emailNotificationWorkflow' });
DBOS.registerWorkflow(dataProcessingWorkflow, { name: 'dataProcessingWorkflow' });
DBOS.registerWorkflow(onboardingWorkflow, { name: 'onboardingWorkflow' });
DBOS.registerWorkflow(scheduledReportWorkflow, { name: 'scheduledReportWorkflow' });
DBOS.registerWorkflow(webhookHandlerWorkflow, { name: 'webhookHandlerWorkflow' });

const dbConfig = getDatabaseConfig();
console.log(`[DBOS] Database Config: ${JSON.stringify({
  provider: dbConfig.provider,
  isRemote: dbConfig.isRemote,
  reason: getEnvironmentInfo().reason
})}`);

DBOS.setConfig({
  name: 'workflow101',
  systemDatabaseUrl: dbConfig.url.replace('?sslmode=require', ''),
  runAdminServer: false,
});
await DBOS.launch();

async function waitForQueuedWorkflowsToComplete(timeoutMs: number): Promise<void> {
  const startTime = Date.now();
  const intervalMs = 1000;
  while (true) {
    if (Date.now() - startTime >= timeoutMs) {
      throw new Error(`Timeout reached after ${timeoutMs}ms - queued workflows still exist`);
    }
    const queuedWorkflows = await DBOS.listQueuedWorkflows({ queueName: queue.name });
    if (queuedWorkflows.length === 0) {
      console.log('All queued workflows completed');
      return;
    }
    console.log(`${queuedWorkflows.length} workflows still queued, waiting...`);
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
  }
}

export async function GET(request: Request) {
  waitUntil(waitForQueuedWorkflowsToComplete(60000));
  return new Response(`DBOS Worker started at ${new Date().toISOString()}`, {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
