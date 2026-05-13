/**
 * citation_auditor.ts
 *
 * Deterministic citation-discipline auditor for privacy-law work product.
 * Flags claims that lack citations, unresolved citation placeholders,
 * suspicious section numbers, and unresolvable PrivacyQuant node references.
 *
 * Conservative: flags possible issues without making legal judgments.
 * Deterministic. No LLM. No live API.
 */

import type { StatuteIndex } from "./types.js";

export type AuditSeverity = "error" | "warning" | "info";

export interface CitationFlag {
  severity: AuditSeverity;
  type: string;
  excerpt: string;
  message: string;
  suggestion?: string;
}

export interface CitationAuditResult {
  flags: CitationFlag[];
  error_count: number;
  warning_count: number;
  info_count: number;
  passed_claims?: string[];
  summary: string;
  disclaimer: string;
}

// Patterns that indicate a citation is present
const CITATION_PATTERNS = [
  /Cal\.\s*Civ\.\s*Code\s*§/i,
  /§\s*179[0-9]\.\d+/,
  /11\s*C\.?C\.?R\.?\s*§\s*7\d{3}/,
  /Colo\.\s*Rev\.\s*Stat\.\s*§/i,
  /Va\.\s*Code\s*Ann\.\s*§/i,
  /Conn\.\s*Gen\.\s*Stat\.\s*§/i,
  /Utah\s*Code\s*Ann\.\s*§/i,
  /Tex\.\s*Bus\.\s*&\s*Com\.\s*Code/i,
  /ORS\s*§/i,
  /Mont\.\s*Code\s*Ann\.\s*§/i,
  /Iowa\s*Code\s*§/i,
  /Fla\.\s*Stat\.\s*§/i,
  /Md\.\s*Code\s*Ann\./i,
  /N\.J\.\s*Stat\.\s*Ann\.\s*§/i,
  /N\.H\.\s*Rev\.\s*Stat\.\s*§/i,
  /Del\.\s*Code\s*Ann\./i,
  /Minn\.\s*Stat\.\s*§/i,
  /Ky\.\s*Rev\.\s*Stat\.\s*§/i,
  /Ind\.\s*Code\s*§/i,
  /R\.I\.\s*Gen\.\s*Laws\s*§/i,
  /Neb\.\s*Rev\.\s*Stat\.\s*§/i,
  /Tenn\.\s*Code\s*Ann\.\s*§/i,
  /740\s*ILCS/,             // BIPA
  /RCW\s*\d+\.\d+/i,        // Washington
  /\d+\s*U\.S\.C\.\s*§/,
  /\d+\s*C\.F\.R\.\s*(pt\.|§)/i,
  /Pub\.\s*L\.\s*\d+/i,
  // PrivacyQuant node refs
  /\b(ccpa|vcdpa|cpa|ctdpa|ucpa|tdpsa|ocpa|mcdpa|icdpa|incdpa|tipa|dpdpa|njdpa|nhdpa|ndpa|kcdpa|modpa|mcdpa_mn|ridtppa|fdbr)\.[a-z_.]+/i,
  // Academic / secondary
  /\(\d{4}\)\s*\d+\s+[A-Z]/,
  /https?:\/\/(cppa\.ca\.gov|oag\.ca\.gov|leg\.colorado\.gov|cga\.ct\.gov)/i,
];

// Phrases that indicate a substantive legal claim was made
const LEGAL_CLAIM_PATTERNS = [
  /\brequires?\b.{0,40}(business|controller|processor|company)/i,
  /\bmust\b.{0,40}(provide|notify|delete|disclose|respond|honor)/i,
  /\bprohibits?\b/i,
  /\bpenalt(y|ies)\b/i,
  /\bviolat(es?|ion)\b/i,
  /\b(right to|opt[- ]out|opt[- ]in)\b/i,
  /\bdeadline\b/i,
  /\bdays? (to|of)\b/i,
  /\bexempt(ion)?\b/i,
  /\bcure period\b/i,
  /\bsensitive (data|PI|personal information)\b/i,
  /\bapplicab(le|ility)\b/i,
];

// Unresolved placeholder patterns
const PLACEHOLDER_PATTERNS = [
  /\[citation needed\]/i,
  /\[cite needed\]/i,
  /\[verify\]/i,
  /\[citation\]/i,
  /\[source\]/i,
  /\[ref\]/i,
  /TODO.*citation/i,
  /FIXME.*citation/i,
];

// Suspicious CCPA section ranges (valid: 1798.100–1798.199, 1798.199.10–1798.199.100)
function isSuspiciousCCPASection(section: string): boolean {
  const match = section.match(/179[0-9]\.(\d+)/);
  if (!match) return false;
  const sub = parseInt(match[1]);
  // Valid range: .100–.199 and .199.xx
  return sub > 0 && sub < 100;
}

// Extract sentences (rough split)
function getSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function hasCitation(sentence: string): boolean {
  return CITATION_PATTERNS.some((p) => p.test(sentence));
}

function hasLegalClaim(sentence: string): boolean {
  return LEGAL_CLAIM_PATTERNS.some((p) => p.test(sentence));
}

export function auditCitations(
  text: string,
  index: StatuteIndex,
  strict = false,
  includePassed = false
): CitationAuditResult {
  const flags: CitationFlag[] = [];
  const passed: string[] = [];

  // 1. Unresolved placeholders
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      flags.push({
        severity: "error",
        type: "unresolved_placeholder",
        excerpt: match[0],
        message: `Unresolved citation placeholder found: "${match[0]}"`,
        suggestion: "Replace with a specific statutory citation or PrivacyQuant node ID.",
      });
    }
  }

  // 2. Suspicious CCPA section numbers
  const ccpaSectionMatches = text.matchAll(/§\s*(179[0-9]\.\d+)/g);
  for (const m of ccpaSectionMatches) {
    if (isSuspiciousCCPASection(m[1])) {
      flags.push({
        severity: "warning",
        type: "suspicious_ccpa_section",
        excerpt: `§ ${m[1]}`,
        message: `Section § ${m[1]} is outside the CCPA/CPRA codified range (§§ 1798.100–1798.199).`,
        suggestion:
          "Verify this section exists. CCPA sections are §§ 1798.100–1798.199 and 1798.199.10+.",
      });
    }
  }

  // 3. Standalone "CPRA" without "CCPA/CPRA" or qualifying context
  const cpraAlone = text.match(/(?<!\bCCPA\/)\bCPRA\b(?![\s\/]CPRA)/g);
  if (cpraAlone && cpraAlone.length > 2) {
    flags.push({
      severity: "info",
      type: "standalone_cpra",
      excerpt: "CPRA",
      message:
        'Multiple standalone references to "CPRA" detected. Prefer "CCPA/CPRA" to avoid ambiguity about which version of the statute applies.',
      suggestion: 'Use "CCPA/CPRA" or cite the specific Cal. Civ. Code section.',
    });
  }

  // 4. Per-sentence: legal claim without citation
  const sentences = getSentences(text);
  for (const sentence of sentences) {
    if (!hasLegalClaim(sentence)) {
      if (includePassed) passed.push(sentence.slice(0, 80));
      continue;
    }
    if (hasCitation(sentence)) {
      if (includePassed) passed.push(`[cited] ${sentence.slice(0, 80)}`);
      continue;
    }
    // Strict: error for missing citation on legal claim
    // Normal: warning
    flags.push({
      severity: strict ? "error" : "warning",
      type: "uncited_legal_claim",
      excerpt: sentence.slice(0, 120) + (sentence.length > 120 ? "…" : ""),
      message: "Substantive legal claim without an inline citation.",
      suggestion:
        "Add a PrivacyQuant node ID (e.g., ccpa.rights.deletion) or a statutory code citation.",
    });
  }

  // 5. PrivacyQuant node refs: validate they resolve
  const nodeRefPattern =
    /\b(ccpa|vcdpa|cpa|ctdpa|ucpa|tdpsa|ocpa|mcdpa|icdpa|incdpa|tipa|dpdpa|njdpa|nhdpa|ndpa|kcdpa|modpa|mcdpa_mn|ridtppa|fdbr)\.[a-z_.]+/gi;
  const nodeRefs = [...text.matchAll(nodeRefPattern)].map((m) => m[0].toLowerCase());
  for (const ref of new Set(nodeRefs)) {
    if (!index.byId.has(ref)) {
      flags.push({
        severity: "warning",
        type: "unresolvable_node_ref",
        excerpt: ref,
        message: `PrivacyQuant node reference "${ref}" does not resolve to a known node.`,
        suggestion: "Use pq_list_statutes or pq_search_requirements to find the correct node ID.",
      });
    }
  }

  const errors = flags.filter((f) => f.severity === "error").length;
  const warnings = flags.filter((f) => f.severity === "warning").length;
  const infos = flags.filter((f) => f.severity === "info").length;

  const summary =
    flags.length === 0
      ? "No citation issues found."
      : `Found ${errors} error(s), ${warnings} warning(s), ${infos} info item(s).`;

  return {
    flags,
    error_count: errors,
    warning_count: warnings,
    info_count: infos,
    passed_claims: includePassed ? passed : undefined,
    summary,
    disclaimer:
      "Citation audit flags possible issues but does not verify that cited authority " +
      "actually supports the claim. Always verify citations against source material.",
  };
}
