#!/usr/bin/env node
/**
 * scripts/validate-codex-plugin.mjs — Codex plugin packaging validation.
 *
 * Run directly:  node scripts/validate-codex-plugin.mjs
 * Exits 0 if all checks pass, exits 1 with a summary if any check fails.
 *
 * Checks:
 *   1. .codex-plugin/plugin.json exists
 *   2. .codex-plugin/plugin.json parses as valid JSON
 *   3. .codex-plugin/plugin.json has mcpServers set to "./.codex-mcp.json"
 *   4. .codex-mcp.json exists
 *   5. .codex-mcp.json parses as valid JSON
 *   6. .codex-mcp.json contains mcp_servers.privacyquant
 *   7. skills/privacyquant-legal-workflows/SKILL.md exists
 *   8. SKILL.md has frontmatter with name and description fields
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const results = [];

function pass(name, detail) {
  results.push({ name, passed: true, detail });
}

function fail(name, detail) {
  results.push({ name, passed: false, detail });
}

// ── 1. .codex-plugin/plugin.json exists ──────────────────────────────────────
const pluginJsonPath = path.join(REPO_ROOT, ".codex-plugin", "plugin.json");
const pluginJsonExists = fs.existsSync(pluginJsonPath);
if (pluginJsonExists) {
  pass(".codex-plugin/plugin.json exists", pluginJsonPath);
} else {
  fail(".codex-plugin/plugin.json exists", `Not found at ${pluginJsonPath}`);
}

// ── 2. .codex-plugin/plugin.json parses as valid JSON ────────────────────────
let pluginJson = null;
if (pluginJsonExists) {
  try {
    pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
    pass(".codex-plugin/plugin.json valid JSON", "parsed successfully");
  } catch (err) {
    fail(".codex-plugin/plugin.json valid JSON", `Parse error: ${err.message}`);
  }
}

// ── 3. plugin.json has mcpServers set to "./.codex-mcp.json" ─────────────────
if (pluginJson !== null) {
  const mcpServers = pluginJson.mcpServers;
  if (mcpServers === "./.codex-mcp.json") {
    pass('.codex-plugin/plugin.json mcpServers field', `mcpServers = "${mcpServers}"`);
  } else {
    fail(
      '.codex-plugin/plugin.json mcpServers field',
      `Expected "./.codex-mcp.json" but got ${JSON.stringify(mcpServers)}`
    );
  }
}

// ── 4. .codex-mcp.json exists ────────────────────────────────────────────────
const codexMcpPath = path.join(REPO_ROOT, ".codex-mcp.json");
const codexMcpExists = fs.existsSync(codexMcpPath);
if (codexMcpExists) {
  pass(".codex-mcp.json exists", codexMcpPath);
} else {
  fail(".codex-mcp.json exists", `Not found at ${codexMcpPath}`);
}

// ── 5. .codex-mcp.json parses as valid JSON ───────────────────────────────────
let codexMcpJson = null;
if (codexMcpExists) {
  try {
    codexMcpJson = JSON.parse(fs.readFileSync(codexMcpPath, "utf8"));
    pass(".codex-mcp.json valid JSON", "parsed successfully");
  } catch (err) {
    fail(".codex-mcp.json valid JSON", `Parse error: ${err.message}`);
  }
}

// ── 6. .codex-mcp.json contains mcp_servers.privacyquant ─────────────────────
if (codexMcpJson !== null) {
  const server = codexMcpJson?.mcp_servers?.privacyquant;
  if (server && typeof server === "object") {
    pass(".codex-mcp.json has mcp_servers.privacyquant", `command = "${server.command}"`);
  } else {
    fail(
      ".codex-mcp.json has mcp_servers.privacyquant",
      "mcp_servers.privacyquant key missing or not an object"
    );
  }
}

// ── 7. skills/privacyquant-legal-workflows/SKILL.md exists ───────────────────
const skillPath = path.join(
  REPO_ROOT,
  "skills",
  "privacyquant-legal-workflows",
  "SKILL.md"
);
const skillExists = fs.existsSync(skillPath);
if (skillExists) {
  pass("skills/privacyquant-legal-workflows/SKILL.md exists", skillPath);
} else {
  fail("skills/privacyquant-legal-workflows/SKILL.md exists", `Not found at ${skillPath}`);
}

// ── 8. SKILL.md has frontmatter with name and description ────────────────────
if (skillExists) {
  const skillContent = fs.readFileSync(skillPath, "utf8");
  const fmMatch = skillContent.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    fail("SKILL.md has valid frontmatter", "No YAML frontmatter block found (expected opening and closing ---)");
  } else {
    const frontmatter = fmMatch[1];
    const hasName = /^name:\s*.+/m.test(frontmatter);
    const hasDesc = /^description:\s*.+/m.test(frontmatter);
    if (hasName && hasDesc) {
      pass("SKILL.md has valid frontmatter", "name and description fields present");
    } else {
      const missing = [!hasName && "name", !hasDesc && "description"].filter(Boolean).join(", ");
      fail("SKILL.md has valid frontmatter", `Missing frontmatter fields: ${missing}`);
    }
  }
}

// ── Print results ─────────────────────────────────────────────────────────────
const failedChecks = results.filter((r) => !r.passed);
const passedChecks = results.filter((r) => r.passed);

console.log("\nPrivacyQuant Codex plugin validation\n");
for (const r of results) {
  const icon = r.passed ? "✓" : "✗";
  console.log(`  ${icon} ${r.name} — ${r.detail}`);
}

console.log(`\n${passedChecks.length}/${results.length} checks passed`);

if (failedChecks.length > 0) {
  console.log("\nFailed:");
  for (const r of failedChecks) {
    console.log(`  ✗ ${r.name}: ${r.detail}`);
  }
  process.exit(1);
}
