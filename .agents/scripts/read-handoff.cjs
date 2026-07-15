/**
 * .agents/scripts/read-handoff.cjs
 *
 * Reads the latest handoff file from .agents/handoffs/.
 * Parses YAML frontmatter and outputs structured summary.
 *
 * Usage:
 *   node .agents/scripts/read-handoff.cjs              ← latest handoff
 *   node .agents/scripts/read-handoff.cjs --all         ← all handoffs (newest first)
 *   node .agents/scripts/read-handoff.cjs --summary     ← just the summary section
 *   node .agents/scripts/read-handoff.cjs --json        ← output as JSON
 *   node .agents/scripts/read-handoff.cjs --file <name> ← specific file
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const HANDOFFS_DIR = path.resolve(__dirname, '..', 'handoffs');

// ── Parse YAML frontmatter ──────────────────────────────────
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;

  try {
    return yaml.load(match[1]);
  } catch (e) {
    console.error('  ⚠️  YAML parse error:', e.message);
    return null;
  }
}

function getBody(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n\n([\s\S]*)$/);
  return match ? match[1].trim() : content;
}

// ── Get handoff files sorted by timestamp ────────────────────
function getHandoffFiles() {
  if (!fs.existsSync(HANDOFFS_DIR)) return [];
  return fs.readdirSync(HANDOFFS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'HANDOFF_SCHEMA.md')
    .sort()
    .reverse();
}

// ── Format as text summary ───────────────────────────────────
function formatSummary(meta, body, filename) {
  const B = '  ';
  const lines = [];

  lines.push(`\n${B}╔══════════════════════════════════════════════════╗`);
  lines.push(`${B}║  Handoff: ${filename.padEnd(45)}║`);
  lines.push(`${B}╚══════════════════════════════════════════════════╝`);
  lines.push('');

  if (!meta) {
    lines.push(`${B}⚠️  Could not parse frontmatter — showing raw content:`);
    lines.push(`${B}${'─'.repeat(60)}`);
    lines.push(body.slice(0, 2000));
    return lines.join('\n');
  }

  // Metadata
  lines.push(`${B}Session:    ${meta.session_id || 'unknown'}`);
  lines.push(`${B}Timestamp:  ${meta.timestamp || 'unknown'}`);
  lines.push(`${B}Agent:      ${meta.source_agent || 'unknown'} → ${meta.target_agent || '*'}`);
  const branch = meta.context?.branch || 'unknown';
  const commit = meta.context?.last_commit || 'unknown';
  lines.push(`${B}Branch:     ${branch} @ ${commit}`);
  lines.push('');

  // Tasks
  const completed = meta.context?.tasks_completed || [];
  const inProgress = meta.context?.tasks_in_progress || [];
  const pending = meta.context?.tasks_pending || [];
  const total = completed.length + inProgress.length + pending.length;

  lines.push(`${B}Tasks (${total} total):`);
  lines.push(`${B}  ✅ Completed: ${completed.length}`);
  completed.slice(0, 5).forEach(t => lines.push(`${B}    • ${t}`));
  if (completed.length > 5) lines.push(`${B}    • ... and ${completed.length - 5} more`);
  lines.push(`${B}  🔄 In Progress: ${inProgress.length}`);
  inProgress.forEach(t => lines.push(`${B}    • ${t}`));
  lines.push(`${B}  ⏳ Pending: ${pending.length}`);
  pending.slice(0, 5).forEach(t => lines.push(`${B}    • ${t}`));
  if (pending.length > 5) lines.push(`${B}    • ... and ${pending.length - 5} more`);
  lines.push('');

  // Discoveries
  const discoveries = meta.discoveries || [];
  lines.push(`${B}Discoveries: ${discoveries.length}`);
  for (const d of discoveries) {
    const sev = d.severity === 'critical' ? '🔴' : d.severity === 'high' ? '🟠' : d.severity === 'medium' ? '🟡' : '🔵';
    lines.push(`${B}  ${sev} [${d.domain || '?'}] ${d.finding || '?'}`);
    if (d.action) lines.push(`${B}     Action: ${d.action}`);
  }
  if (discoveries.length === 0) {
    lines.push(`${B}  (none logged)`);
  }
  lines.push('');

  // Errors
  const errors = meta.errors || [];
  lines.push(`${B}Errors: ${errors.length}`);
  for (const e of errors) {
    lines.push(`${B}  ❌ ${e.error || '?'}`);
    if (e.solution) lines.push(`${B}     Solution: ${e.solution} (×${e.frequency || 1})`);
  }
  if (errors.length === 0) {
    lines.push(`${B}  (none)`);
  }
  lines.push('');

  // Next Session
  const next = meta.next_session || {};
  const priority = next.priority || [];
  const warnings = next.warnings || [];
  lines.push(`${B}Next Session:`);
  if (priority.length > 0) {
    lines.push(`${B}  Priority:`);
    priority.forEach((t, i) => lines.push(`${B}    ${i + 1}. ${t}`));
  } else {
    lines.push(`${B}  (no priority tasks set)`);
  }
  if (warnings.length > 0) {
    lines.push(`${B}  ⚠️  Warnings:`);
    warnings.forEach(w => lines.push(`${B}    • ${w}`));
  }
  lines.push('');

  // Summary from body
  const summaryMatch = body.match(/## Summary\n([\s\S]*?)(?:\n## |$)/);
  if (summaryMatch) {
    lines.push(`${B}Summary:`);
    summaryMatch[1].trim().split('\n').forEach(l => {
      const t = l.trim();
      if (t) lines.push(`${B}  ${t}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

// ── Main ─────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const showAll = args.includes('--all');
  const showJson = args.includes('--json');
  const showSummary = args.includes('--summary');
  const specificFile = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;

  const files = getHandoffFiles();

  if (files.length === 0) {
    console.log(`\n  📭 No handoff files found in .agents/handoffs/\n`);
    process.exit(0);
  }

  if (showAll) {
    for (const file of files) {
      const content = fs.readFileSync(path.join(HANDOFFS_DIR, file), 'utf8');
      const meta = parseFrontmatter(content);
      const body = getBody(content);
      console.log(formatSummary(meta, body, file));
      console.log(`  ${'═'.repeat(56)}\n`);
    }
    return;
  }

  if (specificFile) {
    const filepath = path.join(HANDOFFS_DIR, specificFile);
    if (!fs.existsSync(filepath)) {
      console.error(`  ❌ File not found: ${specificFile}`);
      console.error(`     Available: ${files.join(', ')}`);
      process.exit(1);
    }
    const content = fs.readFileSync(filepath, 'utf8');
    const meta = parseFrontmatter(content);
    const body = getBody(content);
    if (showJson) {
      console.log(JSON.stringify(meta, null, 2));
    } else {
      console.log(formatSummary(meta, body, specificFile));
    }
    return;
  }

  // Latest handoff
  const latest = files[0];
  const content = fs.readFileSync(path.join(HANDOFFS_DIR, latest), 'utf8');
  const meta = parseFrontmatter(content);
  const body = getBody(content);

  if (showJson) {
    console.log(JSON.stringify(meta, null, 2));
  } else if (showSummary) {
    const summaryMatch = body.match(/## Summary\n([\s\S]*?)(?:\n## |$)/);
    if (summaryMatch) {
      console.log(summaryMatch[1].trim());
    } else {
      console.log('  (No summary section found)');
    }
  } else {
    console.log(formatSummary(meta, body, latest));
  }
}

main();
