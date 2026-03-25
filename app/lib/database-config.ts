export type DatabaseProvider = 'local' | 'supabase';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  url: string;
  isRemote: boolean;
}

function getEnvironment(): 'local' | 'production' | 'development' {
  const env = process.env.ENVIRONMENT?.toLowerCase();
  if (env === 'production' || env === 'prod') return 'production';
  if (env === 'local' || env === 'dev') return 'local';
  
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'development';
}

function getUseRemote(): boolean | null {
  const value = process.env.USE_REMOTE?.toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

export function getDatabaseConfig(): DatabaseConfig {
  const environment = getEnvironment();
  const useRemoteOverride = getUseRemote();
  
  let provider: DatabaseProvider;
  let url: string;
  
  if (useRemoteOverride !== null) {
    provider = useRemoteOverride ? 'supabase' : 'local';
  } else {
    provider = environment === 'production' ? 'supabase' : 'local';
  }
  
  if (provider === 'supabase') {
    url = getSupabaseConnectionString();
  } else {
    url = getLocalConnectionString();
  }
  
  return {
    provider,
    url,
    isRemote: provider === 'supabase',
  };
}

function getSupabaseConnectionString(): string {
  return (
    process.env.DIRECT_URL ||
    process.env.DATABASE_REMOTE ||
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.DBOS_SYSTEM_DATABASE_URL ||
    `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD || ''}@db.${getSupabaseProjectRef()}.supabase.co:5432/postgres?sslmode=require`
  );
}

function getSupabaseProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'your-project-ref';
}

function getLocalConnectionString(): string {
  return (
    process.env.DBOS_SYSTEM_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/workflow101'
  );
}

export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  };
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

export function getEnvironmentInfo() {
  const environment = getEnvironment();
  const useRemoteOverride = getUseRemote();
  const dbConfig = getDatabaseConfig();
  
  let reason: string;
  if (useRemoteOverride !== null) {
    reason = useRemoteOverride 
      ? 'USE_REMOTE=true explicitly enabled Supabase'
      : 'USE_REMOTE=false explicitly disabled Supabase';
  } else {
    reason = environment === 'production'
      ? 'ENVIRONMENT=production defaults to Supabase'
      : 'ENVIRONMENT=local defaults to local PostgreSQL';
  }
  
  return {
    environment,
    useRemoteOverride,
    ...dbConfig,
    reason,
    supabaseConfigured: isSupabaseConfigured(),
  };
}
