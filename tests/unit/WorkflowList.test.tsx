import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowList } from '../../app/components/WorkflowList';
import type { WorkflowInfo } from '../../app/types';

vi.mock('../../app/actions', () => ({
  retryWorkflow: vi.fn(),
}));

describe('WorkflowList', () => {
  const mockWorkflows: WorkflowInfo[] = [
    {
      workflowId: 'workflow-1',
      workflowName: 'exampleWorkflow',
      status: 'SUCCESS',
      createdAt: Date.now() - 10000,
    },
    {
      workflowId: 'workflow-2',
      workflowName: 'emailNotificationWorkflow',
      status: 'PENDING',
      createdAt: Date.now() - 5000,
    },
    {
      workflowId: 'workflow-3',
      workflowName: 'dataProcessingWorkflow',
      status: 'ERROR',
      createdAt: Date.now(),
    },
  ];

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<WorkflowList workflows={[]} loading={true} onRetry={vi.fn()} />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should not show loading spinner when not loading', () => {
      render(<WorkflowList workflows={mockWorkflows} loading={false} onRetry={vi.fn()} />);
      
      const spinner = screen.queryByTestId('loading-spinner');
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no workflows', () => {
      render(<WorkflowList workflows={[]} loading={false} onRetry={vi.fn()} />);
      
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should show empty title', () => {
      render(<WorkflowList workflows={[]} loading={false} onRetry={vi.fn()} />);
      
      const emptyTitle = screen.getByTestId('empty-title');
      expect(emptyTitle).toHaveTextContent('No workflows found');
    });

    it('should show empty description', () => {
      render(<WorkflowList workflows={[]} loading={false} onRetry={vi.fn()} />);
      
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveTextContent('Get started by enqueueing your first workflow');
    });
  });

  describe('Workflow List', () => {
    it('should show workflow list when workflows exist', () => {
      render(<WorkflowList workflows={mockWorkflows} loading={false} onRetry={vi.fn()} />);
      
      const workflowList = screen.getByTestId('workflow-list');
      expect(workflowList).toBeInTheDocument();
    });

    it('should Render correct number of workflow cards', () => {
      render(<WorkflowList workflows={mockWorkflows} loading={false} onRetry={vi.fn()} />);
      
      const workflowCards = screen.getAllByTestId(/^workflow-card-/);
      expect(workflowCards).toHaveLength(3);
    });

    it('should display workflow IDs', () => {
      render(<WorkflowList workflows={mockWorkflows} loading={false} onRetry={vi.fn()} />);
      
      expect(screen.getByText('workflow-1')).toBeInTheDocument();
      expect(screen.getByText('workflow-2')).toBeInTheDocument();
      expect(screen.getByText('workflow-3')).toBeInTheDocument();
    });

    it('should display workflow names', () => {
      render(<WorkflowList workflows={mockWorkflows} loading={false} onRetry={vi.fn()} />);
      
      expect(screen.getByText('exampleWorkflow')).toBeInTheDocument();
      expect(screen.getByText('emailNotificationWorkflow')).toBeInTheDocument();
      expect(screen.getByText('dataProcessingWorkflow')).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should show SUCCESS status for successful workflows', () => {
      render(<WorkflowList workflows={[mockWorkflows[0]]} loading={false} onRetry={vi.fn()} />);
      
      const statusBadge = screen.getByTestId('workflow-status-success');
      expect(statusBadge).toBeInTheDocument();
    });

    it('should show PENDING status for pending workflows', () => {
      render(<WorkflowList workflows={[mockWorkflows[1]]} loading={false} onRetry={vi.fn()} />);
      
      const statusBadge = screen.getByTestId('workflow-status-pending');
      expect(statusBadge).toBeInTheDocument();
    });

    it('should show ERROR status for failed workflows', () => {
      render(<WorkflowList workflows={[mockWorkflows[2]]} loading={false} onRetry={vi.fn()} />);
      
      const statusBadge = screen.getByTestId('workflow-status-error');
      expect(statusBadge).toBeInTheDocument();
    });
  });
});
