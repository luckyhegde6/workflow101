#!/usr/bin/env node
/**
 * Pre-commit Security Check
 * 
 * This script runs before every commit to ensure no secrets are being committed.
 * 
 * Usage:
 *   node scripts/pre-commit-security.js
 * 
 * Install as pre-commit hook:
 *   npm pkg set scripts.prepare="node scripts/pre-commit-security.js"
 *   npx husky add .husky/pre-commit "npm run prepare"
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Patterns that indicate secrets (regex)
const SECRET_PATTERNS = [
  { pattern: /(?<![A-Z0-9])(?<!https:\/\/)(?<!http:\/\/)(?<!\/\/)(?:api[_-]?key|apikey|api[_-]?secret|secret[_-]?key|private[_-]?key|access[_-]?token|auth[_-]?token|bearer[_-]?token|refresh[_-]?token)["\s:=]+['"][a-zA-Z0-9_\-]{20,}['"](?!\s*[,}])/gi, name: 'API Key or Token' },
  { pattern: /password["\s:=]+['"][^'"]{8,}['"](?!\s*[,}])/gi, name: 'Password' },
  { pattern: /(?<![A-Z0-9])password\s*=\s*['"][^'"]+['"](?!\s*[,}])/gi, name: 'Password Assignment' },
  { pattern: /(?<![A-Z0-9])(?:aws[_-]?access[_-]?key|aws[_-]?secret|s3[_-]?key|azure[_-]?key|gcp[_-]?key)["\s:=]+['"][a-zA-Z0-9_\-+=\/]{20,}['"](?!\s*[,}])/gi, name: 'Cloud Provider Key' },
  { pattern: /postgresql:\/\/[^:]+:[^@]+@/gi, name: 'Database Connection String with Password' },
  { pattern: /(?<![A-Z0-9])(?:ghp|gho|github)[a-zA-Z0-9]{36,}/gi, name: 'GitHub Token' },
  { pattern: /(?<![A-Z0-9])sk-[a-zA-Z0-9]{48}/gi, name: 'OpenAI API Key' },
  { pattern: /(?<![A-Z0-9])xox[baprs]-[a-zA-Z0-9]{10,}/gi, name: 'Slack Token' },
  { pattern: /(?<![A-Z0-9])AKIA[0-9A-Z]{16}/gi, name: 'AWS Access Key' },
];

// Files that are allowed to contain secrets (they're templates)
const ALLOWED_FILES = [
  '.env.example',
  '.env.local.example',
  'scripts/pre-commit-security.js',
  'scripts/test-db-config.js',
  'scripts/test-supabase-connection.js',
  'scripts/dev-db-up.sh',
];

// Patterns within allowed contexts (not real secrets)
const SAFE_PATTERNS = [
  /localhost:5432/, // Local dev connections
  /\[YOUR-PASSWORD\]/, // Placeholder in templates
  /\[PASSWORD\]/, // Placeholder in templates
  /test-password/, // Test passwords
  /exampleWorkflow/, // Workflow name
  /postgres:postgres@/, // Default local credentials
  /user:password@/, // Generic example
  /:#/, // Comment lines
];

  // Directories to skip
  const SKIP_DIRS = [
    'node_modules',
    '.git',
    '.next',
    'coverage',
    '.husky',
    '.playwright-cli',
    '.well-known',
  ];

function resolve(...paths) {
  return join(...paths);
}

function scanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const issues = [];
    const relPath = relative(ROOT, filePath);
    
    for (const { pattern, name } of SECRET_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // Skip if in allowed file
        if (ALLOWED_FILES.some(f => relPath.includes(f))) {
          continue;
        }
        
        // Check if this matches any safe pattern
        const matched = match[0];
        const isSafe = SAFE_PATTERNS.some(safe => safe.test(matched));
        if (isSafe) {
          continue;
        }
        
        // Skip .env files with localhost connections (local dev)
        if (relPath.startsWith('.env') && /localhost/.test(matched)) {
          continue;
        }
        
        // Skip commented lines (start with #)
        const lineContent = content.split('\n')[lineNum - 1] || '';
        if (lineContent.trim().startsWith('#')) {
          continue;
        }
        
        // Get line number
        const lines = content.substring(0, match.index).split('\n');
        const lineNum = lines.length;
        
        issues.push({
          type: name,
          line: lineNum,
          file: relPath,
          preview: content.split('\n')[lineNum - 1]?.trim()?.substring(0, 100) || '',
        });
      }
    }
    
    return issues;
  } catch {
    return [];
  }
}

function scanDirectory(dir, allIssues = []) {
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = resolve(dir, entry);
      
      // Skip certain directories
      if (SKIP_DIRS.some(skip => fullPath.includes(skip))) {
        continue;
      }
      
      try {
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath, allIssues);
        } else if (stat.isFile()) {
          const ext = entry.split('.').pop().toLowerCase();
          // Only scan common file types
          if (['ts', 'tsx', 'js', 'jsx', 'json', 'env', 'yaml', 'yml', 'sh'].includes(ext)) {
            const issues = scanFile(fullPath);
            allIssues.push(...issues);
          }
        }
      } catch {
        // Skip files we can't read
      }
    }
  } catch {
    // Skip directories we can't read
  }
  
  return allIssues;
}

function main() {
  console.log('🔒 Running Pre-commit Security Check\n');
  
  const issues = scanDirectory(ROOT);
  
  if (issues.length === 0) {
    console.log('✅ No secrets detected!\n');
    process.exit(0);
  }
  
  console.log('❌ POTENTIAL SECRETS DETECTED!\n');
  console.log(`Found ${issues.length} potential secret(s):\n`);
  
  for (const issue of issues) {
    console.log(`  ⚠️  ${issue.type}`);
    console.log(`     File: ${issue.file}:${issue.line}`);
    console.log(`     Line: ${issue.preview}`);
    console.log('');
  }
  
  console.log('----------------------------------------');
  console.log('To fix:');
  console.log('  1. Move secrets to environment variables');
  console.log('  2. Use process.env.YOUR_SECRET');
  console.log('  3. Add files to ALLOWED_FILES if they are templates');
  console.log('');
  console.log('If you believe this is a false positive, you can bypass with:');
  console.log('  git commit --no-verify -m "Your commit message"\n');
  
  process.exit(1);
}

main();
