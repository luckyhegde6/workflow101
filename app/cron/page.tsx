'use client';

import { useState, useEffect, useCallback } from 'react';
import { triggerWorker, listWorkflows } from '../actions';
import { WorkflowInfo } from '../types';

export default function CronPage() {
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [recentRuns, setRecentRuns] = useState<Array<{ timestamp: Date; status: 'success' | 'error'; message: string }>>([]);
  const [workflowStats, setWorkflowStats] = useState({
    total: 0,
    success: 0,
    pending: 0,
    error: 0,
  });

  const fetchStats = useCallback(async () => {
    const result = await listWorkflows();
    if (result.success && result.workflows) {
      const workflows = result.workflows;
      setWorkflowStats({
        total: workflows.length,
        success: workflows.filter(w => w.status === 'SUCCESS').length,
        pending: workflows.filter(w => w.status === 'PENDING' || w.status === 'ENQUEUED').length,
        error: workflows.filter(w => w.status === 'ERROR').length,
      });
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleTrigger = async () => {
    setTriggering(true);
    setMessage(null);
    try {
      const result = await triggerWorker();
      if (result.success) {
        setMessage(result.message || 'Worker triggered successfully');
        setIsError(false);
        setRecentRuns(prev => [{
          timestamp: new Date(),
          status: 'success',
          message: result.message || 'Worker triggered'
        }, ...prev.slice(0, 9)]);
      } else {
        setMessage(result.error || 'Failed to trigger worker');
        setIsError(true);
        setRecentRuns(prev => [{
          timestamp: new Date(),
          status: 'error',
          message: result.error || 'Failed'
        }, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unknown error');
      setIsError(true);
    } finally {
      setTriggering(false);
      fetchStats();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cron & Worker Control</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Monitor and control workflow execution</p>
          </div>
          <a
            href="/"
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            ← Back to Dashboard
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Worker Status</h2>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-xs font-bold text-green-600 shadow">
                  {workflowStats.pending}
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {workflowStats.pending > 0 ? 'Active' : 'Idle'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {workflowStats.pending} workflow{workflowStats.pending !== 1 ? 's' : ''} processing
                </div>
              </div>
            </div>

            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold disabled:opacity-50"
            >
              {triggering ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Triggering...
                </span>
              ) : (
                'Trigger Worker Now'
              )}
            </button>

            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                isError 
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' 
                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              }`}>
                {message}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Workflow Stats</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400">Total Runs</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{workflowStats.total}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-green-700 dark:text-green-400">Successful</span>
                <span className="text-xl font-bold text-green-600">{workflowStats.success}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <span className="text-red-700 dark:text-red-400">Failed</span>
                <span className="text-xl font-bold text-red-600">{workflowStats.error}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cron Configuration</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Schedule</div>
              <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">* * * * *</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Every minute</div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Endpoint</div>
              <div className="font-mono text-gray-900 dark:text-white">/api/dbos</div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Vercel Free Tier:</strong> Cron jobs run at minimum once per day. 
                  Upgrade for per-minute execution.
                </div>
              </div>
            </div>
          </div>
        </div>

        {recentRuns.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Triggers</h2>
            <div className="space-y-2">
              {recentRuns.map((run, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${run.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {run.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-900 dark:text-white">{run.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
