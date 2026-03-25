'use client';

import { useState, useEffect, useCallback } from 'react';
import ApprovalList from '../components/ApprovalList';

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

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | undefined>('pending');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchApprovals = useCallback(async () => {
    try {
      const url = filter ? `/api/approvals?status=${filter}` : '/api/approvals';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setApprovals(data.approvals.map((a: ApprovalRequest) => ({
          ...a,
          createdAt: new Date(a.createdAt).toISOString(),
          resolvedAt: a.resolvedAt ? new Date(a.resolvedAt).toISOString() : undefined,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 5000);
    return () => clearInterval(interval);
  }, [fetchApprovals]);

  const handleApprove = async (id: string, comment?: string) => {
    try {
      const res = await fetch(`/api/approvals/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: 'Request approved successfully' });
        fetchApprovals();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to approve' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to approve request' });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleReject = async (id: string, comment?: string) => {
    try {
      const res = await fetch(`/api/approvals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: 'Request rejected' });
        fetchApprovals();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to reject' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to reject request' });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const approvedCount = approvals.filter(a => a.status === 'approved').length;
  const rejectedCount = approvals.filter(a => a.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Approvals</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Review and approve pending workflow requests</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/observability"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Back
            </a>
          </div>
        </div>

        {notification && (
          <div className={`mb-6 p-4 rounded-lg ${
            notification.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-800 dark:text-red-300'
          }`}>
            {notification.message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <button
            onClick={() => { setActiveTab('pending'); setFilter('pending'); }}
            className={`p-4 rounded-xl text-left transition-all ${
              activeTab === 'pending' && filter === 'pending'
                ? 'bg-yellow-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 shadow hover:shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-75">Pending</p>
                <p className="text-3xl font-bold">{pendingCount}</p>
              </div>
              <span className="text-3xl">⏳</span>
            </div>
          </button>
          <button
            onClick={() => { setActiveTab('all'); setFilter(undefined); }}
            className={`p-4 rounded-xl text-left transition-all ${
              activeTab === 'all'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 shadow hover:shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-75">Total</p>
                <p className="text-3xl font-bold">{approvals.length}</p>
              </div>
              <span className="text-3xl">📋</span>
            </div>
          </button>
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <span className="text-3xl">❌</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {activeTab === 'pending' ? 'Pending Approvals' : 'All Approvals'}
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading approvals...</p>
            </div>
          ) : (
            <ApprovalList
              approvals={approvals}
              onApprove={handleApprove}
              onReject={handleReject}
              emptyMessage={activeTab === 'pending' ? 'No pending approvals' : 'No approvals found'}
            />
          )}
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span>💡</span> How Approvals Work
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Human-in-the-loop pattern for AI agent workflows. Workflows can request approval before executing 
            sensitive actions, allowing you to review and approve/reject requests.
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-blue-500">1.</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Request Approval</p>
                <p className="text-gray-500 dark:text-gray-400">Workflow calls approval API when user action is needed</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500">2.</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Review Request</p>
                <p className="text-gray-500 dark:text-gray-400">View details, metadata, and add comments</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500">3.</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Approve or Reject</p>
                <p className="text-gray-500 dark:text-gray-400">Make a decision with optional comment</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500">4.</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Workflow Resumes</p>
                <p className="text-gray-500 dark:text-gray-400">Action proceeds or stops based on your decision</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
