import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { EnqueueWorkflowButton, workflowOptions } from '../../app/components/EnqueueWorkflowButton';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('EnqueueWorkflowButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the workflow select dropdown', () => {
      render(<EnqueueWorkflowButton />);
      
      const select = screen.getByTestId('workflow-select');
      expect(select).toBeInTheDocument();
    });

    it('should render the configure button', () => {
      render(<EnqueueWorkflowButton />);
      
      const button = screen.getByTestId('enqueue-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Configure & Run Workflow');
    });

    it('should display workflow options', () => {
      render(<EnqueueWorkflowButton />);
      
      const select = screen.getByTestId('workflow-select');
      const options = select.querySelectorAll('option');
      
      expect(options).toHaveLength(workflowOptions.length);
    });

    it('should display description for selected workflow', () => {
      render(<EnqueueWorkflowButton />);
      
      const description = screen.getByTestId('workflow-description');
      expect(description).toHaveTextContent(workflowOptions[0].description);
    });
  });

  describe('User Interactions', () => {
    it('should update description when workflow changes', async () => {
      render(<EnqueueWorkflowButton />);
      
      const select = screen.getByTestId('workflow-select');
      const description = screen.getByTestId('workflow-description');
      
      await act(async () => {
        fireEvent.change(select, { target: { value: 'emailNotificationWorkflow' } });
      });
      
      await waitFor(() => {
        expect(description).toHaveTextContent('Send an email notification');
      });
    });

    it('should navigate to wizard with workflow param when button is clicked', async () => {
      render(<EnqueueWorkflowButton />);
      
      const button = screen.getByTestId('enqueue-button');
      await act(async () => {
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/config?workflow=exampleWorkflow');
      });
    });

    it('should navigate with correct workflow when different option selected', async () => {
      render(<EnqueueWorkflowButton />);
      
      const select = screen.getByTestId('workflow-select');
      
      await act(async () => {
        fireEvent.change(select, { target: { value: 'emailNotificationWorkflow' } });
      });
      
      const button = screen.getByTestId('enqueue-button');
      await act(async () => {
        fireEvent.click(button);
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/config?workflow=emailNotificationWorkflow');
      });
    });
  });

  describe('Workflow Options', () => {
    it('should have correct workflow types', () => {
      const types = workflowOptions.map(o => o.type);
      
      expect(types).toContain('exampleWorkflow');
      expect(types).toContain('emailNotificationWorkflow');
      expect(types).toContain('dataProcessingWorkflow');
      expect(types).toContain('onboardingWorkflow');
      expect(types).toContain('scheduledReportWorkflow');
      expect(types).toContain('webhookHandlerWorkflow');
    });

    it('should have correct labels', () => {
      const labels = workflowOptions.map(o => o.label);
      
      expect(labels).toContain('Example Workflow');
      expect(labels).toContain('Email Notification');
      expect(labels).toContain('Data Processing');
      expect(labels).toContain('User Onboarding');
      expect(labels).toContain('Scheduled Report');
      expect(labels).toContain('Webhook Handler');
    });
  });
});
