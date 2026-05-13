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
