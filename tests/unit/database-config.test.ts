import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDatabaseConfig, getEnvironmentInfo, isSupabaseConfigured, type DatabaseProvider } from '../../app/lib/database-config';

describe('Database Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('USE_REMOTE=true', () => {
    it('should use Supabase when USE_REMOTE=true', () => {
      process.env.USE_REMOTE = 'true';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_DB_PASSWORD = 'test-password';
      
      const config = getDatabaseConfig();
      
      expect(config.provider).toBe('supabase');
      expect(config.isRemote).toBe(true);
      expect(config.url).toContain('supabase.co');
    });

    it('should return correct reason when USE_REMOTE=true', () => {
      process.env.USE_REMOTE = 'true';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      
      const info = getEnvironmentInfo();
      
      expect(info.reason).toBe('USE_REMOTE=true explicitly enabled Supabase');
    });
  });

  describe('USE_REMOTE=false', () => {
    it('should use local PostgreSQL when USE_REMOTE=false', () => {
      process.env.USE_REMOTE = 'false';
      process.env.DBOS_SYSTEM_DATABASE_URL = 'postgresql://localhost:5432/test';
      
      const config = getDatabaseConfig();
      
      expect(config.provider).toBe('local');
      expect(config.isRemote).toBe(false);
    });

    it('should return correct reason when USE_REMOTE=false', () => {
      process.env.USE_REMOTE = 'false';
      
      const info = getEnvironmentInfo();
      
      expect(info.reason).toBe('USE_REMOTE=false explicitly disabled Supabase');
    });
  });

  describe('ENVIRONMENT=production', () => {
    it('should use Supabase when ENVIRONMENT=production and no USE_REMOTE override', () => {
      process.env.ENVIRONMENT = 'production';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_DB_PASSWORD = 'test-password';
      
      const config = getDatabaseConfig();
      
      expect(config.provider).toBe('supabase');
    });

    it('should return correct reason for ENVIRONMENT=production', () => {
      process.env.ENVIRONMENT = 'production';
      
      const info = getEnvironmentInfo();
      
      expect(info.reason).toBe('ENVIRONMENT=production defaults to Supabase');
    });

    it('should allow USE_REMOTE=false to override ENVIRONMENT=production', () => {
      process.env.ENVIRONMENT = 'production';
      process.env.USE_REMOTE = 'false';
      
      const config = getDatabaseConfig();
      
      expect(config.provider).toBe('local');
    });
  });

  describe('ENVIRONMENT=local', () => {
    it('should use local PostgreSQL when ENVIRONMENT=local and no USE_REMOTE override', () => {
      process.env.ENVIRONMENT = 'local';
      
      const config = getDatabaseConfig();
      
      expect(config.provider).toBe('local');
    });

    it('should return correct reason for ENVIRONMENT=local', () => {
      process.env.ENVIRONMENT = 'local';
      
      const info = getEnvironmentInfo();
      
      expect(info.reason).toBe('ENVIRONMENT=local defaults to local PostgreSQL');
    });

    it('should allow USE_REMOTE=true to override ENVIRONMENT=local', () => {
      process.env.ENVIRONMENT = 'local';
      process.env.USE_REMOTE = 'true';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_DB_PASSWORD = 'test-password';
      
      const config = getDatabaseConfig();
      
      expect(config.provider).toBe('supabase');
    });
  });

  describe('Default behavior (no ENVIRONMENT, no USE_REMOTE)', () => {
    it('should default to local PostgreSQL for development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      });
      
      const config = getDatabaseConfig();
      
      expect(config.provider).toBe('local');
    });
  });

  describe('isSupabaseConfigured', () => {
    it('should return false when Supabase URL is not set', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      
      expect(isSupabaseConfigured()).toBe(false);
    });

    it('should return true when Supabase is configured', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key';
      
      expect(isSupabaseConfigured()).toBe(true);
    });
  });

  describe('getEnvironmentInfo', () => {
    it('should return complete environment information', () => {
      process.env.ENVIRONMENT = 'production';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      
      const info = getEnvironmentInfo();
      
      expect(info).toHaveProperty('environment');
      expect(info).toHaveProperty('useRemoteOverride');
      expect(info).toHaveProperty('provider');
      expect(info).toHaveProperty('url');
      expect(info).toHaveProperty('isRemote');
      expect(info).toHaveProperty('reason');
      expect(info).toHaveProperty('supabaseConfigured');
    });
  });
});
