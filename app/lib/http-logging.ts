import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from './logging';

export interface HTTPLogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  ip?: string;
  requestBody?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
  error?: string;
}

class HTTPLogger {
  private logs: HTTPLogEntry[] = [];
  private maxLogs = 500;

  log(entry: Omit<HTTPLogEntry, 'id' | 'timestamp'>): void {
    const fullEntry: HTTPLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    this.logs.push(fullEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    logger.info(`${entry.method} ${entry.path}`, {
      http: {
        statusCode: entry.statusCode,
        duration: entry.duration,
        method: entry.method,
      },
    });
  }

  getLogs(filter?: {
    method?: string;
    statusCode?: number;
    path?: string;
    startTime?: Date;
    endTime?: Date;
  }): HTTPLogEntry[] {
    let result = [...this.logs];

    if (filter?.method) {
      result = result.filter((log) => log.method === filter.method);
    }

    if (filter?.statusCode) {
      result = result.filter((log) => log.statusCode === filter.statusCode);
    }

    if (filter?.path) {
      result = result.filter((log) => log.path.includes(filter.path!));
    }

    if (filter?.startTime) {
      result = result.filter((log) => new Date(log.timestamp) >= filter.startTime!);
    }

    if (filter?.endTime) {
      result = result.filter((log) => new Date(log.timestamp) <= filter.endTime!);
    }

    return result.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getStats(): {
    total: number;
    byMethod: Record<string, number>;
    byStatusCode: Record<string, number>;
    avgDuration: number;
    errorRate: number;
  } {
    const byMethod: Record<string, number> = {};
    const byStatusCode: Record<string, number> = {};
    let totalDuration = 0;
    let errorCount = 0;

    this.logs.forEach((log) => {
      byMethod[log.method] = (byMethod[log.method] || 0) + 1;
      byStatusCode[log.statusCode.toString()] =
        (byStatusCode[log.statusCode.toString()] || 0) + 1;
      totalDuration += log.duration;
      if (log.statusCode >= 400) {
        errorCount++;
      }
    });

    return {
      total: this.logs.length,
      byMethod,
      byStatusCode,
      avgDuration: this.logs.length > 0 ? totalDuration / this.logs.length : 0,
      errorRate: this.logs.length > 0 ? errorCount / this.logs.length : 0,
    };
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const httpLogger = new HTTPLogger();

export async function withHTTPLogging(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const method = request.method;
  const path = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent') || undefined;

  let statusCode = 500;
  let responseBody: Record<string, unknown> | undefined;
  let error: string | undefined;

  try {
    const response = await handler();
    statusCode = response.status;

    const clonedResponse = response.clone();
    try {
      responseBody = await clonedResponse.json();
    } catch {
      const text = await clonedResponse.text();
      responseBody = { text };
    }

    return response;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    const duration = Date.now() - startTime;

    httpLogger.log({
      method,
      path,
      statusCode,
      duration,
      userAgent,
      requestBody: await getRequestBody(request),
      responseBody,
      error,
    });
  }
}

async function getRequestBody(
  request: NextRequest
): Promise<Record<string, unknown> | undefined> {
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await request.json();
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function getStatusColor(statusCode: number): string {
  if (statusCode >= 500) return 'text-red-600';
  if (statusCode >= 400) return 'text-yellow-600';
  if (statusCode >= 300) return 'text-blue-600';
  return 'text-green-600';
}

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'text-blue-600',
    POST: 'text-green-600',
    PUT: 'text-yellow-600',
    PATCH: 'text-orange-600',
    DELETE: 'text-red-600',
  };
  return colors[method] || 'text-gray-600';
}
