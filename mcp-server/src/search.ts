import type { StatuteNode, SearchResult, StatuteIndex } from "./types.js";

/**
 * Tokenise a query string into lowercase terms, stripping punctuation.
 */
function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/**
 * Score a node against a query using contract_signals matching.
 *
 * Scoring:
 *   - Each contract_signal that appears as a substring of the query (case-insensitive): +3
 *   - Each query token that appears in any contract_signal: +1
 *   - Title word match: +2 per word
 *   - Statute name exact match in query: +5
 *
 * Returns 0 if nothing matched.
 */
function scoreNode(node: StatuteNode, queryLower: string, queryTokens: string[]): {
  score: number;
  matched_signals: string[];
} {
  let score = 0;
  const matched_signals: string[] = [];

  // Signal matching
  for (const signal of node.contract_signals) {
    const sigLower = signal.toLowerCase();
    if (queryLower.includes(sigLower)) {
      score += 3;
      matched_signals.push(signal);
    } else {
      // Partial token overlap
      const sigTokens = tokenise(signal);
      const overlap = queryTokens.filter((t) => sigTokens.includes(t));
      if (overlap.length > 0) {
        score += overlap.length;
        if (!matched_signals.includes(signal)) {
          matched_signals.push(signal);
        }
      }
    }
  }

  // Title word bonus
  const titleTokens = tokenise(node.title);
  for (const t of queryTokens) {
    if (titleTokens.includes(t)) score += 2;
  }

  // Statute name bonus — helps with "what does CCPA say about deletion"
  const statuteLower = node.statute.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (queryLower.includes(statuteLower) || queryLower.includes(node.statute.toLowerCase())) {
    score += 5;
  }

  return { score, matched_signals };
}

export interface SearchOptions {
  /** Freetext query — matched against contract_signals, title, statute name */
  query: string;
  /** If provided, restrict to nodes from this statute (case-insensitive) */
  statute?: string;
  /** If provided, restrict to nodes of this requirement_type */
  requirement_type?: "hard" | "threshold" | "soft";
  /** Maximum results to return (default 5) */
  limit?: number;
}

/**
 * Extract a compact search query from a raw DPA/contract clause.
 *
 * Strategy: pull all known privacy-law signal terms that appear in the clause text.
 * Fall back to the highest-frequency non-stopword tokens if no signals match.
 * Returns a string suitable for passing directly to searchNodes() as `query`.
 */
const PRIVACY_SIGNALS = [
  // Rights
  "deletion", "delete", "erasure", "erase",
  "access", "right to know", "data subject access",
  "correction", "rectification", "correct inaccurate",
  "portability", "portable format",
  "opt-out", "opt out", "do not sell", "do not share",
  "targeted advertising", "cross-context behavioral advertising",
  "profiling", "automated decision", "ADMT",
  "appeal", "right to appeal",
  "limit use", "sensitive PI", "sensitive personal information",
  // Processor/controller duties
  "data processing agreement", "DPA", "processor agreement",
  "subprocessor", "service provider", "controller", "processor",
  "data minimization", "purpose limitation",
  "reasonable security", "technical and organizational",
  "breach notification", "security incident",
  "data protection assessment", "DPIA", "risk assessment",
  "privacy notice", "notice at collection",
  // Sensitive data
  "sensitive data", "biometric", "genetic", "health data",
  "precise geolocation", "racial", "ethnic", "religious",
  "sexual orientation", "mental health", "financial",
  "children", "minor", "known child",
  // Statutes
  "CCPA", "CPRA", "VCDPA", "CPA", "CTDPA", "UCPA",
  "TDPSA", "OCPA", "MODPA", "NJDPA", "NHDPA", "NDPA",
  "KCDPA", "MCDPA", "ICDPA", "INCDPA", "TIPA", "DPDPA",
  "RIDTPPA", "FDBR",
  // Enforcement
  "cure period", "civil penalty", "GPC", "Global Privacy Control",
  "universal opt-out", "UOOM",
];

export function extractClauseSignals(clauseText: string): string {
  const clauseLower = clauseText.toLowerCase();

  // Collect matched signals, deduplicating
  const matched: string[] = [];
  const seen = new Set<string>();

  for (const signal of PRIVACY_SIGNALS) {
    const sigLower = signal.toLowerCase();
    if (clauseLower.includes(sigLower) && !seen.has(sigLower)) {
      seen.add(sigLower);
      matched.push(signal);
      // Stop at 12 signals — enough for a rich query without noise
      if (matched.length >= 12) break;
    }
  }

  if (matched.length > 0) {
    return matched.join(" ");
  }

  // Fallback: take the first 200 chars stripped of stopwords
  const STOPWORDS = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "that", "this",
    "these", "those", "it", "its", "not", "no", "any", "all", "each",
    "which", "who", "whom", "whose", "when", "where", "how", "if", "unless",
    "such", "than", "then", "so", "also", "into", "through", "during",
    "including", "without", "under", "within", "upon", "per", "whether",
  ]);

  const tokens = tokenise(clauseText.slice(0, 200))
    .filter((t) => !STOPWORDS.has(t) && t.length > 2);

  // Frequency count and take top 8
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  const topTokens = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t);

  return topTokens.join(" ") || clauseText.slice(0, 100);
}

export function searchNodes(
  index: StatuteIndex,
  options: SearchOptions
): SearchResult[] {
  const { query, statute, requirement_type, limit = 5 } = options;
  const queryLower = query.toLowerCase();
  const queryTokens = tokenise(query);

  let candidates = index.all;

  // Pre-filter by statute
  if (statute) {
    const statuteLower = statute.toLowerCase();
    candidates = candidates.filter(
      (n) =>
        n.statute.toLowerCase().includes(statuteLower) ||
        n.id.startsWith(statuteLower)
    );
  }

  // Pre-filter by requirement_type
  if (requirement_type) {
    candidates = candidates.filter((n) => n.requirement_type === requirement_type);
  }

  // Score all candidates
  const scored: SearchResult[] = candidates
    .map((node) => {
      const { score, matched_signals } = scoreNode(node, queryLower, queryTokens);
      return { node, score, matched_signals };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}
