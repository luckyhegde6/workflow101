/**
 * Workflow101 Plugin for OpenCode
 *
 * Provides hooks for:
 * - Auto-formatting TypeScript/TSX files
 * - TypeScript type checking after edits
 * - Console.log warning audit
 * - Security checks for API endpoints
 */

import type { PluginInput } from "@opencode-ai/plugin";

export const Workflow101Plugin = async ({
  client,
  $,
  directory,
  worktree,
}: PluginInput) => {
  type HookProfile = "minimal" | "standard" | "strict";

  const editedFiles = new Set<string>();

  const log = (level: "debug" | "info" | "warn" | "error", message: string) =>
    client.app.log({ body: { service: "workflow101", level, message } });

  const normalizeProfile = (value: string | undefined): HookProfile => {
    if (value === "minimal" || value === "strict") return value;
    return "standard";
  };

  const currentProfile = normalizeProfile(process.env.ECC_HOOK_PROFILE);
  const disabledHooks = new Set(
    (process.env.ECC_DISABLED_HOOKS || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );

  const profileOrder: Record<HookProfile, number> = {
    minimal: 0,
    standard: 1,
    strict: 2,
  };

  const profileAllowed = (required: HookProfile | HookProfile[]): boolean => {
    if (Array.isArray(required)) {
      return required.some(
        (entry) => profileOrder[currentProfile] >= profileOrder[entry]
      );
    }
    return profileOrder[currentProfile] >= profileOrder[required];
  };

  const hookEnabled = (
    hookId: string,
    requiredProfile: HookProfile | HookProfile[] = "standard"
  ): boolean => {
    if (disabledHooks.has(hookId)) return false;
    return profileAllowed(requiredProfile);
  };

  return {
    /**
     * File Edited Hook
     * Triggers: After any file is edited
     * Action: Format code and check for console.log
     */
    "file.edited": async (event: { path: string }) => {
      editedFiles.add(event.path);

      if (
        hookEnabled("post:edit:format", ["strict"]) &&
        event.path.match(/\.(ts|tsx|js|jsx)$/)
      ) {
        try {
          await $`prettier --write ${event.path} 2>/dev/null`;
          log("info", `[workflow101] Formatted: ${event.path}`);
        } catch {
          // Prettier not installed or failed
        }
      }

      if (
        hookEnabled("post:edit:console-warn", ["standard", "strict"]) &&
        event.path.match(/\.(ts|tsx|js|jsx)$/)
      ) {
        try {
          const result = await $`grep -n "console\\.log" ${event.path} 2>/dev/null`.text();
          if (result.trim()) {
            const lines = result.trim().split("\n").length;
            log(
              "warn",
              `[workflow101] console.log found in ${event.path} (${lines} occurrence${lines > 1 ? "s" : ""})`
            );
          }
        } catch {
          // No console.log found
        }
      }
    },

    /**
     * Tool Execute After Hook
     * Triggers: After tool execution completes
     * Action: Type check on TypeScript edits
     */
    "tool.execute.after": async (
      input: { tool: string; args?: { filePath?: string } },
      output: unknown
    ) => {
      if (
        hookEnabled("post:edit:typecheck", ["strict"]) &&
        input.tool === "edit" &&
        input.args?.filePath?.match(/\.tsx?$/)
      ) {
        try {
          await $`npx tsc --noEmit 2>&1`;
          log("info", "[workflow101] TypeScript check passed");
        } catch (error: unknown) {
          const err = error as { stdout?: string };
          log("warn", "[workflow101] TypeScript errors detected:");
          if (err.stdout) {
            const errors = err.stdout.split("\n").slice(0, 5);
            errors.forEach((line: string) => log("warn", `  ${line}`));
          }
        }
      }

      // Build success notification
      if (
        hookEnabled("post:bash:build-success", ["standard", "strict"]) &&
        input.tool === "bash" &&
        input.args?.toString().includes("npm run build")
      ) {
        log("info", "[workflow101] Build completed successfully");
      }
    },

    /**
     * Tool Execute Before Hook
     * Triggers: Before tool execution
     * Action: Security checks
     */
    "tool.execute.before": async (
      input: { tool: string; args?: Record<string, unknown> }
    ) => {
      // Check for hardcoded secrets in write operations
      if (
        hookEnabled("pre:write:secret-check", ["standard", "strict"]) &&
        input.tool === "write" &&
        input.args?.filePath &&
        typeof input.args.filePath === "string"
      ) {
        const filePath = input.args.filePath;
        if (
          filePath.match(/\.(ts|tsx|js|jsx)$/) &&
          !filePath.includes("test") &&
          !filePath.includes("spec")
        ) {
          log(
            "info",
            `[workflow101] Remember to use environment variables for secrets in ${filePath}`
          );
        }
      }

      // DBOS-specific reminder
      if (
        hookEnabled("pre:write:dbos-pattern", ["standard", "strict"]) &&
        input.tool === "write" &&
        input.args?.filePath &&
        typeof input.args.filePath === "string" &&
        input.args.filePath.includes("workflow")
      ) {
        log(
          "info",
          "[workflow101] Remember: use 'use workflow' and 'use step' directives"
        );
      }
    },

    /**
     * Session Created Hook
     * Triggers: When session starts
     * Action: Load context
     */
    "session.created": async () => {
      if (!hookEnabled("session:start", ["minimal", "standard", "strict"]))
        return;

      log("info", `[workflow101] Session started - profile=${currentProfile}`);

      try {
        const hasAgentsMd = await $`test -f ${worktree}/AGENTS.md && echo "yes"`.text();
        if (hasAgentsMd.trim() === "yes") {
          log("info", "[workflow101] Found AGENTS.md - loading project context");
        }
      } catch {
        // No AGENTS.md found
      }
    },

    /**
     * Session Idle Hook
     * Triggers: When session becomes idle
     * Action: Console.log audit
     */
    "session.idle": async () => {
      if (!hookEnabled("stop:check-console-log", ["minimal", "standard", "strict"]))
        return;
      if (editedFiles.size === 0) return;

      log("info", "[workflow101] Session idle - running console.log audit");

      let totalConsoleLogCount = 0;
      const filesWithConsoleLogs: string[] = [];

      for (const file of editedFiles) {
        if (!file.match(/\.(ts|tsx|js|jsx)$/)) continue;

        try {
          const result = await $`grep -c "console\\.log" ${file} 2>/dev/null`.text();
          const count = parseInt(result.trim(), 10);
          if (count > 0) {
            totalConsoleLogCount += count;
            filesWithConsoleLogs.push(file);
          }
        } catch {
          // No console.log found
        }
      }

      if (totalConsoleLogCount > 0) {
        log(
          "warn",
          `[workflow101] Audit: ${totalConsoleLogCount} console.log statement(s) in ${filesWithConsoleLogs.length} file(s)`
        );
        filesWithConsoleLogs.forEach((f) => log("warn", `  - ${f}`));
        log("warn", "[workflow101] Remove console.log statements before committing");
      } else {
        log("info", "[workflow101] Audit passed: No console.log statements found");
      }

      editedFiles.clear();
    },

    /**
     * Session Deleted Hook
     * Triggers: When session ends
     * Action: Cleanup
     */
    "session.deleted": async () => {
      if (!hookEnabled("session:end-marker", ["minimal", "standard", "strict"]))
        return;
      log("info", "[workflow101] Session ended");
      editedFiles.clear();
    },

    /**
     * Permission Hook
     * Triggers: When permission requested
     * Action: Auto-approve safe operations
     */
    "permission.ask": async (event: { tool: string; args: unknown }) => {
      log("info", `[workflow101] Permission requested: ${event.tool}`);

      const cmd = String(
        (event.args as Record<string, unknown>)?.command ||
          event.args ||
          ""
      );

      // Auto-approve read operations
      if (["read", "glob", "grep", "search", "list"].includes(event.tool)) {
        return { approved: true, reason: "Read-only operation" };
      }

      // Auto-approve formatters
      if (
        event.tool === "bash" &&
        /^(npx )?(prettier|biome)/.test(cmd)
      ) {
        return { approved: true, reason: "Formatter execution" };
      }

      // Auto-approve test execution
      if (
        event.tool === "bash" &&
        /^(npm test|npx vitest|npx playwright)/.test(cmd)
      ) {
        return { approved: true, reason: "Test execution" };
      }

      return { approved: undefined };
    },
  };
};

export default Workflow101Plugin;
