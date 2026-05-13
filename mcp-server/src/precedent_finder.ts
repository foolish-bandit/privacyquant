import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

type ToolResult = { content: Array<{ type: "text"; text: string }> };

type ToolServer = {
  registerTool: (
    name: string,
    config: Record<string, unknown>,
    handler: (args: FindPrecedentArgs) => Promise<ToolResult>
  ) => unknown;
};

type FindPrecedentArgs = {
  query?: string;
  tags?: string[];
  statutes?: string[];
  states?: string[];
  industry?: string;
  min_year?: number;
  top?: number;
  include_operational_lessons?: boolean;
};

type EnforcementAction = {
  id: string;
  case_name?: string;
  full_caption?: string;
  year?: number;
  regulator?: string[];
  respondent?: string;
  respondent_industry?: string;
  statutes?: string[];
  statute_sections?: string[];
  violation_theories?: string[];
  factual_pattern?: string;
  monetary_amount_usd?: number | null;
  remediation_imposed?: string[];
  citation?: string;
  url?: string;
  operational_lessons?: string[];
};

type EnforcementCorpus = {
  _meta?: Record<string, unknown>;
  actions?: EnforcementAction[];
};

type ScoreBreakdown = {
  tag_overlap: number;
  query_match: number;
  statute_match: number;
  state_match: number;
  industry_match: number;
  recency: number;
  severity: number;
};

type ScoredAction = {
  action: EnforcementAction;
  score: number;
  breakdown: ScoreBreakdown;
  matched_tags: string[];
  matched_terms: string[];
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORPUS_PATH = path.resolve(__dirname, "../../references/enforcement_actions.json");

let cachedCorpus: EnforcementCorpus | null = null;

function loadCorpus(): EnforcementCorpus {
  if (cachedCorpus) return cachedCorpus;
  const raw = fs.readFileSync(CORPUS_PATH, "utf8");
  cachedCorpus = JSON.parse(raw) as EnforcementCorpus;
  return cachedCorpus;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function terms(value?: string): string[] {
  if (!value) return [];
  return normalize(value).split(/\s+/).filter((term) => term.length >= 3);
}

function actionText(action: EnforcementAction): string {
  return normalize([
    action.id,
    action.case_name,
    action.full_caption,
    action.respondent,
    action.respondent_industry,
    action.statutes?.join(" "),
    action.statute_sections?.join(" "),
    action.violation_theories?.join(" "),
    action.factual_pattern,
    action.remediation_imposed?.join(" "),
    action.operational_lessons?.join(" "),
  ].filter(Boolean).join(" "));
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function scoreTags(action: EnforcementAction, tags: string[]): { score: number; matched: string[] } {
  if (!tags.length) return { score: 0, matched: [] };
  const actionTags = new Set((action.violation_theories ?? []).map(normalize));
  const requested = tags.map(normalize);
  const matched = requested.filter((tag) => actionTags.has(tag));
  return { score: matched.length * 20, matched };
}

function scoreQuery(action: EnforcementAction, query?: string): { score: number; matched: string[] } {
  const queryTerms = unique(terms(query));
  if (!queryTerms.length) return { score: 0, matched: [] };
  const text = actionText(action);
  const matched = queryTerms.filter((term) => text.includes(term));
  const phraseBonus = query && text.includes(normalize(query)) ? 10 : 0;
  return { score: Math.min(35, matched.length * 4 + phraseBonus), matched };
}

function scoreListMatch(actionValues: string[] | undefined, requested: string[] | undefined, points: number): number {
  if (!requested?.length || !actionValues?.length) return 0;
  const text = normalize(actionValues.join(" "));
  return requested.some((value) => text.includes(normalize(value))) ? points : 0;
}

function scoreState(action: EnforcementAction, states?: string[]): number {
  if (!states?.length) return 0;
  const text = actionText(action);
  return states.some((state) => text.includes(normalize(state))) ? 10 : 0;
}

function scoreIndustry(action: EnforcementAction, industry?: string): number {
  if (!industry) return 0;
  const industryTerms = terms(industry);
  const text = normalize(action.respondent_industry ?? "");
  if (!text) return 0;
  const matches = industryTerms.filter((term) => text.includes(term)).length;
  return Math.min(15, matches * 5);
}

function scoreRecency(year?: number): number {
  if (!year) return 0;
  const currentYear = new Date().getUTCFullYear();
  const age = Math.max(0, currentYear - year);
  if (age <= 1) return 12;
  if (age <= 3) return 8;
  if (age <= 5) return 4;
  return 0;
}

function scoreSeverity(amount?: number | null): number {
  if (!amount) return 0;
  if (amount >= 100_000_000) return 12;
  if (amount >= 10_000_000) return 9;
  if (amount >= 1_000_000) return 6;
  if (amount >= 100_000) return 3;
  return 1;
}

function scoreAction(action: EnforcementAction, args: FindPrecedentArgs): ScoredAction | null {
  if (args.min_year !== undefined && (action.year ?? 0) < args.min_year) return null;

  const tagScore = scoreTags(action, args.tags ?? []);
  const queryScore = scoreQuery(action, args.query);
  const breakdown: ScoreBreakdown = {
    tag_overlap: tagScore.score,
    query_match: queryScore.score,
    statute_match: scoreListMatch(action.statutes, args.statutes, 15),
    state_match: scoreState(action, args.states),
    industry_match: scoreIndustry(action, args.industry),
    recency: scoreRecency(action.year),
    severity: scoreSeverity(action.monetary_amount_usd),
  };
  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  const hasFilters = Boolean(args.query || args.tags?.length || args.statutes?.length || args.states?.length || args.industry);
  if (hasFilters && score === 0) return null;

  return {
    action,
    score,
    breakdown,
    matched_tags: tagScore.matched,
    matched_terms: queryScore.matched,
  };
}

function renderResult(args: FindPrecedentArgs, scored: ScoredAction[]): string {
  const lines: string[] = [
    "# PrivacyQuant Precedent Finder",
    "",
    `**Results returned**: ${scored.length}`,
  ];

  if (args.query) lines.push(`**Query**: ${args.query}`);
  if (args.tags?.length) lines.push(`**Tags**: ${args.tags.join(", ")}`);
  if (args.statutes?.length) lines.push(`**Statutes**: ${args.statutes.join(", ")}`);
  if (args.states?.length) lines.push(`**States**: ${args.states.join(", ")}`);
  if (args.industry) lines.push(`**Industry**: ${args.industry}`);
  lines.push("");

  if (!scored.length) {
    lines.push("No matching enforcement actions found. Try broader violation tags, statute names, or factual keywords.");
    return lines.join("\n");
  }

  for (const item of scored) {
    const a = item.action;
    lines.push(`## ${a.case_name ?? a.id}`);
    lines.push(`- **Score**: ${item.score}`);
    lines.push(`- **ID**: \`${a.id}\``);
    if (a.full_caption) lines.push(`- **Caption**: ${a.full_caption}`);
    if (a.year) lines.push(`- **Year**: ${a.year}`);
    if (a.regulator?.length) lines.push(`- **Regulator**: ${a.regulator.join("; ")}`);
    if (a.respondent) lines.push(`- **Respondent**: ${a.respondent}`);
    if (a.respondent_industry) lines.push(`- **Industry**: ${a.respondent_industry}`);
    if (a.statutes?.length) lines.push(`- **Statutes**: ${a.statutes.join("; ")}`);
    if (a.violation_theories?.length) lines.push(`- **Violation theories**: ${a.violation_theories.join(", ")}`);
    if (item.matched_tags.length) lines.push(`- **Matched tags**: ${item.matched_tags.join(", ")}`);
    if (item.matched_terms.length) lines.push(`- **Matched query terms**: ${item.matched_terms.join(", ")}`);
    if (a.factual_pattern) lines.push(`- **Factual pattern**: ${a.factual_pattern}`);
    if (a.monetary_amount_usd !== undefined && a.monetary_amount_usd !== null) {
      lines.push(`- **Headline amount**: $${a.monetary_amount_usd.toLocaleString()}`);
    }
    if (a.remediation_imposed?.length) lines.push(`- **Remediation**: ${a.remediation_imposed.join("; ")}`);
    if (args.include_operational_lessons !== false && a.operational_lessons?.length) {
      lines.push(`- **Operational lessons**: ${a.operational_lessons.join("; ")}`);
    }
    if (a.citation) lines.push(`- **Citation**: ${a.citation}`);
    if (a.url) lines.push(`- **URL**: ${a.url}`);
    lines.push(`- **Score breakdown**: ${Object.entries(item.breakdown).map(([key, value]) => `${key}=${value}`).join(", ")}`);
    lines.push(`- **Verification**: [verify] Confirm current source documents and, where court records are relevant, use CourtListener MCP alongside PrivacyQuant.`);
    lines.push("");
  }

  lines.push(
    "## Notes",
    "- These are analogy matches from a curated enforcement corpus, not binding precedent rankings.",
    "- Settlement allegations are not adjudicated facts unless the source says otherwise.",
    "- Always verify source documents before citing in legal work product."
  );

  return lines.join("\n");
}

export function findPrecedents(args: FindPrecedentArgs): ScoredAction[] {
  const corpus = loadCorpus();
  const actions = corpus.actions ?? [];
  const top = Math.min(Math.max(args.top ?? 5, 1), 20);
  return actions
    .map((action) => scoreAction(action, args))
    .filter((item): item is ScoredAction => Boolean(item))
    .sort((a, b) => b.score - a.score || (b.action.year ?? 0) - (a.action.year ?? 0))
    .slice(0, top);
}

export function registerFindPrecedentTool(server: ToolServer): void {
  server.registerTool(
    "pq_find_precedent",
    {
      title: "Find Privacy Enforcement Precedent",
      description: `Find analogous privacy enforcement actions from PrivacyQuant's curated enforcement corpus.

Use this after identifying a statutory gap, clause issue, or risk pattern. The matcher is deterministic:
it scores tag overlap, factual query terms, statute/state/industry proximity, recency, and headline severity.
Results are [verify] leads, not legal conclusions.`,
      inputSchema: {
        query: z.string().optional().describe("Free-text factual pattern, e.g. 'adtech pixels sharing health data'."),
        tags: z.array(z.string()).optional().describe("Violation theory tags, e.g. gpc_not_honored or processor_contract_inadequate."),
        statutes: z.array(z.string()).optional().describe("Statutes or statute fragments to match, e.g. CCPA, BIPA, FTC Act."),
        states: z.array(z.string()).optional().describe("State names or abbreviations to match in action text."),
        industry: z.string().optional().describe("Industry descriptor, e.g. automotive, retail, telehealth, adtech."),
        min_year: z.number().int().optional().describe("Only return actions from this year or later."),
        top: z.number().int().min(1).max(20).default(5).describe("Maximum number of results to return."),
        include_operational_lessons: z.boolean().default(true).describe("Include operational lessons when available."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const scored = findPrecedents(args);
      return { content: [{ type: "text", text: renderResult(args, scored) }] };
    }
  );
}
