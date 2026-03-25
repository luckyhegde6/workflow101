export interface ProgressUpdate {
  workflowId: string;
  step: number;
  totalSteps: number;
  percent: number;
  message: string;
  timestamp: string;
}

export interface BatchProgress {
  total: number;
  processed: number;
  failed: number;
  skipped: number;
  currentItem?: string;
  results: Array<{ item: string; status: 'success' | 'failed' | 'skipped'; error?: string }>;
}

export function createProgressTracker(
  workflowId: string,
  totalSteps: number
): (step: number, message: string) => ProgressUpdate {
  return (step: number, message: string): ProgressUpdate => ({
    workflowId,
    step,
    totalSteps,
    percent: Math.round((step / totalSteps) * 100),
    message,
    timestamp: new Date().toISOString(),
  });
}

export function createBatchTracker(total: number): BatchProgress {
  return {
    total,
    processed: 0,
    failed: 0,
    skipped: 0,
    results: [],
  };
}

export function updateBatchProgress(
  tracker: BatchProgress,
  item: string,
  status: 'success' | 'failed' | 'skipped',
  error?: string
): BatchProgress {
  const result = { item, status, error };
  const updates: Partial<BatchProgress> = { results: [...tracker.results, result] };

  if (status === 'success') {
    updates.processed = tracker.processed + 1;
  } else if (status === 'failed') {
    updates.failed = tracker.failed + 1;
  } else {
    updates.skipped = tracker.skipped + 1;
  }

  updates.currentItem = item;

  return { ...tracker, ...updates };
}

export function getBatchSummary(tracker: BatchProgress): string {
  return `Processed ${tracker.processed}/${tracker.total} items` +
    (tracker.failed > 0 ? `, ${tracker.failed} failed` : '') +
    (tracker.skipped > 0 ? `, ${tracker.skipped} skipped` : '');
}
