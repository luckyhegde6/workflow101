'use client';

/**
 * Workflow Status Page
 * 
 * Real-time monitoring of workflow executions with:
 * - Live workflow status tracking
 * - Queue depth visualization
 * - Workflow history with timing
 * - Status filtering and search
 */

import { useState, useEffect, useCallback } from 'react';
import { listWorkflows } from '../actions';

interface WorkflowExecution {
  workflowId: string;
  workflowName: string;
  status: 'SUCCESS' | 'ERROR' | 'PENDING' | 'ENQUEUED';
  createdAt: number;
  runtimeMs?: number;
}

interface QueueStats {
  pending: number;
  enqueued: number;
  success: number;
  error: number;
  total: number;
}

type StatusFilter = 'all' | 'SUCCESS' | 'ERROR' | 'PENDING' | 'ENQUEUED';

export default function WorkflowStatusPage() {
  const [workflows, setWorkflows] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWorkflows = useCallback(async () => {
    try {
      const result = await listWorkflows();
      if (result.success && result.workflows) {
        setWorkflows(result.workflows as WorkflowExecution[]);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch workflows');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
    const interval = setInterval(fetchWorkflows, 5000);
    return () => clearInterval(interval);
  }, [fetchWorkflows]);

  // Calculate stats
  const stats: QueueStats = workflows.reduce(
    (acc, wf) => {
      acc.total++;
      acc[wf.status.toLowerCase() as keyof Omit<QueueStats, 'total'>]++;
      return acc;
    },
    { pending: 0, enqueued: 0, success: 0, error: 0, total: 0 }
  );

  // Filter workflows
  const filteredWorkflows = workflows.filter((wf) => {
    if (statusFilter !== 'all' && wf.status !== statusFilter) return false;
    if (searchQuery && !wf.workflowName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    SUCCESS: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
    PENDING: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
    ENQUEUED: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
    ERROR: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Workflow Status
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time workflow execution monitoring
              {lastUpdated && (
                <span className="ml-2 text-sm">
                  • Updated {formatTime(lastUpdated.getTime())}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={fetchWorkflows}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Success</div>
            <div className="text-2xl font-bold text-green-600">{stats.success}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Enqueued</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.enqueued}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Errors</div>
            <div className="text-2xl font-bold text-red-600">{stats.error}</div>
          </div>
        </div>

        {/* Queue Depth Visualization */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Queue Depth
          </h2>
          <div className="flex gap-2 h-8 rounded-full overflow-hidden">
            {stats.pending > 0 && (
              <div
                className="bg-blue-500 transition-all duration-300 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${Math.max(5, (stats.pending / Math.max(stats.total, 1)) * 100)}%` }}
              >
                {stats.pending > 0 ? `${stats.pending} pending` : ''}
              </div>
            )}
            {stats.enqueued > 0 && (
              <div
                className="bg-yellow-500 transition-all duration-300 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${Math.max(5, (stats.enqueued / Math.max(stats.total, 1)) * 100)}%` }}
              >
                {stats.enqueued > 0 ? `${stats.enqueued} queued` : ''}
              </div>
            )}
            {stats.success > 0 && (
              <div
                className="bg-green-500 transition-all duration-300 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${Math.max(5, (stats.success / Math.max(stats.total, 1)) * 100)}%` }}
              >
                {stats.success > 0 ? `${stats.success} success` : ''}
              </div>
            )}
            {stats.error > 0 && (
              <div
                className="bg-red-500 transition-all duration-300 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${Math.max(5, (stats.error / Math.max(stats.total, 1)) * 100)}%` }}
              >
                {stats.error > 0 ? `${stats.error} error` : ''}
              </div>
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>0</span>
            <span>{stats.total}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'SUCCESS', 'PENDING', 'ENQUEUED', 'ERROR'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Workflow List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Workflow Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Workflow ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading && workflows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Loading workflows...
                    </td>
                  </tr>
                ) : filteredWorkflows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No workflows found
                    </td>
                  </tr>
                ) : (
                  filteredWorkflows.slice(0, 50).map((workflow) => {
                    const colors = statusColors[workflow.status] || statusColors.PENDING;
                    return (
                      <tr key={workflow.workflowId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${colors.dot} ${workflow.status === 'PENDING' || workflow.status === 'ENQUEUED' ? 'animate-pulse' : ''}`} />
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                              {workflow.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {workflow.workflowName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">
                          {workflow.workflowId.slice(0, 16)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatTime(workflow.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {workflow.runtimeMs ? formatDuration(workflow.runtimeMs) : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-4 mt-8">
          <a
            href="/queue"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            View Queue Configuration
          </a>
          <a
            href="/observability"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Go to Observability
          </a>
        </div>
      </div>
    </div>
  );
}
