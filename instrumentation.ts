/**
 * OpenTelemetry Instrumentation for Next.js
 * 
 * This file initializes OpenTelemetry tracing using @vercel/otel.
 * It supports both Node.js and Edge runtimes automatically.
 * 
 * @see https://nextjs.org/docs/app/guides/open-telemetry
 * @see https://vercel.com/docs/tracing/instrumentation
 */

import { registerOTel } from '@vercel/otel';

/**
 * Register OpenTelemetry with Vercel
 * 
 * This function is called automatically by Next.js before the application starts.
 * The service name will appear in traces and spans in your observability dashboard.
 */
export function register() {
  registerOTel({
    serviceName: 'workflow101',
    // Optional: Configure context propagation for external services
    // instrumentationConfig: {
    //   fetch: {
    //     propagateContextUrls: [
    //       'https://api.example.com',
    //     ],
    //   },
    // },
  });
}
