'use client';

import { useState } from 'react';

interface ApprovalCardProps {
  id: string;
  workflowName: string;
  action: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  requestedBy?: string;
  comment?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
  onApprove?: (id: string, comment?: string) => Promise<void>;
  onReject?: (id: string, comment?: string) => Promise<void>;
}

export default function ApprovalCard({
  id,
  workflowName,
  action,
  description,
  status,
  createdAt,
  requestedBy,
  comment,
  resolvedBy,
  resolvedAt,
  metadata,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsSubmitting(true);
    try {
      await onApprove(id, commentText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsSubmitting(true);
    try {
      await onReject(id, commentText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const statusIcons = {
    pending: '⏳',
    approved: '✅',
    rejected: '❌',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{statusIcons[status]}</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{action}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{workflowName}</p>
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[status]}`}>
            {status.toUpperCase()}
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-3">{description}</p>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span>
            {requestedBy ? `Requested by: ${requestedBy}` : 'Auto-requested'}
          </span>
          <span>{new Date(createdAt).toLocaleString()}</span>
        </div>

        {showDetails && metadata && Object.keys(metadata).length > 0 && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Metadata</p>
            <pre className="text-xs font-mono overflow-x-auto">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </div>
        )}

        {resolvedAt && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {status === 'approved' ? 'Approved' : 'Rejected'} by {resolvedBy || 'Unknown'}
              {' at '}{new Date(resolvedAt).toLocaleString()}
            </p>
            {comment && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">"{comment}"</p>
            )}
          </div>
        )}

        {status === 'pending' && (
          <div className="space-y-3">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment (optional)..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Processing...' : '✓ Approve'}
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Processing...' : '✗ Reject'}
              </button>
            </div>
          </div>
        )}
      </div>

      {metadata && Object.keys(metadata).length > 0 && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      )}
    </div>
  );
}
