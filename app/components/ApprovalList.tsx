'use client';

import { useState } from 'react';
import ApprovalCard from './ApprovalCard';

interface ApprovalRequest {
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
}

interface ApprovalListProps {
  approvals: ApprovalRequest[];
  onApprove: (id: string, comment?: string) => Promise<void>;
  onReject: (id: string, comment?: string) => Promise<void>;
  emptyMessage?: string;
}

export default function ApprovalList({
  approvals,
  onApprove,
  onReject,
  emptyMessage = 'No approvals found',
}: ApprovalListProps) {
  if (approvals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {approvals.map((approval) => (
        <ApprovalCard
          key={approval.id}
          {...approval}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
