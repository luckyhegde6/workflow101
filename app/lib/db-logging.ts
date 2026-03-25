import { logger } from './logging';

export interface DBLogEntry {
  id: string;
  timestamp: string;
  operation: 'query' | 'transaction' | 'connect' | 'disconnect' | 'error';
  table?: string;
  duration: number;
  sql?: string;
  params?: unknown[];
  rowsAffected?: number;
  error?: string;
  connectionId?: string;
}

class DatabaseLogger {
  private logs: DBLogEntry[] = [];
  private maxLogs = 500;
  private slowQueryThreshold = 1000;

  log(entry: Omit<DBLogEntry, 'id' | 'timestamp'>): void {
    const fullEntry: DBLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    this.logs.push(fullEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const logLevel = entry.duration > this.slowQueryThreshold ? 'warn' : 'info';
    const logFn = logLevel === 'warn' ? logger.warn.bind(logger) : logger.info;

    logFn(`${entry.operation.toUpperCase()} ${entry.table || ''}`, {
      db: {
        operation: entry.operation,
        duration: entry.duration,
        rowsAffected: entry.rowsAffected,
        sql: entry.sql,
      },
    });
  }

  logQuery(
    sql: string,
    params: unknown[],
    duration: number,
    rowsAffected: number,
    table?: string
  ): void {
    this.log({
      operation: 'query',
      sql,
      params,
      duration,
      rowsAffected,
      table,
    });
  }

  logTransaction(
    name: string,
    duration: number,
    success: boolean,
    operations: number
  ): void {
    this.log({
      operation: 'transaction',
      duration,
      table: name,
      rowsAffected: operations,
      error: success ? undefined : 'Transaction failed',
    });
  }

  logConnection(action: 'connect' | 'disconnect', connectionId: string): void {
    this.log({
      operation: action,
      duration: 0,
      connectionId,
    });
  }

  logError(error: Error, context?: Record<string, unknown>): void {
    this.log({
      operation: 'error',
      duration: 0,
      error: error.message,
    });

    logger.error('Database error', { ...context, error: error.message });
  }

  getLogs(filter?: {
    operation?: DBLogEntry['operation'];
    table?: string;
    startTime?: Date;
    endTime?: Date;
    slowOnly?: boolean;
  }): DBLogEntry[] {
    let result = [...this.logs];

    if (filter?.operation) {
      result = result.filter((log) => log.operation === filter.operation);
    }

    if (filter?.table) {
      result = result.filter((log) => log.table === filter.table);
    }

    if (filter?.startTime) {
      result = result.filter((log) => new Date(log.timestamp) >= filter.startTime!);
    }

    if (filter?.endTime) {
      result = result.filter((log) => new Date(log.timestamp) <= filter.endTime!);
    }

    if (filter?.slowOnly) {
      result = result.filter((log) => log.duration > this.slowQueryThreshold);
    }

    return result.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getStats(): {
    total: number;
    byOperation: Record<string, number>;
    slowQueries: number;
    avgDuration: number;
    totalRowsAffected: number;
    errorCount: number;
  } {
    const byOperation: Record<string, number> = {};
    let totalDuration = 0;
    let slowQueries = 0;
    let totalRowsAffected = 0;
    let errorCount = 0;

    this.logs.forEach((log) => {
      byOperation[log.operation] = (byOperation[log.operation] || 0) + 1;
      totalDuration += log.duration;

      if (log.duration > this.slowQueryThreshold) {
        slowQueries++;
      }

      if (log.rowsAffected !== undefined) {
        totalRowsAffected += log.rowsAffected;
      }

      if (log.operation === 'error') {
        errorCount++;
      }
    });

    return {
      total: this.logs.length,
      byOperation,
      slowQueries,
      avgDuration: this.logs.length > 0 ? totalDuration / this.logs.length : 0,
      totalRowsAffected,
      errorCount,
    };
  }

  clearLogs(): void {
    this.logs = [];
  }

  setSlowQueryThreshold(ms: number): void {
    this.slowQueryThreshold = ms;
  }
}

export const dbLogger = new DatabaseLogger();

export function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function getOperationColor(operation: string): string {
  const colors: Record<string, string> = {
    query: 'text-blue-600',
    transaction: 'text-purple-600',
    connect: 'text-green-600',
    disconnect: 'text-gray-600',
    error: 'text-red-600',
  };
  return colors[operation] || 'text-gray-600';
}

export function maskSensitiveData(sql: string): string {
  return sql
    .replace(/'[^']*'/g, "'***'")
    .replace(/\$[0-9]+/g, '$?')
    .replace(/\d{4,}/g, '***');
}
