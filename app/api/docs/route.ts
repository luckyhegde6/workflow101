import { NextResponse } from 'next/server';

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Everything Workflows API',
    description: 'Durable workflow system powered by DBOS + Vercel',
    version: '1.0.0',
  },
  servers: [
    {
      url: '/api',
      description: 'Current server',
    },
  ],
  paths: {
    '/dbos': {
      get: {
        summary: 'Trigger DBOS Worker',
        description: 'Triggers the DBOS worker to process queued workflows',
        tags: ['Worker'],
        responses: {
          '200': {
            description: 'Worker triggered successfully',
            content: {
              'text/plain': {
                example: 'DBOS Worker started at 2026-03-25T00:00:00.000Z',
              },
            },
          },
        },
      },
    },
    '/workflows': {
      get: {
        summary: 'List Workflows',
        description: 'List all workflow executions',
        tags: ['Workflows'],
        parameters: [
          {
            name: 'name',
            in: 'query',
            description: 'Filter by workflow name',
            required: false,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of workflows',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    workflows: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          workflowId: { type: 'string' },
                          workflowName: { type: 'string' },
                          status: { type: 'string', enum: ['SUCCESS', 'PENDING', 'ENQUEUED', 'ERROR'] },
                          createdAt: { type: 'number' },
                          completedAt: { type: 'number' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Enqueue Workflow',
        description: 'Enqueue a new workflow for execution',
        tags: ['Workflows'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['workflowName'],
                properties: {
                  workflowName: {
                    type: 'string',
                    enum: [
                      'exampleWorkflow',
                      'emailNotificationWorkflow',
                      'dataProcessingWorkflow',
                      'onboardingWorkflow',
                      'scheduledReportWorkflow',
                      'webhookHandlerWorkflow',
                    ],
                    description: 'Name of the workflow to enqueue',
                  },
                  params: {
                    type: 'object',
                    description: 'Parameters to pass to the workflow',
                  },
                },
              },
              example: {
                workflowName: 'exampleWorkflow',
                params: { message: 'Hello World' },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Workflow enqueued',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    workflowId: { type: 'string' },
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/workflows/{workflowId}': {
      get: {
        summary: 'Get Workflow Status',
        description: 'Get the status of a specific workflow',
        tags: ['Workflows'],
        parameters: [
          {
            name: 'workflowId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Workflow status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    workflow: {
                      type: 'object',
                      properties: {
                        workflowId: { type: 'string' },
                        workflowName: { type: 'string' },
                        status: { type: 'string' },
                        createdAt: { type: 'number' },
                        completedAt: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/workflows/{workflowId}/retry': {
      post: {
        summary: 'Retry Workflow',
        description: 'Retry a failed workflow',
        tags: ['Workflows'],
        parameters: [
          {
            name: 'workflowId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Workflow retry initiated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/workflows/trigger': {
      post: {
        summary: 'Trigger Worker',
        description: 'Manually trigger the DBOS worker',
        tags: ['Worker'],
        responses: {
          '200': {
            description: 'Worker triggered',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Workflow: {
        type: 'object',
        properties: {
          workflowId: { type: 'string' },
          workflowName: { type: 'string' },
          status: { type: 'string', enum: ['SUCCESS', 'PENDING', 'ENQUEUED', 'ERROR'] },
          createdAt: { type: 'number' },
          completedAt: { type: 'number' },
        },
      },
      WorkflowResult: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          workflowId: { type: 'string' },
          error: { type: 'string' },
        },
      },
    },
  },
  tags: [
    { name: 'Workflows', description: 'Workflow management endpoints' },
    { name: 'Worker', description: 'Worker control endpoints' },
  ],
};

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
