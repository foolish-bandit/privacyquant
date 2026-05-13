import { z } from "zod";
import { loadIndex } from "./loader.js";
import type { StatuteIndex } from "./types.js";

type Severity = "ERROR" | "WARNING";

type CitationAuditArgs = {
  text: string;
  strict?: boolean;
  include_passed_claims?: boolean;
};

type Finding = {
  severity: Severity;
  line_number: number;
  message: string;
  excerpt: string;
  suggestion?: string;
};

type PassedClaim = {
  line_number: number;
  excerpt: string;
  citation_types: string[];
};

type AuditResult = {
  errors_count: number;
  warnings_count: number;
  passed_claims_count: number;
  publish_ready: boolean;
  findings: Finding[];
  passed_claims: PassedClaim[];
};

type ToolResult = { content: Array<{ type: "text"; text: string }> };

type ToolServer = {
  registerTool: (
    name: string,
    config: Record<string, unknown>,
    handler: (args: CitationAuditArgs) => Promise<ToolResult>
  ) => unknown;
};

type CitationPattern = { pattern: RegExp; label: string };

let cachedIndex: StatuteIndex | null = null;

function getIndex(): StatuteIndex {
  if (!cachedIndex) cachedIndex = loadIndex();
  return cachedIndex;
}

const CITATION_PATTERNS: CitationPattern[] = [
  { pattern: /Cal\.?\s*Civ\.?\s*Code\s*§+\s*1798\.\d+(?:\.\d+)?(?:\([a-z0-9]+\))*/i, label: "CA Civil Code" },
  { pattern: /11\s*C\.?C\.?R\.?\s*§+\s*7\d{3}(?:\.\d+)?(?:\([a-z0-9]+\))*/i, label: "CA Privacy Regs" },
  { pattern: /CCPA\s*Regs?\s*§+\s*7\d{3}(?:\.\d+)?(?:\([a-z0-9]+\))*/i, label: "CCPA Regs" },
  { pattern: /Colo\.?\s*Rev\.?\s*Stat\.?\s*§+\s*6-1-13\d{2}(?:\([a-z0-9]+\))*/i, label: "CO Privacy Act" },
  { pattern: /4\s*C\.?C\.?R\.?\s*§+\s*904-3/i, label: "CO Privacy Rules" },
  { pattern: /Va\.?\s*Code\s*§+\s*59\.1-5\d{2}(?:\([a-z0-9]+\))*/i, label: "VA Privacy Act" },
  { pattern: /Conn\.?\s*Gen\.?\s*Stat\.?\s*§+\s*42-5\d{2}(?:\([a-z0-9]+\))*/i, label: "CT Privacy Act" },
  { pattern: /Utah\s*Code\s*§+\s*13-61-\d+(?:\([a-z0-9]+\))*/i, label: "UT Privacy Act" },
  { pattern: /Tex\.?\s*Bus\.?\s*&\s*Com\.?\s*Code\s*§+\s*541\.\d+(?:\([a-z0-9]+\))*/i, label: "TX Privacy Act" },
  { pattern: /Or\.?\s*Rev\.?\s*Stat\.?\s*§+\s*646A\.5\d{2}(?:\([a-z0-9]+\))*/i, label: "OR Privacy Act" },
  { pattern: /Mont\.?\s*Code\s*§+\s*30-14-28\d{2}(?:\([a-z0-9]+\))*/i, label: "MT Privacy Act" },
  { pattern: /Fla\.?\s*Stat\.?\s*§+\s*501\.7\d{2}(?:\([a-z0-9]+\))*/i, label: "FL FDBR" },
  { pattern: /Iowa\s*Code\s*§+\s*715D\.\d+(?:\([a-z0-9]+\))*/i, label: "IA Privacy Act" },
  { pattern: /Ind\.?\s*Code\s*§+\s*24-15(?:-\d+)?(?:\([a-z0-9]+\))*/i, label: "IN Privacy Act" },
  { pattern: /Tenn\.?\s*Code\s*§+\s*47-18-32\d{2}(?:\([a-z0-9]+\))*/i, label: "TN Privacy Act" },
  { pattern: /Del\.?\s*Code\s*(?:tit\.?\s*6|Title\s*6),?\s*(?:Ch\.?|Chapter)\s*12D/i, label: "DE Privacy Act" },
  { pattern: /Del\.?\s*Code\s*(?:tit\.?\s*6|Title\s*6)\s*§+\s*12D-\d+(?:\([a-z0-9]+\))*/i, label: "DE Privacy Act" },
  { pattern: /N\.?J\.?\s*Stat\.?\s*§+\s*56:8-166\.\d+(?:\([a-z0-9]+\))*/i, label: "NJ Privacy Act" },
  { pattern: /N\.?H\.?\s*Rev\.?\s*Stat\.?\s*(?:ch\.?|Chapter)\s*507-H/i, label: "NH Privacy Act" },
  { pattern: /Neb\.?\s*Rev\.?\s*Stat\.?\s*§+\s*87-1\d{3}(?:\([a-z0-9]+\))*/i, label: "NE Privacy Act" },
  { pattern: /Ky\.?\s*Rev\.?\s*Stat\.?\s*§+\s*367\.36\d{2}(?:\([a-z0-9]+\))*/i, label: "KY Privacy Act" },
  { pattern: /Md\.?\s*Code\s*Com\.?\s*Law\s*§+\s*14-46\d{2}(?:\([a-z0-9]+\))*/i, label: "MD MODPA" },
  { pattern: /Minn\.?\s*Stat\.?\s*(?:ch\.?|Chapter)\s*325O/i, label: "MN Privacy Act" },
  { pattern: /R\.?I\.?\s*Gen\.?\s*Laws\s*§+\s*6-48\.1(?:-\d+)?(?:\([a-z0-9]+\))*/i, label: "RI Privacy Act" },
  { pattern: /15\s*U\.?S\.?C\.?\s*§+\s*\d+/i, label: "Federal U.S.C." },
  { pattern: /16\s*C\.?F\.?R\.?\s*(?:Part|§)\s*\d+/i, label: "Federal C.F.R." },
  { pattern: /740\s*ILCS\s*14/i, label: "BIPA" },
  { pattern: /Wash\.?\s*Rev\.?\s*Code\s*(?:ch\.?|Chapter)\s*19\.373/i, label: "WA MHMDA" },
  { pattern: /`[a-z0-9_]+(?:[-_][a-z0-9_]+)?\.[a-z0-9_]+\.[a-z0-9_]+`/i, label: "PrivacyQuant node" },
];

const SUBSTANTIVE_MARKERS = /\b(must(?:\s+not)?|shall(?:\s+not)?|is\s+(?:required|prohibited|permitted|obligated|forbidden|deemed)|are\s+(?:required|prohibited|permitted|obligated|forbidden|deemed)|has\s+(?:the|a)\s+right\s+to|have\s+(?:the|a)\s+right\s+to|right\s+to\s+(?:know|access|delete|correct|opt\s*out|opt-out|appeal|portability|limit\s*use|object|restrict)|threshold\s+of|penalt(?:y|ies)\s+(?:of|up\s+to)|civil\s+penalt|cure\s+period|effective\s+date|consumer\s+count|annual\s+(?:gross\s+)?revenue|opt[-\s]?in\s+consent|opt[-\s]?out\s+(?:right|mechanism|signal)|sensitive\s+(?:data|personal\s+information)|sale\s+of\s+(?:personal\s+information|personal\s+data|sensitive\s+data)|sharing\s+of\s+(?:personal\s+information|personal\s+data)|targeted\s+advertising|cross[-\s]?context\s+behavioral\s+advertising|controller\s+(?:must|shall|is\s+required)|processor\s+(?:must|shall|is\s+required)|service\s+provider\s+(?:must|shall|is\s+required)|business\s+(?:must|shall|is\s+required))\b/i;

const EXCLUDED_LINE_START = /^(\s*```|\s*\|\s*|\s*#+\s*$)/;

function splitSentences(text: string): Array<{ line: number; sentence: string }> {
  const sentences: Array<{ line: number; sentence: string }> = [];
  const abbreviations = ["Cal", "Va", "Colo", "Conn", "Tex", "Or", "Mont", "Fla", "Ind", "Tenn", "Del", "Md", "Minn", "Neb", "Ky", "Wash", "Ill", "U.S", "U.S.C", "C.F.R", "Civ", "Stat", "Rev", "Code", "Bus", "Com", "Prof", "Penal", "Gen", "tit", "Ch", "ch", "Inc", "Ltd", "Co", "Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sep", "Sept", "Oct", "Nov", "Dec", "e.g", "i.e", "v"];
  const sentinel = "__DOT__";

  text.split(/\r?\n/).forEach((lineText, index) => {
    if (EXCLUDED_LINE_START.test(lineText)) return;
    let masked = lineText;
    for (const abbreviation of abbreviations) {
      masked = masked.replace(new RegExp(`\\b${abbreviation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.`, "g"), `${abbreviation}${sentinel}`);
    }
    for (const part of masked.split(/(?<=[.!?])\s+(?=[A-Z(])/g)) {
      const sentence = part.replaceAll(sentinel, ".").trim();
      if (sentence) sentences.push({ line: index + 1, sentence });
    }
  });

  return sentences;
}

function citationTypes(sentence: string): string[] {
  const found = new Set<string>();
  for (const { pattern, label } of CITATION_PATTERNS) {
    if (pattern.test(sentence)) found.add(label);
  }
  return [...found];
}

function isSubstantive(sentence: string): boolean {
  return SUBSTANTIVE_MARKERS.test(sentence);
}

function ccpaSectionWarning(sentence: string): string | null {
  const match = /Cal\.?\s*Civ\.?\s*Code\s*§+\s*(\d+\.\d+)/i.exec(sentence);
  if (!match) return null;
  const section = Number(match[1]);
  if (!Number.isFinite(section)) return null;
  if (section < 1798.1 || section > 1798.199) {
    return `California Civil Code citation ${match[0]} appears outside the common CCPA/CPRA codified range. Verify the section number.`;
  }
  return null;
}

function nodeReferenceWarnings(text: string, index: StatuteIndex): Finding[] {
  const findings: Finding[] = [];
  const regex = /`([a-z0-9_]+(?:[-_][a-z0-9_]+)?\.[a-z0-9_]+\.[a-z0-9_]+)`/gi;
  text.split(/\r?\n/).forEach((line, idx) => {
    for (const match of line.matchAll(regex)) {
      const nodeId = match[1];
      if (!index.byId.has(nodeId)) {
        findings.push({
          severity: "WARNING",
          line_number: idx + 1,
          message: `PrivacyQuant node reference not found: ${nodeId}`,
          excerpt: line.slice(0, 240),
          suggestion: "Use pq_search_requirements or pq_list_statutes to verify the node ID.",
        });
      }
    }
  });
  return findings;
}

function auditText(text: string, includePassedClaims = false): AuditResult {
  const index = getIndex();
  const findings: Finding[] = [];
  const passed_claims: PassedClaim[] = [];

  for (const { line, sentence } of splitSentences(text)) {
    if (!isSubstantive(sentence)) continue;
    const types = citationTypes(sentence);
    if (types.length === 0) {
      findings.push({
        severity: "ERROR",
        line_number: line,
        message: "Substantive privacy-law claim lacks an inline citation.",
        excerpt: sentence.slice(0, 240),
        suggestion: "Add a citation to the controlling statute, regulation, enforcement source, or PrivacyQuant node in the same sentence.",
      });
      continue;
    }

    const warning = ccpaSectionWarning(sentence);
    if (warning) {
      findings.push({ severity: "WARNING", line_number: line, message: warning, excerpt: sentence.slice(0, 240) });
    }

    if (includePassedClaims) {
      passed_claims.push({ line_number: line, excerpt: sentence.slice(0, 240), citation_types: types });
    }
  }

  text.split(/\r?\n/).forEach((line, idx) => {
    if (/\[citation needed/i.test(line) || /\[cite needed/i.test(line)) {
      findings.push({
        severity: "ERROR",
        line_number: idx + 1,
        message: "Unresolved citation-needed marker.",
        excerpt: line.slice(0, 240),
        suggestion: "Resolve the citation or remove the unsupported claim before publication.",
      });
    }
    if (/\bCPRA\b/.test(line) && !/as amended by CPRA|CCPA\/CPRA|\(CPRA\)/.test(line)) {
      findings.push({
        severity: "WARNING",
        line_number: idx + 1,
        message: "Potential CCPA/CPRA naming inconsistency.",
        excerpt: line.slice(0, 240),
        suggestion: "Prefer citing the codified Cal. Civ. Code section; refer to CPRA as an amendment unless context requires otherwise.",
      });
    }
  });

  findings.push(...nodeReferenceWarnings(text, index));

  const errors = findings.filter((finding) => finding.severity === "ERROR").length;
  const warnings = findings.filter((finding) => finding.severity === "WARNING").length;

  return {
    errors_count: errors,
    warnings_count: warnings,
    passed_claims_count: passed_claims.length,
    publish_ready: errors === 0,
    findings,
    passed_claims,
  };
}

function renderAudit(result: AuditResult, strict = false): string {
  const lines: string[] = [
    "# Citation Audit",
    "",
    `**Errors**: ${result.errors_count}`,
    `**Warnings**: ${result.warnings_count}`,
    `**Passed cited claims shown**: ${result.passed_claims_count}`,
    `**Publish ready**: ${result.publish_ready && (!strict || result.warnings_count === 0) ? "yes" : "no"}`,
    "",
  ];

  if (result.findings.length === 0) {
    lines.push("No citation-discipline issues found by the deterministic auditor.");
  } else {
    lines.push("## Findings");
    for (const finding of result.findings) {
      const marker = finding.severity === "ERROR" ? "ERROR" : "WARNING";
      lines.push(`### ${marker} — line ${finding.line_number}`);
      lines.push(finding.message);
      if (finding.excerpt) lines.push(`> ${finding.excerpt}`);
      if (finding.suggestion) lines.push(`Suggestion: ${finding.suggestion}`);
      lines.push("");
    }
  }

  if (result.passed_claims.length > 0) {
    lines.push("## Passed Cited Claims");
    for (const claim of result.passed_claims) {
      lines.push(`- Line ${claim.line_number}: ${claim.citation_types.join(", ")} — ${claim.excerpt}`);
    }
  }

  lines.push(
    "",
    "## Notes",
    "- This tool is deterministic and conservative. It catches citation-discipline issues; it does not prove the cited authority supports the sentence.",
    "- Run this on client-facing memos, articles, draft guidance, and legal analysis before publication.",
    "- Use CourtListener MCP or primary statutory sources to verify disputed citations."
  );

  return lines.join("\n");
}

export function registerCitationAuditorTool(server: ToolServer): void {
  server.registerTool(
    "pq_audit_citations",
    {
      title: "Audit Privacy-Law Citations",
      description: `Audit privacy-law work product for citation discipline.

This deterministic tool is migrated from the old US State Privacy Navigator citation auditor.
It flags substantive privacy-law claims that lack inline citations, unresolved citation-needed
markers, suspicious CCPA/CPRA naming, questionable California Civil Code ranges, and missing
PrivacyQuant node references.`,
      inputSchema: {
        text: z.string().min(20).max(50000).describe("Markdown or plain text to audit."),
        strict: z.boolean().default(false).describe("Treat warnings as blocking publication in the summary."),
        include_passed_claims: z.boolean().default(false).describe("Include cited substantive claims that passed the inline-citation check."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const result = auditText(args.text, args.include_passed_claims ?? false);
      return { content: [{ type: "text", text: renderAudit(result, args.strict ?? false) }] };
    }
  );
}
