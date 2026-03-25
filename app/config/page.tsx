'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WizardNavigation, { Breadcrumb } from '../components/WizardNavigation';
import ConfirmationPopup from '../components/ConfirmationPopup';
import { enqueueWorkflow } from '../actions';
import { WORKFLOW_STEPS, CRON_PRESETS, type ScheduleType, type ConfirmationData, type WorkflowParams, type WorkflowType, type CronPreset } from '../lib/workflow-types';

const workflowOptions: Array<{ type: WorkflowType; label: string; description: string; icon: string }> = [
  { type: 'exampleWorkflow', label: 'Example', description: 'Basic test workflow', icon: '⚡' },
  { type: 'emailNotificationWorkflow', label: 'Email', description: 'Send email notifications', icon: '📧' },
  { type: 'dataProcessingWorkflow', label: 'Data Processing', description: 'Process and transform data', icon: '🔄' },
  { type: 'onboardingWorkflow', label: 'User Onboarding', description: 'Onboard new users', icon: '👋' },
  { type: 'scheduledReportWorkflow', label: 'Scheduled Report', description: 'Generate scheduled reports', icon: '📊' },
  { type: 'webhookHandlerWorkflow', label: 'Webhook Handler', description: 'Process webhook events', icon: '🪝' },
];

function Step1SelectWorkflow({ 
  selected, 
  onSelect 
}: { 
  selected: WorkflowType | null; 
  onSelect: (type: WorkflowType) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select Workflow Type</h2>
        <p className="text-gray-600 dark:text-gray-400">Choose the workflow you want to configure and execute.</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflowOptions.map((wf) => (
          <button
            key={wf.type}
            onClick={() => onSelect(wf.type)}
            className={`p-6 rounded-xl text-left transition-all border-2 ${
              selected === wf.type
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
            }`}
          >
            <span className="text-4xl mb-3 block">{wf.icon}</span>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{wf.label}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{wf.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step2ConfigureParams({ 
  workflowType, 
  params, 
  onChange 
}: { 
  workflowType: WorkflowType; 
  params: WorkflowParams;
  onChange: (params: WorkflowParams) => void;
}) {
  const updateParam = (key: string, value: unknown) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Configure Parameters</h2>
        <p className="text-gray-600 dark:text-gray-400">Set the parameters for your workflow execution.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        {workflowType === 'exampleWorkflow' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
              <input
                type="text"
                value={(params.message as string) || ''}
                onChange={(e) => updateParam('message', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter message"
              />
            </div>
          </>
        )}

        {workflowType === 'emailNotificationWorkflow' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
              <input
                type="email"
                value={(params.to as string) || ''}
                onChange={(e) => updateParam('to', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
              <input
                type="text"
                value={(params.subject as string) || ''}
                onChange={(e) => updateParam('subject', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body</label>
              <textarea
                value={(params.body as string) || ''}
                onChange={(e) => updateParam('body', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Email body"
              />
            </div>
          </>
        )}

        {workflowType === 'dataProcessingWorkflow' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data ID</label>
              <input
                type="text"
                value={(params.dataId as string) || ''}
                onChange={(e) => updateParam('dataId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="data-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Operation</label>
              <select
                value={(params.operation as string) || 'transform'}
                onChange={(e) => updateParam('operation', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="transform">Transform</option>
                <option value="aggregate">Aggregate</option>
                <option value="filter">Filter</option>
                <option value="export">Export</option>
              </select>
            </div>
          </>
        )}

        {workflowType === 'onboardingWorkflow' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User ID</label>
              <input
                type="text"
                value={(params.userId as string) || ''}
                onChange={(e) => updateParam('userId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="user-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={(params.email as string) || ''}
                onChange={(e) => updateParam('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={(params.name as string) || ''}
                onChange={(e) => updateParam('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="John Doe"
              />
            </div>
          </>
        )}

        {workflowType === 'scheduledReportWorkflow' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Type</label>
              <select
                value={(params.reportType as string) || 'daily'}
                onChange={(e) => updateParam('reportType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="daily">Daily Summary</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="quarterly">Quarterly Report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipients (comma-separated)</label>
              <input
                type="text"
                value={(params.recipients as string) || ''}
                onChange={(e) => updateParam('recipients', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="email1@example.com, email2@example.com"
              />
            </div>
          </>
        )}

        {workflowType === 'webhookHandlerWorkflow' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Type</label>
              <select
                value={(params.eventType as string) || 'payment.completed'}
                onChange={(e) => updateParam('eventType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="user.created">User Created</option>
                <option value="user.updated">User Updated</option>
                <option value="payment.completed">Payment Completed</option>
                <option value="payment.failed">Payment Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payload (JSON)</label>
              <textarea
                value={(params.payload as string) || '{"amount": 100}'}
                onChange={(e) => updateParam('payload', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                placeholder='{"key": "value"}'
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Step3Schedule({ 
  scheduleType, 
  onTypeChange,
  scheduledAt,
  onScheduledAtChange,
  cronExpression,
  onCronExpressionChange,
}: { 
  scheduleType: ScheduleType; 
  onTypeChange: (type: ScheduleType) => void;
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
  cronExpression: string;
  onCronExpressionChange: (value: string) => void;
}) {
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Set Execution Schedule</h2>
        <p className="text-gray-600 dark:text-gray-400">Choose when and how often to run this workflow.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { value: 'immediate' as ScheduleType, label: 'Immediate', icon: '⚡', desc: 'Run now' },
          { value: 'scheduled' as ScheduleType, label: 'Scheduled', icon: '📅', desc: 'Run once at specific time' },
          { value: 'recurring' as ScheduleType, label: 'Recurring', icon: '🔄', desc: 'Run on cron schedule' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => onTypeChange(opt.value)}
            className={`p-4 rounded-xl text-center transition-all border-2 ${
              scheduleType === opt.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
            }`}
          >
            <span className="text-3xl mb-2 block">{opt.icon}</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">{opt.label}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
          </button>
        ))}
      </div>

      {scheduleType === 'scheduled' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Date and Time
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => onScheduledAtChange(e.target.value)}
            min={getMinDateTime()}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
          />
          {scheduledAt && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              Will run at: {new Date(scheduledAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {scheduleType === 'recurring' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cron Presets</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(CRON_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => onCronExpressionChange(preset.expression)}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    cronExpression === preset.expression
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{preset.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Cron Expression</label>
            <input
              type="text"
              value={cronExpression}
              onChange={(e) => onCronExpressionChange(e.target.value)}
              placeholder="* * * * *"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Format: minute hour day month weekday
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Step4Review({ 
  data,
  onBack 
}: { 
  data: {
    workflowType: WorkflowType;
    params: WorkflowParams;
    scheduleType: ScheduleType;
    scheduledAt: string;
    cronExpression: string;
  };
  onBack: () => void;
}) {
  const workflowName = workflowOptions.find(w => w.type === data.workflowType)?.label || data.workflowType;
  const cronDescription = (Object.values(CRON_PRESETS) as CronPreset[]).find(p => p.expression === data.cronExpression)?.description;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Review & Confirm</h2>
        <p className="text-gray-600 dark:text-gray-400">Review your workflow configuration before submitting.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Configuration Summary</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Workflow Type</p>
              <p className="font-medium text-gray-900 dark:text-white">{workflowName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Schedule</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {data.scheduleType === 'immediate' && 'Run Immediately'}
                {data.scheduleType === 'scheduled' && new Date(data.scheduledAt).toLocaleString()}
                {data.scheduleType === 'recurring' && (
                  <span className="flex flex-col">
                    <span className="font-mono">{data.cronExpression}</span>
                    <span className="text-sm text-gray-500">{cronDescription}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {Object.keys(data.params).length > 0 && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Parameters</p>
              <pre className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                {JSON.stringify(data.params, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
          <span className="text-lg">💡</span>
          <span>
            {data.scheduleType === 'recurring'
              ? 'This workflow will be scheduled for recurring execution based on the cron expression.'
              : data.scheduleType === 'scheduled'
              ? 'This workflow will run at the specified time.'
              : 'Click Submit to execute this workflow immediately.'}
          </span>
        </p>
      </div>
    </div>
  );
}

function WorkflowWizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialWorkflow = searchParams.get('workflow') as WorkflowType | null;
  
  const [currentStep, setCurrentStep] = useState(initialWorkflow ? 2 : 1);
  const [workflowType, setWorkflowType] = useState<WorkflowType | null>(initialWorkflow);
  const [params, setParams] = useState<WorkflowParams>({});
  const [scheduleType, setScheduleType] = useState<ScheduleType>('immediate');
  const [scheduledAt, setScheduledAt] = useState('');
  const [cronExpression, setCronExpression] = useState(CRON_PRESETS.daily.expression);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (initialWorkflow && !workflowType) {
      setWorkflowType(initialWorkflow);
      setCurrentStep(2);
    }
  }, [initialWorkflow, workflowType]);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return workflowType !== null;
      case 2:
        return Object.keys(params).length > 0;
      case 3:
        if (scheduleType === 'scheduled') return scheduledAt !== '';
        return true;
      default:
        return true;
    }
  }, [currentStep, workflowType, params, scheduleType, scheduledAt]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowConfirm(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);

    try {
      const res = await enqueueWorkflow(workflowType!, params);
      if (res.success) {
        setShowConfirm(false);
        router.push('/');
      } else {
        setResult({ success: false, message: res.error || 'Failed to submit' });
      }
    } catch (error) {
      setResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getConfirmationData = (): ConfirmationData | null => {
    if (!workflowType) return null;
    
    const cronDescription = (Object.values(CRON_PRESETS) as CronPreset[]).find(p => p.expression === cronExpression)?.description;
    
    return {
      workflowType,
      workflowName: workflowOptions.find(w => w.type === workflowType)?.label || workflowType,
      params,
      scheduleType,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      cronExpression,
      cronDescription,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb 
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Workflow Config', href: '/config' },
            { label: `Step ${currentStep}` },
          ]}
        />

        <WizardNavigation 
          steps={WORKFLOW_STEPS}
          currentStep={currentStep}
          onStepClick={(step: number) => step < currentStep && setCurrentStep(step)}
        />

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {currentStep === 1 && (
            <Step1SelectWorkflow 
              selected={workflowType} 
              onSelect={(type) => {
                setWorkflowType(type);
                setParams({});
              }} 
            />
          )}
          
          {currentStep === 2 && workflowType && (
            <Step2ConfigureParams 
              workflowType={workflowType}
              params={params}
              onChange={setParams}
            />
          )}
          
          {currentStep === 3 && (
            <Step3Schedule 
              scheduleType={scheduleType}
              onTypeChange={setScheduleType}
              scheduledAt={scheduledAt}
              onScheduledAtChange={setScheduledAt}
              cronExpression={cronExpression}
              onCronExpressionChange={setCronExpression}
            />
          )}
          
          {currentStep === 4 && (
            <Step4Review 
              data={{ workflowType: workflowType!, params, scheduleType, scheduledAt, cronExpression }}
              onBack={handleBack}
            />
          )}

          {result && (
            <div className={`mt-6 p-4 rounded-lg ${
              result.success 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 text-green-800 dark:text-green-300' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-800 dark:text-red-300'
            }`}>
              {result.message}
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Back
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(true)}
                className="px-6 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                Preview
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {currentStep === 4 ? 'Submit' : 'Next'} →
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationPopup
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        data={getConfirmationData()}
        loading={submitting}
      />
    </div>
  );
}

export default function WorkflowWizard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>}>
      <WorkflowWizardInner />
    </Suspense>
  );
}
