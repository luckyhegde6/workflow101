'use client';

import { useState, useEffect, useCallback } from 'react';

type LogType = 'application' | 'http' | 'database';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  id?: string;
  timestamp: string;
  level?: LogLevel;
  message?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  operation?: string;
  sql?: string;
  table?: string;
  rowsAffected?: number;
  error?: string;
  context?: Record<string, unknown>;
}

interface LogStats {
  total: number;
  byLevel?: Record<string, number>;
  byMethod?: Record<string, number>;
  byStatusCode?: Record<string, number>;
  byOperation?: Record<string, number>;
  slowQueries?: number;
  avgDuration?: number;
  errorCount?: number;
}

export default function LogsPage() {
  const [logType, setLogType] = useState<LogType>('application');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ type: logType });
      if (levelFilter !== 'all') {
        params.set('level', levelFilter);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  }, [logType, levelFilter, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs?')) return;

    try {
      const response = await fetch(`/api/logs?type=${logType}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        setLogs([]);
        setStats(null);
      }
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'debug':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getMethodColor = (method?: string) => {
    switch (method) {
      case 'GET':
        return 'text-blue-600';
      case 'POST':
        return 'text-green-600';
      case 'PUT':
        return 'text-yellow-600';
      case 'PATCH':
        return 'text-orange-600';
      case 'DELETE':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return 'text-gray-600';
    if (statusCode >= 500) return 'text-red-600';
    if (statusCode >= 400) return 'text-yellow-600';
    if (statusCode >= 300) return 'text-blue-600';
    return 'text-green-600';
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const filteredLogs = logs.filter((log) => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const searchable = [
        log.message,
        log.path,
        log.method,
        log.operation,
        log.table,
        log.sql,
        log.error,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(search);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Logs</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              View application, HTTP, and database logs
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/observability"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Observability
            </a>
            <a
              href="/"
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50"
            >
              Dashboard
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex gap-2">
            {(['application', 'http', 'database'] as LogType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setLogType(type);
                  setLoading(true);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  logType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            Auto-refresh
          </label>

          <button
            onClick={handleClearLogs}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50"
          >
            Clear Logs
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
              {stats.byLevel && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Errors</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.byLevel.error || 0}
                  </p>
                </div>
              )}
              {stats.slowQueries !== undefined && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Slow Queries</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.slowQueries}</p>
                </div>
              )}
              {stats.avgDuration !== undefined && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg Duration</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatDuration(stats.avgDuration)}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No logs found
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, i) => (
                    <tr
                      key={log.id || i}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(
                            log.level || log.operation
                          )}`}
                        >
                          {(log.level || log.operation || 'INFO').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {logType === 'http' && (
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${getMethodColor(log.method)}`}>
                              {log.method}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">{log.path}</span>
                            {log.statusCode && (
                              <span
                                className={`font-medium ${getStatusColor(log.statusCode)}`}
                              >
                                {log.statusCode}
                              </span>
                            )}
                          </div>
                        )}
                        {logType === 'database' && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{log.operation}</span>
                            {log.table && <span> on {log.table}</span>}
                            {log.rowsAffected !== undefined && (
                              <span className="ml-2 text-gray-500">
                                ({log.rowsAffected} rows)
                              </span>
                            )}
                          </div>
                        )}
                        {logType === 'application' && log.context && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {JSON.stringify(log.context).slice(0, 100)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDuration(log.duration)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                        {log.message || log.error || log.sql || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
