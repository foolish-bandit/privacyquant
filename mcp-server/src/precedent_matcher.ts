/**
 * precedent_matcher.ts
 *
 * Deterministic precedent matching against the PrivacyQuant enforcement
 * actions corpus (references/enforcement_actions.json).
 *
 * Port of the us-state-privacy-navigator precedent_match.py scoring algorithm
 * with TypeScript types and path resolution for the MCP server context.
 *
 * Scoring (per action, transparent):
 *   tag_score     = 100 × |gap_tags ∩ action.violation_theories|
 *   state_score   = 35 if action regulator/statutes mention a gap state
 *   recency_score = max(0, 20 − 2 × (currentYear − action.year))
 *   severity_score = 5–25 based on settlement amount + remediation presence
 *
 * No LLM sub-call. Fully deterministic.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface EnforcementAction {
  id: string;
  case_name: string;
  full_caption?: string;
  year: number;
  regulator: string[];
  respondent: string;
  respondent_industry?: string;
  statutes: string[];
  statute_sections?: string[];
  violation_theories: string[];
  factual_pattern: string;
  monetary_amount_usd: number | null;
  remediation_imposed?: string[];
  citation: string;
  url?: string;
  operational_lessons?: string[];
}

export interface EnforcementCorpus {
  $schema_version: string;
  _meta: {
    corpus_version: string;
    last_updated: string;
    violation_theory_tags: string[];
  };
  actions: EnforcementAction[];
}

export interface PrecedentMatch {
  id: string;
  case_name: string;
  year: number;
  regulator: string[];
  respondent: string;
  respondent_industry?: string;
  factual_pattern: string;
  monetary_amount_usd: number | null;
  violation_theories: string[];
  operational_lessons: string[];
  citation: string;
  url?: string;
  score: number;
  score_breakdown: {
    tag_overlap: string[];
    tag_score: number;
    state_score: number;
    recency_score: number;
    severity_score: number;
  };
}

// ─── State term index ───────────────────────────────────────────────────────

const STATE_TERMS: Record<string, string[]> = {
  CA: ["california", "cal.", "cppa", "cipa"],
  VA: ["virginia", "va."],
  CO: ["colorado", "colo."],
  CT: ["connecticut", "conn."],
  UT: ["utah"],
  TX: ["texas", "tex."],
  OR: ["oregon", "or."],
  MT: ["montana", "mont."],
  FL: ["florida", "fla."],
  IA: ["iowa"],
  DE: ["delaware", "del."],
  NJ: ["new jersey", "n.j."],
  NH: ["new hampshire", "n.h."],
  NE: ["nebraska", "neb."],
  MN: ["minnesota", "minn."],
  MD: ["maryland", "md."],
  TN: ["tennessee", "tenn."],
  IN: ["indiana", "ind."],
  KY: ["kentucky", "ky."],
  RI: ["rhode island", "r.i."],
  IL: ["illinois", "ill.", "bipa"],
  WA: ["washington", "wash.", "mhmda"],
};

// ─── Corpus loader ──────────────────────────────────────────────────────────

let _corpus: EnforcementCorpus | null = null;

export function loadCorpus(): EnforcementCorpus {
  if (_corpus) return _corpus;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // mcp-server/src/ → repo root → references/
  const corpusPath = path.resolve(__dirname, "../../references/enforcement_actions.json");
  if (!fs.existsSync(corpusPath)) {
    throw new Error(`Enforcement corpus not found at ${corpusPath}`);
  }
  _corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8")) as EnforcementCorpus;
  return _corpus;
}

export function allTags(): string[] {
  return loadCorpus()._meta.violation_theory_tags;
}

// ─── Scoring helpers ────────────────────────────────────────────────────────

function stateMatch(action: EnforcementAction, gapStates: string[]): boolean {
  if (!gapStates.length) return false;
  const text = [
    ...action.regulator,
    ...action.statutes,
  ].join(" ").toLowerCase();

  for (const state of gapStates) {
    const terms = STATE_TERMS[state.toUpperCase()] ?? [];
    if (terms.some((t) => text.includes(t))) return true;
  }
  return false;
}

function scoreAction(
  action: EnforcementAction,
  gapTags: Set<string>,
  gapStates: string[],
  currentYear = 2026
): { total: number; breakdown: PrecedentMatch["score_breakdown"] } {
  // 1. Tag overlap — 100 pts per matching tag
  const actionTags = new Set(action.violation_theories);
  const overlap = [...gapTags].filter((t) => actionTags.has(t));
  const tagScore = overlap.length * 100;

  // 2. State proximity — 35 pts if any match
  const stateScore = stateMatch(action, gapStates) ? 35 : 0;

  // 3. Recency — max 20, decays 2/yr over 10yr window
  const year = action.year ?? 2018;
  const recencyScore = Math.max(0, 20 - 2 * (currentYear - year));

  // 4. Severity — settlement size + remediation bonus
  const amt = action.monetary_amount_usd ?? 0;
  let severityScore = 0;
  if (amt >= 1_000_000_000) severityScore = 25;
  else if (amt >= 100_000_000) severityScore = 20;
  else if (amt >= 10_000_000) severityScore = 15;
  else if (amt >= 1_000_000) severityScore = 10;
  else if (amt > 0) severityScore = 5;
  if (action.remediation_imposed?.length) {
    severityScore = Math.min(25, severityScore + 5);
  }

  return {
    total: tagScore + stateScore + recencyScore + severityScore,
    breakdown: {
      tag_overlap: overlap,
      tag_score: tagScore,
      state_score: stateScore,
      recency_score: recencyScore,
      severity_score: severityScore,
    },
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function rankActions(
  gapTags: string[],
  gapStates: string[],
  topN = 5
): PrecedentMatch[] {
  const corpus = loadCorpus();
  const tagSet = new Set(gapTags.map((t) => t.toLowerCase()));

  const scored: PrecedentMatch[] = [];
  for (const action of corpus.actions) {
    const { total, breakdown } = scoreAction(action, tagSet, gapStates);
    if (total === 0) continue;
    scored.push({
      id: action.id,
      case_name: action.case_name,
      year: action.year,
      regulator: action.regulator,
      respondent: action.respondent,
      respondent_industry: action.respondent_industry,
      factual_pattern: action.factual_pattern,
      monetary_amount_usd: action.monetary_amount_usd,
      violation_theories: action.violation_theories,
      operational_lessons: action.operational_lessons ?? [],
      citation: action.citation,
      url: action.url,
      score: total,
      score_breakdown: breakdown,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

/** Free-text fallback — matches query tokens against factual pattern,
 *  violation theories, case name, and operational lessons. */
export function textQuery(query: string, topN = 5): PrecedentMatch[] {
  const corpus = loadCorpus();
  const terms = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length >= 3);

  const results: Array<PrecedentMatch & { _hits: number }> = [];

  for (const action of corpus.actions) {
    const haystack = [
      action.case_name,
      action.factual_pattern,
      action.violation_theories.join(" "),
      action.statutes.join(" "),
      ...(action.operational_lessons ?? []),
    ]
      .join(" ")
      .toLowerCase();

    const hits = terms.filter((t) => haystack.includes(t)).length;
    if (hits === 0) continue;

    results.push({
      id: action.id,
      case_name: action.case_name,
      year: action.year,
      regulator: action.regulator,
      respondent: action.respondent,
      respondent_industry: action.respondent_industry,
      factual_pattern: action.factual_pattern,
      monetary_amount_usd: action.monetary_amount_usd,
      violation_theories: action.violation_theories,
      operational_lessons: action.operational_lessons ?? [],
      citation: action.citation,
      url: action.url,
      score: hits,
      score_breakdown: {
        tag_overlap: [],
        tag_score: 0,
        state_score: 0,
        recency_score: 0,
        severity_score: hits,
      },
      _hits: hits,
    });
  }

  results.sort((a, b) => b._hits - a._hits);
  return results.slice(0, topN);
}
