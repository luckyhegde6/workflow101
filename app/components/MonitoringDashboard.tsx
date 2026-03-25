'use client';

import { useState, useEffect } from 'react';
import { LogEntry, LogLevel, LogFilter } from '../lib/logging';

interface MonitoringDashboardProps {
  workflowStats?: {
    total: number;
    success: number;
    pending: number;
    error: number;
  };
  onRefresh?: () => void;
}

const levelColors: Record<LogLevel, { bg: string; text: string; icon: string }> = {
  debug: { bg: 'bg-gray-100', text: 'text-gray-600', icon: '🔍' },
  info: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'ℹ️' },
  warn: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: '⚠️' },
  error: { bg: 'bg-red-100', text: 'text-red-600', icon: '❌' },
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function MonitoringDashboard({ workflowStats, onRefresh }: MonitoringDashboardProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      if (onRefresh) {
        onRefresh();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [onRefresh]);

  const filteredLogs = logs.filter((log) => {
    if (selectedLevel !== 'all' && log.level !== selectedLevel) {
      return false;
    }
    if (searchText) {
      const search = searchText.toLowerCase();
      return (
        log.message.toLowerCase().includes(search) ||
        JSON.stringify(log.context || {}).toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {workflowStats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {workflowStats.total}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600">
              {workflowStats.success}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Success</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600">
              {workflowStats.pending}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-600">
              {workflowStats.error}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Error</div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Activity Log</h3>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as LogLevel | 'all')}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No logs to display
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredLogs.slice(-50).reverse().map((log, index) => {
                const colors = levelColors[log.level];
                return (
                  <div
                    key={index}
                    className="px-4 py-2 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <span className="text-xs text-gray-400 mt-0.5 w-20 flex-shrink-0">
                      {formatTime(log.timestamp)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">
                      {log.message}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
