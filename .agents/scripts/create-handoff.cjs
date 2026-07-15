/**
 * .agents/scripts/create-handoff.cjs
 *
 * Creates a session handoff file in .agents/handoffs/
 * Usage: node .agents/scripts/create-handoff.cjs [session-label]
 *
 * If no label is provided, generates one from the current timestamp.
 * Reads package.json for project name, git for branch/commit info.
 * Reads TODOS.md for task status.
 *
 * Output: .agents/handoffs/YYYYMMDD-HHMMSS-<agent>-<label>.md
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const HANDOFFS_DIR = path.resolve(__dirname, '..', 'handoffs');

// ── Helpers ────────────────────────────────────────────────────

function pad(n) {
  return String(n).padStart(2, '0');
}

function now() {
  const d = new Date();
  const iso = d.toISOString();
  return {
    timestamp: iso.replace('Z', '+00:00'),
    fileTimestamp:
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-` +
      `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`,
    dateStr: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    timeStr: iso.slice(11, 19) + 'Z',
  };
}

function safeExec(cmd) {
  try {
    return require('child_process')
      .execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
      .trim();
  } catch {
    return 'unknown';
  }
}

function getGitInfo() {
  return {
    branch: safeExec('git rev-parse --abbrev-ref HEAD 2>nul'),
    commit: safeExec('git rev-parse --short HEAD 2>nul'),
  };
}

function getProjectName() {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '..', '..', 'package.json'), 'utf8')
    );
    return pkg.name || 'unknown-project';
  } catch {
    return 'unknown-project';
  }
}

function getAgentId() {
  // Detect agent from environment
  if (process.env.OPENCODE_VERSION) return 'opencode';
  if (process.env.CLAUDE_CODE_VERSION) return 'claude';
  if (process.env.CURSOR_VERSION) return 'cursor';
  if (process.env.LLM_AGENT_TYPE) return process.env.LLM_AGENT_TYPE;

  // Try to detect from common env vars
  if (process.env.VSCODE_INSPECTOR_OPTIONS) {
    try {
      const opts = JSON.parse(process.env.VSCODE_INSPECTOR_OPTIONS);
      if (opts.__openCode) return 'opencode';
    } catch {}
  }

  return 'unknown-agent';
}

function getTasksFromTodo() {
  const todoPath = path.resolve(__dirname, '..', '..', 'TODOS.md');
  try {
    const content = fs.readFileSync(todoPath, 'utf8');
    const completed = [];
    const inProgress = [];
    const pending = [];

    const lines = content.split('\n');
    let section = null;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        section = trimmed.slice(3).toLowerCase();
        continue;
      }
      if (!section) continue;

      const match = trimmed.match(/^-\s+\[([ xX])\]\s+(.+)/);
      if (!match) continue;

      const text = match[2];
      if (['completed', 'done'].includes(section)) {
        completed.push(text);
      } else if (['in progress', 'in-progress', 'wip'].includes(section)) {
        inProgress.push(text);
      } else if (['pending', 'todo', 'backlog'].includes(section)) {
        pending.push(text);
      }
    }

    return { completed, inProgress, pending };
  } catch {
    return { completed: [], inProgress: [], pending: [] };
  }
}

// ── Main ───────────────────────────────────────────────────────

function main() {
  const label = process.argv[2] || `session-${now().dateStr}`;
  const git = getGitInfo();
  const tasks = getTasksFromTodo();
  const n = now();
  const agentId = getAgentId();
  const projectName = getProjectName();

  const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, '-');
  const filename = `${n.fileTimestamp}-${agentId}-${safeLabel}.md`;
  const filepath = path.join(HANDOFFS_DIR, filename);

  // Ensure handoffs directory exists
  if (!fs.existsSync(HANDOFFS_DIR)) {
    fs.mkdirSync(HANDOFFS_DIR, { recursive: true });
  }

  // Build frontmatter as a clean YAML object
  const frontmatter = {
    handoff_version: '1.0',
    session_id: `${n.dateStr}-${safeLabel}`,
    timestamp: `${n.dateStr}T${n.timeStr}`,
    source_agent: agentId,
    target_agent: '*',
    project: projectName,
    context: {
      branch: git.branch,
      last_commit: git.commit,
      tasks_completed: tasks.completed.length > 0 ? tasks.completed : [],
      tasks_in_progress: tasks.inProgress.length > 0 ? tasks.inProgress : [],
      tasks_pending: tasks.pending.length > 0 ? tasks.pending : [],
      current_phase: 'development',
    },
    discoveries: [],
    errors: [],
    kb_updates: [],
    next_session: {
      priority: [],
      context_files: [],
      warnings: [],
    },
    tags: [],
  };

  const yamlStr = yaml.dump(frontmatter, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: true,
  });

  const body = `# Session Handoff: ${safeLabel}

## Summary
[Brief summary of what was accomplished this session]

## Key Decisions
1. **Decision**: [What was decided]
   - **Rationale**: [Why]
   - **Impact**: [What this means going forward]

## Open Questions
- [Question that needs answering]

## Current State
- **Build**: [✅ Passing | ❌ Failing | ⚠️ Partial]
- **Unit Tests**: [N] / [N] passing
- **E2E Tests**: [N] / [N] passing
- **Known Issues**: [List critical known issues]

## Next Actions
1. [ ] **[Action Title]**: [Description]
2. [ ] **[Action Title]**: [Description]
3. [ ] **[Action Title]**: [Description]

## Warnings
- [Warning for next agent]

## Files Modified This Session
- \`path/to/file.ts\` — [Description of change]
`;

  const content = `---\n${yamlStr}---\n\n${body}`;
  fs.writeFileSync(filepath, content, 'utf8');

  console.log(`\n  ✅ Handoff created: ${filename}`);
  console.log(`     Location: ${filepath}`);
  console.log(`     Agent: ${agentId}`);
  console.log(`     Branch: ${git.branch} @ ${git.commit}`);
  console.log(`     Tasks: ${tasks.completed.length} completed, ${tasks.inProgress.length} in progress, ${tasks.pending.length} pending`);
  console.log(`\n  Edit the file to fill in discoveries, errors, and next actions.\n`);
}

main();
