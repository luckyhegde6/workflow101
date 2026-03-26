/**
 * Queue Monitoring Page
 * 
 * Provides visibility into Vercel Queues usage and status.
 * Shows queue configuration and how to monitor queue health.
 */

import { Suspense } from 'react';
import Navbar from '../components/Navbar';

interface QueueInfoProps {
  topic: string;
  description: string;
  consumer: string;
}

const queueInfo: QueueInfoProps[] = [
  {
    topic: 'workflows',
    description: 'Main workflow execution queue. Processes workflow requests immediately.',
    consumer: '/api/queue/workflow',
  },
  {
    topic: 'scheduled-workflows',
    description: 'Delayed workflow queue. For workflows with scheduled execution times.',
    consumer: '/api/queue/workflow',
  },
  {
    topic: 'email-notifications',
    description: 'Email notification queue. For sending notification emails.',
    consumer: 'Not configured',
  },
  {
    topic: 'approvals',
    description: 'Approval queue. For human-in-the-loop approval workflows.',
    consumer: 'Not configured',
  },
];

function QueueStatusCard({ info }: { info: QueueInfoProps }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {info.topic}
          </h3>
        </div>
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          topic
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        {info.description}
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Consumer</span>
          <code className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
            {info.consumer}
          </code>
        </div>
      </div>
    </div>
  );
}

function QueueInfoContent() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Queue Monitoring
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Monitor and manage Vercel Queues configuration
        </p>
      </div>

      {/* Queue Topics */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Queue Topics
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {queueInfo.map((info) => (
            <QueueStatusCard key={info.topic} info={info} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          How It Works
        </h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
              1
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Cron Triggers Daily
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Vercel cron runs once daily (default: 6:00 AM) and collects all due scheduled workflows.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
              2
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Workflows Published to Queue
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Due workflows are published to the <code className="text-xs bg-gray-200 dark:bg-gray-600 px-1 rounded">workflows</code> queue topic.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
              3
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Queue Consumer Processes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Consumer function processes messages with automatic retries and at-least-once delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Benefits of Using Queues
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="text-2xl mb-2">🔄</div>
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-1">
              Automatic Retries
            </h3>
            <p className="text-sm text-green-600 dark:text-green-300">
              Failed messages are automatically retried with exponential backoff.
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              Decoupled Processing
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              HTTP requests return immediately while work happens in the background.
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
              Scalability
            </h3>
            <p className="text-sm text-purple-600 dark:text-purple-300">
              Vercel manages scaling automatically based on queue depth.
            </p>
          </div>
        </div>
      </section>

      {/* Limitations */}
      <section className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
        <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-200 mb-4">
          ⚠️ Free Tier Limitations
        </h2>
        <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>Cron jobs limited to <strong>once per day</strong> on free tier</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>Queues have <strong>4,000 free sends/month</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>Retention limited to <strong>24 hours</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>Concurrent consumers limited on free tier</span>
          </li>
        </ul>
      </section>

      {/* Configuration */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Configuration (Vercel UI)
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Queue triggers are configured through Vercel Dashboard → Storage → Queues.
          Queue consumers are defined in the function that processes queue messages.
        </p>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-sm font-mono overflow-x-auto">
{`// app/api/queue/workflow/route.ts
import { Queue } from '@vercel/queue';

const workflowQueue = new Queue('workflows', async (job) => {
  const { workflowName, params } = job.data;
  // Process the workflow
  console.log('Processing workflow:', workflowName);
});`}
        </pre>
      </section>

      {/* Monitoring Links */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Monitoring Resources
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="/workflow-status"
            className="block p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white hover:shadow-lg transition-all"
          >
            <h3 className="font-medium mb-1">
              Workflow Status →
            </h3>
            <p className="text-sm text-blue-100">
              Real-time workflow execution monitoring
            </p>
          </a>
          <a
            href="/observability"
            className="block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            <h3 className="font-medium text-blue-600 dark:text-blue-400 mb-1">
              Observability →
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Full monitoring dashboard with Sentry metrics
            </p>
          </a>
          <a
            href="https://vercel.com/docs/queues"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            <h3 className="font-medium text-blue-600 dark:text-blue-400 mb-1">
              Vercel Queues Docs →
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Official Vercel Queues documentation
            </p>
          </a>
        </div>
      </section>
    </div>
  );
}

function QueueLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}

export default function QueuePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Suspense fallback={<QueueLoadingSkeleton />}>
          <QueueInfoContent />
        </Suspense>
      </main>
    </div>
  );
}
