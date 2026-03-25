import { describe, it, expect } from 'vitest';
import { emailTemplates, renderTemplate, validateTemplateVariables } from '../../app/lib/templates';

describe('Email Templates', () => {
  describe('emailTemplates', () => {
    it('should have welcome template', () => {
      expect(emailTemplates.welcome).toBeDefined();
      expect(emailTemplates.welcome.id).toBe('welcome');
      expect(emailTemplates.welcome.subject).toContain('Welcome');
    });

    it('should have passwordReset template', () => {
      expect(emailTemplates.passwordReset).toBeDefined();
      expect(emailTemplates.passwordReset.variables).toContain('resetLink');
    });

    it('should have notification template', () => {
      expect(emailTemplates.notification).toBeDefined();
      expect(emailTemplates.notification.variables).toContain('message');
    });

    it('should have report template', () => {
      expect(emailTemplates.report).toBeDefined();
      expect(emailTemplates.report.variables).toContain('reportType');
    });

    it('should have dataProcessingComplete template', () => {
      expect(emailTemplates.dataProcessingComplete).toBeDefined();
      expect(emailTemplates.dataProcessingComplete.variables).toContain('dataId');
    });
  });

  describe('renderTemplate', () => {
    it('should render template with all variables', () => {
      const template = emailTemplates.welcome;
      const variables = {
        name: 'John Doe',
        email: 'john@example.com',
        userId: 'user123',
        verificationLink: 'https://example.com/verify?token=abc',
      };

      const result = renderTemplate(template, variables);

      expect(result.subject).toBe(template.subject);
      expect(result.body).toContain('Dear John Doe');
      expect(result.body).toContain('john@example.com');
      expect(result.body).toContain('user123');
      expect(result.body).toContain('https://example.com/verify?token=abc');
    });

    it('should handle missing variables gracefully', () => {
      const template = emailTemplates.welcome;
      const variables = { name: 'John' };

      const result = renderTemplate(template, variables);

      expect(result.body).toContain('Dear John');
      expect(result.body).toContain('Email: ');
      expect(result.body).toContain('User ID: ');
    });

    it('should render report template with dynamic subject', () => {
      const template = emailTemplates.report;
      const variables = {
        name: 'Admin',
        reportType: 'Monthly Sales',
        date: '2026-03-01',
        summary: 'Total sales: $50,000',
        reportLink: 'https://example.com/reports/123',
      };

      const result = renderTemplate(template, variables);

      expect(result.subject).toBe('Monthly Sales Report - 2026-03-01');
      expect(result.body).toContain('Monthly Sales');
      expect(result.body).toContain('Total sales: $50,000');
    });
  });

  describe('validateTemplateVariables', () => {
    it('should return empty array when all variables provided', () => {
      const variables = ['name', 'email', 'userId', 'verificationLink'];
      const missing = validateTemplateVariables('welcome', variables);
      expect(missing).toHaveLength(0);
    });

    it('should return missing variables', () => {
      const variables = ['name'];
      const missing = validateTemplateVariables('welcome', variables);
      expect(missing).toContain('email');
      expect(missing).toContain('userId');
      expect(missing).toContain('verificationLink');
    });

    it('should return error for unknown template', () => {
      const missing = validateTemplateVariables('unknownTemplate', []);
      expect(missing).toContain("Template 'unknownTemplate' not found");
    });
  });
});
