#!/usr/bin/env node
/**
 * Test Database Configuration
 * 
 * Usage:
 *   node scripts/test-db-config.js
 * 
 * Shows which database will be used based on environment variables.
 */

// Load .env file
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env files in order (later overwrites earlier)
const envPath = resolve(__dirname, '..', '.env');
const envLocalPath = resolve(__dirname, '..', '.env.local');

let loadedCount = 0;
if (existsSync(envPath)) {
  config({ path: envPath });
  loadedCount++;
}
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
  loadedCount++;
}

if (loadedCount > 0) {
  console.log(`📁 Loaded ${loadedCount} .env file(s)\n`);
}

function getEnvironment() {
  const env = process.env.ENVIRONMENT?.toLowerCase();
  if (env === 'production' || env === 'prod') return 'production';
  if (env === 'local' || env === 'dev') return 'local';
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'development';
}

function getUseRemote() {
  const value = process.env.USE_REMOTE?.toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function getDatabaseConfig() {
  const environment = getEnvironment();
  const useRemoteOverride = getUseRemote();
  
  let provider;
  let url;
  
  if (useRemoteOverride !== null) {
    provider = useRemoteOverride ? 'supabase' : 'local';
  } else {
    provider = environment === 'production' ? 'supabase' : 'local';
  }
  
  if (provider === 'supabase') {
    // Try multiple connection string formats
    url = process.env.DIRECT_URL ||
      process.env.DATABASE_REMOTE ||
      process.env.SUPABASE_DB_URL ||
      (() => {
        // Extract project ref from Supabase URL
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const match = supabaseUrl.match(/https:\/\/([^.]+)\./);
        const projectRef = match ? match[1] : 'your-project';
        return `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD || ''}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
      })();
  } else {
    url = process.env.DBOS_SYSTEM_DATABASE_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/workflow101';
  }
  
  return {
    provider,
    url,
    isRemote: provider === 'supabase',
  };
}

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  );
}

function getEnvironmentInfo() {
  const environment = getEnvironment();
  const useRemoteOverride = getUseRemote();
  const dbConfig = getDatabaseConfig();
  
  let reason;
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

console.log('\n🔍 Database Configuration Test\n');

const info = getEnvironmentInfo();

console.log('Environment Variables:');
console.log('  - ENVIRONMENT:', process.env.ENVIRONMENT || '(not set)');
console.log('  - USE_REMOTE:', process.env.USE_REMOTE || '(not set)');
console.log('');

console.log('Environment Information:');
console.log('  - Resolved ENVIRONMENT:', info.environment);
console.log('  - USE_REMOTE override:', info.useRemoteOverride ?? '(not set)');
console.log('');

console.log('Database Configuration:');
console.log('  - Provider:', info.provider);
console.log('  - Is Remote:', info.isRemote ? '✅ Yes (Supabase)' : '❌ No (Local PostgreSQL)');
console.log('  - URL:', info.url.replace(/\/\/.*:.*@/, '//[credentials hidden]@'));
console.log('');

console.log('Reason:', info.reason);
console.log('');

console.log('Supabase Configured:', isSupabaseConfigured() ? '✅ Yes' : '❌ No');
console.log('  - URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || '(not set)');
console.log('  - Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ? '✅ Set' : '❌ Not set');
console.log('  - DB Password:', process.env.SUPABASE_DB_PASSWORD ? '✅ Set' : '❌ Not set');
console.log('');

if (info.isRemote) {
  console.log('To use Supabase remote database:');
  console.log('  1. Create .env.local from .env.local.example');
  console.log('  2. Add SUPABASE_DB_PASSWORD from Supabase Dashboard');
  console.log('  3. Run: USE_REMOTE=true npm run dev\n');
  
  if (!process.env.SUPABASE_DB_PASSWORD) {
    console.log('⚠️  Warning: Using Supabase URL but no database password set');
    console.log('   The connection may fail without proper credentials\n');
  }
} else {
  console.log('To use local PostgreSQL (default):');
  console.log('  1. Ensure Docker is running');
  console.log('  2. Run: npm run db:up');
  console.log('  3. Run: npm run dev\n');
}

console.log('---\n');
