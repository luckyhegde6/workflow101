import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { WorkflowCard } from '../../app/components/WorkflowCard';
import type { WorkflowInfo } from '../../app/types';

describe('WorkflowCard', () => {
  const mockWorkflow: WorkflowInfo = {
    workflowId: 'test-workflow-123',
    workflowName: 'exampleWorkflow',
    status: 'SUCCESS',
    createdAt: Date.now(),
    completedAt: Date.now(),
  };

  describe('Rendering', () => {
    it('should render workflow ID', () => {
      render(<WorkflowCard workflow={mockWorkflow} onRetry={vi.fn()} />);
      
      const workflowId = screen.getByTestId('workflow-id');
      expect(workflowId).toBeInTheDocument();
      expect(workflowId).toHaveTextContent('test-workflow-123');
    });

    it('should render workflow name', () => {
      render(<WorkflowCard workflow={mockWorkflow} onRetry={vi.fn()} />);
      
      const workflowName = screen.getByTestId('workflow-name');
      expect(workflowName).toBeInTheDocument();
      expect(workflowName).toHaveTextContent('exampleWorkflow');
    });

    it('should render timestamp', () => {
      render(<WorkflowCard workflow={mockWorkflow} onRetry={vi.fn()} />);
      
      const timestamp = screen.getByTestId('workflow-timestamp');
      expect(timestamp).toBeInTheDocument();
      expect(timestamp).toHaveTextContent('Started');
    });
  });

  describe('Status Display', () => {
    it('should show SUCCESS status badge', () => {
      render(<WorkflowCard workflow={mockWorkflow} onRetry={vi.fn()} />);
      
      const statusBadge = screen.getByTestId('workflow-status-success');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveTextContent('SUCCESS');
    });

    it('should show PENDING status badge', () => {
      const pendingWorkflow = { ...mockWorkflow, status: 'PENDING' as const };
      render(<WorkflowCard workflow={pendingWorkflow} onRetry={vi.fn()} />);
      
      const statusBadge = screen.getByTestId('workflow-status-pending');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveTextContent('PENDING');
    });

    it('should show ENQUEUED status badge', () => {
      const queuedWorkflow = { ...mockWorkflow, status: 'ENQUEUED' as const };
      render(<WorkflowCard workflow={queuedWorkflow} onRetry={vi.fn()} />);
      
      const statusBadge = screen.getByTestId('workflow-status-enqueued');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveTextContent('ENQUEUED');
    });

    it('should show ERROR status badge', () => {
      const errorWorkflow = { ...mockWorkflow, status: 'ERROR' as const };
      render(<WorkflowCard workflow={errorWorkflow} onRetry={vi.fn()} />);
      
      const statusBadge = screen.getByTestId('workflow-status-error');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveTextContent('ERROR');
    });
  });

  describe('Retry Button', () => {
    it('should show retry button for ERROR status', () => {
      const errorWorkflow = { ...mockWorkflow, status: 'ERROR' as const };
      render(<WorkflowCard workflow={errorWorkflow} onRetry={vi.fn()} />);
      
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toBeInTheDocument();
    });

    it('should not show retry button for SUCCESS status', () => {
      render(<WorkflowCard workflow={mockWorkflow} onRetry={vi.fn()} />);
      
      const retryButton = screen.queryByTestId('retry-button');
      expect(retryButton).not.toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const onRetry = vi.fn();
      const errorWorkflow = { ...mockWorkflow, status: 'ERROR' as const };
      render(<WorkflowCard workflow={errorWorkflow} onRetry={onRetry} />);
      
      const retryButton = screen.getByTestId('retry-button');
      await act(async () => {
        retryButton.click();
      });
      
      expect(onRetry).toHaveBeenCalledWith('test-workflow-123');
    });

    it('should show loading state when retrying', async () => {
      const onRetry = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      const errorWorkflow = { ...mockWorkflow, status: 'ERROR' as const };
      render(<WorkflowCard workflow={errorWorkflow} onRetry={onRetry} />);
      
      const retryButton = screen.getByTestId('retry-button');
      await act(async () => {
        retryButton.click();
      });
      
      expect(retryButton).toHaveTextContent('Retrying...');
    });
  });
});
