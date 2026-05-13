/**
 * clause_evaluator.ts
 *
 * Given a DPA clause and a set of matched statute nodes, calls the Anthropic
 * API to assess whether the clause satisfies, partially satisfies, or conflicts
 * with each requirement. Returns structured GREEN/YELLOW/RED verdicts with
 * gap analysis and suggested redlines.
 *
 * This is a sub-call from the MCP server — it runs as a tool invocation
 * *inside* the MCP response, not as a recursive call to the same Claude session.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { StatuteNode } from "./types.js";

export type Verdict = "GREEN" | "YELLOW" | "RED";

export interface ClauseAssessment {
  node_id: string;
  statute: string;
  title: string;
  verdict: Verdict;
  /** What the clause does well relative to the requirement */
  satisfied: string;
  /** What is missing, ambiguous, or in conflict */
  gap: string;
  /** Specific suggested redline language to close the gap (empty string if GREEN) */
  suggested_redline: string;
  /** The requirement text for reference */
  requirement_summary: string;
}

export interface ClauseCheckResult {
  clause_excerpt: string;
  assessments: ClauseAssessment[];
  overall_verdict: Verdict;
  /** Top priority fix — the most actionable gap across all nodes */
  top_priority: string;
}

const SYSTEM_PROMPT = `You are a US privacy law compliance analyst reviewing DPA (Data Processing Agreement) clauses against specific statutory requirements from US state privacy laws.

For each statutory requirement you are given, assess whether the provided contract clause:
- GREEN: Fully satisfies the requirement — the clause explicitly addresses the obligation with adequate specificity
- YELLOW: Partially satisfies or is ambiguous — the clause touches on the requirement but is incomplete, vague, or missing key elements
- RED: Does not satisfy or conflicts with the requirement — the clause is silent, contradicts, or is materially deficient

Be precise and practical. A clause that says "processor will delete data upon termination" is GREEN for a deletion obligation but YELLOW for a right-to-deletion-request obligation (different trigger). Specificity matters — "reasonable security" without more is YELLOW for any state that requires documented technical and organizational measures.

Respond ONLY with valid JSON matching this exact structure — no preamble, no markdown fences:
{
  "assessments": [
    {
      "node_id": "<exact node id>",
      "verdict": "GREEN" | "YELLOW" | "RED",
      "satisfied": "<what the clause does well, or 'Nothing' if RED>",
      "gap": "<what is missing or wrong — be specific, cite the clause language that is deficient>",
      "suggested_redline": "<concrete replacement or addition language — empty string if GREEN>"
    }
  ],
  "top_priority": "<single most important gap across all assessments, actionable and specific>"
}`;

function buildUserPrompt(
  clauseText: string,
  nodes: StatuteNode[]
): string {
  const nodeDescriptions = nodes
    .map(
      (n) => `Node ID: ${n.id}
Statute: ${n.statute} | Section: ${n.section}
Title: ${n.title}
Requirement type: ${n.requirement_type}
Obligation bearer: ${n.obligation_bearer}
Trigger: ${n.trigger}
Requirement: ${n.requirement.trim()}
Exceptions: ${n.exceptions.length > 0 ? n.exceptions.join("; ") : "None"}
`
    )
    .join("\n---\n");

  return `CONTRACT CLAUSE TO ASSESS:
"""
${clauseText.trim()}
"""

STATUTORY REQUIREMENTS TO CHECK AGAINST:
${nodeDescriptions}

Assess each requirement against the clause above. Be specific about what language in the clause satisfies or fails each requirement.`;
}

export async function evaluateClause(
  clauseText: string,
  nodes: StatuteNode[]
): Promise<ClauseCheckResult> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(clauseText, nodes),
      },
    ],
  });

  const rawText = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  // Strip any accidental markdown fences
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  let parsed: {
    assessments: Array<{
      node_id: string;
      verdict: string;
      satisfied: string;
      gap: string;
      suggested_redline: string;
    }>;
    top_priority: string;
  };

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    process.stderr.write(`[clause_evaluator] JSON parse failed. Raw response:\n${rawText}\n`);
    return {
      clause_excerpt: clauseText.slice(0, 200),
      assessments: nodes.map((n) => ({
        node_id: n.id,
        statute: n.statute,
        title: n.title,
        verdict: "RED" as Verdict,
        satisfied: "Nothing",
        gap: `Evaluation failed — JSON parse error. Raw response (first 500 chars): ${rawText.slice(0, 500)}`,
        suggested_redline: "",
        requirement_summary: n.requirement.slice(0, 200),
      })),
      overall_verdict: "RED",
      top_priority: "Automated evaluation failed (JSON parse error) — manual review required for all nodes",
    };
  }

  // Merge API response with node metadata
  const assessments: ClauseAssessment[] = parsed.assessments.map((a) => {
    const node = nodes.find((n) => n.id === a.node_id) ?? nodes[0];
    return {
      node_id: a.node_id,
      statute: node?.statute ?? "Unknown",
      title: node?.title ?? "Unknown",
      verdict: (["GREEN", "YELLOW", "RED"].includes(a.verdict)
        ? a.verdict
        : "YELLOW") as Verdict,
      satisfied: a.satisfied ?? "",
      gap: a.gap ?? "",
      suggested_redline: a.suggested_redline ?? "",
      requirement_summary: (node?.requirement ?? "").slice(0, 300),
    };
  });

  // Overall verdict: worst of all assessments
  const verdictRank: Record<Verdict, number> = { GREEN: 0, YELLOW: 1, RED: 2 };
  const overall: Verdict = assessments.reduce<Verdict>(
    (worst, a) =>
      verdictRank[a.verdict] > verdictRank[worst] ? a.verdict : worst,
    "GREEN"
  );

  return {
    clause_excerpt: clauseText.slice(0, 300),
    assessments,
    overall_verdict: overall,
    top_priority: parsed.top_priority ?? "",
  };
}
