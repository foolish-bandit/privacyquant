import { z } from "zod";
import { loadIndex } from "./loader.js";
import { ALL_DIMENSIONS, resolveConflict } from "./conflict_resolver.js";
import type { ConflictResult, Dimension, StatePosition } from "./conflict_resolver.js";
import type { StatuteIndex, StatuteNode } from "./types.js";

type ToolResult = { content: Array<{ type: "text"; text: string }> };

type ToolServer = {
  registerTool: (
    name: string,
    config: Record<string, unknown>,
    handler: (args: NodeAwareConflictArgs) => Promise<ToolResult>
  ) => unknown;
};

type NodeAwareConflictArgs = {
  statutes: string[];
  dimensions?: Dimension[];
  include_related_nodes?: boolean;
  evidence_limit_per_position?: number;
};

type NodeEvidence = {
  node_id: string;
  found: boolean;
  title?: string;
  statute?: string;
  section?: string;
  effective_date?: string;
  requirement_type?: string;
  excerpt?: string;
  source_url?: string;
};

type EnrichedPosition = StatePosition & {
  evidence: NodeEvidence[];
  related_nodes: NodeEvidence[];
};

type EnrichedConflict = Omit<ConflictResult, "positions"> & {
  positions: EnrichedPosition[];
  missing_node_refs: string[];
};

let cachedIndex: StatuteIndex | null = null;

function getIndex(): StatuteIndex {
  if (!cachedIndex) cachedIndex = loadIndex();
  return cachedIndex;
}

const DIMENSION_KEYWORDS: Record<Dimension, string[]> = {
  sensitive_data_treatment: ["sensitive", "consent", "limit sensitive", "sensitive personal"],
  sensitive_data_sale: ["sensitive", "sale", "sell", "ban on sale"],
  minor_treatment: ["minor", "child", "teen", "under 16", "under 18", "known child"],
  uoom_recognition: ["universal opt", "gpc", "global privacy control", "opt-out mechanism"],
  response_time: ["45 days", "90 days", "response", "request", "deadline"],
  appeal_right: ["appeal", "denial", "attorney general"],
  cure_period: ["cure", "30-day", "60-day", "90-day", "enforcement"],
  penalty_max: ["penalty", "civil penalty", "violation", "enforcement"],
  data_minimization: ["minimization", "reasonably necessary", "adequate", "relevant", "limited"],
  processor_contract: ["processor", "service provider", "contract", "subprocessor", "contractor"],
  right_to_correction: ["correction", "correct", "inaccurate"],
  right_to_profiling_optout: ["profiling", "automated", "decision", "opt out", "legal or similarly significant"],
};

const STATUTE_ALIASES: Record<string, string[]> = {
  "CCPA": ["ccpa", "ccpa/cpra", "cpra", "california"],
  "CCPA/CPRA": ["ccpa", "ccpa/cpra", "cpra", "california"],
  "VCDPA": ["vcdpa", "virginia"],
  "CPA": ["cpa", "colorado"],
  "CTDPA": ["ctdpa", "connecticut"],
  "UCPA": ["ucpa", "utah"],
  "TDPSA": ["tdpsa", "texas"],
  "OCPA": ["ocpa", "oregon"],
  "MCDPA": ["mcdpa", "montana"],
  "ICDPA": ["icdpa", "iowa"],
  "INCDPA": ["incdpa", "indiana"],
  "TIPA": ["tipa", "tennessee"],
  "DPDPA": ["dpdpa", "delaware"],
  "NJDPA": ["njdpa", "new jersey"],
  "NHDPA": ["nhdpa", "new hampshire"],
  "NDPA": ["ndpa", "nebraska"],
  "KCDPA": ["kcdpa", "kentucky"],
  "MODPA": ["modpa", "maryland"],
  "MCDPA-MN": ["mcdpa-mn", "mcdpa_mn", "minnesota"],
  "RIDTPPA": ["ridtppa", "rhode island"],
  "FDBR": ["fdbr", "florida"],
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function excerpt(value: string, max = 360): string {
  const clean = value.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function nodeEvidence(nodeId: string, index: StatuteIndex): NodeEvidence {
  const exact = index.byId.get(nodeId);
  const node = exact ?? [...index.byId.entries()].find(([id]) => id.toLowerCase() === nodeId.toLowerCase())?.[1];

  if (!node) return { node_id: nodeId, found: false };
  return {
    node_id: node.id,
    found: true,
    title: node.title,
    statute: node.statute,
    section: node.section,
    effective_date: node.effective_date,
    requirement_type: node.requirement_type,
    excerpt: excerpt(node.requirement),
    source_url: node.source_url,
  };
}

function statuteMatches(node: StatuteNode, position: StatePosition, requestedStatutes: string[]): boolean {
  const candidates = [position.statute, position.state, ...requestedStatutes];
  const aliases = candidates.flatMap((candidate) => {
    const direct = STATUTE_ALIASES[candidate.toUpperCase()] ?? [];
    return [candidate, ...direct];
  }).map(normalize);

  const text = normalize(`${node.id} ${node.statute}`);
  return aliases.some((alias) => alias && text.includes(alias));
}

function nodeText(node: StatuteNode): string {
  return normalize([
    node.id,
    node.statute,
    node.title,
    node.trigger,
    node.requirement,
    node.contract_signals.join(" "),
  ].join(" "));
}

function findRelatedNodes(index: StatuteIndex, dimension: Dimension, position: StatePosition, requestedStatutes: string[], limit: number): NodeEvidence[] {
  const keywords = DIMENSION_KEYWORDS[dimension].map(normalize);
  const scored = index.all
    .filter((node) => statuteMatches(node, position, requestedStatutes))
    .map((node) => {
      const text = nodeText(node);
      const score = keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0);
      return { node, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.node.id.localeCompare(b.node.id))
    .slice(0, limit);

  return scored.map(({ node }) => nodeEvidence(node.id, index));
}

function enrichConflict(result: ConflictResult, args: NodeAwareConflictArgs, index: StatuteIndex): EnrichedConflict {
  const limit = args.evidence_limit_per_position ?? 3;
  const includeRelated = args.include_related_nodes ?? true;
  const missing = new Set<string>();

  const positions: EnrichedPosition[] = result.positions.map((position) => {
    const evidence = position.node_refs.map((nodeId) => nodeEvidence(nodeId, index));
    for (const item of evidence) {
      if (!item.found) missing.add(item.node_id);
    }

    const related = includeRelated
      ? findRelatedNodes(index, result.dimension, position, args.statutes, limit)
          .filter((item) => !position.node_refs.includes(item.node_id))
      : [];

    return {
      ...position,
      evidence,
      related_nodes: related,
    };
  });

  return {
    ...result,
    positions,
    missing_node_refs: [...missing].sort(),
  };
}

function renderEvidence(evidence: NodeEvidence[], indent = "  "): string[] {
  if (!evidence.length) return [`${indent}_No node evidence found._`];
  const lines: string[] = [];
  for (const item of evidence) {
    if (!item.found) {
      lines.push(`${indent}- \`${item.node_id}\` — MISSING NODE REF`);
      continue;
    }
    lines.push(`${indent}- \`${item.node_id}\` — ${item.title} (${item.section})`);
    if (item.excerpt) lines.push(`${indent}  - ${item.excerpt}`);
    if (item.source_url) lines.push(`${indent}  - Source: ${item.source_url}`);
  }
  return lines;
}

function renderConflicts(args: NodeAwareConflictArgs, conflicts: EnrichedConflict[]): string {
  const lines: string[] = [
    "# Node-Aware Compliance Ceiling Analysis",
    "",
    `**Statutes**: ${args.statutes.join(", ")}`,
    `**Dimensions analysed**: ${conflicts.length}`,
    "",
    "This report starts with PrivacyQuant's compliance-ceiling rules, then verifies and enriches each position against the loaded statutory node graph.",
    "",
  ];

  for (const conflict of conflicts) {
    lines.push(`## ${conflict.dimension_label}`);
    lines.push(`**Binding rule** — controlled by **${conflict.controlling_statute}**:`);
    lines.push(conflict.binding_rule);
    lines.push("");

    if (conflict.is_true_conflict) {
      lines.push(`**True conflict**: ${conflict.conflict_note ?? "Review required."}`);
      lines.push("");
    }

    lines.push(`**Implementation baseline**: ${conflict.implementation_note}`);
    lines.push("");

    if (conflict.missing_node_refs.length > 0) {
      lines.push(`**Missing node refs detected**: ${conflict.missing_node_refs.map((id) => `\`${id}\``).join(", ")}`);
      lines.push("These are static conflict-resolver references that do not currently resolve in the loaded node graph. Treat them as data-quality follow-up items.");
      lines.push("");
    }

    lines.push("### Per-state positions with node evidence");
    const sorted = [...conflict.positions].sort((a, b) => b.strictness_rank - a.strictness_rank || a.statute.localeCompare(b.statute));
    for (const position of sorted) {
      const marker = position.statute === conflict.controlling_statute ? "▶ " : "";
      lines.push(`${marker}**${position.statute} (${position.state})** — strictness ${position.strictness_rank}`);
      lines.push(`- Position: ${position.position}`);
      lines.push(`- Static refs: ${position.node_refs.length ? position.node_refs.map((id) => `\`${id}\``).join(", ") : "none"}`);
      lines.push("- Evidence:");
      lines.push(...renderEvidence(position.evidence, "  "));
      if (position.related_nodes.length > 0) {
        lines.push("- Related nodes found in graph:");
        lines.push(...renderEvidence(position.related_nodes, "  "));
      }
      lines.push("");
    }

    lines.push("---", "");
  }

  lines.push(
    "## Notes",
    "- This tool is deterministic and read-only.",
    "- Missing node refs usually mean the static conflict table is ahead of the current YAML corpus or uses stale node IDs.",
    "- Use `pq_fetch_requirement` on any listed node ID to inspect the full node.",
    "- Use `pq_check_applicability` before this tool so the statute list reflects the actual business facts."
  );

  return lines.join("\n");
}

export function resolveNodeAwareConflicts(args: NodeAwareConflictArgs): EnrichedConflict[] {
  const index = getIndex();
  const dimensions = args.dimensions ?? ALL_DIMENSIONS;
  const base = resolveConflict(args.statutes, dimensions);
  return base.map((result) => enrichConflict(result, args, index));
}

export function registerNodeAwareConflictResolverTool(server: ToolServer): void {
  server.registerTool(
    "pq_resolve_conflict_nodes",
    {
      title: "Resolve Multi-State Conflicts with Node Evidence",
      description: `Resolve multi-state privacy compliance conflicts and enrich each position with evidence from the loaded PrivacyQuant statutory node graph.

This is the node-aware companion to pq_resolve_conflict. It keeps the existing compliance-ceiling rules but validates static node references, finds related nodes by dimension, and flags missing node refs as data-quality follow-ups.`,
      inputSchema: {
        statutes: z.array(z.string().min(2)).min(1).max(20).describe("Applicable statute acronyms, e.g. CCPA, CPA, CTDPA, MODPA."),
        dimensions: z.array(z.enum(ALL_DIMENSIONS as [Dimension, ...Dimension[]])).optional().describe("Compliance dimensions to analyze. Omit for all dimensions."),
        include_related_nodes: z.boolean().default(true).describe("Include additional related nodes found in the loaded graph."),
        evidence_limit_per_position: z.number().int().min(1).max(8).default(3).describe("Maximum related evidence nodes per state position."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const conflicts = resolveNodeAwareConflicts(args);
      if (conflicts.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No conflict data found for statutes: ${args.statutes.join(", ")}. Try standard acronyms such as CCPA, CPA, CTDPA, MODPA, VCDPA, TDPSA, OCPA.`,
          }],
        };
      }

      return { content: [{ type: "text", text: renderConflicts(args, conflicts) }] };
    }
  );
}
