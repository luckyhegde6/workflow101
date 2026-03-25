'use client';

import { useState, useEffect } from 'react';
import { WorkflowInfo, WorkflowStatusType } from '../types';

interface WorkflowCardProps {
  workflow: WorkflowInfo;
  onRetry: (workflowId: string) => void;
}

const statusColors: Record<WorkflowStatusType, string> = {
  SUCCESS: 'bg-green-100 text-green-800 border-green-200',
  PENDING: 'bg-blue-100 text-blue-800 border-blue-200',
  ENQUEUED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ERROR: 'bg-red-100 text-red-800 border-red-200',
};

const statusIcons: Record<WorkflowStatusType, string> = {
  SUCCESS: '✓',
  PENDING: '⏳',
  ENQUEUED: '📤',
  ERROR: '✗',
};

function formatTimestamp(epochMs: number): string {
  const date = new Date(epochMs);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WorkflowCard({ workflow, onRetry }: WorkflowCardProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry(workflow.workflowId);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      data-testid={`workflow-card-${workflow.workflowId}`}
      className="group relative bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-900 dark:to-slate-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Workflow ID
            </span>
            <span 
              data-testid="workflow-name"
              className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded"
            >
              {workflow.workflowName}
            </span>
          </div>
          <p 
            data-testid="workflow-id"
            className="text-lg font-mono font-semibold text-gray-900 dark:text-gray-100 truncate mb-2"
          >
            {workflow.workflowId}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span data-testid="workflow-timestamp">
              Started {formatTimestamp(workflow.createdAt)}
            </span>
          </div>
        </div>
        <div className="ml-6 flex flex-col items-end gap-2">
          <span
            data-testid={`workflow-status-${workflow.status.toLowerCase()}`}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold border ${statusColors[workflow.status]}`}
          >
            <span className="mr-1">{statusIcons[workflow.status]}</span>
            {workflow.status}
          </span>
          {workflow.status === 'ERROR' && (
            <button
              data-testid="retry-button"
              onClick={handleRetry}
              disabled={retrying}
              className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {retrying ? 'Retrying...' : 'Retry'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
