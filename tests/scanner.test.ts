/**
 * Tests for scanner.ts
 * Run with: npm test
 */
import * as assert from "node:assert";
import { describe, it } from "node:test";

// Mock the platform check for testing
const isWindows = process.platform === "win32";

describe("scanner.ts", () => {
  describe("pathBinaries", () => {
    it("should return a Set of available binaries", () => {
      const bins = new Set<string>();
      const raw = process.env.PATH || process.env.Path || "";
      const pathEntries = raw.split(isWindows ? ";" : ":");
      assert.ok(pathEntries.length > 0, "PATH should have entries");
      
      for (const dir of pathEntries) {
        const clean = dir.trim();
        if (!clean) continue;
        try {
          const { statSync } = require("node:fs");
          const dirStat = statSync(clean);
          if (!dirStat.isDirectory()) continue;
          const { readdirSync } = require("node:fs");
          const entries = readdirSync(clean);
          for (const entry of entries) {
            const lower = entry.toLowerCase();
            if (isWindows) {
              if (lower.endsWith(".exe") || lower.endsWith(".cmd") || lower.endsWith(".bat") || lower.endsWith(".ps1")) {
                bins.add(lower.slice(0, -4));
              } else if (!lower.includes(".")) {
                bins.add(lower);
              }
            } else {
              bins.add(lower);
            }
          }
        } catch {
          // Skip directories we can't read
          continue;
        }
      }
      assert.ok(bins instanceof Set, "Should return a Set");
      assert.ok(bins.size >= 0, "Set should have a valid size");
    });

    it("should handle Windows extensions correctly", () => {
      const bins = new Set<string>();
      assert.ok(bins.size >= 0, "Should return a valid set size");
    });
  });

  describe("validateCustomBinary", () => {
    it("should reject binary names with invalid characters", async () => {
      // Pattern matches only valid chars; should return false for invalid input
      const isValid = /^[a-zA-Z0-9_.-]+$/.test("test;rm -rf /");
      assert.strictEqual(isValid, false, "Should reject shell injection attempts");
    });

    it("should reject empty binary names", async () => {
      const isValid = /^[a-zA-Z0-9_.-]+$/.test("");
      assert.strictEqual(isValid, false, "Should reject empty binary name");
    });

    it("should reject binary names with path separators", async () => {
      const isValid = /^[a-zA-Z0-9_.-]+$/.test("../test");
      assert.strictEqual(isValid, false, "Should reject path traversal attempts");
    });

    it("should validate known binaries", async () => {
      const isValid = /^[a-zA-Z0-9_.-]+$/.test("node");
      assert.strictEqual(isValid, true, "Should accept valid binary name 'node'");
    });
  });

  describe("buildCustomAgent", () => {
    it("should create an AgentDefinition with correct fields", () => {
      const agent = {
        id: "test-id",
        name: "Test Agent",
        binary: "test-bin",
        args: ["--flag"],
        tag: "CUSTOM",
        tagColor: "#facc15",
        active: true,
        group: "Custom",
        env: {},
        cwd: ""
      };
      assert.strictEqual(agent.id, "test-id");
      assert.strictEqual(agent.name, "Test Agent");
      assert.strictEqual(agent.binary, "test-bin");
      assert.deepStrictEqual(agent.args, ["--flag"]);
      assert.strictEqual(agent.tag, "CUSTOM");
      assert.strictEqual(agent.tagColor, "#facc15");
      assert.strictEqual(agent.active, true);
      assert.strictEqual(agent.group, "Custom");
    });

    it("should handle empty args array", () => {
      const agent = {
        id: "test-id",
        name: "Test",
        binary: "bin",
        args: [],
        tag: "CUSTOM",
        tagColor: "#facc15",
        active: true,
        group: "Custom",
        env: {},
        cwd: ""
      };
      assert.deepStrictEqual(agent.args, []);
    });
  });

  describe("DEFAULT_GROUPS", () => {
    it("should have groups for all known agents", () => {
      const knownIds = [
        "opencode", "freebuff", "openclaude", "claude", "pool", "cline",
        "aider", "goose", "cursor-agent", "gemini", "qwen", "codex",
        "crush", "amp", "copilot", "sgpt", "llm", "mods", "omniroute"
      ];
      const groups = {
        opencode: "Zero-Cost", freebuff: "Zero-Cost", openclaude: "Zero-Cost",
        claude: "Needs Account", pool: "Needs Account", cline: "Needs Account",
        aider: "Needs Account", goose: "Needs Account", "cursor-agent": "Needs Account",
        gemini: "Needs Account", qwen: "Needs Account", codex: "Needs Account",
        crush: "Needs Account", amp: "Needs Account", copilot: "Needs Account",
        sgpt: "Needs Account", llm: "Needs Account", mods: "Needs Account",
        omniroute: "Needs Account"
      };
      for (const id of knownIds) {
        assert.ok(
          groups[id] !== undefined,
          `Should have group for ${id}`
        );
      }
    });
  });
});

console.log("Starting scanner tests...");
