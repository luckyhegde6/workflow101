#!/usr/bin/env node
/**
 * Test Database Configuration
 *
 * Usage:
 *   node scripts/test-db-config.js
 *
 * Shows the database configuration (local PostgreSQL only).
 */

// Load .env file
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

function getLocalConnectionString() {
  return (
    process.env.DBOS_SYSTEM_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/workflow101'
  );
}

console.log('\n🔍 Database Configuration Test (Local PostgreSQL)\n');

console.log('Environment Variables:');
console.log('  - DBOS_SYSTEM_DATABASE_URL:', process.env.DBOS_SYSTEM_DATABASE_URL || '(not set)');
console.log('  - POSTGRES_URL_NON_POOLING:', process.env.POSTGRES_URL_NON_POOLING || '(not set)');
console.log('  - DATABASE_URL:', process.env.DATABASE_URL || '(not set)');
console.log('');

console.log('Database Configuration:');
const url = getLocalConnectionString();
console.log('  - Provider:', 'local');
console.log('  - Is Remote:', 'No (Local PostgreSQL)');
console.log('  - URL:', url.replace(/\/\/.*:.*@/, '//[credentials hidden]@'));
console.log('');

console.log('To use local PostgreSQL:');
console.log('  1. Ensure Docker is running');
console.log('  2. Run: npm run db:up');
console.log('  3. Run: npm run dev\n');

console.log('---\n');
