'use client';

import { useState, useEffect, useCallback } from 'react';
import { listWorkflows, triggerWorker } from '../actions';
import { WorkflowInfo, WorkflowStatusType } from '../types';

interface WorkerStatus {
  running: boolean;
  lastRun: string | null;
  nextRun: string | null;
  workflowsProcessed: number;
  errors: number;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

interface DBOSInspectCommand {
  command: string;
  description: string;
  icon: string;
}

const DBOS_INSPECT_COMMANDS: DBOSInspectCommand[] = [
  {
    command: 'npx workflow inspect runs --backend vercel',
    description: 'Inspect workflows running on Vercel',
    icon: '🌐',
  },
  {
    command: 'npx workflow inspect runs --web',
    description: 'Launch Web UI for visual exploration',
    icon: '🎨',
  },
  {
    command: 'npx workflow inspect runs --limit 50',
    description: 'List last 50 workflow runs',
    icon: '📋',
  },
  {
    command: 'npx workflow inspect runs --workflow exampleWorkflow',
    description: 'Filter by workflow name',
    icon: '🔍',
  },
  {
    command: 'npx workflow inspect status <workflow-id>',
    description: 'Get detailed status of a workflow',
    icon: '📊',
  },
  {
    command: 'npx workflow inspect logs <workflow-id>',
    description: 'View workflow execution logs',
    icon: '📝',
  },
];

export default function ObservabilityPage() {
  const [workflows, setWorkflows] = useState<WorkflowInfo[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [workerLoading, setWorkerLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>({
    running: false,
    lastRun: null,
    nextRun: null,
    workflowsProcessed: 0,
    errors: 0,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'inspect' | 'approvals' | 'supabase' | 'metrics'>('overview');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    try {
      const result = await listWorkflows();
      if (result.success && result.workflows && Array.isArray(result.workflows)) {
        const workflowsData = result.workflows;
        setWorkflows(workflowsData);
        
        setLogs(prev => [
          { timestamp: new Date().toISOString(), level: 'info', message: `Fetched ${workflowsData.length} workflows` },
          ...prev.slice(0, 49),
        ]);
      }
    } catch (error) {
      setLogs(prev => [
        { timestamp: new Date().toISOString(), level: 'error', message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
        ...prev,
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTriggerWorker = async () => {
    setWorkerLoading(true);
    try {
      const result = await triggerWorker();
      if (result.success) {
        setWorkerStatus(prev => ({
          ...prev,
          lastRun: new Date().toISOString(),
          workflowsProcessed: prev.workflowsProcessed + 1,
        }));
        setLogs(prev => [
          { timestamp: new Date().toISOString(), level: 'info', message: 'Worker triggered successfully' },
          ...prev.slice(0, 49),
        ]);
      } else {
        setLogs(prev => [
          { timestamp: new Date().toISOString(), level: 'error', message: result.error || 'Failed to trigger worker' },
          ...prev.slice(0, 49),
        ]);
      }
    } catch (error) {
      setWorkerStatus(prev => ({ ...prev, errors: prev.errors + 1 }));
      setLogs(prev => [
        { timestamp: new Date().toISOString(), level: 'error', message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
        ...prev.slice(0, 49),
      ]);
    } finally {
      setWorkerLoading(false);
    }
  };

  const copyToClipboard = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    fetchWorkflows();
    const interval = setInterval(fetchWorkflows, 5000);
    return () => clearInterval(interval);
  }, [fetchWorkflows]);

  useEffect(() => {
    const workerInterval = setInterval(() => {
      setWorkerStatus(prev => ({
        ...prev,
        running: true,
        nextRun: new Date(Date.now() + 60000).toISOString(),
      }));
    }, 1000);
    return () => clearInterval(workerInterval);
  }, []);

  const stats = {
    total: workflows.length,
    success: workflows.filter(w => w.status === 'SUCCESS').length,
    pending: workflows.filter(w => w.status === 'PENDING' || w.status === 'ENQUEUED').length,
    error: workflows.filter(w => w.status === 'ERROR').length,
  };

  const statusColors: Record<WorkflowStatusType, string> = {
    SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    PENDING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ENQUEUED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500';
      case 'warn':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Observability</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Monitor and debug workflow executions</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/logs"
              className="px-4 py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50"
            >
              View Logs
            </a>
            <a
              href="/docs"
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50"
            >
              API Docs
            </a>
            <a
              href="/"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Dashboard
            </a>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Runs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Error Rate</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.total > 0 ? Math.round((stats.error / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="text-2xl">✗</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Worker Status</p>
                <p className={`text-lg font-bold ${workerStatus.running ? 'text-green-600' : 'text-gray-400'}`}>
                  {workerStatus.running ? 'Running' : 'Idle'}
                </p>
              </div>
              <button
                onClick={handleTriggerWorker}
                disabled={workerLoading}
                className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                  workerLoading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {workerLoading ? 'Triggering...' : 'Trigger'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview', label: 'Overview', icon: '📈' },
              { id: 'inspect', label: 'DBOS Inspect', icon: '🔍' },
              { id: 'approvals', label: 'Approvals', icon: '✅' },
              { id: 'metrics', label: 'Sentry Metrics', icon: '📊' },
              { id: 'supabase', label: 'Supabase', icon: '🗄️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Workflow Timeline</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                  ) : workflows.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No workflows found</div>
                  ) : (
                    workflows.slice(0, 50).map((workflow) => (
                      <div
                        key={workflow.workflowId}
                        onClick={() => setSelectedWorkflow(workflow)}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                          selectedWorkflow?.workflowId === workflow.workflowId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[workflow.status]}`}>
                              {workflow.status}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {workflow.workflowName}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">{workflow.workflowId.slice(0, 20)}...</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(workflow.createdAt).toLocaleTimeString()}
                            </p>
                            {workflow.completedAt && (
                              <p className="text-xs text-gray-400">
                                {(workflow.completedAt - workflow.createdAt) / 1000}s
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Log</h2>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                  {logs.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">No logs yet</div>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className="px-4 py-2 text-sm">
                        <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className={`mx-2 ${getLevelColor(log.level)}`}>[{log.level.toUpperCase()}]</span>
                        <span className="text-gray-600 dark:text-gray-400">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {selectedWorkflow && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Selected Workflow</h2>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Workflow ID</p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedWorkflow.workflowId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedWorkflow.workflowName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${statusColors[selectedWorkflow.status]}`}>
                        {selectedWorkflow.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Started</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(selectedWorkflow.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {selectedWorkflow.completedAt && (
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {(selectedWorkflow.completedAt - selectedWorkflow.createdAt) / 1000} seconds
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Worker Stats</h2>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Last Run</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {workerStatus.lastRun ? new Date(workerStatus.lastRun).toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Next Run</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {workerStatus.nextRun ? new Date(workerStatus.nextRun).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Processed</span>
                    <span className="text-sm text-gray-900 dark:text-white">{workerStatus.workflowsProcessed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Errors</span>
                    <span className="text-sm text-red-600">{workerStatus.errors}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inspect' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🔍</span> DBOS Workflow Inspect Commands
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Use the <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">npx workflow inspect</code> CLI 
                to inspect and debug workflow executions. Copy any command below to use it.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {DBOS_INSPECT_COMMANDS.map((cmd, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{cmd.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{cmd.description}</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-gray-200 dark:bg-gray-800 px-3 py-2 rounded-lg font-mono text-gray-900 dark:text-gray-300 overflow-x-auto">
                            {cmd.command}
                          </code>
                          <button
                            onClick={() => copyToClipboard(cmd.command)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              copiedCommand === cmd.command
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200'
                            }`}
                          >
                            {copiedCommand === cmd.command ? '✓' : '📋'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <span>💡</span> Quick Tips
              </h3>
              <ul className="space-y-2 text-blue-100">
                <li>• Use <code className="bg-white/20 px-2 py-0.5 rounded">--backend vercel</code> to inspect production workflows</li>
                <li>• Use <code className="bg-white/20 px-2 py-0.5 rounded">--web</code> to open the visual explorer in your browser</li>
                <li>• Add <code className="bg-white/20 px-2 py-0.5 rounded">--limit 100</code> to see more results</li>
                <li>• Combine filters like <code className="bg-white/20 px-2 py-0.5 rounded">--workflow name --status ERROR</code></li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>✅</span> Human-in-the-Loop Approvals
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Human-in-the-loop pattern for workflow approvals. Workflows can request approval before 
                executing sensitive actions, allowing you to review and approve/reject requests.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                  <div className="text-4xl mb-4">⏳</div>
                  <h3 className="text-xl font-bold mb-2">Pending Approvals</h3>
                  <p className="text-blue-100 mb-4">
                    View and act on pending approval requests from workflows.
                  </p>
                  <a
                    href="/approvals"
                    className="inline-block px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Go to Approvals
                  </a>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">How It Works</h3>
                  <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">1.</span>
                      <span><strong>Request:</strong> Workflow calls approval API when user action is needed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">2.</span>
                      <span><strong>Review:</strong> View details, metadata, and add comments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">3.</span>
                      <span><strong>Decide:</strong> Approve or reject with optional comment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">4.</span>
                      <span><strong>Resume:</strong> Workflow proceeds or stops based on your decision</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">API Endpoints</h3>
              <div className="space-y-3">
                {[
                  { method: 'GET', endpoint: '/api/approvals', desc: 'List all approvals' },
                  { method: 'POST', endpoint: '/api/approvals', desc: 'Request new approval' },
                  { method: 'GET', endpoint: '/api/approvals/[id]', desc: 'Get approval details' },
                  { method: 'POST', endpoint: '/api/approvals/[id]/approve', desc: 'Approve request' },
                  { method: 'POST', endpoint: '/api/approvals/[id]/reject', desc: 'Reject request' },
                  { method: 'POST', endpoint: '/api/approvals/[id]/webhook', desc: 'Webhook (approve/reject)' },
                ].map((api, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      api.method === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      api.method === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {api.method}
                    </span>
                    <code className="flex-1 font-mono text-gray-600 dark:text-gray-400">{api.endpoint}</code>
                    <span className="text-gray-500">{api.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📊</span> Sentry Metrics Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Real-time metrics tracking for workflow executions. View detailed metrics in the{' '}
                <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Sentry dashboard
                </a>
                .
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                  <div className="text-3xl font-bold">workflow_status_count</div>
                  <div className="text-blue-100 mt-1">Counter</div>
                  <div className="text-sm text-blue-200 mt-2">Tags: workflow_name, status</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
                  <div className="text-3xl font-bold">workflow_runtime_ms</div>
                  <div className="text-green-100 mt-1">Distribution</div>
                  <div className="text-sm text-green-200 mt-2">Tags: workflow_name, status</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
                  <div className="text-3xl font-bold">workflow_queue_depth</div>
                  <div className="text-purple-100 mt-1">Gauge</div>
                  <div className="text-sm text-purple-200 mt-2">Tags: workflow_name, queue_name</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Metrics Reference</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold">Metric</th>
                        <th className="text-left py-3 px-4 font-semibold">Type</th>
                        <th className="text-left py-3 px-4 font-semibold">Description</th>
                        <th className="text-left py-3 px-4 font-semibold">Tags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      <tr>
                        <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400">workflow_status_count</td>
                        <td className="py-3 px-4"><span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">Counter</span></td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Total workflow executions by status</td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">workflow_name, status</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-green-600 dark:text-green-400">workflow_runtime_ms</td>
                        <td className="py-3 px-4"><span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">Distribution</span></td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Workflow execution duration</td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">workflow_name, status</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-purple-600 dark:text-purple-400">workflow_queue_depth</td>
                        <td className="py-3 px-4"><span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">Gauge</span></td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Current pending workflows</td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">workflow_name, status</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-yellow-600 dark:text-yellow-400">workflow_enqueued</td>
                        <td className="py-3 px-4"><span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs">Counter</span></td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">New workflow enqueues</td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">workflow_name, queue_name</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-orange-600 dark:text-orange-400">workflow_type_count</td>
                        <td className="py-3 px-4"><span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs">Counter</span></td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Workflow type distribution</td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">workflow_name, schedule_type</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-red-600 dark:text-red-400">workflow_scheduled</td>
                        <td className="py-3 px-4"><span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs">Counter</span></td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Scheduled workflow creations</td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">workflow_name, schedule_type</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-indigo-600 dark:text-indigo-400">api_response_time_ms</td>
                        <td className="py-3 px-4"><span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs">Distribution</span></td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">API endpoint response times</td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">endpoint, method, status_class</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono text-cyan-600 dark:text-cyan-400">database_operation_time_ms</td>
                        <td className="py-3 px-4"><span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded text-xs">Distribution</span></td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Database query durations</td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">operation, success</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <span>📈</span> Viewing Metrics in Sentry
              </h3>
              <ul className="space-y-2 text-indigo-100">
                <li>• Go to the <strong>Metrics</strong> section in your Sentry dashboard</li>
                <li>• Use the metric explorer to visualize workflow performance</li>
                <li>• Create alerts based on error rates or latency thresholds</li>
                <li>• Filter by tags like <code className="bg-white/20 px-2 py-0.5 rounded">workflow_name</code> or <code className="bg-white/20 px-2 py-0.5 rounded">status</code></li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'supabase' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🗄️</span> Supabase Integration
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Workflow executions are stored in Supabase for persistence and cross-instance access.
                Configure your Supabase connection in <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">.env</code>.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Environment Variables</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">✓</span>
                      <code className="flex-1 bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono">
                        NEXT_PUBLIC_SUPABASE_URL
                      </code>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">✓</span>
                      <code className="flex-1 bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono">
                        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
                      </code>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Supabase URL</h3>
                  <code className="text-sm text-gray-600 dark:text-gray-400 font-mono break-all">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}
                  </code>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Required Supabase Table</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create this table in your Supabase project to store workflow executions:
              </p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`-- Create workflow_executions table
CREATE TABLE workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  retry_count INT DEFAULT 0
);

-- Enable RLS
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (adjust for your needs)
CREATE POLICY "Allow all" ON workflow_executions
  FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_created_at ON workflow_executions(created_at DESC);`}
              </pre>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <span>🚀</span> Getting Started
              </h3>
              <ol className="space-y-2 text-green-100">
                <li>1. Go to your Supabase project dashboard</li>
                <li>2. Open the SQL Editor</li>
                <li>3. Run the table creation script above</li>
                <li>4. Start enqueueing workflows - they'll be persisted automatically</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
