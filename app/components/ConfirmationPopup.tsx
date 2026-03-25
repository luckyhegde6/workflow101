'use client';

import { useEffect, useRef } from 'react';
import type { WorkflowType, WorkflowParams, ScheduleType } from '../lib/workflow-types';

interface ConfirmationData {
  workflowType: WorkflowType;
  workflowName: string;
  params: WorkflowParams;
  scheduleType: ScheduleType;
  scheduledAt?: Date;
  cronExpression?: string;
  cronDescription?: string;
}

interface ConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: ConfirmationData | null;
  loading?: boolean;
}

export default function ConfirmationPopup({
  isOpen,
  onClose,
  onConfirm,
  data,
  loading = false,
}: ConfirmationPopupProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const scheduleLabels: Record<string, string> = {
    immediate: 'Run immediately',
    scheduled: 'Scheduled',
    recurring: 'Recurring (Cron)',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600">
          <h2 id="modal-title" className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚡</span>
            Confirm Workflow Execution
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Workflow Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Type:</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{data.workflowName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Schedule:</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{scheduleLabels[data.scheduleType]}</dd>
              </div>
              {data.scheduleType === 'scheduled' && data.scheduledAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Run at:</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {new Date(data.scheduledAt).toLocaleString()}
                  </dd>
                </div>
              )}
              {data.scheduleType === 'recurring' && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Cron:</dt>
                    <dd className="font-medium text-gray-900 dark:text-white font-mono">{data.cronExpression}</dd>
                  </div>
                  {data.cronDescription && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">Schedule:</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">{data.cronDescription}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </div>

          {Object.keys(data.params).length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Parameters</h3>
              <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 overflow-x-auto">
                {JSON.stringify(data.params, null, 2)}
              </pre>
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>
                {data.scheduleType === 'recurring'
                  ? 'This workflow will run on a recurring schedule. Make sure the cron expression is correct.'
                  : data.scheduleType === 'scheduled'
                  ? 'This workflow is scheduled to run at the specified time.'
                  : 'This workflow will execute immediately upon submission.'}
              </span>
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <span>🚀</span>
                Submit Workflow
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
