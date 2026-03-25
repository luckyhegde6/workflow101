#!/usr/bin/env node
/**
 * Test Supabase Remote Connection
 * 
 * Usage:
 *   node scripts/test-supabase-connection.js
 * 
 * Prerequisites:
 *   1. Copy .env.local.example to .env.local
 *   2. Add your SUPABASE_DB_PASSWORD
 *   3. Set USE_REMOTE=true in .env.local
 * 
 * SECURITY: This script only uses environment variables.
 * No hardcoded credentials are stored in the code.
 */

// Load .env file for local testing
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');
if (existsSync(envPath)) config({ path: envPath });

const envLocalPath = resolve(__dirname, '..', '.env.local');
if (existsSync(envLocalPath)) config({ path: envLocalPath });

// Import after dotenv is loaded
const { createClient } = await import('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Get DB connection string from environment - supports multiple formats
const getDbConnectionString = () => {
  // Direct URL takes priority
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL;
  if (process.env.DATABASE_REMOTE) return process.env.DATABASE_REMOTE;
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  
  // Fallback: construct from components (password hidden)
  const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\./)?.[1] || 'your-project';
  return `postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
};

const dbConnectionString = getDbConnectionString();
const hasDbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_REMOTE?.includes('@');

console.log('🔍 Testing Supabase Connection\n');
console.log('Configuration:');
console.log('  - URL:', supabaseUrl || '❌ NOT SET');
console.log('  - Service Role Key:', supabaseKey ? '✅ SET' : '❌ NOT SET');
console.log('  - DB Connection:', dbConnectionString.includes('[PASSWORD]') ? '❌ Incomplete' : '✅ Configured');
console.log('');

if (!supabaseUrl) {
  console.log('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  console.log('\nTo configure:');
  console.log('  1. Copy .env.local.example to .env.local');
  console.log('  2. Add SUPABASE_DB_PASSWORD from Supabase Dashboard');
  console.log('  3. Run: USE_REMOTE=true npm run dev\n');
  process.exit(1);
}

// Test Supabase REST API
console.log('Testing Supabase REST API connection...');
const response = await fetch(`${supabaseUrl}/rest/v1/`, {
  headers: {
    'apikey': supabaseKey || '',
    'Authorization': `Bearer ${supabaseKey || ''}`,
  }
});

if (response.ok) {
  console.log('✅ Supabase REST API: Connected');
} else {
  console.log('❌ Supabase REST API: Failed', response.status, response.statusText);
}

// Test direct PostgreSQL connection (only if properly configured)
if (dbConnectionString.includes('[PASSWORD]') || !hasDbPassword) {
  console.log('\n⚠️  PostgreSQL: Skipped - DB_PASSWORD not configured');
  console.log('   Set SUPABASE_DB_PASSWORD or DATABASE_REMOTE in .env.local\n');
} else {
  console.log('\nTesting direct PostgreSQL connection...');
  try {
    const { Pool } = await import('pg');
    
    const pool = new Pool({
      connectionString: dbConnectionString.replace('[PASSWORD]', process.env.SUPABASE_DB_PASSWORD || ''),
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    const result = await client.query('SELECT current_database(), current_user, version()');
    
    console.log('✅ PostgreSQL: Connected');
    console.log('  - Database:', result.rows[0].current_database);
    console.log('  - User:', result.rows[0].current_user);
    console.log('  - Version:', result.rows[0].version.split(' ').slice(0, 3).join(' '));
    
    client.release();
    await pool.end();
  } catch (error) {
    console.log('❌ PostgreSQL: Connection failed');
    console.log('  Error:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Check your SUPABASE_DB_PASSWORD - it may be incorrect');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.log('\n💡 Check your network connection and Supabase project status');
    }
  }
}

console.log('\n--- Test Complete ---\n');
