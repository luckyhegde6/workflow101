'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">API Documentation</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Everything Workflows API - Interactive Explorer</p>
          </div>
          <a
            href="/"
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/30"
          >
            Back to Dashboard
          </a>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <SwaggerUI 
            url="/api/docs"
            options={{
              syntaxHighlight: {
                theme: 'tomorrow-night',
              },
              presets: [
                'apigateway' as never,
              ],
            }}
          />
        </div>
      </div>
    </div>
  );
}
