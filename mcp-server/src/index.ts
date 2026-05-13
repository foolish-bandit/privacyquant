import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadIndex } from "./loader.js";
import { searchNodes, extractClauseSignals } from "./search.js";
import { resolveConflict, ALL_DIMENSIONS } from "./conflict_resolver.js";
import type { Dimension } from "./conflict_resolver.js";
import { evaluateClause } from "./clause_evaluator.js";
import { routeDSAR, RIGHT_LABELS } from "./dsar_router.js";
import type { RightType } from "./dsar_router.js";
import { rankActions, textQuery, allTags } from "./precedent_matcher.js";
import { BM25Index, hybridMerge } from "./semantic_search.js";
// ─── Additional tool modules ────────────────────────────────────────────────
import { checkApplicability } from "./applicability_checker.js";
import { draftDpaClause } from "./dpa_clause_drafter.js";
import { resolveConflictWithNodes } from "./node_aware_conflict_resolver.js";
import { buildDSARWorkflow } from "./dsar_workflow_router.js";
import { auditCitations } from "./citation_auditor.js";
import { draftNoticeClause } from "./notice_clause_drafter.js";
import { scorePrivacyExposure } from "./privacy_exposure_scorer.js";
import { watchLegislation } from "./legislation_watcher.js";
import { registerDraftDpaClauseTool } from "./draft_dpa_clause.js";
import type { StatuteNode, StatuteIndex } from "./types.js";

// ─── Load the knowledge graph once at startup ──────────────────────────────
let index: StatuteIndex;
let bm25: BM25Index;
try {
  index = loadIndex();
  bm25 = new BM25Index(index);
} catch (err) {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
}

// ─── Server ────────────────────────────────────────────────────────────────
const server = new McpServer({
  name: "privacyquant-mcp-server",
  version: "0.1.0",
});

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatNode(node: StatuteNode): string {
  const lines: string[] = [
    `# ${node.title}`,
    `**ID**: ${node.id}`,
    `**Statute**: ${node.statute}`,
    `**Section**: ${node.section}`,
    `**Effective**: ${node.effective_date}`,
    `**Type**: ${node.requirement_type} | **Bearer**: ${node.obligation_bearer}`,
    ``,
    `**Trigger**: ${node.trigger}`,
    ``,
    `**Requirement**:`,
    node.requirement.trim(),
  ];

  if (node.exceptions.length > 0) {
    lines.push(``, `**Exceptions**:`);
    node.exceptions.forEach((e) => lines.push(`- ${e}`));
  }

  if (node.contract_signals.length > 0) {
    lines.push(``, `**Contract signals**: ${node.contract_signals.join(", ")}`);
  }

  if (node.cross_refs.length > 0) {
    lines.push(``, `**Cross-references**: ${node.cross_refs.join(", ")}`);
  }

  lines.push(``, `**Source**: ${node.source_url}`);

  if (node.git_hash) {
    lines.push(`**Git hash**: ${node.git_hash}`);
  }

  return lines.join("\n");
}

// ─── Tool 1: fetch_requirement ─────────────────────────────────────────────
server.registerTool(
  "pq_fetch_requirement",
  {
    title: "Fetch Requirement by ID",
    description: `Fetch a single PrivacyQuant statutory requirement node by its exact ID.

Use this when you know the node ID (e.g. from a cross_refs list or a prior search result)
and need the full requirement text, exceptions, and metadata.

Args:
  - id (string): Dot-notation node ID, e.g. "ccpa.rights.deletion" or "modpa.minors.flat_ban"

Returns the full node including: statute, section, requirement text, exceptions,
contract_signals, cross_refs, source_url, and git_hash.

Returns an error if the ID is not found.`,
    inputSchema: {
      id: z.string()
        .min(1)
        .describe('Node ID in dot notation, e.g. "ccpa.rights.deletion"'),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ id }) => {
    const node = index.byId.get(id);
    if (!node) {
      // Try case-insensitive fallback
      const lower = id.toLowerCase();
      const match = [...index.byId.entries()].find(
        ([k]) => k.toLowerCase() === lower
      );
      if (!match) {
        return {
          content: [
            {
              type: "text",
              text: `Node not found: "${id}". Use pq_list_statutes to see available statutes, or pq_search_requirements to find relevant nodes.`,
            },
          ],
        };
      }
      return {
        content: [{ type: "text", text: formatNode(match[1]) }],
      };
    }
    return {
      content: [{ type: "text", text: formatNode(node) }],
    };
  }
);

// ─── Tool 2: search_requirements ───────────────────────────────────────────
server.registerTool(
  "pq_search_requirements",
  {
    title: "Search Statutory Requirements",
    description: `Search the PrivacyQuant statutory knowledge graph by keyword or contract clause text.

Use this to find relevant statutory nodes before analyzing a contract clause or drafting
a DPA provision. The search matches against contract_signals (phrases that appear in real
DPA/contract language), node titles, and statute names.

Two modes:
  1. Keyword search: provide a short query string
  2. Clause search: paste a raw DPA clause into clause_text — the tool extracts signal
     terms automatically. Use this when you have the actual contract language.

Args:
  - query (string): Freetext keyword query. Examples:
      "right to deletion"
      "do not sell or share my personal information"
      "sensitive data consent"
      "universal opt-out GPC"
  - clause_text (string, optional): Raw DPA or contract clause text. When provided,
      the tool extracts privacy-law signal terms from the clause and uses them as the
      search query — you do not need to identify keywords yourself. If both query and
      clause_text are provided, clause_text signals are appended to the query.
  - statute (string, optional): Filter to a specific statute, e.g. "CCPA", "MODPA", "VCDPA"
  - requirement_type (string, optional): Filter by type — "hard", "threshold", or "soft"
  - limit (number, optional): Max results to return (default 5, max 20)

Returns ranked results with matched signals and full node details.
If no results found, try broader terms or use pq_list_statutes to browse by statute.`,
    inputSchema: {
      query: z.string()
        .min(2)
        .max(2000)
        .describe("Freetext keyword query"),
      clause_text: z.string()
        .min(20)
        .max(10000)
        .optional()
        .describe("Raw DPA or contract clause — signal terms are extracted automatically"),
      statute: z.string()
        .optional()
        .describe('Filter to a specific statute, e.g. "CCPA", "MODPA"'),
      requirement_type: z
        .enum(["hard", "threshold", "soft"])
        .optional()
        .describe("Filter by requirement type"),
      limit: z.number()
        .int()
        .min(1)
        .max(20)
        .default(5)
        .describe("Maximum results to return (default 5)"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ query, clause_text, statute, requirement_type, limit }) => {
    // Build effective query: keyword query + extracted clause signals
    let effectiveQuery = query;
    let clauseSignals: string | null = null;

    if (clause_text) {
      clauseSignals = extractClauseSignals(clause_text);
      // Append clause signals to the query; deduplicate by using a Set of tokens
      const combined = new Set([
        ...query.toLowerCase().split(/\s+/),
        ...clauseSignals.toLowerCase().split(/\s+/),
      ]);
      effectiveQuery = [...combined].join(" ");
    }

    const results = searchNodes(index, {
      query: effectiveQuery,
      statute,
      requirement_type,
      limit: limit * 2, // fetch more for hybrid merge
    });

    // BM25 semantic search — handles morphological variants and novel phrasing
    const bm25Results = bm25.search(effectiveQuery, statute, limit * 2);

    // Merge keyword and semantic results, boosting nodes that appear in both
    const hybridResults = hybridMerge(bm25Results, results, limit);

    // Apply requirement_type filter post-merge if specified
    const filtered = requirement_type
      ? hybridResults.filter((r) => r.node.requirement_type === requirement_type)
      : hybridResults;

    const finalResults = filtered.slice(0, limit);

    if (finalResults.length === 0) {
      const noMatchLines = [
        `No nodes matched${clause_text ? " the clause" : ` "${query}"`}${statute ? ` in ${statute}` : ""}.`,
        ``,
        `Suggestions:`,
        `- Try broader terms (e.g. "deletion" instead of "right to erasure")`,
        `- Remove the statute filter to search across all statutes`,
        `- Use pq_list_statutes to see what statutes and nodes are available`,
      ];
      if (clause_text && clauseSignals) {
        noMatchLines.push(`- Extracted signals from clause: "${clauseSignals}"`);
        noMatchLines.push(`- Try passing the clause directly to pq_check_clause for full evaluation`);
      }
      return {
        content: [{ type: "text", text: noMatchLines.join("\n") }],
      };
    }

    const displayQuery = clause_text
      ? `clause (signals: ${clauseSignals})`
      : `"${query}"`;

    const lines: string[] = [
      `Found ${finalResults.length} result${finalResults.length !== 1 ? "s" : ""} for ${displayQuery} _(hybrid BM25 + keyword)_`,
      ``,
    ];

    finalResults.forEach((r, i) => {
      lines.push(`## ${i + 1}. ${r.node.title} (${r.node.statute})`);
      lines.push(`**ID**: ${r.node.id} | **Score**: ${r.combined_score.toFixed(1)} | **Type**: ${r.node.requirement_type}`);
      if (r.matched_terms.length > 0) {
        lines.push(`**Matched terms**: ${r.matched_terms.slice(0, 8).join(", ")}`);
      }
      lines.push(`**Section**: ${r.node.section}`);
      lines.push(`**Trigger**: ${r.node.trigger}`);
      lines.push(``);
      const req = r.node.requirement.trim();
      lines.push(req.length > 400 ? req.slice(0, 400) + "…" : req);
      lines.push(``);
      lines.push(`---`);
      lines.push(``);
    });

    lines.push(
      `Use pq_fetch_requirement with a node ID for the full text, exceptions, and cross-references.`
    );

    if (clause_text) {
      lines.push(
        `Use pq_check_clause with the same clause text for GREEN/YELLOW/RED verdicts and redlines.`
      );
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
);

// ─── Tool 3: list_statutes ─────────────────────────────────────────────────
server.registerTool(
  "pq_list_statutes",
  {
    title: "List Available Statutes",
    description: `List all statutes in the PrivacyQuant knowledge graph, with node counts and coverage summary.

Use this to understand what statutes are available before searching, or to browse
the node IDs within a specific statute.

Args:
  - statute (string, optional): If provided, list all nodes for that statute with their IDs and titles.
    E.g. "CCPA", "MODPA", "vcdpa" (case-insensitive).
    If omitted, returns a summary table of all statutes.

Returns statute name, node count, effective date range, and — when a specific statute
is requested — the full list of node IDs and titles.`,
    inputSchema: {
      statute: z.string()
        .optional()
        .describe('Statute name to drill into, e.g. "CCPA", "MODPA". Omit for summary of all.'),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ statute }) => {
    if (statute) {
      // Drill into a specific statute
      const lower = statute.toLowerCase();
      const nodes = [...index.byStatute.entries()]
        .filter(([k]) => k.includes(lower) || lower.includes(k))
        .flatMap(([, v]) => v);

      if (nodes.length === 0) {
        const available = [...index.byStatute.keys()].join(", ");
        return {
          content: [
            {
              type: "text",
              text: `Statute "${statute}" not found. Available: ${available}`,
            },
          ],
        };
      }

      const lines: string[] = [
        `## ${nodes[0].statute} — ${nodes.length} nodes`,
        ``,
      ];

      // Group by area (second component of dot-notation ID)
      const byArea = new Map<string, typeof nodes>();
      for (const n of nodes) {
        const area = n.id.split(".")[1] ?? "other";
        if (!byArea.has(area)) byArea.set(area, []);
        byArea.get(area)!.push(n);
      }

      for (const [area, areaNodes] of byArea) {
        lines.push(`### ${area}`);
        for (const n of areaNodes) {
          lines.push(`- \`${n.id}\` — ${n.title} (${n.requirement_type})`);
        }
        lines.push(``);
      }

      return { content: [{ type: "text", text: lines.join("\n") }] };
    }

    // Summary table of all statutes
    const lines: string[] = [
      `# PrivacyQuant Statutory Knowledge Graph`,
      `**Total nodes**: ${index.all.length} across ${index.byStatute.size} statutes`,
      ``,
      `| Statute | Nodes | Requirement types |`,
      `|---------|-------|-------------------|`,
    ];

    // Sort by statute name
    const sorted = [...index.byStatute.entries()].sort(([a], [b]) =>
      a.localeCompare(b)
    );

    for (const [, nodes] of sorted) {
      const statute = nodes[0].statute;
      const count = nodes.length;
      const types = [...new Set(nodes.map((n) => n.requirement_type))].join(", ");
      lines.push(`| ${statute} | ${count} | ${types} |`);
    }

    lines.push(``);
    lines.push(
      `Use pq_list_statutes with a statute name to see individual node IDs, ` +
      `or pq_search_requirements to find relevant nodes by keyword.`
    );

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ─── Tool 4: pq_resolve_conflict ───────────────────────────────────────────
server.registerTool(
  "pq_resolve_conflict",
  {
    title: "Resolve Multi-State Compliance Conflicts",
    description: `For a set of applicable state privacy laws and one or more compliance dimensions,
returns the binding constraint — the strictest rule a controller must design to in order
to be compliant across all applicable states simultaneously.

Use this when advising on a multi-state privacy program, drafting a DPA that must satisfy
multiple jurisdictions, or determining which state's requirement controls implementation.

Args:
  - statutes (array of strings): The applicable state privacy laws to compare.
    Use statute acronyms: CCPA, CPRA, CCPA/CPRA, VCDPA, CPA, CTDPA, UCPA, TDPSA,
    OCPA, MCDPA, ICDPA, INCDPA, TIPA, DPDPA, NJDPA, NHDPA, NDPA, KCDPA, MODPA,
    MCDPA-MN, RIDTPPA, FDBR.
  - dimensions (array of strings, optional): Which compliance dimensions to analyse.
    If omitted, all dimensions are returned.
    Available dimensions:
      - sensitive_data_treatment   : Opt-in vs opt-out for sensitive data processing
      - sensitive_data_sale        : Whether sale of sensitive data is prohibited
      - minor_treatment            : Minor and teen data protections
      - uoom_recognition           : GPC / universal opt-out signal recognition
      - response_time              : Consumer rights request response deadlines
      - appeal_right               : Right to appeal denied requests
      - cure_period                : Enforcement cure period status
      - penalty_max                : Maximum civil penalty per violation
      - data_minimization          : Data minimization standard strictness
      - processor_contract         : Processor / service provider contract requirements
      - right_to_correction        : Whether correction right exists
      - right_to_profiling_optout  : Right to opt out of profiling / ADM

Returns for each dimension:
  - The binding rule and which statute controls it
  - Each state's position with the node IDs backing it
  - Whether a true conflict exists (rare)
  - A concrete implementation note for how to satisfy all states simultaneously

Example use: "I'm drafting a DPA for a controller subject to CCPA, CPA, CTDPA, and MODPA.
What's the binding constraint on processor contract requirements and sensitive data treatment?"`,
    inputSchema: {
      statutes: z
        .array(z.string().min(2))
        .min(1)
        .max(20)
        .describe("List of applicable statute acronyms, e.g. [\"CCPA\", \"CPA\", \"MODPA\"]"),
      dimensions: z
        .array(
          z.enum([
            "sensitive_data_treatment",
            "sensitive_data_sale",
            "minor_treatment",
            "uoom_recognition",
            "response_time",
            "appeal_right",
            "cure_period",
            "penalty_max",
            "data_minimization",
            "processor_contract",
            "right_to_correction",
            "right_to_profiling_optout",
          ])
        )
        .optional()
        .describe("Dimensions to analyse. Omit to return all dimensions."),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ statutes, dimensions }) => {
    const dimsToRun: Dimension[] = dimensions ?? ALL_DIMENSIONS;
    const results = resolveConflict(statutes, dimsToRun);

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: [
              `No conflict data found for the requested statutes and dimensions.`,
              `Statutes requested: ${statutes.join(", ")}`,
              `Dimensions requested: ${dimsToRun.join(", ")}`,
              ``,
              `Try using standard statute acronyms: CCPA, VCDPA, CPA, CTDPA, UCPA, TDPSA, OCPA,`,
              `MCDPA, ICDPA, INCDPA, TIPA, DPDPA, NJDPA, NHDPA, NDPA, KCDPA, MODPA, MCDPA-MN, RIDTPPA, FDBR`,
            ].join("\n"),
          },
        ],
      };
    }

    const lines: string[] = [
      `# Compliance Ceiling Analysis`,
      `**Statutes**: ${statutes.join(", ")}`,
      `**Dimensions analysed**: ${results.length}`,
      ``,
    ];

    for (const r of results) {
      lines.push(`## ${r.dimension_label}`);
      lines.push(`**Binding rule** (controlled by **${r.controlling_statute}**):`)
      lines.push(r.binding_rule);
      lines.push(``);

      if (r.is_true_conflict) {
        lines.push(`⚠️ **True conflict detected**: ${r.conflict_note}`);
        lines.push(``);
      }

      lines.push(`**Implementation**: ${r.implementation_note}`);
      lines.push(``);

      lines.push(`**Per-state positions**:`);
      // Sort: binding first, then by strictness desc
      const sorted = [...r.positions].sort((a, b) => b.strictness_rank - a.strictness_rank);
      for (const p of sorted) {
        const marker = p.statute === r.controlling_statute ? "▶ " : "  ";
        lines.push(`${marker}**${p.statute}**: ${p.position}`);
        if (p.node_refs.length > 0) {
          lines.push(`   _Nodes: ${p.node_refs.join(", ")}_`);
        }
      }
      lines.push(``);
      lines.push(`---`);
      lines.push(``);
    }

    lines.push(
      `Use pq_fetch_requirement with a node ID to retrieve the full statutory text behind any position.`
    );

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
);

// ─── Tool 5: pq_check_clause ───────────────────────────────────────────────
server.registerTool(
  "pq_check_clause",
  {
    title: "Check DPA Clause Against Statutory Requirements",
    description: `Evaluate a DPA or contract clause against applicable US state privacy law requirements.
Paste a raw clause and specify which statutes apply. The tool retrieves the relevant
statutory nodes, then assesses each one with a GREEN / YELLOW / RED verdict plus a
specific gap description and suggested redline language to close the gap.

Use this during DPA review to:
- Flag clauses that are silent on a required obligation
- Identify language that is technically present but too vague to satisfy the requirement
- Get concrete redline suggestions tied to specific statutory sections
- Produce a clause-level gap log with node citations

Args:
  - clause (string): The raw DPA or contract clause text to evaluate. Paste the full
    clause — do not summarize or paraphrase. The more complete the text, the more
    accurate the assessment.
  - statutes (array of strings): The applicable state privacy laws to check against.
    Use acronyms: CCPA, VCDPA, CPA, CTDPA, TDPSA, OCPA, MODPA, NJDPA, etc.
    If omitted, the tool searches for relevant nodes across all statutes.
  - topics (array of strings, optional): Constrain the node search to specific topics.
    Examples: ["deletion", "processor contract", "sensitive data", "appeal right"].
    If omitted, the tool infers topics from the clause text automatically.
  - max_nodes (integer, optional): Maximum number of statute nodes to evaluate the
    clause against (default 6, max 12). Higher values are more thorough but slower.

Returns:
  - Overall verdict (GREEN / YELLOW / RED)
  - Per-node assessments with: verdict, what is satisfied, specific gap, suggested redline
  - Top priority fix across all gaps
  - Node IDs for tracing back to full statutory text via pq_fetch_requirement

Note: This tool makes a sub-call to Claude to perform the legal reasoning. It requires
ANTHROPIC_API_KEY to be set in the environment. Response time is typically 10-20 seconds.`,
    inputSchema: {
      clause: z
        .string()
        .min(20)
        .max(10000)
        .describe("Raw DPA or contract clause text — paste the full clause"),
      statutes: z
        .array(z.string().min(2))
        .max(10)
        .optional()
        .describe(
          'Applicable statutes to check against, e.g. ["CCPA", "MODPA", "CPA"]'
        ),
      topics: z
        .array(z.string().min(2))
        .max(5)
        .optional()
        .describe(
          'Optional topic filters, e.g. ["deletion", "processor contract"]'
        ),
      max_nodes: z
        .number()
        .int()
        .min(1)
        .max(12)
        .default(6)
        .describe("Maximum nodes to evaluate against (default 6)"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false, // sub-calls to LLM are non-deterministic
      openWorldHint: false,
    },
  },
  async ({ clause, statutes, topics, max_nodes }) => {
    // Check for API key upfront — better error than a confusing SDK failure
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        content: [
          {
            type: "text",
            text: "pq_check_clause requires ANTHROPIC_API_KEY to be set in the environment. Set it and restart the MCP server.",
          },
        ],
      };
    }

    // Build search query from clause text + optional topic hints
    const topicHint = topics?.join(" ") ?? "";
    // Extract first ~200 chars of clause as the search seed — enough signal for matching
    const clauseSeed = clause.slice(0, 200);
    const query = [topicHint, clauseSeed].filter(Boolean).join(" ");

    // Search each applicable statute, or all if none specified
    const statuteList = statutes ?? [];
    let nodes: StatuteNode[] = [];

    if (statuteList.length > 0) {
      // Search per-statute and merge, deduplicating by id
      const seen = new Set<string>();
      const perStatuteLimit = Math.max(2, Math.ceil(max_nodes / statuteList.length));
      for (const statute of statuteList) {
        const results = searchNodes(index, {
          query,
          statute,
          limit: perStatuteLimit,
        });
        for (const r of results) {
          if (!seen.has(r.node.id)) {
            seen.add(r.node.id);
            nodes.push(r.node);
          }
        }
      }
      // If per-statute search didn't find enough, top up with a broader search
      if (nodes.length < 2) {
        const broader = searchNodes(index, { query, limit: max_nodes });
        for (const r of broader) {
          if (!seen.has(r.node.id)) {
            seen.add(r.node.id);
            nodes.push(r.node);
          }
        }
      }
    } else {
      const results = searchNodes(index, { query, limit: max_nodes });
      nodes = results.map((r) => r.node);
    }

    // Cap at max_nodes
    nodes = nodes.slice(0, max_nodes);

    if (nodes.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: [
              `No relevant statutory nodes found for this clause.`,
              ``,
              `Try:`,
              `- Adding a 'topics' list with keywords from the clause (e.g. ["deletion", "data subject rights"])`,
              `- Specifying statutes explicitly`,
              `- Using pq_search_requirements with clause keywords to find relevant nodes manually`,
            ].join("\n"),
          },
        ],
      };
    }

    // Run the evaluation
    let result;
    try {
      result = await evaluateClause(clause, nodes);
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Clause evaluation failed: ${err}\n\nEnsure ANTHROPIC_API_KEY is valid and the API is reachable.`,
          },
        ],
      };
    }

    // Format output
    const verdictEmoji: Record<string, string> = {
      GREEN: "✅",
      YELLOW: "⚠️",
      RED: "🔴",
    };

    const lines: string[] = [
      `# Clause Check Results`,
      `**Overall verdict**: ${verdictEmoji[result.overall_verdict]} **${result.overall_verdict}**`,
      `**Nodes evaluated**: ${result.assessments.length} across ${[...new Set(result.assessments.map((a) => a.statute))].join(", ")}`,
      ``,
      `**Clause (excerpt)**: _${result.clause_excerpt.replace(/\n/g, " ").slice(0, 200)}${result.clause_excerpt.length > 200 ? "…" : ""}_`,
      ``,
    ];

    if (result.top_priority) {
      lines.push(`## ⚡ Top Priority`);
      lines.push(result.top_priority);
      lines.push(``);
    }

    lines.push(`## Per-Node Assessments`);
    lines.push(``);

    for (const a of result.assessments) {
      lines.push(
        `### ${verdictEmoji[a.verdict]} ${a.verdict} — ${a.title} (${a.statute})`
      );
      lines.push(`**Node**: \`${a.node_id}\``);
      lines.push(``);

      if (a.satisfied && a.satisfied !== "Nothing") {
        lines.push(`**Satisfied**: ${a.satisfied}`);
      }

      if (a.gap && a.verdict !== "GREEN") {
        lines.push(`**Gap**: ${a.gap}`);
      }

      if (a.suggested_redline && a.verdict !== "GREEN") {
        lines.push(``);
        lines.push(`**Suggested redline**:`);
        lines.push(`> ${a.suggested_redline.replace(/\n/g, "\n> ")}`);
      }

      lines.push(``);
      lines.push(`---`);
      lines.push(``);
    }

    lines.push(
      `Use \`pq_fetch_requirement\` with any node ID above to retrieve the full statutory text and exceptions.`
    );

    if (result.overall_verdict !== "GREEN") {
      lines.push(
        `Use \`pq_resolve_conflict\` to check for multi-state binding constraints on the dimensions flagged above.`
      );
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
);

// ─── Tool 6: pq_dsar_router ────────────────────────────────────────────────
server.registerTool(
  "pq_dsar_router",
  {
    title: "Route a DSAR to the Applicable Statute and Deadline",
    description: `Determine the statutory obligations for responding to a consumer rights request
based on the consumer's state of residence and the right invoked.

Use this when:
- A consumer submits a deletion, access, correction, portability, or opt-out request
- You need to know the response deadline, appeal requirements, and whether the right even
  exists under the applicable state law
- You are advising on multi-state DSAR workflows and need per-state routing

Key gotchas this tool surfaces automatically:
- Iowa has a 90-day initial response window — the longest of any state
- Utah, Iowa, and Kentucky have NO correction right
- Iowa has NO opt-out of targeted advertising — sale only
- Utah and Iowa have NO right to appeal
- Maryland has a flat ban on sale of known-minor data — opt-out is irrelevant
- Florida FDBR has narrow applicability (≥$1B revenue + specific activities)
- Many states (AK, AL, AR, AZ, GA, etc.) have no comprehensive privacy law

Args:
  - consumer_state (string): Two-letter state abbreviation of the consumer's residence,
    e.g. "CA", "VA", "IA", "MD"
  - right_invoked (string): The right the consumer is asserting. One of:
      access                       — right to know / confirm processing
      deletion                     — right to delete / erasure
      correction                   — right to correct inaccurate data
      portability                  — right to data portability
      opt_out_sale                 — right to opt out of sale
      opt_out_targeted_advertising — right to opt out of targeted advertising
      opt_out_profiling            — right to opt out of profiling / ADM
      limit_sensitive_pi           — right to limit use of sensitive PI (CA only)
      appeal                       — right to appeal a denied request
  - controller_statutes (array, optional): The statutes the controller is subject to.
    Used to generate multi-state notes when the controller operates in multiple states.
    E.g. ["CCPA", "CPA", "MODPA", "VCDPA"]. Omit for single-state routing.

Returns:
  - Whether the right exists under the applicable statute
  - Response deadline (initial + max with extension)
  - Appeal requirement and deadline
  - Specific limitations and practitioner notes
  - Node IDs for tracing back to full statutory text`,
    inputSchema: {
      consumer_state: z
        .string()
        .min(2)
        .max(2)
        .describe("Two-letter state abbreviation, e.g. 'CA', 'IA', 'MD'"),
      right_invoked: z
        .enum([
          "access",
          "deletion",
          "correction",
          "portability",
          "opt_out_sale",
          "opt_out_targeted_advertising",
          "opt_out_profiling",
          "limit_sensitive_pi",
          "appeal",
        ])
        .describe("The right the consumer is asserting"),
      controller_statutes: z
        .array(z.string())
        .optional()
        .describe("Statutes the controller is subject to, for multi-state notes"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ consumer_state, right_invoked, controller_statutes }) => {
    const result = routeDSAR(consumer_state, right_invoked as RightType);

    const lines: string[] = [
      `# DSAR Routing: ${result.right_label}`,
      `**Consumer state**: ${result.consumer_state}`,
      `**Right invoked**: ${result.right_label}`,
      `**Statute**: ${result.applicable_statute?.statute ?? "None applicable"}`,
      ``,
    ];

    // Directive — the top-line answer
    lines.push(`## Directive`);
    lines.push(result.directive);
    lines.push(``);

    if (result.applicable_statute && result.must_respond) {
      const right = result.applicable_statute.rights[right_invoked as RightType];
      if (right?.exists) {
        lines.push(`## Response requirements`);
        lines.push(`**Initial deadline**: ${right.initial_deadline_days} calendar days`);
        if (right.max_deadline_days && right.max_deadline_days > (right.initial_deadline_days ?? 45)) {
          lines.push(`**Maximum with extension**: ${right.max_deadline_days} calendar days`);
          lines.push(`**Extension notice**: Required — must notify consumer before deadline expires`);
        }
        lines.push(``);

        lines.push(`**Appeal right**: ${right.appeal_right ? `Yes — ${right.appeal_deadline_days} days to complete appeal` : "No"}`);

        if (result.applicable_statute.cure_period) {
          lines.push(`**Cure period**: ${result.applicable_statute.cure_period}`);
        }
        lines.push(``);

        if (right.limitations.length > 0) {
          lines.push(`## Limitations and conditions`);
          right.limitations.forEach((l) => lines.push(`- ${l}`));
          lines.push(``);
        }

        if (right.notes.length > 0) {
          lines.push(`## Practitioner notes`);
          right.notes.forEach((n) => lines.push(`- ${n}`));
          lines.push(``);
        }

        if (right.node_refs.length > 0) {
          lines.push(`## Node references`);
          lines.push(`_Use \`pq_fetch_requirement\` with any of these IDs for full statutory text:_`);
          right.node_refs.forEach((ref) => lines.push(`- \`${ref}\``));
          lines.push(``);
        }
      }
    } else if (!result.must_respond && result.applicable_statute) {
      // Right doesn't exist — show all available rights for this state
      const available = Object.entries(result.applicable_statute.rights)
        .filter(([, v]) => v?.exists)
        .map(([k]) => RIGHT_LABELS[k as RightType])
        .join(", ");

      lines.push(`## Rights available under ${result.applicable_statute.statute}`);
      lines.push(available || "None in graph — verify manually");
      lines.push(``);
    }

    // Multi-state notes if controller_statutes provided
    if (controller_statutes && controller_statutes.length > 0 && result.must_respond) {
      lines.push(`## Multi-state context`);
      lines.push(
        `This request is routed to **${result.applicable_statute?.statute}** because the consumer ` +
        `resides in **${result.consumer_state}**. The controller is also subject to: ` +
        `${controller_statutes.join(", ")}.`
      );
      lines.push(``);
      lines.push(
        `The applicable statute for this DSAR is determined by the consumer's state of residence, ` +
        `not the controller's full list of applicable laws. Respond under **${result.applicable_statute?.statute}** ` +
        `requirements above.`
      );
      lines.push(``);

      // Iowa-specific multi-state warning
      if (consumer_state.toLowerCase() === "ia") {
        lines.push(
          `⚠️ **Iowa 90-day window**: Even if the controller's program is built to a 45-day ` +
          `standard for CA/VA/CO, Iowa DSARs require a 90-day initial response. Do not apply ` +
          `the standard 45-day workflow to this request.`
        );
        lines.push(``);
      }
    }

    if (result.multi_state_notes.length > 0) {
      lines.push(`## Additional notes`);
      result.multi_state_notes.forEach((n) => lines.push(`- ${n}`));
      lines.push(``);
    }

    lines.push(
      `_Output is a draft for attorney review — not legal advice. ` +
      `Verify node data reflects current law before relying on deadlines._`
    );

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
);

// ─── Tool 7: pq_find_precedent ─────────────────────────────────────────────
server.registerTool(
  "pq_find_precedent",
  {
    title: "Find Analogous Enforcement Actions",
    description: `Search the PrivacyQuant enforcement actions corpus for real enforcement actions
analogous to a compliance gap or violation pattern.

Use this when:
- A DPA gap analysis (pq_check_clause) has returned RED or YELLOW verdicts and you
  want to know what enforcement actions have targeted the same gaps
- A client wants to understand the practical enforcement risk behind a specific gap
- You are drafting a risk memo and need settlement amounts, regulators, and factual
  patterns for comparable cases
- You want to know what remediation was imposed in analogous matters

Two search modes:
  1. Tag search (precise): provide one or more violation_theory tags from the
     48-tag taxonomy. Returns actions that share those exact theories, ranked by
     tag overlap + state proximity + recency + settlement severity.
  2. Free-text search (fallback): provide a query string if you don't know the
     tag. Matched against case names, factual patterns, violation theories, and
     operational lessons.

The 48 violation theory tags:
  GPC/opt-out: gpc_not_honored, uoom_not_honored, targeted_ads_no_optout,
    dark_pattern_optout, no_donotsell_link, no_homepage_link, discrimination_for_optout
  Notice/disclosure: notice_at_collection_missing, notice_inadequate_content,
    notice_stale, sale_not_disclosed, sharing_not_disclosed, deceptive_privacy_representation,
    loyalty_program_inadequate_disclosure
  Sensitive/special data: sensitive_data_no_consent, sensitive_data_sale_general,
    sensitive_data_sale_md_ban, pixel_health_data_disclosure
  Minor/children: minor_data_sold, minor_data_targeted_ads, minor_no_parental_consent,
    actual_knowledge_minors
  Rights requests: deletion_failure, deletion_processor_not_directed,
    rights_request_response_late, rights_request_denial_unjustified,
    rights_request_appeal_missing, verification_excessive, verification_inadequate
  Contracts/processors: dpa_missing, processor_contract_inadequate,
    subprocessor_flowdown_missing
  Data governance: minimization_violation, purpose_limitation_violation,
    retention_excessive, retention_undisclosed, risk_assessment_missing
  Security: security_failure_breach
  Biometric: biometric_no_written_consent, biometric_no_retention_schedule
  Dark patterns/consent: dark_pattern_consent, consent_bundled, consent_pre_checked,
    financial_incentive_no_value_calc
  Brokers: data_broker_registration_failure
  Adjacent: vppa_video_disclosure, wiretap_chat_pixel, wiretap_session_replay

Args:
  - tags (array, optional): One or more violation theory tags from the 48-tag taxonomy
  - states (array, optional): Applicable states to weight — e.g. ["CA", "TX", "MD"]
  - query (string, optional): Free-text fallback when tags are unknown
  - top_n (integer, optional): Number of results to return (default 5, max 10)

Returns ranked enforcement actions with: case name, year, regulator, respondent,
settlement amount, factual pattern, operational lessons, and citation.`,
    inputSchema: {
      tags: z
        .array(z.string().min(3))
        .max(10)
        .optional()
        .describe("Violation theory tags from the 48-tag taxonomy"),
      states: z
        .array(z.string().min(2).max(2))
        .max(20)
        .optional()
        .describe("Applicable state abbreviations to weight results toward"),
      query: z
        .string()
        .min(3)
        .max(500)
        .optional()
        .describe("Free-text query — used when tags are unknown"),
      top_n: z
        .number()
        .int()
        .min(1)
        .max(10)
        .default(5)
        .describe("Number of results to return (default 5)"),
      statutes: z
        .array(z.string().min(2))
        .max(10)
        .optional()
        .describe("Statute names to match against corpus action statutes, e.g. [\"CCPA\", \"BIPA\", \"FTC Act\"]"),
      industry: z
        .string()
        .min(2)
        .max(100)
        .optional()
        .describe("Industry descriptor to weight results toward, e.g. \"healthcare\", \"adtech\", \"automotive\""),
      min_year: z
        .number()
        .int()
        .min(2000)
        .max(2100)
        .optional()
        .describe("Only return enforcement actions from this year or later"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ tags, states, query, top_n, statutes, industry, min_year }) => {
    let matches;
    let searchMode: string;

    // Build a supplementary text query from statutes + industry for use when tags-only mode
    // doesn't capture statute/industry signals, or as the primary query when no tags/query given
    const supplementParts: string[] = [];
    if (statutes?.length) supplementParts.push(...statutes);
    if (industry) supplementParts.push(industry);
    const supplementQuery = supplementParts.join(" ");

    // Determine effective query (user query + statute/industry terms)
    const effectiveQuery = [query, supplementQuery].filter(Boolean).join(" ");

    // Fetch a larger pool when min_year filtering will discard some results
    const pool = min_year ? top_n * 4 : top_n;

    if (tags && tags.length > 0) {
      matches = rankActions(tags, states ?? [], pool);
      searchMode = `tags: ${tags.join(", ")}${states?.length ? ` | states: ${states.join(", ")}` : ""}`;
      if (supplementQuery) searchMode += ` | filter: ${supplementQuery}`;
    } else if (effectiveQuery) {
      matches = textQuery(effectiveQuery, pool);
      searchMode = `query: "${effectiveQuery}"`;
    } else {
      return {
        content: [{
          type: "text",
          text: "Provide at least one tag, query string, statute name, or industry.\n\nAvailable tags:\n" +
            allTags().join(", "),
        }],
      };
    }

    // Apply min_year hard filter
    if (min_year !== undefined) {
      matches = matches.filter((m) => m.year >= min_year);
    }

    // Trim to requested count after filtering
    matches = matches.slice(0, top_n);

    if (matches.length === 0) {
      const suggestion = tags?.length
        ? `No actions matched tags [${tags.join(", ")}]. Try broader tags or use a free-text query.`
        : `No actions matched "${query}". Try different keywords or use tags.`;
      return {
        content: [{ type: "text", text: suggestion }],
      };
    }

    const fmt = (n: number | null) =>
      n ? `$${n.toLocaleString("en-US")}` : "Injunctive / undisclosed";

    const lines: string[] = [
      `# Enforcement Precedents`,
      `**Search**: ${searchMode}`,
      `**Results**: ${matches.length} of ${top_n} requested`,
      ``,
    ];

    matches.forEach((m, i) => {
      lines.push(`## ${i + 1}. ${m.case_name} (${m.year})`);
      lines.push(`**Regulator**: ${m.regulator.join(", ")}`);
      lines.push(`**Respondent**: ${m.respondent}${m.respondent_industry ? ` — ${m.respondent_industry}` : ""}`);
      lines.push(`**Settlement**: ${fmt(m.monetary_amount_usd)}`);
      lines.push(`**Score**: ${m.score} (tag: ${m.score_breakdown.tag_score}, state: ${m.score_breakdown.state_score}, recency: ${m.score_breakdown.recency_score}, severity: ${m.score_breakdown.severity_score})`);

      if (m.score_breakdown.tag_overlap.length > 0) {
        lines.push(`**Matched theories**: ${m.score_breakdown.tag_overlap.join(", ")}`);
      }
      lines.push(`**All theories**: ${m.violation_theories.join(", ")}`);
      lines.push(``);
      lines.push(`**Facts**: ${m.factual_pattern}`);

      if (m.operational_lessons.length > 0) {
        lines.push(``);
        lines.push(`**Operational lessons**:`);
        m.operational_lessons.forEach((l) => lines.push(`- ${l}`));
      }

      lines.push(``);
      lines.push(`**Citation**: ${m.citation}`);
      if (m.url) lines.push(`**URL**: ${m.url}`);
      lines.push(``);
      lines.push(`---`);
      lines.push(``);
    });

    lines.push(
      `_Corpus v2.3 — 84 enforcement actions. ` +
      `Settlement amounts reflect reported headline figures; verify against source documents before citing in work product._`
    );

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
);

// ─── Tool 8: pq_check_applicability ────────────────────────────────────────
server.registerTool("pq_check_applicability", {
  title: "Check Applicability of State Privacy Laws",
  description: `Determine which US state consumer privacy laws likely apply based on controller/business threshold inputs. Returns Applies | Likely Applies | Does Not Apply | Insufficient Info per statute. Covers all 20 PrivacyQuant-covered states. Deterministic — no LLM.`,
  inputSchema: {
    annual_revenue_usd: z.number().optional().describe("Annual gross revenue in USD"),
    consumers_processed: z.number().int().optional().describe("Number of consumers' PI processed annually"),
    households_processed: z.number().int().optional().describe("Number of households' PI processed annually"),
    revenue_pct_from_sale: z.number().min(0).max(100).optional().describe("% of annual revenue from selling PI"),
    states_operating: z.array(z.string()).optional().describe("States where business operates — if omitted, evaluates all 20"),
    is_nonprofit: z.boolean().optional().describe("True if entity is a non-profit organization"),
    is_government: z.boolean().optional().describe("True if entity is a government body"),
    is_hipaa_covered_entity: z.boolean().optional().describe("True if entity is HIPAA-covered (note: data-level exemption, not entity-level under most state laws)"),
    is_glba_covered: z.boolean().optional().describe("True if entity is GLBA-covered financial institution"),
  },
}, async (input) => {
  const result = checkApplicability(input);
  const lines = [
    `# Applicability Check`,
    `**Summary**: ${result.summary}`,
    result.any_applies ? `**Applicable statutes**: ${result.applicable_statutes.join(", ")}` : "",
    result.needed_inputs.length > 0 ? `**Missing inputs**: ${result.needed_inputs.join(", ")}` : "",
    ``,
  ];
  for (const r of result.results) {
    const icon = r.verdict === "Applies" ? "✅" : r.verdict === "Likely Applies" ? "⚠️" : r.verdict === "Does Not Apply" ? "❌" : "❓";
    lines.push(`## ${icon} ${r.statute} (${r.state}) — ${r.verdict}`);
    lines.push(r.reason);
    if (r.threshold_met.length) lines.push(`Met: ${r.threshold_met.join("; ")}`);
    if (r.threshold_not_met.length) lines.push(`Not met: ${r.threshold_not_met.join("; ")}`);
    if (r.needed_inputs.length) lines.push(`Needs: ${r.needed_inputs.join(", ")}`);
    lines.push("");
  }
  lines.push(`_${result.disclaimer}_`);
  return { content: [{ type: "text", text: lines.join("\n") }] };
});

// ─── Tool 9: pq_resolve_conflict_nodes ──────────────────────────────────────
server.registerTool("pq_resolve_conflict_nodes", {
  title: "Resolve Multi-State Conflicts with Node Evidence",
  description: `Node-aware companion to pq_resolve_conflict. Returns the same compliance-ceiling analysis enriched with statutory node evidence, requirement excerpts, and section citations from the loaded graph. Use when you need the 'why' behind a binding rule, not just the rule. Deterministic — no LLM.`,
  inputSchema: {
    statutes: z.array(z.string()).min(2).describe("Statutes to resolve across — e.g. [\"CCPA\", \"CPA\", \"MODPA\"]"),
    dimensions: z.array(z.string()).optional().describe("Compliance dimensions to check — omit for all 12"),
    evidence_limit_per_position: z.number().int().min(1).max(5).default(2).describe("Max node evidence items per dimension per statute (default 2)"),
  },
}, async ({ statutes, dimensions, evidence_limit_per_position }) => {
  const { ALL_DIMENSIONS } = await import("./conflict_resolver.js");
  type Dimension = import("./conflict_resolver.js").Dimension;
  const dims = (dimensions?.length ? dimensions : ALL_DIMENSIONS) as Dimension[];
  const result = resolveConflictWithNodes(index, statutes, dims, evidence_limit_per_position);
  const lines = [`# Conflict Resolution with Node Evidence`, `**Statutes**: ${statutes.join(", ")}`, ``];
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
  return { content: [{ type: "text", text: lines.join("\n") }] };
});

// ─── Tool 10: pq_draft_dpa_clause ───────────────────────────────────────────
server.registerTool("pq_draft_dpa_clause", {
  title: "Draft a DPA Clause from Statutory Requirements",
  description: `Generate first-draft DPA or contract clause language that satisfies specific statutory requirements. Inverse of pq_check_clause. Provide node IDs (from pq_search_requirements) and get a ready-to-edit clause with coverage summary and practitioner notes. Requires ANTHROPIC_API_KEY.`,
  inputSchema: {
    node_ids: z.array(z.string().min(3)).min(1).max(8).describe("Node IDs to draft for — use pq_search_requirements to find them"),
    role: z.enum(["controller", "processor", "both"]).default("processor").describe("Drafting perspective (default: processor obligations clause)"),
    style: z.enum(["brief", "standard", "detailed"]).default("standard").describe("Clause length/detail level"),
    context: z.string().max(500).optional().describe("Additional context from the attorney (party names, specific negotiation constraints, etc.)"),
  },
}, async ({ node_ids, role, style, context }) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { content: [{ type: "text", text: "pq_draft_dpa_clause requires ANTHROPIC_API_KEY." }] };
  }
  const nodes = node_ids.map((id) => index.byId.get(id)).filter(Boolean) as import("./types.js").StatuteNode[];
  const missing = node_ids.filter((id) => !index.byId.has(id));
  if (nodes.length === 0) {
    return { content: [{ type: "text", text: `No nodes found for IDs: ${node_ids.join(", ")}. Use pq_search_requirements to find valid node IDs.` }] };
  }
  const result = await draftDpaClause(nodes, role, style, context);
  const lines = [
    `# Drafted DPA Clause`,
    missing.length ? `**Missing nodes** (not found): ${missing.join(", ")}` : "",
    `**Nodes covered**: ${nodes.map((n) => n.id).join(", ")}`,
    ``,
    `## Clause`,
    `\`\`\``,
    result.clause_text,
    `\`\`\``,
    ``,
  ];
  if (result.coverage.length) {
    lines.push(`## Coverage`);
    for (const c of result.coverage) lines.push(`- \`${c.node_id}\`: ${c.requirement_summary} → _"${c.clause_sentence}"_`);
    lines.push("");
  }
  if (result.gaps.length) { lines.push(`## Gaps`); result.gaps.forEach((g) => lines.push(`- ${g}`)); lines.push(""); }
  if (result.notes.length) { lines.push(`## Practitioner Notes`); result.notes.forEach((n) => lines.push(`- ${n}`)); lines.push(""); }
  lines.push(`_Run pq_check_clause against the final edited text to verify coverage before execution._`);
  return { content: [{ type: "text", text: lines.join("\n") }] };
});

// ─── Tool 11: pq_route_dsar_workflow ────────────────────────────────────────
server.registerTool("pq_route_dsar_workflow", {
  title: "Convert a DSAR into an Operational Workflow",
  description: `Operational companion to pq_dsar_router. Given a received consumer rights request, generates a step-by-step checklist with deadline calculations, verification guidance, processor handoff steps, and escalation flags. Deterministic — no LLM.`,
  inputSchema: {
    consumer_state: z.string().min(2).max(2).describe("Consumer's state of residence (2-letter abbreviation)"),
    right_invoked: z.enum(["access","deletion","correction","portability","opt_out_sale","opt_out_targeted_advertising","opt_out_profiling","limit_sensitive_pi","appeal"]).describe("The right invoked"),
    controller_statutes: z.array(z.string()).optional().describe("Statutes the controller is subject to"),
    controller_status: z.enum(["controller","processor","dual","unknown"]).default("controller").describe("Whether you are acting as controller, processor, or both"),
    request_received_date: z.string().optional().describe("ISO date the request was received (YYYY-MM-DD) — enables deadline calculation"),
    residency_verified: z.boolean().optional().describe("Whether consumer residency in the stated state has been verified"),
    authorized_agent: z.boolean().optional().describe("Whether the request is submitted by an authorized agent"),
    sensitive_data_involved: z.boolean().optional().describe("Whether the request involves sensitive personal data"),
    specific_pieces_requested: z.boolean().optional().describe("Whether the consumer requested specific pieces of PI (triggers enhanced verification)"),
    deletion_scope: z.enum(["all","partial","unknown"]).optional().describe("Scope of deletion requested"),
  },
}, async (input) => {
  const result = buildDSARWorkflow(input as Parameters<typeof buildDSARWorkflow>[0]);
  const lines = [
    `# DSAR Workflow: ${result.right_label}`,
    `**State**: ${result.consumer_state} | **Statute**: ${result.statute ?? "None"} | **Must respond**: ${result.must_respond ? "Yes" : "No"}`,
    result.calculated_due_date ? `**Initial deadline**: ${result.calculated_due_date} (${result.initial_deadline_days} days)` : result.initial_deadline_days ? `**Initial deadline**: ${result.initial_deadline_days} calendar days from receipt` : "",
    result.calculated_max_date && result.max_deadline_days !== result.initial_deadline_days ? `**Max with extension**: ${result.calculated_max_date}` : "",
    result.appeal_right ? `**Appeal right**: Yes — ${result.appeal_deadline_days} days` : "**Appeal right**: No",
    ``,
  ];
  if (result.escalation_flags.length) {
    lines.push(`## ⚠️ Escalation Flags`);
    result.escalation_flags.forEach((f) => lines.push(`- ${f}`));
    lines.push("");
  }
  lines.push(`## Workflow Steps`);
  for (const step of result.steps) {
    lines.push(`### Step ${step.step}: ${step.action}`);
    if (step.deadline) lines.push(`**Deadline**: ${step.deadline}`);
    if (step.notes?.length) step.notes.forEach((n) => lines.push(`- ${n}`));
    lines.push("");
  }
  lines.push(`_${result.disclaimer}_`);
  return { content: [{ type: "text", text: lines.join("\n") }] };
});

// ─── Tool 12: pq_draft_notice_clause ────────────────────────────────────────
server.registerTool("pq_draft_notice_clause", {
  title: "Draft a Privacy Notice Clause",
  description: `Draft first-draft privacy notice language from processing facts. Supports notice_at_collection, privacy_notice, opt_out_disclosure, sensitive_data_notice, financial_incentive, and ai_training_disclosure. Deterministic — no LLM. Always review with qualified counsel before publication.`,
  inputSchema: {
    notice_type: z.enum(["notice_at_collection","privacy_notice","opt_out_disclosure","sensitive_data_notice","financial_incentive","ai_training_disclosure"]).describe("Type of notice to draft"),
    states: z.array(z.string()).describe("Applicable states — affects notice content and rights disclosures"),
    business_name: z.string().optional().describe("Business name for the notice"),
    data_categories: z.array(z.string()).optional().describe("Categories of PI collected"),
    purposes: z.array(z.string()).optional().describe("Processing purposes"),
    sale_or_sharing: z.boolean().optional().describe("Does business sell or share PI for targeted advertising?"),
    targeted_advertising: z.boolean().optional().describe("Does business use PI for targeted advertising?"),
    profiling_or_admt: z.boolean().optional().describe("Does business use profiling or automated decision-making?"),
    sensitive_data: z.boolean().optional().describe("Does business process sensitive PI?"),
    minors_data: z.boolean().optional().describe("Does business process data of known minors?"),
    uses_llm_training: z.boolean().optional().describe("Does business use PI to train AI/LLM systems?"),
    universal_opt_out: z.boolean().optional().describe("Does business recognize GPC/UOOM signals?"),
    contact_method: z.string().optional().describe("Consumer contact method (email, URL, toll-free number)"),
    style: z.enum(["plain","formal","layered"]).default("plain").describe("Notice style"),
  },
}, async (input) => {
  const result = draftNoticeClause(input as Parameters<typeof draftNoticeClause>[0]);
  const lines = [
    `# ${result.notice_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Draft`,
    result.missing_facts.length ? `**Missing facts** (add before publishing): ${result.missing_facts.join(", ")}` : "",
    ``,
    `## Draft Text`,
    `\`\`\``,
    result.clause_text,
    `\`\`\``,
    ``,
  ];
  if (result.drafting_notes.length) { lines.push(`## Drafting Notes`); result.drafting_notes.forEach((n) => lines.push(`- ${n}`)); lines.push(""); }
  if (result.supporting_nodes.length) lines.push(`**Supporting nodes**: ${result.supporting_nodes.map((n) => `\`${n}\``).join(", ")}`);
  lines.push(`_Run pq_audit_citations on the final text before publishing._`);
  return { content: [{ type: "text", text: lines.join("\n") }] };
});

// ─── Tool 13: pq_score_privacy_risk ─────────────────────────────────────────
server.registerTool("pq_score_privacy_risk", {
  title: "Score Privacy Exposure Risk",
  description: `Produce a deterministic privacy exposure triage score (0–100) with band (Minimal/Low/Moderate/High/Critical), component breakdown, regulator-interest notes, remediation priorities, and analogous enforcement precedents. Triage aid — not an enforcement prediction. Deterministic — no LLM.`,
  inputSchema: {
    states: z.array(z.string()).optional().describe("Applicable states"),
    industry: z.string().optional().describe("Industry/sector (used for enforcement context)"),
    sale_or_sharing: z.boolean().optional().describe("Business sells or shares PI"),
    targeted_advertising: z.boolean().optional().describe("Uses targeted advertising"),
    profiling_or_admt: z.boolean().optional().describe("Uses profiling or ADMT"),
    sensitive_data: z.boolean().optional().describe("Processes sensitive PI"),
    minors_data: z.boolean().optional().describe("Processes known minors' data"),
    health_data: z.boolean().optional().describe("Processes consumer health data"),
    biometric_data: z.boolean().optional().describe("Processes biometric data"),
    precise_geolocation: z.boolean().optional().describe("Processes precise geolocation data"),
    universal_opt_out_gap: z.boolean().optional().describe("GPC/UOOM signals not currently honored"),
    dsar_backlog: z.boolean().optional().describe("Outstanding or overdue consumer rights requests"),
    processor_contract_gap: z.boolean().optional().describe("Missing or deficient processor/service-provider contracts"),
    notice_gap: z.boolean().optional().describe("Notice at collection missing or deficient"),
    security_incident: z.boolean().optional().describe("Active or recent security incident/breach"),
    repeat_issue: z.boolean().optional().describe("Known or repeat compliance issue"),
    remediation_started: z.boolean().optional().describe("Active remediation underway — credit applied"),
    top_precedents: z.number().int().min(1).max(5).default(3).describe("Number of analogous enforcement actions to return"),
  },
}, async (input) => {
  const result = scorePrivacyExposure(input);
  const lines = [
    `# Privacy Exposure Score`,
    `**Score**: ${result.score}/100 — **${result.band}**`,
    ``,
    `## Score Breakdown`,
  ];
  for (const c of result.components) {
    lines.push(`- **${c.label}**: ${c.points}/${c.max} — ${c.note}`);
  }
  lines.push("");
  if (result.regulator_interest_notes.length) {
    lines.push(`## Regulator Interest`);
    result.regulator_interest_notes.forEach((n) => lines.push(`- ${n}`));
    lines.push("");
  }
  if (result.remediation_priorities.length) {
    lines.push(`## Remediation Priorities`);
    result.remediation_priorities.forEach((p) => lines.push(p));
    lines.push("");
  }
  if (result.analogous_precedents.length) {
    lines.push(`## Analogous Enforcement Precedents`);
    for (const p of result.analogous_precedents) {
      lines.push(`### ${p.case_name} (${p.year}) — ${p.monetary_amount_usd ? `$${p.monetary_amount_usd.toLocaleString()}` : "Injunctive"}`);
      lines.push(p.factual_pattern);
      lines.push("");
    }
  }
  lines.push(`_${result.disclaimer}_`);
  return { content: [{ type: "text", text: lines.join("\n") }] };
});

// ─── Tool 14: pq_audit_citations ────────────────────────────────────────────
server.registerTool("pq_audit_citations", {
  title: "Audit Privacy-Law Text for Citation Discipline",
  description: `Flag citation discipline issues in privacy-law work product: uncited legal claims, unresolved placeholders, suspicious section numbers, standalone CPRA references, and unresolvable PrivacyQuant node IDs. Conservative — flags possible issues without making legal judgments. Deterministic — no LLM.`,
  inputSchema: {
    text: z.string().min(50).max(50000).describe("The privacy-law work product text to audit"),
    strict: z.boolean().default(false).describe("Strict mode: uncited legal claims become errors (not warnings)"),
    include_passed_claims: z.boolean().default(false).describe("Include sentences that passed citation check in output"),
  },
}, async ({ text, strict, include_passed_claims }) => {
  const result = auditCitations(text, index, strict, include_passed_claims);
  const lines = [
    `# Citation Audit`,
    `**Summary**: ${result.summary}`,
    result.error_count > 0 ? `**Errors**: ${result.error_count}` : "",
    result.warning_count > 0 ? `**Warnings**: ${result.warning_count}` : "",
    result.info_count > 0 ? `**Info**: ${result.info_count}` : "",
    ``,
  ];
  if (result.flags.length) {
    lines.push(`## Flags`);
    for (const f of result.flags) {
      const icon = f.severity === "error" ? "🔴" : f.severity === "warning" ? "⚠️" : "ℹ️";
      lines.push(`${icon} **${f.type}**: ${f.message}`);
      lines.push(`  _Excerpt_: "${f.excerpt}"`);
      if (f.suggestion) lines.push(`  _Suggestion_: ${f.suggestion}`);
      lines.push("");
    }
  }
  lines.push(`_${result.disclaimer}_`);
  return { content: [{ type: "text", text: lines.join("\n") }] };
});

// ─── Tool 15: pq_watch_legislation ──────────────────────────────────────────
server.registerTool("pq_watch_legislation", {
  title: "Watch for Active Privacy Legislation",
  description: `Search the Open States / Plural Policy API for active privacy bills in PrivacyQuant-covered states. Returns legislative leads that may require statutory node updates. Requires OPENSTATES_API_KEY or PLURAL_API_KEY environment variable. Live API — results change over time.`,
  inputSchema: {
    states: z.array(z.string().min(2).max(2)).optional().describe("States to search — omit for all 20 covered states"),
    keywords: z.array(z.string()).optional().describe("Search keywords — defaults to [\"consumer privacy\", \"personal data\", \"personal information\", \"data protection\"]"),
    updated_since: z.string().optional().describe("ISO date — only return bills updated since this date (YYYY-MM-DD)"),
    per_state_limit: z.number().int().min(1).max(20).default(5).describe("Max bills to return per state (default 5)"),
  },
}, async ({ states, keywords, updated_since, per_state_limit }) => {
  const result = await watchLegislation(
    states ?? [],
    keywords ?? [],
    updated_since,
    per_state_limit
  );
  const lines = [
    `# Legislative Watch`,
    `**States searched**: ${result.states_searched.join(", ")}`,
    `**Keywords**: ${result.keywords_used.join(", ")}`,
    `**Status**: ${result.api_status}${result.error_message ? ` — ${result.error_message}` : ""}`,
    `**Bills found**: ${result.total_bills_found}`,
    ``,
  ];
  if (result.api_status === "no_key") {
    lines.push(result.error_message ?? "API key required.");
  } else {
    for (const [state, leads] of Object.entries(result.results_by_state)) {
      lines.push(`## ${state}`);
      for (const lead of leads) {
        lines.push(`### ${lead.identifier}: ${lead.title}`);
        lines.push(`**Latest action**: ${lead.latest_action} (${lead.latest_action_date})`);
        lines.push(`**Status**: ${lead.status}`);
        if (lead.sources.length) lines.push(`**Source**: ${lead.sources[0].url}`);
        lines.push(`**Open States**: ${lead.openstates_url}`);
        lines.push(`_${lead.verify_marker}_`);
        lines.push("");
      }
    }
    if (result.total_bills_found === 0) lines.push("No active bills found matching the search criteria.");
    lines.push(`## Review Workflow`);
    result.review_workflow.forEach((s) => lines.push(s));
    lines.push("");
  }
  lines.push(`_${result.disclaimer}_`);
  return { content: [{ type: "text", text: lines.join("\n") }] };
});

// ─── Tool 16: pq_draft_dpa_clause_deterministic ──────────────────────────────
registerDraftDpaClauseTool(server, index);

// ─── Start ─────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("PrivacyQuant MCP server running on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
