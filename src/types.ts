import type { IPty } from "node-pty";

export interface AgentDefinition {
  id: string;
  name: string;
  binary: string;
  args: string[];
  tag: string;
  tagColor: string;
  active: boolean;
  group: string;
  env: Record<string, string>;
  cwd: string;
  /** True for CLIs that will ask you to sign in or paste an API key. */
  requiresKey?: boolean;
}

export interface SessionRecord {
  pty: IPty;
  agent: AgentDefinition;
  scrollbackBuffer: string[];
  lastActivity: number;
  rateLimited: boolean;
  crashCount: number;
  exitCode: number | null;
  // Performance: Scrollback accumulation for batch writes
  _scrollbackAccum?: string;
  _scrollbackCount?: number;
  _flushTimer?: NodeJS.Timeout;
}

export interface AgentConfig {
  args: string[];
  env: Record<string, string>;
  cwd: string;
  group: string;
  autoRestart: boolean;
}

export interface ClientMessage {
  type:
    | "input"
    | "resize"
    | "switch_agent"
    | "kill_session"
    | "restart_session"
    | "rescan"
    | "add_custom_agent"
    | "context_handoff"
    | "save_agent_config"
    | "get_agent_config"
    | "set_active_slot"
    | "split_view"
    | "close_split"
    | "notification_click";
  agentId?: string;
  data?: string;
  cols?: number;
  rows?: number;
  name?: string;
  binary?: string;
  args?: string[];
  config?: Partial<AgentConfig>;
  slot?: number;
}

// Narrowed rate-limit patterns with word boundaries to reduce false positives
// Matches common API rate-limit error messages without catching normal output
export const RATE_LIMIT_PATTERNS =
  /(?:\brate\s+limit\b|\bquota\s+exceeded\b|429\b|credit[s]?\s+exhausted\b|\bdaily\s+limit\b|too\s+many\s+requests\b|\blimit\s+reached\b|\btoo\s+many\s+calls\b|rate\s+limit\s+exceeded\b|request\s+limit\s+exceeded\b|api\s+limit\s+reached\b)/i;

export const MAX_SCROLLBACK = 500;

export const DEFAULT_GROUPS: Record<string, string> = {
  // Zero-cost agents - no API key, no sign-in.
  opencode: "Zero-Cost",
  freebuff: "Zero-Cost",
  openclaude: "Zero-Cost",
  // Everything below signs in / needs a provider key. These are only listed when
  // the scanner actually finds the binary on this machine.
  claude: "Needs Account",
  pool: "Needs Account",
  cline: "Needs Account",
  aider: "Needs Account",
  goose: "Needs Account",
  "cursor-agent": "Needs Account",
  gemini: "Needs Account",
  qwen: "Needs Account",
  codex: "Needs Account",
  crush: "Needs Account",
  amp: "Needs Account",
  copilot: "Needs Account",
  sgpt: "Needs Account",
  llm: "Needs Account",
  mods: "Needs Account",
  omniroute: "Needs Account",
};

/* -- Default agent roster --------------------------------------------------
 * ONLY zero-cost CLIs that run without any API key / paid account:
 *   opencode    - free models through OpenCode Zen (e.g. "MiMo V2.5 Free")
 *   freebuff    - free tier, no key ("Start coding for free")
 *   openclaude  - Gitlawb OpenGateway, free endpoint, no key
 *
 * Agents that prompt for credentials were removed from the defaults so the
 * dashboard never asks for an API key you don't have. If you ever want them
 * back, add them with the "+ Add Custom CLI" button (or a custom agent id),
 * e.g. `claude` (Claude Code - API billing / login), `pool` (Poolside login),
 * `aider`, `goose`, `cursor`.
 * ------------------------------------------------------------------------- */
export const DEFAULT_REGISTRY: Omit<AgentDefinition, "active" | "group" | "env" | "cwd">[] = [
  { id: "opencode", name: "OpenCode TUI", binary: "opencode", args: [], tag: "TUI-CORE", tagColor: "#d97706" },
  { id: "freebuff", name: "Freebuff AI Agent", binary: "freebuff", args: [], tag: "ZERO-COST", tagColor: "#06b6d4" },
  { id: "openclaude", name: "OpenClaude Client", binary: "openclaude", args: [], tag: "FREE-GATEWAY", tagColor: "#f97316" },
];
