import { NextResponse } from 'next/server';
import { logger, type LogEntry } from '@/app/lib/logging';
import { httpLogger, type HTTPLogEntry } from '@/app/lib/http-logging';
import { dbLogger, type DBLogEntry } from '@/app/lib/db-logging';

export interface LogsResponse {
  success: boolean;
  logs: LogEntry[];
  httpLogs: HTTPLogEntry[];
  dbLogs: DBLogEntry[];
  stats: {
    application: ReturnType<typeof logger.getStats>;
    http: ReturnType<typeof httpLogger.getStats>;
    database: ReturnType<typeof dbLogger.getStats>;
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'all';
  const level = url.searchParams.get('level');
  const search = url.searchParams.get('search');

  try {
    if (type === 'application' || type === 'all') {
      const logs = logger.getLogs({
        levels: level ? [level as 'debug' | 'info' | 'warn' | 'error'] : undefined,
        searchText: search || undefined,
      });

      const stats = logger.getStats();

      return NextResponse.json({
        success: true,
        logs,
        stats: {
          total: stats.total,
          byLevel: stats.byLevel,
          recentCount: stats.recentCount,
        },
      });
    }

    if (type === 'http') {
      const logs = httpLogger.getLogs({
        method: url.searchParams.get('method') || undefined,
        statusCode: url.searchParams.get('status')
          ? parseInt(url.searchParams.get('status')!)
          : undefined,
        path: url.searchParams.get('path') || undefined,
      });

      const stats = httpLogger.getStats();

      return NextResponse.json({
        success: true,
        logs,
        stats,
      });
    }

    if (type === 'database') {
      const logs = dbLogger.getLogs({
        operation: (url.searchParams.get('operation') as DBLogEntry['operation']) || undefined,
        table: url.searchParams.get('table') || undefined,
        slowOnly: url.searchParams.get('slow') === 'true',
      });

      const stats = dbLogger.getStats();

      return NextResponse.json({
        success: true,
        logs,
        stats,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid log type' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'all';

  try {
    if (type === 'application' || type === 'all') {
      logger.clearLogs();
    }

    if (type === 'http' || type === 'all') {
      httpLogger.clearLogs();
    }

    if (type === 'database' || type === 'all') {
      dbLogger.clearLogs();
    }

    return NextResponse.json({
      success: true,
      message: `Logs cleared for type: ${type}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
