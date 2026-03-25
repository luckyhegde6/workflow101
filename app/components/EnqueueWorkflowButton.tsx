'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type WorkflowType = 
  | 'exampleWorkflow'
  | 'emailNotificationWorkflow'
  | 'dataProcessingWorkflow'
  | 'onboardingWorkflow'
  | 'scheduledReportWorkflow'
  | 'webhookHandlerWorkflow';

export interface WorkflowOption {
  type: WorkflowType;
  label: string;
  description: string;
}

export const workflowOptions: WorkflowOption[] = [
  { type: 'exampleWorkflow', label: 'Example Workflow', description: 'Basic workflow for testing' },
  { type: 'emailNotificationWorkflow', label: 'Email Notification', description: 'Send an email notification' },
  { type: 'dataProcessingWorkflow', label: 'Data Processing', description: 'Process data with specified operation' },
  { type: 'onboardingWorkflow', label: 'User Onboarding', description: 'Onboard a new user' },
  { type: 'scheduledReportWorkflow', label: 'Scheduled Report', description: 'Generate and send a scheduled report' },
  { type: 'webhookHandlerWorkflow', label: 'Webhook Handler', description: 'Process incoming webhook event' },
];

interface EnqueueWorkflowButtonProps {
  workflowType?: WorkflowType;
}

export function EnqueueWorkflowButton({ workflowType }: EnqueueWorkflowButtonProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<WorkflowOption>(
    workflowOptions.find(o => o.type === workflowType) || workflowOptions[0]
  );

  const handleOpenWizard = () => {
    router.push(`/config?workflow=${selectedOption.type}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <label 
          htmlFor="workflow-select" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Select Workflow
        </label>
        <select
          id="workflow-select"
          data-testid="workflow-select"
          value={selectedOption.type}
          onChange={(e) => {
            const option = workflowOptions.find(o => o.type === e.target.value);
            if (option) setSelectedOption(option);
          }}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {workflowOptions.map((option) => (
            <option key={option.type} value={option.type}>
              {option.label}
            </option>
          ))}
        </select>
        <p 
          data-testid="workflow-description"
          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {selectedOption.description}
        </p>
      </div>
      
      <button
        data-testid="enqueue-button"
        onClick={handleOpenWizard}
        className="w-full group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Configure & Run Workflow
        </span>
      </button>
    </div>
  );
}
