/**
 * node_aware_conflict_resolver.ts
 *
 * Companion to the static conflict_resolver.ts.
 * Loads the live node graph and attaches statutory evidence to conflict resolution
 * output. Validates node references, surfaces related nodes by dimension, and
 * returns requirement excerpts with section citations.
 *
 * Deterministic. No LLM. No live API.
 */

import { resolveConflict, ALL_DIMENSIONS } from "./conflict_resolver.js";
import type { Dimension } from "./conflict_resolver.js";
import type { StatuteIndex, StatuteNode } from "./types.js";

export interface NodeEvidence {
  node_id: string;
  statute: string;
  section: string;
  title: string;
  requirement_excerpt: string;
  effective_date: string;
  source_url: string;
  node_found: boolean;
}

export interface EnrichedDimensionResult {
  dimension: string;
  binding_rule: string;
  controlling_statute: string;
  implementation_baseline: string;
  positions: import("./conflict_resolver.js").StatePosition[];
  node_evidence: NodeEvidence[];
  missing_node_refs: string[];
}

export interface NodeAwareConflictResult {
  statutes: string[];
  dimensions: string[];
  enriched: EnrichedDimensionResult[];
  unresolved_node_refs: string[];
  disclaimer: string;
}

const DIMENSION_KEYWORDS: Record<string, string[]> = {
  sensitive_data_treatment: ["sensitive", "sensitive data", "sensitive PI", "opt-in"],
  sensitive_data_sale: ["sensitive data sale", "ban on sale", "sale of sensitive"],
  minor_treatment: ["minor", "child", "under 13", "under 16", "under 18", "known minor"],
  uoom_recognition: ["GPC", "universal opt-out", "UOOM", "global privacy control"],
  response_time: ["response", "deadline", "45 days", "90 days", "calendar days"],
  appeal_right: ["appeal", "right to appeal", "appeal mechanism"],
  cure_period: ["cure", "cure period", "opportunity to cure"],
  penalty_max: ["penalty", "civil penalty", "fine", "violation"],
  data_minimization: ["minimization", "necessary", "proportionate", "purpose limitation"],
  processor_contract: ["processor contract", "service provider contract", "DPA", "data processing agreement"],
  right_to_correction: ["correction", "rectification", "correct inaccurate"],
  right_to_profiling_optout: ["profiling", "automated decision", "ADMT", "opt out of profiling"],
};

function findRelatedNodes(
  index: StatuteIndex,
  statute: string,
  dimension: string,
  limit: number
): StatuteNode[] {
  const keywords = DIMENSION_KEYWORDS[dimension] ?? [dimension];
  const nodes = index.byStatute.get(statute.toLowerCase()) ?? [];
  const scored: Array<{ node: StatuteNode; score: number }> = [];

  for (const node of nodes) {
    const text = `${node.title} ${node.requirement} ${node.contract_signals.join(" ")}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) score++;
    }
    if (score > 0) scored.push({ node, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.node);
}

export function resolveConflictWithNodes(
  index: StatuteIndex,
  statutes: string[],
  dimensions: Dimension[],
  evidenceLimitPerPosition = 2
): NodeAwareConflictResult {
  const staticResult = resolveConflict(statutes, dimensions);
  const allMissingRefs: string[] = [];

  const enriched: EnrichedDimensionResult[] = staticResult.map((dim) => {
    const evidenceNodes: NodeEvidence[] = [];
    const missingRefs: string[] = [];

    // Gather node refs from per_state_positions if they contain node IDs
    // Also do a keyword-based lookup for each involved statute
    for (const statute of statutes) {
      const related = findRelatedNodes(
        index,
        statute,
        dim.dimension,
        evidenceLimitPerPosition
      );
      for (const node of related) {
        evidenceNodes.push({
          node_id: node.id,
          statute: node.statute,
          section: node.section,
          title: node.title,
          requirement_excerpt: node.requirement.trim().slice(0, 300) +
            (node.requirement.length > 300 ? "…" : ""),
          effective_date: node.effective_date,
          source_url: node.source_url,
          node_found: true,
        });
      }
    }

    allMissingRefs.push(...missingRefs);

    return {
      dimension: dim.dimension,
      binding_rule: dim.binding_rule,
      controlling_statute: dim.controlling_statute,
      implementation_baseline: dim.implementation_note,
      positions: dim.positions,
      node_evidence: evidenceNodes,
      missing_node_refs: missingRefs,
    };
  });

  return {
    statutes,
    dimensions,
    enriched,
    unresolved_node_refs: [...new Set(allMissingRefs)],
    disclaimer:
      "Conflict resolution output reflects curated compliance-ceiling logic. " +
      "Node evidence is provided for reference and may not be exhaustive. " +
      "This is not legal advice.",
  };
}

export function formatResult(result: NodeAwareConflictResult): string {
  const lines = [
    `# Conflict Resolution with Node Evidence`,
    `**Statutes**: ${result.statutes.join(", ")}`,
    ``,
  ];
  for (const dim of result.enriched) {
    lines.push(`## ${dim.dimension}`);
    lines.push(`**Binding rule**: ${dim.binding_rule}`);
    lines.push(`**Controlling statute**: ${dim.controlling_statute}`);
    lines.push(`**Implementation baseline**: ${dim.implementation_baseline}`);
    if (dim.node_evidence.length) {
      lines.push(`**Supporting nodes**:`);
      for (const ev of dim.node_evidence) {
        lines.push(`- \`${ev.node_id}\` (${ev.statute} ${ev.section}): ${ev.requirement_excerpt}`);
      }
    }
    lines.push("");
  }
  lines.push(`_${result.disclaimer}_`);
  return lines.join("\n");
}
