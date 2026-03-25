'use client';

import { WorkflowInfo, WorkflowStatusType } from '../types';

interface WorkflowDetailProps {
  workflow: WorkflowInfo;
  onClose: () => void;
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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getDuration(start: number, end?: number): string {
  if (!end) return 'In progress';
  const ms = end - start;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function WorkflowDetail({ workflow, onClose, onRetry }: WorkflowDetailProps) {
  const duration = getDuration(workflow.createdAt, workflow.completedAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Workflow Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Workflow ID
              </label>
              <p className="font-mono text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg break-all">
                {workflow.workflowId}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Workflow Name
              </label>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {workflow.workflowName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Status
              </label>
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold border ${statusColors[workflow.status]}`}>
                <span className="mr-1">{statusIcons[workflow.status]}</span>
                {workflow.status}
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Duration
              </label>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{duration}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Started At
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {formatTimestamp(workflow.createdAt)}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Completed At
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {workflow.completedAt ? formatTimestamp(workflow.completedAt) : '—'}
              </p>
            </div>
          </div>

          {workflow.status === 'ERROR' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Error Details
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                Workflow execution failed. Click retry to run again.
              </p>
            </div>
          )}

          {workflow.status === 'SUCCESS' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Execution Complete
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400">
                Workflow completed successfully in {duration}.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
          {workflow.status === 'ERROR' && (
            <button
              onClick={() => {
                onRetry(workflow.workflowId);
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Retry Workflow
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
