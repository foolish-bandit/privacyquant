/**
 * dpa_clause_drafter.ts
 *
 * Inverse of clause_evaluator.ts: given a statutory node (or set of nodes),
 * generate DPA/contract clause language that satisfies the requirement.
 *
 * Uses the Anthropic API with a tightly-constrained legal drafting prompt.
 * Output is a single clause (or clause set for multi-state) in plain contractual
 * English, with a coverage summary mapping each sentence to the node requirement
 * it satisfies.
 *
 * No LLM call needed for node lookup — the clause evaluator already handles that.
 * This tool focuses purely on the generation step.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { StatuteNode } from "./types.js";

export type DraftingRole = "controller" | "processor" | "both";
export type DraftingStyle = "brief" | "standard" | "detailed";

export interface DraftedClause {
  /** The drafted clause text in plain contractual English */
  clause_text: string;
  /** Which node requirements are addressed and where */
  coverage: Array<{
    node_id: string;
    requirement_summary: string;
    clause_sentence: string;
  }>;
  /** Any requirements from the nodes that the clause intentionally omits or flags */
  gaps: string[];
  /** Practitioner notes — what to verify before execution */
  notes: string[];
}

const SYSTEM_PROMPT = `You are a privacy law contract drafter specializing in US state privacy law compliance. 
Given one or more statutory requirements, draft DPA (Data Processing Agreement) or contract clause 
language that satisfies those requirements.

Drafting standards:
- Plain contractual English — no legalese unless unavoidable, no Latin
- Active voice where possible
- Defined terms in Title Case on first use, e.g. "Personal Information", "Service Provider"
- Conditions stated precisely (deadlines in calendar days, not "promptly" or "reasonable time")
- Multi-state: if multiple states have diverging requirements, draft to the compliance ceiling 
  (the most stringent standard satisfies all)
- Never draft exceptions that would swallow the rule
- Where a state requires opt-IN consent (not opt-out), make that explicit
- For hard requirements (binary obligations), use "shall" not "should" or "will endeavor to"

Respond ONLY with valid JSON — no preamble, no markdown fences — in this exact structure:
{
  "clause_text": "<the full drafted clause text, using \\n for line breaks>",
  "coverage": [
    {
      "node_id": "<exact node id>",
      "requirement_summary": "<20-word summary of what the node requires>",
      "clause_sentence": "<the specific sentence or phrase in clause_text that addresses this>"
    }
  ],
  "gaps": ["<any node requirement intentionally omitted with reason>"],
  "notes": ["<practitioner notes — what to verify, customize, or negotiate>"]
}`;

function buildDraftingPrompt(
  nodes: StatuteNode[],
  role: DraftingRole,
  style: DraftingStyle,
  context?: string
): string {
  const styleGuidance = {
    brief: "Draft a concise clause (2-4 sentences). Cover the essential obligations only.",
    standard: "Draft a complete clause covering all material requirements (4-8 sentences).",
    detailed: "Draft a comprehensive clause with subsections, defined terms, and full requirement coverage.",
  }[style];

  const roleContext = {
    controller: "The party receiving this clause is the DATA CONTROLLER or BUSINESS. Draft from the processor/service provider's perspective — the clause describes what the processor commits to.",
    processor: "The party receiving this clause is the DATA PROCESSOR or SERVICE PROVIDER. Draft from the controller's perspective — the clause describes processor obligations.",
    both: "Draft a mutual clause that addresses both controller and processor obligations.",
  }[role];

  const nodeDescriptions = nodes
    .map(
      (n) => `Node ID: ${n.id}
Statute: ${n.statute} | Section: ${n.section}
Requirement type: ${n.requirement_type}
Obligation bearer: ${n.obligation_bearer}
Trigger: ${n.trigger}
Requirement: ${n.requirement.trim()}
Exceptions: ${n.exceptions.length > 0 ? n.exceptions.join("; ") : "None"}
`
    )
    .join("\n---\n");

  const contextBlock = context
    ? `\nADDITIONAL CONTEXT FROM ATTORNEY:\n${context}\n`
    : "";

  return `DRAFTING TASK: ${styleGuidance}

ROLE CONTEXT: ${roleContext}
${contextBlock}
STATUTORY REQUIREMENTS TO SATISFY:
${nodeDescriptions}

Draft a DPA clause (or clause set) that satisfies all of the above requirements.
Where requirements conflict, draft to the compliance ceiling (most stringent).
Identify any requirements you cannot address in a single clause and note them as gaps.`;
}

export async function draftDpaClause(
  nodes: StatuteNode[],
  role: DraftingRole = "processor",
  style: DraftingStyle = "standard",
  context?: string
): Promise<DraftedClause> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildDraftingPrompt(nodes, role, style, context),
      },
    ],
  });

  const rawText = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const cleaned = rawText
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  let parsed: {
    clause_text: string;
    coverage: Array<{ node_id: string; requirement_summary: string; clause_sentence: string }>;
    gaps: string[];
    notes: string[];
  };

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      clause_text: "Drafting failed — could not parse response. Try again or draft manually.",
      coverage: nodes.map((n) => ({
        node_id: n.id,
        requirement_summary: n.requirement.slice(0, 80),
        clause_sentence: "[not generated]",
      })),
      gaps: ["Full drafting failed — review nodes manually"],
      notes: ["Retry pq_draft_dpa_clause; if persistent, check ANTHROPIC_API_KEY"],
    };
  }

  return {
    clause_text: parsed.clause_text ?? "",
    coverage: parsed.coverage ?? [],
    gaps: parsed.gaps ?? [],
    notes: parsed.notes ?? [],
  };
}
