'use client';

import { useState, useMemo } from 'react';
import { WorkflowInfo, WorkflowStatusType } from '../types';
import { WorkflowCard } from './WorkflowCard';
import { WorkflowDetail } from './WorkflowDetail';
import { StatusFilter } from './StatusFilter';

interface WorkflowListProps {
  workflows: WorkflowInfo[];
  loading: boolean;
  onRetry: (workflowId: string) => void;
}

export function WorkflowList({ workflows, loading, onRetry }: WorkflowListProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<WorkflowStatusType[]>([
    'SUCCESS',
    'PENDING',
    'ENQUEUED',
    'ERROR',
  ]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInfo | null>(null);

  const statusCounts = useMemo(() => {
    const counts: Record<WorkflowStatusType, number> = {
      SUCCESS: 0,
      PENDING: 0,
      ENQUEUED: 0,
      ERROR: 0,
    };
    workflows.forEach((wf) => {
      counts[wf.status]++;
    });
    return counts;
  }, [workflows]);

  const filteredWorkflows = useMemo(() => {
    if (selectedStatuses.length === 0) return [];
    if (selectedStatuses.length === 4) return workflows;
    return workflows.filter((wf) => selectedStatuses.includes(wf.status));
  }, [workflows, selectedStatuses]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <svg 
          data-testid="loading-spinner"
          className="animate-spin h-12 w-12 text-blue-600 mb-4" 
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">Loading workflows...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatusFilter
        selectedStatuses={selectedStatuses}
        onChange={setSelectedStatuses}
        counts={statusCounts}
      />

      {filteredWorkflows.length === 0 ? (
        <div data-testid="empty-state" className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 data-testid="empty-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No workflows found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {selectedStatuses.length === 0
              ? 'Select at least one status to view workflows'
              : 'Get started by enqueueing your first workflow'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredWorkflows.length} of {workflows.length} workflows
            </p>
          </div>
          <div data-testid="workflow-list" className="grid gap-4">
            {filteredWorkflows.map((workflow) => (
              <div
                key={workflow.workflowId}
                onClick={() => setSelectedWorkflow(workflow)}
                className="cursor-pointer"
              >
                <WorkflowCard 
                  workflow={workflow}
                  onRetry={onRetry}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {selectedWorkflow && (
        <WorkflowDetail
          workflow={selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
          onRetry={onRetry}
        />
      )}
    </div>
  );
}
