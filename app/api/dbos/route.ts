import { DBOS, WorkflowQueue } from '@dbos-inc/dbos-sdk';
import { waitUntil } from '@vercel/functions';
import { getDatabaseConfig, getEnvironmentInfo } from '../../lib/database-config';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

const queue = new WorkflowQueue('exampleQueue');

async function exampleWorkflow(message: string) {
  DBOS.logger.info(`Starting workflow with message: ${message}`);
  
  await DBOS.sleep(1000);
  DBOS.logger.info('Step 1 completed');
  
  await DBOS.sleep(1000);
  DBOS.logger.info('Step 2 completed');
  
  DBOS.logger.info('Workflow completed successfully');
  return { success: true, message, completedAt: new Date(await DBOS.now()).toISOString() };
}

async function emailNotificationWorkflow(params: {
  to: string;
  subject: string;
  body: string;
}) {
  DBOS.logger.info(`Sending email to ${params.to}`);
  
  await DBOS.sleep(1000);
  DBOS.logger.info('Email content validated');
  
  await DBOS.sleep(1000);
  DBOS.logger.info('Email sent successfully');
  
  return { 
    success: true, 
    to: params.to, 
    sentAt: new Date(await DBOS.now()).toISOString() 
  };
}

async function dataProcessingWorkflow(params: {
  dataId: string;
  operation: string;
}) {
  DBOS.logger.info(`Processing data: ${params.dataId} with operation: ${params.operation}`);
  
  await DBOS.sleep(1000);
  DBOS.logger.info('Data fetched');
  
  await DBOS.sleep(1000);
  DBOS.logger.info('Data processed');
  
  await DBOS.sleep(1000);
  DBOS.logger.info('Results stored');
  
  return { 
    success: true, 
    dataId: params.dataId,
    operation: params.operation,
    processedAt: new Date(await DBOS.now()).toISOString()
  };
}

async function onboardingWorkflow(params: {
  userId: string;
  email: string;
}) {
  DBOS.logger.info(`Starting onboarding for user: ${params.userId}`);
  
  await DBOS.sleep(5000);
  DBOS.logger.info('Welcome email sent');
  
  await DBOS.sleep(1000);
  DBOS.logger.info('Account created');
  
  await DBOS.sleep(3000);
  DBOS.logger.info('Onboarding completed');
  
  return { 
    success: true, 
    userId: params.userId,
    completedAt: new Date(await DBOS.now()).toISOString()
  };
}

async function scheduledReportWorkflow(params: {
  reportType: string;
  recipients: string[];
}) {
  DBOS.logger.info(`Generating ${params.reportType} report`);
  
  await DBOS.sleep(2000);
  DBOS.logger.info('Report generated');
  
  await DBOS.sleep(1000);
  DBOS.logger.info('Report sent to recipients');
  
  return { 
    success: true, 
    reportType: params.reportType,
    recipientCount: params.recipients.length,
    generatedAt: new Date(await DBOS.now()).toISOString()
  };
}

async function webhookHandlerWorkflow(params: {
  eventType: string;
  payload: Record<string, unknown>;
}) {
  DBOS.logger.info(`Processing webhook event: ${params.eventType}`);
  
  await DBOS.sleep(1000);
  DBOS.logger.info('Payload validated');
  
  await DBOS.sleep(1000);
  DBOS.logger.info('Event processed');
  
  return { 
    success: true, 
    eventType: params.eventType,
    processedAt: new Date(await DBOS.now()).toISOString()
  };
}

DBOS.registerWorkflow(exampleWorkflow, { name: 'exampleWorkflow' });
DBOS.registerWorkflow(emailNotificationWorkflow, { name: 'emailNotificationWorkflow' });
DBOS.registerWorkflow(dataProcessingWorkflow, { name: 'dataProcessingWorkflow' });
DBOS.registerWorkflow(onboardingWorkflow, { name: 'onboardingWorkflow' });
DBOS.registerWorkflow(scheduledReportWorkflow, { name: 'scheduledReportWorkflow' });
DBOS.registerWorkflow(webhookHandlerWorkflow, { name: 'webhookHandlerWorkflow' });

let dbosInitialized = false;

async function initDBOS(): Promise<boolean> {
  if (dbosInitialized) return true;

  try {
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
    dbosInitialized = true;
    return true;
  } catch (error) {
    console.error('[DBOS] Initialization failed:', error);
    return false;
  }
}

async function waitForQueuedWorkflowsToComplete(timeoutMs: number): Promise<void> {
  if (!dbosInitialized) return;
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
  try {
    const initialized = await withTimeout(initDBOS(), 5000);
    if (!initialized) {
      return new Response(JSON.stringify({ success: false, error: 'DBOS is not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    waitUntil(waitForQueuedWorkflowsToComplete(60000));
    return new Response(JSON.stringify({ success: true, message: `DBOS Worker started at ${new Date(await DBOS.now()).toISOString()}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'DBOS initialization timed out' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
