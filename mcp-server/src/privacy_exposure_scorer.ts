import { z } from "zod";
import { findPrecedents } from "./precedent_finder.js";

type ScoreArgs = {
  states?: string[];
  industry?: string;
  facts?: string;
  data_categories?: string[];
  gaps?: string[];
  sensitive_data?: boolean;
  minors_data?: boolean;
  health_data?: boolean;
  biometric_data?: boolean;
  precise_geolocation?: boolean;
  sale_or_sharing?: boolean;
  targeted_advertising?: boolean;
  profiling_or_admt?: boolean;
  universal_opt_out_gap?: boolean;
  dsar_backlog?: boolean;
  processor_contract_gap?: boolean;
  notice_gap?: boolean;
  security_incident?: boolean;
  repeat_issue?: boolean;
  remediation_started?: boolean;
  top_precedents?: number;
};

type Component = {
  name: string;
  points: number;
  reason: string;
};

type ToolResult = { content: Array<{ type: "text"; text: string }> };

type ToolServer = {
  registerTool: (
    name: string,
    config: Record<string, unknown>,
    handler: (args: ScoreArgs) => Promise<ToolResult>
  ) => unknown;
};

const STRICT_STATES = new Set(["CA", "CO", "CT", "TX", "OR", "MD", "NJ"]);
const UOOM_STATES = new Set(["CA", "CO", "CT", "OR", "MT", "DE", "NJ", "NH", "MD", "MN", "RI", "FL"]);
const MINORS_STATES = new Set(["CA", "CT", "NJ", "MD", "MN", "FL", "OR"]);

function normalizeState(state: string): string {
  return state.trim().toUpperCase();
}

function add(components: Component[], condition: boolean | undefined, name: string, points: number, reason: string): void {
  if (condition) components.push({ name, points, reason });
}

function riskBand(score: number): string {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 35) return "Moderate";
  if (score >= 15) return "Low";
  return "Minimal";
}

function regulatorInterest(args: ScoreArgs): string[] {
  const states = (args.states ?? []).map(normalizeState);
  const notes: string[] = [];
  if (states.includes("CA")) notes.push("California: CPPA/AG attention is plausible for sale/sharing, GPC, notice, sensitive PI, and dark-pattern issues.");
  if (states.includes("TX")) notes.push("Texas: AG has shown aggressive interest in children, biometric, sensitive-data, and advertising-data theories.");
  if (states.includes("CO")) notes.push("Colorado: detailed rules raise exposure for consent quality, profiling, UOOM/GPC, and biometric governance.");
  if (states.includes("CT")) notes.push("Connecticut: cure-period sunset and AI/LLM amendments increase scrutiny for high-risk processing and notice accuracy.");
  if (states.includes("OR")) notes.push("Oregon: 2026 changes heighten exposure for precise geolocation sale and known-minor data sale.");
  if (states.includes("MD")) notes.push("Maryland: strict data minimization and flat bans make overcollection, sensitive data sale, and minors' advertising especially exposed.");
  if (!notes.length && states.length) notes.push("No specific regulator-priority note is encoded for the selected states; review state AG guidance and recent enforcement manually.");
  return notes;
}

function tagsForPrecedent(args: ScoreArgs): string[] {
  const tags: string[] = [];
  if (args.universal_opt_out_gap) tags.push("gpc_not_honored");
  if (args.sale_or_sharing || args.targeted_advertising) tags.push("sale_sharing_without_notice");
  if (args.health_data) tags.push("health_data_advertising_disclosure");
  if (args.minors_data) tags.push("children_privacy");
  if (args.biometric_data) tags.push("biometric_data");
  if (args.processor_contract_gap) tags.push("processor_contract_inadequate");
  if (args.notice_gap) tags.push("privacy_notice_misrepresentation");
  if (args.security_incident) tags.push("security_failure");
  return [...new Set(tags)];
}

function buildComponents(args: ScoreArgs): Component[] {
  const components: Component[] = [];
  const states = (args.states ?? []).map(normalizeState);
  const strictCount = states.filter((state) => STRICT_STATES.has(state)).length;
  const uoomCount = states.filter((state) => UOOM_STATES.has(state)).length;
  const minorsCount = states.filter((state) => MINORS_STATES.has(state)).length;

  add(components, states.length >= 5, "multi_state_footprint", 8, "Five or more covered states increases operational complexity and inconsistent-rights risk.");
  add(components, strictCount > 0, "strict_state_presence", Math.min(15, strictCount * 3), "Selected states include higher-scrutiny or stricter regimes such as CA, CO, CT, TX, OR, MD, or NJ.");
  add(components, args.sensitive_data, "sensitive_data", 12, "Sensitive data increases consent, notice, minimization, and enforcement exposure.");
  add(components, args.health_data, "health_data", 14, "Health data has been a major enforcement focus, especially when used for advertising or analytics.");
  add(components, args.biometric_data, "biometric_data", 14, "Biometric data creates heightened exposure under biometric statutes and state privacy sensitive-data rules.");
  add(components, args.precise_geolocation, "precise_geolocation", 12, "Precise geolocation creates heightened sensitivity and specific state-law restrictions.");
  add(components, args.minors_data, "minors_data", minorsCount ? 16 : 12, "Known minors' data triggers heightened consent, sale, targeted-advertising, and penalty concerns.");
  add(components, args.sale_or_sharing, "sale_or_sharing", 12, "Sale or sharing theories are recurring enforcement targets and require precise notice and opt-out mechanics.");
  add(components, args.targeted_advertising, "targeted_advertising", 10, "Targeted advertising raises opt-out, disclosure, and universal opt-out mechanism issues.");
  add(components, args.universal_opt_out_gap, "uoom_gap", uoomCount ? 14 : 8, "Universal opt-out / GPC gaps are high-signal compliance failures in states that require recognition.");
  add(components, args.profiling_or_admt, "profiling_or_admt", 10, "Profiling or automated decision-making can trigger opt-out, assessment, notice, and appeal workflows.");
  add(components, args.dsar_backlog, "dsar_backlog", 10, "DSAR backlog creates deadline, appeal, and consumer-complaint exposure.");
  add(components, args.processor_contract_gap, "processor_contract_gap", 9, "Processor/service-provider contract gaps create vendor-risk and flowdown failures.");
  add(components, args.notice_gap, "notice_gap", 10, "Notice inaccuracies are easy for regulators to test against actual data flows.");
  add(components, args.security_incident, "security_incident", 12, "Security incidents increase scrutiny, especially where notice or deletion claims conflict with actual practices.");
  add(components, args.repeat_issue, "repeat_issue", 12, "Repeat or ignored issues increase willfulness and penalty narratives.");

  const gapCount = args.gaps?.length ?? 0;
  if (gapCount > 0) components.push({ name: "documented_gaps", points: Math.min(18, gapCount * 4), reason: `${gapCount} user-identified gap(s) were supplied.` });
  if (args.remediation_started) components.push({ name: "remediation_started", points: -10, reason: "Documented remediation lowers exposure if it is timely, specific, and auditable." });

  return components;
}

function remediationPriorities(args: ScoreArgs, band: string): string[] {
  const items: string[] = [];
  if (["Critical", "High"].includes(band)) items.push("Freeze new high-risk data uses until data mapping, notice, opt-out, and contract gaps are triaged.");
  if (args.notice_gap) items.push("Reconcile privacy notice claims against actual collection, disclosure, sale/sharing, retention, and AI-training practices.");
  if (args.universal_opt_out_gap) items.push("Implement and test GPC/UOOM recognition for applicable states; preserve test evidence.");
  if (args.sale_or_sharing || args.targeted_advertising) items.push("Map adtech/analytics disclosures and determine whether each transfer is sale, sharing, targeted advertising, processor activity, or exempt service-provider processing.");
  if (args.minors_data) items.push("Add known-minor detection, age-gating or suppression rules, and sale/targeted-advertising blocks for minors where required.");
  if (args.sensitive_data || args.health_data || args.biometric_data || args.precise_geolocation) items.push("Create a sensitive-data register with purpose, retention, consent/legal basis, disclosure recipients, and deletion controls.");
  if (args.processor_contract_gap) items.push("Update processor/service-provider contracts with purpose limits, audit/support duties, subcontractor flowdowns, deletion assistance, and no sale/share restrictions.");
  if (args.dsar_backlog) items.push("Triage DSAR backlog by statutory deadline, consumer state, right invoked, appeal availability, and verification status.");
  if (args.profiling_or_admt) items.push("Document profiling/ADMT use cases, consumer rights, assessment obligations, and notice/appeal requirements.");
  if (args.security_incident) items.push("Coordinate privacy-law analysis with breach/security counsel; separate consumer-rights obligations from breach-notification obligations.");
  if (!items.length) items.push("Document data flows, applicable laws, notices, rights workflow, and vendor contracts before expanding processing.");
  return items;
}

function render(args: ScoreArgs): string {
  const components = buildComponents(args);
  const rawScore = components.reduce((sum, component) => sum + component.points, 0);
  const score = Math.max(0, Math.min(100, rawScore));
  const band = riskBand(score);
  const precedentTags = tagsForPrecedent(args);
  const precedents = findPrecedents({
    query: args.facts,
    tags: precedentTags,
    statutes: args.states,
    industry: args.industry,
    top: args.top_precedents ?? 3,
  });

  const lines: string[] = [
    "# Privacy Exposure Score",
    "",
    `**Score**: ${score}/100`,
    `**Band**: ${band}`,
    `**States**: ${args.states?.join(", ") || "not specified"}`,
    `**Industry**: ${args.industry || "not specified"}`,
    "",
    "This is a deterministic triage score, not a prediction of enforcement or a legal conclusion.",
    "",
    "## Score Components",
  ];

  if (!components.length) {
    lines.push("No high-signal exposure components were provided. Supply states, data categories, processing flags, and known gaps for a useful score.");
  } else {
    for (const component of components.sort((a, b) => b.points - a.points)) {
      const sign = component.points >= 0 ? "+" : "";
      lines.push(`- **${component.name}**: ${sign}${component.points} — ${component.reason}`);
    }
  }

  lines.push("", "## Regulator Interest Notes");
  for (const note of regulatorInterest(args)) lines.push(`- ${note}`);

  lines.push("", "## Remediation Priorities");
  remediationPriorities(args, band).forEach((item, index) => lines.push(`${index + 1}. ${item}`));

  lines.push("", "## Analogous Enforcement Leads");
  if (!precedents.length) {
    lines.push("No analogous enforcement leads found from the current corpus. Try adding facts, industry, or specific gap terms.");
  } else {
    for (const item of precedents) {
      const action = item.action;
      lines.push(`### ${action.case_name ?? action.id}`);
      lines.push(`- **Score**: ${item.score}`);
      if (action.year) lines.push(`- **Year**: ${action.year}`);
      if (action.regulator?.length) lines.push(`- **Regulator**: ${action.regulator.join("; ")}`);
      if (action.respondent_industry) lines.push(`- **Industry**: ${action.respondent_industry}`);
      if (action.violation_theories?.length) lines.push(`- **Violation theories**: ${action.violation_theories.join(", ")}`);
      if (action.factual_pattern) lines.push(`- **Pattern**: ${action.factual_pattern}`);
      if (action.operational_lessons?.length) lines.push(`- **Lessons**: ${action.operational_lessons.join("; ")}`);
      if (action.url) lines.push(`- **URL**: ${action.url}`);
      lines.push("- **Verification**: [verify] Review source documents before relying on this lead.");
      lines.push("");
    }
  }

  lines.push(
    "## Notes",
    "- High score means the fact pattern has multiple enforcement-sensitive signals; it does not mean enforcement is likely or inevitable.",
    "- Low score does not mean compliant. Missing facts can hide exposure.",
    "- Pair this with `pq_check_applicability`, `pq_find_precedent`, `pq_route_dsar_workflow`, and `pq_audit_citations` for a fuller review."
  );

  return lines.join("\n");
}

export function registerPrivacyExposureScorerTool(server: ToolServer): void {
  server.registerTool(
    "pq_score_privacy_risk",
    {
      title: "Score Privacy Exposure",
      description: `Score privacy-law exposure from business facts, high-risk data categories, known gaps, selected states, and analogous enforcement leads.

This deterministic tool is a triage aid migrated from the old US State Privacy Navigator risk layer. It does not call an LLM and does not predict enforcement.`,
      inputSchema: {
        states: z.array(z.string()).optional(),
        industry: z.string().optional(),
        facts: z.string().optional(),
        data_categories: z.array(z.string()).optional(),
        gaps: z.array(z.string()).optional(),
        sensitive_data: z.boolean().optional(),
        minors_data: z.boolean().optional(),
        health_data: z.boolean().optional(),
        biometric_data: z.boolean().optional(),
        precise_geolocation: z.boolean().optional(),
        sale_or_sharing: z.boolean().optional(),
        targeted_advertising: z.boolean().optional(),
        profiling_or_admt: z.boolean().optional(),
        universal_opt_out_gap: z.boolean().optional(),
        dsar_backlog: z.boolean().optional(),
        processor_contract_gap: z.boolean().optional(),
        notice_gap: z.boolean().optional(),
        security_incident: z.boolean().optional(),
        repeat_issue: z.boolean().optional(),
        remediation_started: z.boolean().optional(),
        top_precedents: z.number().int().min(0).max(10).default(3),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      return { content: [{ type: "text", text: render(args) }] };
    }
  );
}
