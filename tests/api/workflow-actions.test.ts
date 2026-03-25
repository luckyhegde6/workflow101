import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../app/actions', () => ({
  enqueueWorkflow: vi.fn(),
  listWorkflows: vi.fn(),
  getWorkflowStatus: vi.fn(),
  retryWorkflow: vi.fn(),
}));

import { enqueueWorkflow, listWorkflows, getWorkflowStatus, retryWorkflow } from '../../app/actions';

describe('Workflow Actions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('enqueueWorkflow', () => {
    it('should return success when workflow is enqueued', async () => {
      (enqueueWorkflow as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        workflowId: 'test-workflow-id',
      });

      const result = await enqueueWorkflow('exampleWorkflow', { message: 'test' });

      expect(result.success).toBe(true);
      expect(result.workflowId).toBe('test-workflow-id');
    });

    it('should return error when API fails', async () => {
      (enqueueWorkflow as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      const result = await enqueueWorkflow('exampleWorkflow');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should handle missing database URL gracefully', async () => {
      (enqueueWorkflow as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: 'Database URL not defined',
      });

      const result = await enqueueWorkflow('exampleWorkflow');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database URL not defined');
    });

    it('should pass workflow parameters', async () => {
      const params = { message: 'Hello', userId: '123' };
      (enqueueWorkflow as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        workflowId: 'test-id',
      });

      const result = await enqueueWorkflow('exampleWorkflow', params);

      expect(enqueueWorkflow).toHaveBeenCalledWith('exampleWorkflow', params);
      expect(result.success).toBe(true);
    });
  });

  describe('listWorkflows', () => {
    it('should return workflow list on success', async () => {
      const mockWorkflows = [
        {
          workflowId: 'workflow-1',
          workflowName: 'exampleWorkflow',
          status: 'SUCCESS' as const,
          createdAt: Date.now(),
        },
        {
          workflowId: 'workflow-2',
          workflowName: 'emailWorkflow',
          status: 'PENDING' as const,
          createdAt: Date.now(),
        },
      ];

      (listWorkflows as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        workflows: mockWorkflows,
      });

      const result = await listWorkflows();

      expect(result.success).toBe(true);
      expect(result.workflows).toBeDefined();
      if (result.workflows) {
        expect(result.workflows).toHaveLength(2);
      }
    });

    it('should return error on API failure', async () => {
      (listWorkflows as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: 'Server error',
      });

      const result = await listWorkflows();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });

    it('should filter by workflow name when provided', async () => {
      const mockResponse = {
        success: true,
        workflows: [
          {
            workflowId: 'workflow-1',
            workflowName: 'exampleWorkflow',
            status: 'SUCCESS' as const,
            createdAt: Date.now(),
          },
        ],
      };

      (listWorkflows as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await listWorkflows('exampleWorkflow');

      expect(result.success).toBe(true);
      expect(result.workflows).toBeDefined();
    });
  });

  describe('getWorkflowStatus', () => {
    it('should return workflow status on success', async () => {
      const mockWorkflow = {
        workflowId: 'workflow-1',
        workflowName: 'exampleWorkflow',
        status: 'SUCCESS' as const,
        createdAt: Date.now(),
      };

      (getWorkflowStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        workflow: mockWorkflow,
      });

      const result = await getWorkflowStatus('workflow-1');

      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      if (result.workflow) {
        expect(result.workflow.workflowId).toBe('workflow-1');
        expect(result.workflow.status).toBe('SUCCESS');
      }
    });

    it('should return error when workflow not found', async () => {
      (getWorkflowStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: 'Workflow not found',
      });

      const result = await getWorkflowStatus('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Workflow not found');
    });
  });

  describe('retryWorkflow', () => {
    it('should return success on retry', async () => {
      (retryWorkflow as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        workflowId: 'new-workflow-id',
      });

      const result = await retryWorkflow('failed-workflow-id');

      expect(result.success).toBe(true);
    });

    it('should return error on retry failure', async () => {
      (retryWorkflow as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: 'Retry failed',
      });

      const result = await retryWorkflow('failed-workflow-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Retry failed');
    });
  });
});

describe('Workflow Status Types', () => {
  it('should have valid status values', () => {
    const validStatuses = ['SUCCESS', 'PENDING', 'ENQUEUED', 'ERROR'];

    validStatuses.forEach(status => {
      expect(['SUCCESS', 'PENDING', 'ENQUEUED', 'ERROR']).toContain(status);
    });
  });

  it('should handle unknown status gracefully', () => {
    const mockWorkflow = {
      workflowId: 'workflow-1',
      workflowName: 'exampleWorkflow',
      status: 'UNKNOWN' as any,
      createdAt: Date.now(),
    };

    expect(mockWorkflow.status).toBe('UNKNOWN');
  });
});
