import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadIndex } from "./loader.js";
import { searchNodes } from "./search.js";
import { resolveConflict, ALL_DIMENSIONS } from "./conflict_resolver.js";
import type { Dimension } from "./conflict_resolver.js";
import { evaluateClause } from "./clause_evaluator.js";
import type { StatuteNode, StatuteIndex } from "./types.js";

// ─── Load the knowledge graph once at startup ──────────────────────────────
let index: StatuteIndex;
try {
  index = loadIndex();
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

Args:
  - query (string): Freetext query or pasted contract clause text. Examples:
      "right to deletion"
      "do not sell or share my personal information"
      "sensitive data consent"
      "universal opt-out GPC"
      "CCPA deletion right"
  - statute (string, optional): Filter to a specific statute, e.g. "CCPA", "MODPA", "VCDPA"
  - requirement_type (string, optional): Filter by type — "hard", "threshold", or "soft"
  - limit (number, optional): Max results to return (default 5, max 20)

Returns ranked results with matched signals and full node details.
If no results found, try broader terms or use pq_list_statutes to browse by statute.`,
    inputSchema: {
      query: z.string()
        .min(2)
        .max(2000)
        .describe("Freetext query or contract clause text to match against"),
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
  async ({ query, statute, requirement_type, limit }) => {
    const results = searchNodes(index, {
      query,
      statute,
      requirement_type,
      limit,
    });

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: [
              `No nodes matched "${query}"${statute ? ` in ${statute}` : ""}.`,
              ``,
              `Suggestions:`,
              `- Try broader terms (e.g. "deletion" instead of "right to erasure")`,
              `- Remove the statute filter to search across all statutes`,
              `- Use pq_list_statutes to see what statutes and nodes are available`,
            ].join("\n"),
          },
        ],
      };
    }

    const lines: string[] = [
      `Found ${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`,
      ``,
    ];

    results.forEach((r, i) => {
      lines.push(`## ${i + 1}. ${r.node.title} (${r.node.statute})`);
      lines.push(`**ID**: ${r.node.id} | **Score**: ${r.score} | **Type**: ${r.node.requirement_type}`);
      if (r.matched_signals.length > 0) {
        lines.push(`**Matched signals**: ${r.matched_signals.join(", ")}`);
      }
      lines.push(`**Section**: ${r.node.section}`);
      lines.push(`**Trigger**: ${r.node.trigger}`);
      lines.push(``);
      // Truncate requirement for search results — full text via pq_fetch_requirement
      const req = r.node.requirement.trim();
      lines.push(req.length > 400 ? req.slice(0, 400) + "…" : req);
      lines.push(``);
      lines.push(`---`);
      lines.push(``);
    });

    lines.push(
      `Use pq_fetch_requirement with a node ID for the full text, exceptions, and cross-references.`
    );

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
