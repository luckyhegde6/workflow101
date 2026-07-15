/**
 * .agents/scripts/validate-handoff.cjs
 *
 * Validates a handoff file against the schema defined in HANDOFF_SCHEMA.md.
 * Uses js-yaml for proper YAML parsing.
 *
 * Usage:
 *   node .agents/scripts/validate-handoff.cjs              ← validate latest
 *   node .agents/scripts/validate-handoff.cjs --all         ← validate all handoffs
 *   node .agents/scripts/validate-handoff.cjs --file <name> ← validate specific file
 *   node .agents/scripts/validate-handoff.cjs --fix         ← attempt to fix minor issues
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const HANDOFFS_DIR = path.resolve(__dirname, '..', 'handoffs');

const REQUIRED_FIELDS = [
  'handoff_version',
  'session_id',
  'timestamp',
  'source_agent',
  'target_agent',
  'project',
];

const SEVERITY_VALUES = ['critical', 'high', 'medium', 'low'];

// ── Parse YAML frontmatter ──────────────────────────────────
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;

  try {
    return yaml.load(match[1]);
  } catch (e) {
    return null;
  }
}

function getBody(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n\n([\s\S]*)$/);
  return match ? match[1].trim() : '';
}

// ── Validation ───────────────────────────────────────────────
function validateHandoff(content, filename) {
  const issues = [];
  const warnings = [];

  // Check YAML delimiters
  if (!content.startsWith('---\n')) {
    issues.push({ type: 'ERROR', msg: 'File does not start with `---\\n` (YAML frontmatter delimiter)' });
    return { valid: false, issues, warnings };
  }

  const meta = parseFrontmatter(content);
  if (!meta) {
    issues.push({ type: 'ERROR', msg: 'Could not parse YAML frontmatter' });
    return { valid: false, issues, warnings };
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!meta[field] || meta[field] === '') {
      issues.push({ type: 'ERROR', msg: `Missing required field: '${field}'` });
    }
  }

  // Validate severity values
  const discoveries = meta.discoveries || [];
  for (const d of discoveries) {
    if (d.severity && !SEVERITY_VALUES.includes(d.severity)) {
      warnings.push({ type: 'WARN', msg: `Discovery severity '${d.severity}' not in standard values: ${SEVERITY_VALUES.join(', ')}` });
    }
    if (!d.domain) {
      warnings.push({ type: 'WARN', msg: `Discovery missing 'domain' field` });
    }
    if (!d.finding) {
      warnings.push({ type: 'WARN', msg: `Discovery missing 'finding' field` });
    }
    if (!d.action) {
      warnings.push({ type: 'WARN', msg: `Discovery missing 'action' field` });
    }
  }

  // Check for at least one discovery
  if (discoveries.length === 0) {
    warnings.push({ type: 'WARN', msg: 'No discoveries logged — add at least one for self-learning' });
  }

  // Validate errors
  const errors = meta.errors || [];
  for (const e of errors) {
    if (!e.error) {
      warnings.push({ type: 'WARN', msg: `Error entry missing 'error' field` });
    }
    if (!e.solution) {
      warnings.push({ type: 'WARN', msg: `Error entry missing 'solution' field` });
    }
  }

  // Check next_session
  const next = meta.next_session || {};
  if (!next.priority || next.priority.length === 0) {
    warnings.push({ type: 'WARN', msg: 'No next_session priority tasks — next agent will lack direction' });
  }

  // Check body exists
  const body = getBody(content);
  if (body.length === 0) {
    issues.push({ type: 'ERROR', msg: 'Handoff file has no body content after frontmatter' });
  } else {
    // Check for recommended sections
    if (!body.includes('## Summary')) {
      warnings.push({ type: 'WARN', msg: 'Body missing recommended ## Summary section' });
    }
    if (!body.includes('## Next Actions') && !body.includes('## Next actions')) {
      warnings.push({ type: 'WARN', msg: 'Body missing recommended ## Next Actions section' });
    }
    if (!body.includes('## Key Decisions')) {
      warnings.push({ type: 'INFO', msg: 'Body missing recommended ## Key Decisions section' });
    }
  }

  // Validate timestamp format
  const ts = meta.timestamp;
  if (ts && typeof ts === 'string' && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(ts)) {
    warnings.push({ type: 'WARN', msg: `Timestamp '${ts}' is not ISO 8601 format (expected: YYYY-MM-DDTHH:MM:SSZ)` });
  }

  // Check file name convention
  const nameMatch = filename.match(/^(\d{8})-(\d{6})-(.+)-(.+)\.md$/);
  if (!nameMatch) {
    warnings.push({ type: 'WARN', msg: `Filename '${filename}' doesn't match convention: YYYYMMDD-HHMMSS-<agent>-<label>.md` });
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    meta,
  };
}

// ── Get handoff files ────────────────────────────────────────
function getHandoffFiles() {
  if (!fs.existsSync(HANDOFFS_DIR)) return [];
  return fs.readdirSync(HANDOFFS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'HANDOFF_SCHEMA.md')
    .sort()
    .reverse();
}

// ── Report ───────────────────────────────────────────────────
function printReport(filename, result) {
  console.log(`\n  📄 ${filename}`);
  console.log(`  ${'─'.repeat(56)}`);

  if (result.valid && result.warnings.length === 0) {
    console.log(`  ✅ VALID — No issues found`);
  } else if (result.valid) {
    console.log(`  ✅ VALID (with warnings)`);
  } else {
    console.log(`  ❌ INVALID`);
  }

  if (result.issues.length > 0) {
    console.log(`\n  Errors:`);
    for (const issue of result.issues) {
      console.log(`    ❌ ${issue.msg}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log(`\n  Warnings:`);
    for (const warn of result.warnings) {
      const icon = warn.type === 'WARN' ? '⚠️ ' : '💡';
      console.log(`    ${icon} ${warn.msg}`);
    }
  }

  console.log('');
}

// ── Main ─────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const validateAll = args.includes('--all');
  const specificFile = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;

  const files = getHandoffFiles();

  if (files.length === 0) {
    console.log(`\n  📭 No handoff files found in .agents/handoffs/\n`);
    process.exit(0);
  }

  let totalValid = 0;
  let totalInvalid = 0;

  const filesToCheck = specificFile
    ? [specificFile].filter(f => files.includes(f))
    : validateAll ? files : [files[0]];

  if (specificFile && !files.includes(specificFile)) {
    console.error(`  ❌ File not found: ${specificFile}`);
    console.error(`     Available: ${files.join(', ')}`);
    process.exit(1);
  }

  for (const file of filesToCheck) {
    const content = fs.readFileSync(path.join(HANDOFFS_DIR, file), 'utf8');
    const result = validateHandoff(content, file);
    printReport(file, result);
    if (result.valid) totalValid++;
    else totalInvalid++;
  }

  if (filesToCheck.length > 1) {
    console.log(`  ${'═'.repeat(56)}`);
    console.log(`  Total: ${filesToCheck.length} files`);
    console.log(`  ✅ Valid: ${totalValid}`);
    console.log(`  ❌ Invalid: ${totalInvalid}`);
    console.log('');
  }

  process.exit(totalInvalid > 0 ? 1 : 0);
}

main();
