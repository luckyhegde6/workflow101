import { describe, it, expect, vi, afterEach } from 'vitest';
import { getDatabaseConfig, getEnvironmentInfo } from '../../app/lib/database-config';

describe('Database Configuration (Local PostgreSQL)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDatabaseConfig', () => {
    it('should return local provider with isRemote=false', () => {
      const config = getDatabaseConfig();

      expect(config.provider).toBe('local');
      expect(config.isRemote).toBe(false);
    });

    it('should use DBOS_SYSTEM_DATABASE_URL when set', () => {
      const original = process.env.DBOS_SYSTEM_DATABASE_URL;
      process.env.DBOS_SYSTEM_DATABASE_URL = 'postgresql://localhost:5432/test';
      vi.stubEnv('DBOS_SYSTEM_DATABASE_URL', 'postgresql://localhost:5432/test');

      const config = getDatabaseConfig();

      expect(config.url).toBe('postgresql://localhost:5432/test');

      process.env.DBOS_SYSTEM_DATABASE_URL = original;
    });

    it('should fall back to POSTGRES_URL_NON_POOLING', () => {
      vi.stubEnv('DBOS_SYSTEM_DATABASE_URL', '');
      vi.stubEnv('POSTGRES_URL_NON_POOLING', 'postgresql://fallback:5432/db');

      const config = getDatabaseConfig();

      expect(config.url).toBe('postgresql://fallback:5432/db');
    });

    it('should use default connection string as final fallback', () => {
      vi.stubEnv('DBOS_SYSTEM_DATABASE_URL', '');
      vi.stubEnv('POSTGRES_URL_NON_POOLING', '');
      vi.stubEnv('DATABASE_URL', '');

      const config = getDatabaseConfig();

      expect(config.url).toBe(
        'postgresql://postgres:postgres@localhost:5432/workflow101'
      );
    });
  });

  describe('getEnvironmentInfo', () => {
    it('should return environment info with local config', () => {
      const info = getEnvironmentInfo();

      expect(info).toHaveProperty('environment', 'local');
      expect(info).toHaveProperty('useRemoteOverride', false);
      expect(info).toHaveProperty('provider', 'local');
      expect(info).toHaveProperty('url');
      expect(info).toHaveProperty('isRemote', false);
      expect(info).toHaveProperty('reason');
      expect(info).toHaveProperty('supabaseConfigured', false);
      expect(info.reason).toContain('Local PostgreSQL only');
    });
  });
});
