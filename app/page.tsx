'use client';

import { useEffect, useState, useCallback } from 'react';
import { listWorkflows, retryWorkflow } from './actions';
import { WorkflowInfo } from './types';
import { EnqueueWorkflowButton, WorkflowList } from './components';

export default function Home() {
  const [workflows, setWorkflows] = useState<WorkflowInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWorkflows = useCallback(async () => {
    try {
      const result = await listWorkflows();
      if (result.success && result.workflows) {
        setWorkflows(result.workflows);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch workflows');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
    const interval = setInterval(fetchWorkflows, 3000);
    return () => clearInterval(interval);
  }, [fetchWorkflows]);

  const handleRetry = async (workflowId: string) => {
    const result = await retryWorkflow(workflowId);
    if (result.success) {
      await fetchWorkflows();
    } else {
      setError(result.error || 'Failed to retry workflow');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Everything Workflows
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Durable background workflows powered by DBOS + Vercel
          </p>
        </header>

        {error && (
          <div 
            data-testid="error-message"
            className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg"
          >
            <p>{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Quick Enqueue
              </h2>
              <EnqueueWorkflowButton />
            </div>
            <a
              href="/cron"
              className="block bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Cron Control</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Worker scheduling</div>
                </div>
              </div>
            </a>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-8 py-6 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Workflows</h2>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Auto-updating
                  </div>
                </div>
                <p className="text-slate-400 mt-1">
                  {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} found
                </p>
                {lastUpdated && (
                  <p className="text-slate-500 text-xs mt-1">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>

              <div className="p-8">
                <WorkflowList 
                  workflows={workflows}
                  loading={loading}
                  onRetry={handleRetry}
                />
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center text-sm text-gray-500 dark:text-gray-400">
          Powered by DBOS • Built with Next.js • Tested with Playwright
        </footer>
      </div>
    </div>
  );
}
