import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { IPty } from "node-pty";

const execFileAsync = promisify(execFile);

const CONTEXT_FILE = ".nexus_context.md";

async function runGit(args: string[], cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      timeout: 10000,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });
    return stdout.trim();
  } catch {
    return "";
  }
}

async function ensureContextFileIgnored(cwd: string): Promise<void> {
  const excludePath = resolve(cwd, ".git", "info", "exclude");
  try {
    if (existsSync(excludePath)) {
      const content = await readFile(excludePath, "utf-8");
      if (!content.includes(CONTEXT_FILE)) {
        await appendFile(excludePath, `\n${CONTEXT_FILE}\n`);
      }
    }
  } catch {
    // .git/info/exclude may not exist; non-fatal
  }

  const gitignorePath = resolve(cwd, ".gitignore");
  try {
    if (existsSync(gitignorePath)) {
      const content = await readFile(gitignorePath, "utf-8");
      if (!content.includes(CONTEXT_FILE)) {
        await appendFile(gitignorePath, `\n${CONTEXT_FILE}\n`);
      }
    }
  } catch {
    // non-fatal
  }
}

export async function generateContextReport(cwd: string): Promise<string> {
  // Verify git repository
  const isGitRepo = await runGit(["rev-parse", "--is-inside-work-tree"], cwd);
  if (!isGitRepo) {
    // Not a git repository, write minimal report
    const filePath = resolve(cwd, CONTEXT_FILE);
    const report = [
      `# Nexus Context Report`,
      ``,
      `## Working Directory`,
      `\`${cwd}\``,
      ``,
      `## Git Status`,
      `_Not a git repository._`,
      ``,
      `---`,
      `_Generated at ${new Date().toISOString()} by APEX // Coder Hub_`,
    ].join("\n");
    await writeFile(filePath, report, "utf-8");
    await ensureContextFileIgnored(cwd);
    return filePath;
  }

  const status = await runGit(["status", "-s"], cwd);
  const log = await runGit(["log", "-n", "3", "--oneline"], cwd);
  let diff = await runGit(["diff", "HEAD"], cwd);
  // Cap diff at 4000 characters to avoid overwhelming TUI
  const diffCapped = diff.length > 4000 ? diff.slice(0, 4000) + "\n... (diff truncated at 4000 chars)" : diff;
  const diffAlt = diffCapped || (await runGit(["diff", "HEAD~1", "HEAD"], cwd));

  const report = [
    `# APEX // Coder Hub - Context Report`,
    ``,
    `## Working Directory`,
    `\`${cwd}\``,
    ``,
    `## Git Status (last modified files)`,
    status || "_No changes._",
    ``,
    `## Recent Commits`,
    log || "_No commits found._",
    ``,
    `## Current Diff (capped at 4000 chars)`,
    diffAlt
      ? "```diff\n" + diffAlt + "\n```"
      : "_No diff available._",
    ``,
    `---`,
    `_Generated at ${new Date().toISOString()} by APEX // Coder Hub by Blackjack_`,
  ].join("\n");

  const filePath = resolve(cwd, CONTEXT_FILE);
  await writeFile(filePath, report, "utf-8");
  await ensureContextFileIgnored(cwd);

  return filePath;
}

export async function triggerContextHandoff(
  cwd: string,
  pty: IPty
): Promise<{ success: boolean; message: string; filePath: string }> {
  try {
    const filePath = await generateContextReport(cwd);
    // Send a single safe carriage-return instruction
    // Do NOT dump raw multiline diffs into stdin - that causes TUI input overflow
    const instruction = `Please inspect ${CONTEXT_FILE} for recent repository changes and resume the task.\r`;
    pty.write(instruction);

    return {
      success: true,
      message: `Context report written to ${filePath} and instruction sent to active terminal.`,
      filePath,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Context handoff failed: ${err?.message || "unknown error"}`,
      filePath: "",
    };
  }
}
