import { NextResponse } from 'next/server';
import { httpLogger } from '@/app/lib/http-logging';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, path, statusCode, duration, error } = body;

    httpLogger.log({
      method,
      path,
      statusCode: statusCode || 200,
      duration: duration || 0,
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
