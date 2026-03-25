export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export const emailTemplates: Record<string, EmailTemplate> = {
  welcome: {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to Our Platform!',
    body: `Dear {{name}},

Welcome to our platform! We're excited to have you on board.

Your account has been created with the following details:
- Email: {{email}}
- User ID: {{userId}}

To get started, please verify your email address by clicking the link below:
{{verificationLink}}

If you have any questions, feel free to reach out to our support team.

Best regards,
The Team`,
    variables: ['name', 'email', 'userId', 'verificationLink'],
  },
  passwordReset: {
    id: 'passwordReset',
    name: 'Password Reset',
    subject: 'Reset Your Password',
    body: `Hi {{name}},

We received a request to reset your password.

Click the link below to reset your password:
{{resetLink}}

This link will expire in {{expiryTime}}.

If you didn't request this, please ignore this email.

Best regards,
The Team`,
    variables: ['name', 'resetLink', 'expiryTime'],
  },
  notification: {
    id: 'notification',
    name: 'General Notification',
    subject: '{{subject}}',
    body: `Hi {{name}},

{{message}}

{{additionalInfo}}

Best regards,
The Team`,
    variables: ['name', 'subject', 'message', 'additionalInfo'],
  },
  report: {
    id: 'report',
    name: 'Scheduled Report',
    subject: '{{reportType}} Report - {{date}}',
    body: `Hi {{name}},

Your {{reportType}} report is ready.

Summary:
{{summary}}

Click the link below to view the full report:
{{reportLink}}

Best regards,
The Team`,
    variables: ['name', 'reportType', 'date', 'summary', 'reportLink'],
  },
  dataProcessingComplete: {
    id: 'dataProcessingComplete',
    name: 'Data Processing Complete',
    subject: 'Data Processing Complete - {{dataId}}',
    body: `Hi {{name}},

Your data processing request has been completed successfully.

Details:
- Data ID: {{dataId}}
- Operation: {{operation}}
- Processed At: {{processedAt}}
- Records Processed: {{recordCount}}

{{resultSummary}}

Best regards,
The Team`,
    variables: ['name', 'dataId', 'operation', 'processedAt', 'recordCount', 'resultSummary'],
  },
};

export function renderTemplate(template: EmailTemplate, variables: Record<string, string>): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;

  for (const variable of template.variables) {
    const value = variables[variable] || '';
    const regex = new RegExp(`{{${variable}}}`, 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  return { subject, body };
}

export function validateTemplateVariables(templateId: string, providedVariables: string[]): string[] {
  const template = emailTemplates[templateId];
  if (!template) {
    return [`Template '${templateId}' not found`];
  }

  const missing: string[] = [];
  for (const required of template.variables) {
    if (!providedVariables.includes(required)) {
      missing.push(required);
    }
  }

  return missing;
}
