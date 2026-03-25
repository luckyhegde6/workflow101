'use client';

import type { WorkflowConfigStep } from '../lib/workflow-types';

export const WORKFLOW_STEPS: WorkflowConfigStep[] = [
  { id: 1, title: 'Select', description: 'Choose workflow', completed: false, current: true },
  { id: 2, title: 'Configure', description: 'Set parameters', completed: false, current: false },
  { id: 3, title: 'Schedule', description: 'Set execution', completed: false, current: false },
  { id: 4, title: 'Review', description: 'Confirm & submit', completed: false, current: false },
];

interface WizardNavigationProps {
  steps: WorkflowConfigStep[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export default function WizardNavigation({ 
  steps, 
  currentStep,
  onStepClick 
}: WizardNavigationProps) {
  return (
    <nav className="mb-8" aria-label="Progress">
      <div className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isCompleted && onStepClick?.(step.id)}
                  disabled={!isCompleted && !isCurrent}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                    isCompleted
                      ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                      : isCurrent
                      ? 'bg-blue-600 text-white cursor-default'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </button>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {!isLast && (
                <div className={`flex-1 h-1 mx-2 sm:mx-4 mt-[-2rem] rounded-full ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex text-sm text-gray-500 dark:text-gray-400 mb-6">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gray-300 dark:text-gray-600">/</span>}
            {item.href ? (
              <a href={item.href} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {item.label}
              </a>
            ) : (
              <span className={index === items.length - 1 ? 'text-gray-900 dark:text-white font-medium' : ''}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
