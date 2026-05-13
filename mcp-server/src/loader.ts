import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import type { StatuteNode, StatuteIndex } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve statutes dir relative to the repo root (two levels up from mcp-server/src/)
const STATUTES_DIR = path.resolve(__dirname, "../../statutes");

function isStatuteNode(obj: unknown): obj is StatuteNode {
  if (typeof obj !== "object" || obj === null) return false;
  const n = obj as Record<string, unknown>;
  return (
    typeof n.id === "string" &&
    typeof n.statute === "string" &&
    typeof n.requirement === "string"
  );
}

export function loadIndex(): StatuteIndex {
  const byId = new Map<string, StatuteNode>();
  const byStatute = new Map<string, StatuteNode[]>();
  const all: StatuteNode[] = [];

  if (!fs.existsSync(STATUTES_DIR)) {
    throw new Error(
      `Statutes directory not found at ${STATUTES_DIR}. ` +
      `Ensure the MCP server is run from the privacyquant repo root.`
    );
  }

  const statuteDirs = fs
    .readdirSync(STATUTES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dir of statuteDirs) {
    const dirPath = path.join(STATUTES_DIR, dir);
    const files = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      try {
        const raw = yaml.load(fs.readFileSync(filePath, "utf8"));
        if (!isStatuteNode(raw)) continue;

        const node: StatuteNode = {
          id: raw.id,
          statute: raw.statute,
          section: raw.section ?? "",
          title: raw.title ?? "",
          effective_date: raw.effective_date ?? "",
          supersedes: Array.isArray(raw.supersedes) ? raw.supersedes : [],
          amended_by: Array.isArray(raw.amended_by) ? raw.amended_by : [],
          requirement_type: raw.requirement_type ?? "hard",
          obligation_bearer: raw.obligation_bearer ?? "controller",
          trigger: raw.trigger ?? "",
          requirement: raw.requirement,
          exceptions: Array.isArray(raw.exceptions) ? raw.exceptions : [],
          contract_signals: Array.isArray(raw.contract_signals)
            ? raw.contract_signals
            : [],
          data_categories: Array.isArray(raw.data_categories)
            ? raw.data_categories
            : undefined,
          nist_controls: Array.isArray(raw.nist_controls)
            ? raw.nist_controls
            : undefined,
          cross_refs: Array.isArray(raw.cross_refs) ? raw.cross_refs : [],
          source_url: raw.source_url ?? "",
          git_hash: raw.git_hash ?? "",
        };

        byId.set(node.id, node);
        all.push(node);

        const statuteKey = node.statute.toLowerCase();
        if (!byStatute.has(statuteKey)) {
          byStatute.set(statuteKey, []);
        }
        byStatute.get(statuteKey)!.push(node);
      } catch (err) {
        // Skip malformed files — log to stderr so it doesn't pollute MCP stdout
        process.stderr.write(`Warning: skipping ${filePath}: ${err}\n`);
      }
    }
  }

  process.stderr.write(
    `PrivacyQuant: loaded ${all.length} nodes across ${byStatute.size} statutes\n`
  );

  return { byId, byStatute, all };
}
