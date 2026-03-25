#!/usr/bin/env node
// scripts/dbos-init.cjs
// Initialize DBOS database with required tables

const { execSync } = require('child_process');
const fs = require('fs');

// Load .env file
const envPath = '.env';
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && !key.startsWith('#')) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  });
}

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', shell: true, ...opts });
  } catch (err) {
    console.error(`Error running: ${cmd}`);
    throw err;
  }
}

async function main() {
  console.log('🚀 Initializing DBOS database...');
  console.log('');

  // Build database URL from environment
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL or POSTGRES_URL_NON_POOLING not set');
    process.exit(1);
  }
  
  // PGPASSWORD is needed for dbos CLI to authenticate
  const url = new URL(dbUrl);
  process.env.PGPASSWORD = url.password;
  
  // Create DBOS schema in the application database
  console.log('Creating DBOS system tables...');
  run(`npx dbos schema ${dbUrl}`);
  
  console.log('');
  console.log('✅ DBOS database initialized successfully!');
}

main().catch((err) => {
  console.error('');
  console.error('❌ Failed to initialize DBOS database.');
  console.error('Make sure PostgreSQL is running: npm run db:up');
  process.exit(1);
});
