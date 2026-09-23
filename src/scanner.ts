import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { platform } from "node:os";
import { readdirSync, statSync } from "node:fs";
import { DEFAULT_REGISTRY, DEFAULT_GROUPS, type AgentDefinition } from "./types.js";

const execFileAsync = promisify(execFile);
const isWindows = platform() === "win32";

export type AgentSeed = {
  id: string;
  name: string;
  binary: string;
  args: string[];
  tag: string;
  tagColor: string;
  group?: string;
};

export type KnownAgent = AgentSeed & { group: string; requiresKey: boolean };

export const KNOWN_AGENTS: KnownAgent[] = [
  { id: "omniroute", name: "OmniRoute Router", binary: "omniroute", args: [], tag: "ROUTER", tagColor: "#f472b6", group: "Zero-Cost", requiresKey: false },
  { id: "claude", name: "Claude Code", binary: "claude", args: [], tag: "NEEDS-KEY", tagColor: "#ef4444", group: "Needs Account", requiresKey: true },
  { id: "pool", name: "Poolside CLI", binary: "pool", args: [], tag: "SIGN-IN", tagColor: "#10b981", group: "Needs Account", requiresKey: true },
  { id: "cline", name: "Cline CLI", binary: "cline", args: [], tag: "SIGN-IN", tagColor: "#22c55e", group: "Needs Account", requiresKey: true },
  { id: "aider", name: "Aider Pair Programmer", binary: "aider", args: [], tag: "NEEDS-KEY", tagColor: "#a855f7", group: "Needs Account", requiresKey: true },
  { id: "goose", name: "Goose CLI", binary: "goose", args: [], tag: "NEEDS-KEY", tagColor: "#3b82f6", group: "Needs Account", requiresKey: true },
  { id: "cursor-agent", name: "Cursor Agent CLI", binary: "cursor-agent", args: [], tag: "SIGN-IN", tagColor: "#64748b", group: "Needs Account", requiresKey: true },
  { id: "gemini", name: "Gemini CLI", binary: "gemini", args: [], tag: "SIGN-IN", tagColor: "#4285f4", group: "Needs Account", requiresKey: true },
  { id: "qwen", name: "Qwen Code CLI", binary: "qwen", args: [], tag: "SIGN-IN", tagColor: "#7c3aed", group: "Needs Account", requiresKey: true },
  { id: "codex", name: "OpenAI Codex CLI", binary: "codex", args: [], tag: "NEEDS-KEY", tagColor: "#f59e0b", group: "Needs Account", requiresKey: true },
  { id: "crush", name: "Crush (Charm)", binary: "crush", args: [], tag: "NEEDS-KEY", tagColor: "#ec4899", group: "Needs Account", requiresKey: true },
  { id: "amp", name: "Amp CLI", binary: "amp", args: [], tag: "SIGN-IN", tagColor: "#e11d48", group: "Needs Account", requiresKey: true },
  { id: "copilot", name: "GitHub Copilot CLI", binary: "copilot", args: [], tag: "SIGN-IN", tagColor: "#6e7681", group: "Needs Account", requiresKey: true },
  { id: "sgpt", name: "ShellGPT", binary: "sgpt", args: [], tag: "NEEDS-KEY", tagColor: "#0ea5e9", group: "Needs Account", requiresKey: true },
  { id: "llm", name: "LLM CLI", binary: "llm", args: [], tag: "NEEDS-KEY", tagColor: "#14b8a6", group: "Needs Account", requiresKey: true },
  { id: "mods", name: "Mods", binary: "mods", args: [], tag: "NEEDS-KEY", tagColor: "#8b5cf6", group: "Needs Account", requiresKey: true },
];

/* One read-only pass over every PATH directory -> set of available commands. */
function pathBinaries(): Set<string> {
  const found = new Set<string>();
  const raw = process.env.PATH || process.env.Path || "";
  for (const dir of raw.split(isWindows ? ";" : ":")) {
    // Strip surrounding quotes and parentheses (Windows PATH can have both)
    let clean = dir.trim();
    while (clean.startsWith('"') && clean.endsWith('"')) {
      clean = clean.slice(1, -1);
    }
    while (clean.startsWith('(') && clean.endsWith(')')) {
      clean = clean.slice(1, -1);
    }
    if (!clean) continue;
    let dirStat: { isDirectory: () => boolean };
    try { dirStat = statSync(clean); } catch { continue; }
    if (!dirStat.isDirectory()) continue;
    let entries: string[];
    try { entries = readdirSync(clean); } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'EACCES') {
        console.warn(`[scanner] Permission denied reading PATH dir: ${clean}`);
      }
      continue;
    }
    for (const entry of entries) {
      const lower = entry.toLowerCase();
      if (isWindows) {
        if (lower.endsWith(".exe") || lower.endsWith(".cmd") || lower.endsWith(".bat") || lower.endsWith(".ps1")) {
          found.add(lower.slice(0, -4));
        } else if (!lower.includes(".")) {
          found.add(lower);
        }
      } else {
        found.add(lower);
      }
    }
  }
  return found;
}

export async function scanAgents(): Promise<AgentDefinition[]> {
  const installed = pathBinaries();
  const results: AgentDefinition[] = [];
  const seen = new Set<string>();
  const add = (def: AgentSeed, active: boolean, requiresKey = false) => {
    const key = def.binary.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    results.push({
      id: def.id, name: def.name, binary: def.binary, args: def.args,
      tag: def.tag, tagColor: def.tagColor,
      group: def.group ?? DEFAULT_GROUPS[def.id] ?? "Other",
      requiresKey, active, env: {}, cwd: "",
    });
  };
  for (const def of DEFAULT_REGISTRY) add(def, installed.has(def.binary.toLowerCase()));
  for (const def of KNOWN_AGENTS) add(def, installed.has(def.binary.toLowerCase()), def.requiresKey);
  return results;
}

export async function validateCustomBinary(binary: string): Promise<{ valid: boolean; path?: string }> {
  try {
    if (!/^[a-zA-Z0-9_.-]+$/.test(binary)) return { valid: false };
    const cmd = isWindows ? "where" : "which";
    const { stdout } = await execFileAsync(cmd, [binary], { timeout: 5000, windowsHide: true });
    const resolved = stdout.trim().split("\n")[0]?.trim();
    if (resolved) return { valid: true, path: resolved };
    return { valid: false };
  } catch { return { valid: false }; }
}

export function buildCustomAgent(id: string, name: string, binary: string, args: string[]): AgentDefinition {
  return { id, name, binary, args, tag: "CUSTOM", tagColor: "#facc15", active: true, group: "Custom", env: {}, cwd: "" };
}
