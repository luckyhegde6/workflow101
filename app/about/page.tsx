import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About - Everything Workflows',
  description: 'Learn about the Everything Workflows project, powered by DBOS, Vercel, and Next.js.',
};

const features = [
  {
    icon: '⚡',
    title: 'Durable Execution',
    description: 'Built on DBOS for reliable, fault-tolerant workflow execution with automatic retry and recovery.',
  },
  {
    icon: '🔄',
    title: 'Workflow Chaining',
    description: 'Compose complex workflows by chaining multiple steps together with conditional logic.',
  },
  {
    icon: '⏰',
    title: 'Scheduling',
    description: 'Schedule workflows to run immediately, at a specific time, or on a recurring cron schedule.',
  },
  {
    icon: '📊',
    title: 'Real-time Monitoring',
    description: 'Track workflow execution in real-time with detailed logs and observability dashboards.',
  },
  {
    icon: '🔒',
    title: 'Secure by Design',
    description: 'Enterprise-grade security with audit logging, input validation, and secure defaults.',
  },
  {
    icon: '🚀',
    title: 'Cloud Native',
    description: 'Deploy seamlessly to Vercel with built-in cron support and serverless architecture.',
  },
];

const techStack = [
  { name: 'DBOS', description: 'Durable workflow execution engine' },
  { name: 'Next.js', description: 'React framework with App Router' },
  { name: 'Vercel', description: 'Cloud platform for serverless deployment' },
  { name: 'TypeScript', description: 'Type-safe JavaScript' },
  { name: 'Tailwind CSS', description: 'Utility-first styling' },
  { name: 'Vitest', description: 'Fast unit testing' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white sm:text-6xl">
            About <span className="text-blue-600">Everything Workflows</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            A powerful, durable workflow system built for the modern cloud. 
            Automate complex business processes with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Technology Stack
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {techStack.map((tech, index) => (
              <div
                key={index}
                className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
              >
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {tech.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {tech.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Automate?
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Start building powerful workflows today. Configure workflows, set up scheduling, 
            and monitor execution from our intuitive dashboard.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/config"
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Configure Workflows
            </a>
            <a
              href="/docs"
              className="px-6 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors"
            >
              View Documentation
            </a>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Open Source
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Everything Workflows is built with open source principles. 
              We leverage the best open source tools and believe in transparency and community collaboration.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl mb-2">📦</div>
                <h3 className="font-semibold text-gray-900 dark:text-white">DBOS SDK</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Durable execution</p>
              </div>
              <div>
                <div className="text-4xl mb-2">⚛️</div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Next.js</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">React framework</p>
              </div>
              <div>
                <div className="text-4xl mb-2">🌐</div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Vercel</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cloud deployment</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
