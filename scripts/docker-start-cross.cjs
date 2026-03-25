#!/usr/bin/env node
// scripts/docker-start-cross.cjs
// Cross-platform script to start local PostgreSQL using docker compose
// Usage: node scripts/docker-start-cross.cjs

const { execSync } = require('child_process');

function which(cmd) {
  try {
    const res = execSync(process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`, { stdio: 'pipe' }).toString().trim();
    return !!res;
  } catch {
    return false;
  }
}

function dockerComposeCmd() {
  if (which('docker')) {
    try {
      execSync('docker compose version', { stdio: 'ignore', shell: true });
      return 'docker compose';
    } catch {
      if (which('docker-compose')) return 'docker-compose';
    }
  }
  return null;
}

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', shell: true, ...opts });
  } catch (err) {
    console.warn(`Warning: Command failed: ${cmd}`);
    throw err;
  }
}

function waitForPostgres(composeCmd) {
  console.log('\n⏳ Waiting for Postgres...');
  const maxAttempts = 30;
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      execSync(`${composeCmd} exec -T postgres pg_isready -U postgres -d workflow101`, { stdio: 'ignore', shell: true });
      console.log(' ✅');
      return true;
    } catch {
      process.stdout.write('.');
      if (i === maxAttempts) {
        console.log('\n❌ Postgres did not become ready in time.');
        return false;
      }
      execSync('sleep 2', { stdio: 'ignore' });
    }
  }
  return false;
}

(async () => {
  try {
    console.log('🚀 Starting local PostgreSQL...');
    console.log('');

    const composeCmd = dockerComposeCmd();
    if (!composeCmd) {
      console.error('\nError: Neither `docker compose` nor `docker-compose` was found in PATH.');
      console.error('Make sure Docker is installed and running.\n');
      process.exit(2);
    }

    console.log(`Using compose command: ${composeCmd}`);

    run(`${composeCmd} up -d postgres`);

    if (!waitForPostgres(composeCmd)) {
      process.exit(1);
    }

    console.log('');
    console.log('✅ PostgreSQL is ready.');
    console.log('');
    console.log('Environment variables:');
    console.log('  POSTGRES_URL_NON_POOLING=postgresql://postgres:postgres@localhost:5432/workflow101');
    console.log('  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/workflow101');
    console.log('');
    console.log('Run "npm run dev" to start the development server.');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
