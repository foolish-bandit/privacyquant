import { z } from "zod";

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
};

type ToolServer = {
  registerTool: (
    name: string,
    config: Record<string, unknown>,
    handler: (args: WatchLegislationArgs) => Promise<ToolResult>
  ) => unknown;
};

type WatchLegislationArgs = {
  states?: string[];
  keywords?: string[];
  updated_since?: string;
  action_since?: string;
  per_state_limit?: number;
  include_verify_markers?: boolean;
};

type OpenStatesBill = {
  id?: string;
  identifier?: string;
  title?: string;
  jurisdiction?: { name?: string; id?: string } | string;
  session?: string;
  classification?: string[] | string;
  latest_action_date?: string;
  latest_action_description?: string;
  updated_at?: string;
  openstates_url?: string;
  sources?: Array<{ url?: string; note?: string }>;
  abstracts?: Array<{ abstract?: string; note?: string }>;
  from_organization?: { name?: string };
};

type OpenStatesResponse = {
  results?: OpenStatesBill[];
};

type BillHit = {
  key: string;
  state: string;
  keyword: string;
  id: string;
  identifier: string;
  title: string;
  jurisdiction: string;
  session: string;
  latestActionDate: string;
  latestAction: string;
  updatedAt: string;
  url: string;
  sourceUrl: string;
};

const API_BASE = "https://v3.openstates.org";

const COVERED_STATES: Record<string, string> = {
  CA: "California",
  VA: "Virginia",
  CO: "Colorado",
  CT: "Connecticut",
  UT: "Utah",
  TX: "Texas",
  OR: "Oregon",
  MT: "Montana",
  IA: "Iowa",
  IN: "Indiana",
  TN: "Tennessee",
  DE: "Delaware",
  NJ: "New Jersey",
  NH: "New Hampshire",
  NE: "Nebraska",
  KY: "Kentucky",
  MD: "Maryland",
  MN: "Minnesota",
  RI: "Rhode Island",
  FL: "Florida",
};

const DEFAULT_KEYWORDS = [
  "consumer privacy",
  "personal data",
  "sensitive data",
  "targeted advertising",
];

function apiKey(): string | undefined {
  return process.env.OPENSTATES_API_KEY ?? process.env.PLURAL_API_KEY;
}

function normalizeState(value: string): string | null {
  const upper = value.trim().toUpperCase();
  if (COVERED_STATES[upper]) return upper;

  const entry = Object.entries(COVERED_STATES).find(([, name]) =>
    name.toLowerCase() === value.trim().toLowerCase()
  );
  return entry?.[0] ?? null;
}

function defaultUpdatedSince(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 90);
  return date.toISOString().slice(0, 10);
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function jurisdictionName(value: OpenStatesBill["jurisdiction"]): string {
  if (typeof value === "string") return value;
  return value?.name ?? value?.id ?? "Unknown jurisdiction";
}

function billUrl(bill: OpenStatesBill): string {
  if (bill.openstates_url) return bill.openstates_url;
  if (bill.sources?.[0]?.url) return bill.sources[0].url;
  if (bill.id) return `https://openstates.org/bills/${encodeURIComponent(bill.id)}/`;
  return "";
}

function billSourceUrl(bill: OpenStatesBill): string {
  return bill.sources?.find((source) => Boolean(source.url))?.url ?? bill.openstates_url ?? "";
}

function keyForBill(bill: OpenStatesBill): string {
  return bill.id ?? `${jurisdictionName(bill.jurisdiction)}:${bill.session ?? ""}:${bill.identifier ?? bill.title ?? ""}`;
}

async function searchBills(params: {
  state: string;
  keyword: string;
  updatedSince: string;
  actionSince?: string;
  perPage: number;
  key: string;
}): Promise<BillHit[]> {
  const url = new URL("/bills", API_BASE);
  url.searchParams.set("jurisdiction", COVERED_STATES[params.state]);
  url.searchParams.set("q", params.keyword);
  url.searchParams.set("updated_since", params.updatedSince);
  url.searchParams.set("sort", "updated_desc");
  url.searchParams.set("page", "1");
  url.searchParams.set("per_page", String(params.perPage));
  if (params.actionSince) url.searchParams.set("action_since", params.actionSince);

  const response = await fetch(url, {
    headers: {
      "X-API-KEY": params.key,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Open States API error ${response.status} for ${params.state} / ${params.keyword}`);
  }

  const data = (await response.json()) as OpenStatesResponse;
  return (data.results ?? []).map((bill) => ({
    key: keyForBill(bill),
    state: params.state,
    keyword: params.keyword,
    id: safeString(bill.id),
    identifier: safeString(bill.identifier),
    title: safeString(bill.title) || "Untitled bill",
    jurisdiction: jurisdictionName(bill.jurisdiction),
    session: safeString(bill.session),
    latestActionDate: safeString(bill.latest_action_date),
    latestAction: safeString(bill.latest_action_description),
    updatedAt: safeString(bill.updated_at),
    url: billUrl(bill),
    sourceUrl: billSourceUrl(bill),
  }));
}

function renderResults(args: WatchLegislationArgs, hits: BillHit[], states: string[], keywords: string[]): string {
  const includeVerify = args.include_verify_markers ?? true;
  const lines: string[] = [
    "# Privacy Legislation Watch",
    "",
    `**States searched**: ${states.join(", ")}`,
    `**Keywords searched**: ${keywords.join(", ")}`,
    `**Updated since**: ${args.updated_since ?? defaultUpdatedSince()}`,
  ];

  if (args.action_since) lines.push(`**Action since**: ${args.action_since}`);

  lines.push("", `**Bills found**: ${hits.length}`, "");

  if (hits.length === 0) {
    lines.push(
      "No matching bills were returned by Open States for the selected states, keywords, and date filters.",
      "",
      "Try broader keywords such as `privacy`, `personal information`, `data broker`, `biometric`, or `artificial intelligence`."
    );
    return lines.join("\n");
  }

  const grouped = new Map<string, BillHit[]>();
  for (const hit of hits) {
    if (!grouped.has(hit.state)) grouped.set(hit.state, []);
    grouped.get(hit.state)!.push(hit);
  }

  for (const [state, stateHits] of grouped) {
    lines.push(`## ${state} — ${COVERED_STATES[state]}`);
    lines.push("");

    for (const hit of stateHits) {
      const marker = includeVerify ? "[verify] " : "";
      lines.push(`### ${marker}${hit.identifier || hit.id || "Bill"}: ${hit.title}`);
      lines.push(`- **Keyword match**: ${hit.keyword}`);
      if (hit.session) lines.push(`- **Session**: ${hit.session}`);
      if (hit.latestActionDate || hit.latestAction) {
        lines.push(`- **Latest action**: ${[hit.latestActionDate, hit.latestAction].filter(Boolean).join(" — ")}`);
      }
      if (hit.updatedAt) lines.push(`- **Updated**: ${hit.updatedAt}`);
      if (hit.url) lines.push(`- **Open States**: ${hit.url}`);
      if (hit.sourceUrl && hit.sourceUrl !== hit.url) lines.push(`- **Source**: ${hit.sourceUrl}`);
      lines.push("");
    }
  }

  lines.push(
    "## Review workflow",
    "- Treat every result as a legislative lead, not a finished PrivacyQuant node update.",
    "- Follow the bill link, inspect current text and action history, then mark affected YAML nodes with updated effective dates or `amended_by` references as appropriate.",
    "- Prioritize bills that amend definitions, consumer rights, controller/processor duties, sensitive data rules, cure periods, enforcement authority, or effective dates."
  );

  return lines.join("\n");
}

export function registerWatchLegislationTool(server: ToolServer): void {
  server.registerTool(
    "pq_watch_legislation",
    {
      title: "Watch Privacy Legislation",
      description: `Search Open States API v3 for recent privacy-related bills in states covered by PrivacyQuant.

Use this to find bills that may amend or invalidate existing statutory nodes. The tool
queries Open States live, so OPENSTATES_API_KEY or PLURAL_API_KEY must be set in the MCP
server environment. Results are returned as [verify] leads for human review, not automatic
node updates.`,
      inputSchema: {
        states: z.array(z.string().min(2)).max(20).optional().describe("State abbreviations or names. Defaults to all PrivacyQuant covered states."),
        keywords: z.array(z.string().min(2)).max(8).optional().describe("Search keywords. Defaults to core privacy terms."),
        updated_since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("YYYY-MM-DD filter for bills updated since this date. Defaults to 90 days ago."),
        action_since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("YYYY-MM-DD filter for bills with action since this date."),
        per_state_limit: z.number().int().min(1).max(20).default(5).describe("Maximum deduplicated bills to return per state."),
        include_verify_markers: z.boolean().default(true).describe("Prefix results with [verify] to emphasize human review."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) => {
      const key = apiKey();
      if (!key) {
        return {
          content: [{
            type: "text",
            text: "pq_watch_legislation requires OPENSTATES_API_KEY or PLURAL_API_KEY in the MCP server environment. Create an Open States API key, set it, and restart the server.",
          }],
        };
      }

      const requestedStates = args.states?.length ? args.states : Object.keys(COVERED_STATES);
      const states = requestedStates.map(normalizeState).filter((state): state is string => Boolean(state));
      const invalidStates = requestedStates.filter((state) => !normalizeState(state));

      if (states.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No supported states were provided. Covered states: ${Object.keys(COVERED_STATES).join(", ")}`,
          }],
        };
      }

      const keywords = args.keywords?.length ? args.keywords : DEFAULT_KEYWORDS;
      const updatedSince = args.updated_since ?? defaultUpdatedSince();
      const perStateLimit = args.per_state_limit ?? 5;
      const maxQueries = 60;
      const queryPairs = states.flatMap((state) => keywords.map((keyword) => ({ state, keyword }))).slice(0, maxQueries);

      const byKey = new Map<string, BillHit>();
      const errors: string[] = [];

      for (const pair of queryPairs) {
        try {
          const hits = await searchBills({
            state: pair.state,
            keyword: pair.keyword,
            updatedSince,
            actionSince: args.action_since,
            perPage: perStateLimit,
            key,
          });
          for (const hit of hits) {
            if (!byKey.has(hit.key)) byKey.set(hit.key, hit);
          }
        } catch (err) {
          errors.push(String(err));
        }
      }

      const limitedByState = new Map<string, BillHit[]>();
      for (const hit of byKey.values()) {
        if (!limitedByState.has(hit.state)) limitedByState.set(hit.state, []);
        const bucket = limitedByState.get(hit.state)!;
        if (bucket.length < perStateLimit) bucket.push(hit);
      }

      const hits = [...limitedByState.values()].flat();
      let output = renderResults(args, hits, states, keywords);

      if (invalidStates.length > 0) {
        output += `\n\n## Ignored unsupported states\n${invalidStates.map((state) => `- ${state}`).join("\n")}`;
      }

      if (queryPairs.length === maxQueries && states.length * keywords.length > maxQueries) {
        output += `\n\n## Query cap\nOnly the first ${maxQueries} state/keyword combinations were queried. Narrow states or keywords for a complete scan.`;
      }

      if (errors.length > 0) {
        output += `\n\n## API warnings\n${errors.slice(0, 5).map((error) => `- ${error}`).join("\n")}`;
      }

      return { content: [{ type: "text", text: output }] };
    }
  );
}
