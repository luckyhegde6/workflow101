export type DatabaseProvider = 'local';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  url: string;
  isRemote: boolean;
}

function getLocalConnectionString(): string {
  return (
    process.env.DBOS_SYSTEM_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/workflow101'
  );
}

export function getDatabaseConfig(): DatabaseConfig {
  return {
    provider: 'local',
    url: getLocalConnectionString(),
    isRemote: false,
  };
}

export function getEnvironmentInfo() {
  const dbConfig = getDatabaseConfig();

  return {
    environment: 'local',
    useRemoteOverride: false,
    ...dbConfig,
    reason: 'Local PostgreSQL only (Supabase project deleted, remote DB disabled)',
    supabaseConfigured: false,
  };
}
