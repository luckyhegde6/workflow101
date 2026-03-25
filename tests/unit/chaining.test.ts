import { describe, it, expect } from 'vitest';
import {
  isSuccessResult,
  extractResultValue,
  buildChainParams,
  shouldExecuteStep,
  ChainStep,
} from '../../app/lib/chaining';

describe('Workflow Chaining Utilities', () => {
  describe('isSuccessResult', () => {
    it('should return true for result with success: true', () => {
      expect(isSuccessResult({ success: true })).toBe(true);
      expect(isSuccessResult({ success: true, data: 'test' })).toBe(true);
    });

    it('should return false for result with success: false', () => {
      expect(isSuccessResult({ success: false })).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isSuccessResult(null)).toBe(false);
      expect(isSuccessResult(undefined)).toBe(false);
    });

    it('should return true for non-null values without success property', () => {
      expect(isSuccessResult('some value')).toBe(true);
      expect(isSuccessResult(123)).toBe(true);
    });
  });

  describe('extractResultValue', () => {
    it('should extract data property when present', () => {
      const result = { success: true, data: { userId: '123' } };
      expect(extractResultValue(result)).toEqual({ userId: '123' });
    });

    it('should extract result property when data is not present', () => {
      const result = { success: true, result: { id: 1 } };
      expect(extractResultValue(result)).toEqual({ id: 1 });
    });

    it('should return the value as-is for primitive values', () => {
      expect(extractResultValue('string')).toBe('string');
      expect(extractResultValue(123)).toBe(123);
    });

    it('should return object without data or result as-is', () => {
      const result = { status: 'complete' };
      expect(extractResultValue(result)).toEqual({ status: 'complete' });
    });
  });

  describe('buildChainParams', () => {
    it('should build params from previous results', () => {
      const steps: ChainStep[] = [
        { name: 'step1', workflowName: 'wf1' },
        { name: 'step2', workflowName: 'wf2' },
      ];
      const previousResults = {
        step1: { success: true, data: { value: 42 } },
      };

      const params = buildChainParams(steps, previousResults);

      expect(params).toHaveProperty('value', 42);
      expect(params).toHaveProperty('previousResults');
    });

    it('should handle empty previous results', () => {
      const steps: ChainStep[] = [
        { name: 'step1', workflowName: 'wf1' },
      ];
      const previousResults: Record<string, unknown> = {};

      const params = buildChainParams(steps, previousResults);

      expect(params).toHaveProperty('previousResults');
      expect(Object.keys(params).length).toBe(1);
    });
  });

  describe('shouldExecuteStep', () => {
    it('should execute step without condition', () => {
      const step: ChainStep = { name: 'step1', workflowName: 'wf1' };
      expect(shouldExecuteStep(step, null)).toBe(true);
    });

    it('should execute step when condition returns true', () => {
      const step: ChainStep = {
        name: 'step1',
        workflowName: 'wf1',
        condition: (ctx: Record<string, unknown>) => (ctx.value as number) > 10,
      };
      expect(shouldExecuteStep(step, { value: 20 })).toBe(true);
    });

    it('should not execute step when condition returns false', () => {
      const step: ChainStep = {
        name: 'step1',
        workflowName: 'wf1',
        condition: (ctx: Record<string, unknown>) => (ctx.value as number) > 10,
      };
      expect(shouldExecuteStep(step, { value: 5 })).toBe(false);
    });
  });
});
