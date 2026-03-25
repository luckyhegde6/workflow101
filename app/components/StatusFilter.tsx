'use client';

import { WorkflowStatusType } from '../types';

interface StatusFilterProps {
  selectedStatuses: WorkflowStatusType[];
  onChange: (statuses: WorkflowStatusType[]) => void;
  counts: Record<WorkflowStatusType, number>;
}

const allStatuses: WorkflowStatusType[] = ['SUCCESS', 'PENDING', 'ENQUEUED', 'ERROR'];

const statusConfig: Record<WorkflowStatusType, { label: string; color: string; icon: string }> = {
  SUCCESS: { label: 'Success', color: 'bg-green-500', icon: '✓' },
  PENDING: { label: 'Pending', color: 'bg-blue-500', icon: '⏳' },
  ENQUEUED: { label: 'Enqueued', color: 'bg-yellow-500', icon: '📤' },
  ERROR: { label: 'Error', color: 'bg-red-500', icon: '✗' },
};

export function StatusFilter({ selectedStatuses, onChange, counts }: StatusFilterProps) {
  const toggleStatus = (status: WorkflowStatusType) => {
    if (selectedStatuses.includes(status)) {
      onChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onChange([...selectedStatuses, status]);
    }
  };

  const selectAll = () => {
    onChange([...allStatuses]);
  };

  const clearAll = () => {
    onChange([]);
  };

  const isAllSelected = selectedStatuses.length === allStatuses.length;
  const isNoneSelected = selectedStatuses.length === 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filter by Status</h3>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            disabled={isAllSelected}
            className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            All
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={clearAll}
            disabled={isNoneSelected}
            className="text-xs text-gray-600 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            None
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {allStatuses.map((status) => {
          const config = statusConfig[status];
          const isSelected = selectedStatuses.includes(status);
          const count = counts[status] || 0;

          return (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${config.color}`} />
              <span>{config.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isSelected
                  ? 'bg-white/20 dark:bg-gray-900/20'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {!isNoneSelected && !isAllSelected && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {selectedStatuses.length} of {allStatuses.length} statuses
          </p>
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: WorkflowStatusType }) {
  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
      status === 'SUCCESS' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
      status === 'PENDING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
      status === 'ENQUEUED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
