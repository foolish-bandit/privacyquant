/**
 * legislation_watcher.ts
 *
 * Queries the Open States / Plural Policy API v3 for active privacy bills
 * in PrivacyQuant-covered states. Helps surface statutory changes that may
 * require node updates.
 *
 * Live API tool — requires OPENSTATES_API_KEY or PLURAL_API_KEY env var.
 * openWorldHint: true — results are live and may change.
 */

const OPENSTATES_API = "https://v3.openstates.org";

// PrivacyQuant-covered states with jurisdiction IDs
const COVERED_JURISDICTIONS: Record<string, string> = {
  CA: "ocd-jurisdiction/country:us/state:ca/government",
  VA: "ocd-jurisdiction/country:us/state:va/government",
  CO: "ocd-jurisdiction/country:us/state:co/government",
  CT: "ocd-jurisdiction/country:us/state:ct/government",
  UT: "ocd-jurisdiction/country:us/state:ut/government",
  TX: "ocd-jurisdiction/country:us/state:tx/government",
  OR: "ocd-jurisdiction/country:us/state:or/government",
  MT: "ocd-jurisdiction/country:us/state:mt/government",
  IA: "ocd-jurisdiction/country:us/state:ia/government",
  MD: "ocd-jurisdiction/country:us/state:md/government",
  NJ: "ocd-jurisdiction/country:us/state:nj/government",
  NH: "ocd-jurisdiction/country:us/state:nh/government",
  DE: "ocd-jurisdiction/country:us/state:de/government",
  MN: "ocd-jurisdiction/country:us/state:mn/government",
  KY: "ocd-jurisdiction/country:us/state:ky/government",
  IN: "ocd-jurisdiction/country:us/state:in/government",
  TN: "ocd-jurisdiction/country:us/state:tn/government",
  NE: "ocd-jurisdiction/country:us/state:ne/government",
  RI: "ocd-jurisdiction/country:us/state:ri/government",
  FL: "ocd-jurisdiction/country:us/state:fl/government",
};

export interface LegislativeLead {
  state: string;
  bill_id: string;
  identifier: string;
  title: string;
  status: string;
  latest_action: string;
  latest_action_date: string;
  subjects: string[];
  sources: Array<{ url: string }>;
  openstates_url: string;
  verify_marker: string;
}

export interface LegislationWatchResult {
  states_searched: string[];
  keywords_used: string[];
  results_by_state: Record<string, LegislativeLead[]>;
  total_bills_found: number;
  api_status: "ok" | "partial" | "error" | "no_key";
  error_message?: string;
  review_workflow: string[];
  disclaimer: string;
}

function getApiKey(): string | null {
  return process.env.OPENSTATES_API_KEY ?? process.env.PLURAL_API_KEY ?? null;
}

async function searchBillsForState(
  state: string,
  keywords: string[],
  updatedSince: string | undefined,
  limit: number,
  apiKey: string
): Promise<LegislativeLead[]> {
  const query = keywords.join(" OR ");
  const params = new URLSearchParams({
    jurisdiction: COVERED_JURISDICTIONS[state] ?? state.toLowerCase(),
    q: query,
    per_page: String(Math.min(limit, 20)),
    sort: "updated_desc",
  });

  if (updatedSince) {
    params.set("updated_since", updatedSince);
  }

  const url = `${OPENSTATES_API}/bills?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "X-API-KEY": apiKey,
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`OpenStates API error for ${state}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as {
    results: Array<{
      id: string;
      identifier: string;
      title: string;
      statusText?: string;
      latest_action?: { description: string; date: string };
      subject?: string[];
      sources?: Array<{ url: string }>;
    }>;
  };

  return (data.results ?? []).map((bill) => ({
    state,
    bill_id: bill.id,
    identifier: bill.identifier,
    title: bill.title,
    status: bill.statusText ?? "Unknown",
    latest_action: bill.latest_action?.description ?? "Unknown",
    latest_action_date: bill.latest_action?.date ?? "",
    subjects: bill.subject ?? [],
    sources: bill.sources ?? [],
    openstates_url: `https://openstates.org/bills/${bill.id}/`,
    verify_marker:
      `[verify] Review ${bill.identifier} (${state}) against PrivacyQuant nodes — ` +
      `may require node update if enacted.`,
  }));
}

export async function watchLegislation(
  states: string[],
  keywords: string[],
  updatedSince?: string,
  perStateLimit = 5
): Promise<LegislationWatchResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      states_searched: states,
      keywords_used: keywords,
      results_by_state: {},
      total_bills_found: 0,
      api_status: "no_key",
      error_message:
        "OPENSTATES_API_KEY or PLURAL_API_KEY not set. " +
        "Get a free key at https://open.pluralpolicy.com and set the environment variable.",
      review_workflow: [],
      disclaimer:
        "Set OPENSTATES_API_KEY to enable live legislative monitoring.",
    };
  }

  const targetStates =
    states.length > 0
      ? states.map((s) => s.toUpperCase()).filter((s) => COVERED_JURISDICTIONS[s])
      : Object.keys(COVERED_JURISDICTIONS);

  const defaultKeywords =
    keywords.length > 0
      ? keywords
      : ["consumer privacy", "personal data", "personal information", "data protection"];

  const resultsByState: Record<string, LegislativeLead[]> = {};
  const errors: string[] = [];

  for (const state of targetStates) {
    try {
      const leads = await searchBillsForState(
        state,
        defaultKeywords,
        updatedSince,
        perStateLimit,
        apiKey
      );
      if (leads.length > 0) resultsByState[state] = leads;
    } catch (err) {
      errors.push(`${state}: ${err}`);
    }
    // Brief pause to respect rate limits
    await new Promise((r) => setTimeout(r, 100));
  }

  const total = Object.values(resultsByState).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  const reviewWorkflow = [
    "1. Review each flagged bill against the relevant PrivacyQuant statute nodes.",
    "2. If the bill would amend an existing right, deadline, or threshold: note the node ID that needs updating.",
    "3. Open a pull request with the updated YAML node, citing the bill number and effective date.",
    "4. After the PR merges, re-run pq_search_requirements to confirm the updated node is indexed.",
    "5. Notify LegalQuants community via Substack if the change affects multi-state conflict resolution.",
  ];

  return {
    states_searched: targetStates,
    keywords_used: defaultKeywords,
    results_by_state: resultsByState,
    total_bills_found: total,
    api_status: errors.length === 0 ? "ok" : total > 0 ? "partial" : "error",
    error_message: errors.length > 0 ? errors.join("; ") : undefined,
    review_workflow: reviewWorkflow,
    disclaimer:
      "Legislative leads are for review only. Bills may not become law, and effective dates " +
      "may change. Verify against official state legislature sources before updating nodes. " +
      "This tool does not automatically update PrivacyQuant YAML nodes.",
  };
}

export function formatResult(result: LegislationWatchResult): string {
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
  return lines.join("\n");
}
