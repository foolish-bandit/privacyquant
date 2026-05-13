import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadIndex } from "./loader.js";
import { searchNodes } from "./search.js";
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
