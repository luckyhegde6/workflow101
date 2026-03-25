import { NextResponse } from 'next/server';
import { dbLogger } from '@/app/lib/db-logging';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { operation, sql, params, duration, rowsAffected, table, error } = body;

    dbLogger.log({
      operation: operation || 'query',
      sql,
      params,
      duration: duration || 0,
      rowsAffected,
      table,
      error,
    });

    return NextResponse.json({ success: true });
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
