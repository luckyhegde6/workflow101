/**
 * Email Notification Workflow (LangGraph)
 * 
 * A LangGraph-based workflow for sending email notifications.
 * Wraps the existing DBOS emailNotificationWorkflow with LangGraph's
 * state management and conditional branching.
 * 
 * Graph:
 *  START → [validateEmail] → [composeContent] → [sendEmail] → [logResult] → END
 *              │                                                  │
 *              └── (invalid) → [error] → END                      │
 *                                                                  │
 *              [approval] ←─ (if requires approval) ──────────────┘
 */

import { StateGraph, END } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import { enqueueWorkflow } from '@/app/actions';

export interface EmailWorkflowInput {
  to: string;
  subject: string;
  body: string;
  priority?: 'low' | 'normal' | 'high';
  requireApproval?: boolean;
}

interface EmailState {
  input: EmailWorkflowInput;
  validationResult?: { isValid: boolean; reason?: string };
  composedContent?: { to: string; subject: string; body: string };
  sendResult?: { success: boolean; workflowId?: string; error?: string };
  error?: string;
  completed: boolean;
}

const EmailAnnotation = Annotation.Root({
  input: Annotation<EmailWorkflowInput>(),
  validationResult: Annotation<EmailState['validationResult'] | undefined>(),
  composedContent: Annotation<EmailState['composedContent'] | undefined>(),
  sendResult: Annotation<EmailState['sendResult'] | undefined>(),
  error: Annotation<string | undefined>(),
  completed: Annotation<boolean>(),
});

async function validateEmail(state: typeof EmailAnnotation.State) {
  const { to, subject, body } = state.input;

  if (!to || !to.includes('@')) {
    return { validationResult: { isValid: false, reason: 'Invalid email address' }, error: 'Validation failed: invalid email', completed: true };
  }
  if (!subject || subject.trim().length === 0) {
    return { validationResult: { isValid: false, reason: 'Subject is required' }, error: 'Validation failed: missing subject', completed: true };
  }
  if (!body || body.trim().length === 0) {
    return { validationResult: { isValid: false, reason: 'Body is required' }, error: 'Validation failed: missing body', completed: true };
  }

  return { validationResult: { isValid: true } };
}

async function composeContent(state: typeof EmailAnnotation.State) {
  const { to, subject, body, priority } = state.input;
  const prefix = priority === 'high' ? '[URGENT] ' : '';
  return {
    composedContent: {
      to,
      subject: `${prefix}${subject}`,
      body,
    },
  };
}

async function sendEmail(state: typeof EmailAnnotation.State) {
  if (!state.composedContent) {
    return { error: 'No composed content to send', completed: true };
  }

  try {
    const result = await enqueueWorkflow('emailNotificationWorkflow', {
      to: state.composedContent.to,
      subject: state.composedContent.subject,
      body: state.composedContent.body,
      priority: state.input.priority || 'normal',
    });

    return {
      sendResult: {
        success: result.success,
        workflowId: result.workflowId,
        error: result.error,
      },
    };
  } catch (error) {
    return {
      sendResult: { success: false, error: error instanceof Error ? error.message : 'Send failed' },
    };
  }
}

async function logResult(state: typeof EmailAnnotation.State) {
  if (state.sendResult?.success) {
    console.log(`[EmailWorkflow] Email queued: to=${state.composedContent?.to}, workflowId=${state.sendResult.workflowId}`);
  } else {
    console.error(`[EmailWorkflow] Email failed: ${state.sendResult?.error}`);
  }
  return { completed: true };
}

export function createEmailWorkflow() {
  const graph = new StateGraph(EmailAnnotation)
    .addNode('validateEmail', validateEmail)
    .addNode('composeContent', composeContent)
    .addNode('sendEmail', sendEmail)
    .addNode('logResult', logResult)
    .addNode('error', async (state: typeof EmailAnnotation.State) => ({
      ...state, completed: true, error: state.error || 'Email workflow error',
    }))
    .addEdge('__start__', 'validateEmail')
    .addConditionalEdges('validateEmail', (state: typeof EmailAnnotation.State) =>
      state.validationResult?.isValid === false ? 'error' : 'composeContent')
    .addEdge('composeContent', 'sendEmail')
    .addEdge('sendEmail', 'logResult')
    .addEdge('logResult', '__end__')
    .addEdge('error', '__end__');

  return graph.compile();
}

export type EmailWorkflow = ReturnType<typeof createEmailWorkflow>;
