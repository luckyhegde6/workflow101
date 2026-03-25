export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  workflowId?: string;
  workflowName?: string;
}

export interface LogFilter {
  levels?: LogLevel[];
  workflowNames?: string[];
  startTime?: Date;
  endTime?: Date;
  searchText?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private listeners: Array<(entry: LogEntry) => void> = [];

  private createEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
  }

  debug(message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry('debug', message, context);
    this.addLog(entry);
  }

  info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry('info', message, context);
    this.addLog(entry);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry('warn', message, context);
    this.addLog(entry);
  }

  error(message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry('error', message, context);
    this.addLog(entry);
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    this.listeners.forEach((listener) => listener(entry));
    console.log(`[${entry.level.toUpperCase()}] ${entry.timestamp}: ${entry.message}`);
  }

  getLogs(filter?: LogFilter): LogEntry[] {
    let result = [...this.logs];

    if (filter?.levels?.length) {
      result = result.filter((log) => filter.levels!.includes(log.level));
    }

    if (filter?.workflowNames?.length) {
      result = result.filter(
        (log) => log.workflowName && filter.workflowNames!.includes(log.workflowName)
      );
    }

    if (filter?.startTime) {
      result = result.filter(
        (log) => new Date(log.timestamp) >= filter.startTime!
      );
    }

    if (filter?.endTime) {
      result = result.filter(
        (log) => new Date(log.timestamp) <= filter.endTime!
      );
    }

    if (filter?.searchText) {
      const search = filter.searchText.toLowerCase();
      result = result.filter(
        (log) =>
          log.message.toLowerCase().includes(search) ||
          JSON.stringify(log.context || {}).toLowerCase().includes(search)
      );
    }

    return result;
  }

  clearLogs(): void {
    this.logs = [];
  }

  subscribe(listener: (entry: LogEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    recentCount: number;
  } {
    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    this.logs.forEach((log) => {
      byLevel[log.level]++;
    });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = this.logs.filter(
      (log) => new Date(log.timestamp) >= oneHourAgo
    ).length;

    return {
      total: this.logs.length,
      byLevel,
      recentCount,
    };
  }
}

export const logger = new Logger();

export function formatLogEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
    entry.message,
  ];

  if (entry.workflowName) {
    parts.push(`(workflow: ${entry.workflowName})`);
  }

  if (entry.context && Object.keys(entry.context).length > 0) {
    parts.push(JSON.stringify(entry.context));
  }

  return parts.join(' ');
}

export function exportLogs(
  logs: LogEntry[],
  format: 'json' | 'text' = 'json'
): string {
  if (format === 'json') {
    return JSON.stringify(logs, null, 2);
  }

  return logs.map(formatLogEntry).join('\n');
}
