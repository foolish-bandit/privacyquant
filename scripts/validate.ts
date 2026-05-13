#!/usr/bin/env tsx
/**
 * scripts/validate.ts — CI validation script for the PrivacyQuant knowledge graph.
 *
 * Run from mcp-server/ via: npm run validate
 * Exits 0 if all checks pass, exits 1 with a summary if any check fails.
 *
 * Checks:
 *   1. YAML node count vs README badge (statutory_nodes)
 *   2. Enforcement action count vs index.ts footer
 *   3. Tool registration count vs README badge (MCP_tools)
 *   4. Cross-ref integrity — every cross_refs entry resolves to a real node
 *   5. conflict_resolver and dsar_router node_refs all resolve
 *   6. Duplicate enforcement action IDs
 *   7. Violation theory tags present in _meta taxonomy
 *   8. Required YAML node fields non-empty (id, statute, requirement)
 *   9. corpus_version in enforcement_actions.json matches index.ts footer
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadIndex } from "../mcp-server/src/loader.js";
import { getAllConflictNodeRefs } from "../mcp-server/src/conflict_resolver.js";
import { getAllDsarNodeRefs } from "../mcp-server/src/dsar_router.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];

function pass(name: string, detail: string): void {
  results.push({ name, passed: true, detail });
}

function fail(name: string, detail: string): void {
  results.push({ name, passed: false, detail });
}

// ── 1. YAML node count vs README badge ──────────────────────────────────────
function countYamlNodes(): number {
  const statutesDir = path.join(REPO_ROOT, "statutes");
  let count = 0;
  for (const entry of fs.readdirSync(statutesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dirPath = path.join(statutesDir, entry.name);
    for (const file of fs.readdirSync(dirPath)) {
      if (file === "schema.yaml") continue;
      if (file.endsWith(".yaml") || file.endsWith(".yml")) count++;
    }
  }
  return count;
}

{
  const actual = countYamlNodes();
  const readmeSrc = fs.readFileSync(path.join(REPO_ROOT, "README.md"), "utf8");
  const m = readmeSrc.match(/badge\/statutory_nodes-(\d+)-/);
  if (!m) {
    fail("YAML count vs README badge", "Could not parse statutory_nodes badge from README.md");
  } else {
    const claimed = parseInt(m[1], 10);
    if (actual === claimed) {
      pass("YAML count vs README badge", `${actual} nodes`);
    } else {
      fail("YAML count vs README badge", `README claims ${claimed} but found ${actual} YAML files in statutes/`);
    }
  }
}

// ── 2. Enforcement action count vs index.ts footer ──────────────────────────
const enfRaw = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, "references/enforcement_actions.json"), "utf8")
) as { _meta: Record<string, unknown>; actions: Array<Record<string, unknown>> };
const enfMeta = enfRaw._meta;
const enfActions = enfRaw.actions;

{
  const actual = enfActions.length;
  const indexSrc = fs.readFileSync(path.join(REPO_ROOT, "mcp-server/src/index.ts"), "utf8");
  const m = indexSrc.match(/(\d+)\s+enforcement actions/);
  if (!m) {
    fail("Enforcement action count vs index.ts footer", "Could not parse enforcement action count from index.ts footer");
  } else {
    const claimed = parseInt(m[1], 10);
    if (actual === claimed) {
      pass("Enforcement action count vs index.ts footer", `${actual} actions`);
    } else {
      fail("Enforcement action count vs index.ts footer", `index.ts footer says ${claimed} but enforcement_actions.json has ${actual} actions`);
    }
  }
}

// ── 3. Tool registration count vs README badge ───────────────────────────────
{
  const srcDir = path.join(REPO_ROOT, "mcp-server/src");
  let toolCount = 0;
  for (const file of fs.readdirSync(srcDir)) {
    if (!file.endsWith(".ts")) continue;
    const content = fs.readFileSync(path.join(srcDir, file), "utf8");
    const matches = content.match(/server\.registerTool\(/g);
    if (matches) toolCount += matches.length;
  }
  const readmeSrc = fs.readFileSync(path.join(REPO_ROOT, "README.md"), "utf8");
  const m = readmeSrc.match(/badge\/MCP_tools-(\d+)-/);
  if (!m) {
    fail("Tool count vs README badge", "Could not parse MCP_tools badge from README.md");
  } else {
    const claimed = parseInt(m[1], 10);
    if (toolCount === claimed) {
      pass("Tool count vs README badge", `${toolCount} tools`);
    } else {
      fail("Tool count vs README badge", `README claims ${claimed} but found ${toolCount} server.registerTool() calls in mcp-server/src/`);
    }
  }
}

// ── 4 & 5. Cross-ref integrity + conflict/dsar node_refs ─────────────────────
process.stderr.write(""); // suppress loader stderr output from polluting check output
let index: ReturnType<typeof loadIndex>;
try {
  index = loadIndex();
} catch (err) {
  console.error(`Fatal: could not load index: ${err}`);
  process.exit(1);
}

{
  const broken: string[] = [];
  for (const node of index.all) {
    for (const ref of node.cross_refs) {
      if (!index.byId.has(ref)) {
        broken.push(`"${node.id}" → "${ref}"`);
      }
    }
  }
  if (broken.length === 0) {
    pass("Cross-ref integrity", "all cross_refs resolve");
  } else {
    const sample = broken.slice(0, 5).join(", ");
    fail("Cross-ref integrity", `${broken.length} broken: ${sample}${broken.length > 5 ? " ..." : ""}`);
  }
}

{
  const stale: string[] = [];
  for (const ref of getAllConflictNodeRefs()) {
    if (!index.byId.has(ref)) stale.push(`conflict_resolver: "${ref}"`);
  }
  for (const ref of getAllDsarNodeRefs()) {
    if (!index.byId.has(ref)) stale.push(`dsar_router: "${ref}"`);
  }
  if (stale.length === 0) {
    pass("conflict_resolver / dsar_router node_refs", "all node_refs resolve");
  } else {
    const sample = stale.slice(0, 5).join(", ");
    fail("conflict_resolver / dsar_router node_refs", `${stale.length} stale: ${sample}${stale.length > 5 ? " ..." : ""}`);
  }
}

// ── 6. Duplicate enforcement action IDs ─────────────────────────────────────
{
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const action of enfActions) {
    const id = action.id as string;
    if (seen.has(id)) dupes.push(id);
    else seen.add(id);
  }
  if (dupes.length === 0) {
    pass("Duplicate enforcement action IDs", `${enfActions.length} unique IDs`);
  } else {
    fail("Duplicate enforcement action IDs", `Duplicates: ${dupes.join(", ")}`);
  }
}

// ── 7. Violation theory tags in _meta taxonomy ───────────────────────────────
{
  const taxonomy = new Set<string>(enfMeta.violation_theory_tags as string[]);
  const unknown: string[] = [];
  for (const action of enfActions) {
    const theories = action.violation_theories as string[] | undefined;
    if (!Array.isArray(theories)) continue;
    for (const tag of theories) {
      if (!taxonomy.has(tag)) {
        unknown.push(`${action.id}: "${tag}"`);
      }
    }
  }
  if (unknown.length === 0) {
    pass("Violation theory tags in _meta taxonomy", "all tags recognized");
  } else {
    const sample = unknown.slice(0, 5).join(", ");
    fail("Violation theory tags in _meta taxonomy", `${unknown.length} unknown: ${sample}${unknown.length > 5 ? " ..." : ""}`);
  }
}

// ── 8. Required YAML node fields non-empty ───────────────────────────────────
{
  const empty: string[] = [];
  for (const node of index.all) {
    if (!node.id) empty.push("(no id): id");
    else if (!node.statute) empty.push(`${node.id}: statute`);
    else if (!node.requirement) empty.push(`${node.id}: requirement`);
  }
  if (empty.length === 0) {
    pass("Required YAML node fields non-empty", `all ${index.all.length} nodes have id, statute, requirement`);
  } else {
    const sample = empty.slice(0, 5).join(", ");
    fail("Required YAML node fields non-empty", `${empty.length} missing required fields: ${sample}${empty.length > 5 ? " ..." : ""}`);
  }
}

// ── 9. corpus_version matches index.ts footer ───────────────────────────────
{
  const jsonVersion = String(enfMeta.corpus_version ?? "");
  const indexSrc = fs.readFileSync(path.join(REPO_ROOT, "mcp-server/src/index.ts"), "utf8");
  const m = indexSrc.match(/Corpus v([\d.]+)/);
  if (!m) {
    fail("corpus_version matches index.ts footer", "Could not parse Corpus version from index.ts footer");
  } else {
    const footerVersion = m[1];
    if (jsonVersion === footerVersion) {
      pass("corpus_version matches index.ts footer", `v${jsonVersion}`);
    } else {
      fail("corpus_version matches index.ts footer", `enforcement_actions.json corpus_version "${jsonVersion}" vs index.ts footer "v${footerVersion}"`);
    }
  }
}

// ── Print results ─────────────────────────────────────────────────────────────
const failedChecks = results.filter((r) => !r.passed);
const passedChecks = results.filter((r) => r.passed);

console.log("\nPrivacyQuant validation\n");
for (const r of results) {
  const icon = r.passed ? "✓" : "✗";
  console.log(`  ${icon} ${r.name} — ${r.detail}`);
}

console.log(`\n${passedChecks.length}/${results.length} checks passed`);

if (failedChecks.length > 0) {
  console.log(`\nFailed:`);
  for (const r of failedChecks) {
    console.log(`  ✗ ${r.name}: ${r.detail}`);
  }
  process.exit(1);
}
