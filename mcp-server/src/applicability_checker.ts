import { z } from "zod";

type Verdict = "Applies" | "Likely Applies" | "Does Not Apply" | "Insufficient Info";

type Intake = Record<string, any>;

type StateResult = {
  state: string;
  statute: string;
  effective: string;
  verdict: Verdict;
  reasoning: string;
  needed_inputs: string[];
  applicability_node_id: string;
  node_ids_to_consider: string[];
};

type ApplicabilityOutput = {
  summary: {
    applies: string[];
    likely_applies: string[];
    does_not_apply: string[];
    insufficient: string[];
  };
  results: StateResult[];
  notes: string[];
};

type ToolResult = { content: Array<{ type: "text"; text: string }> };

type ToolServer = {
  registerTool: (
    name: string,
    config: Record<string, unknown>,
    handler: (args: Intake) => Promise<ToolResult>
  ) => unknown;
};

const STATE_META: Record<string, { statute: string; effective: string; node: string; allNodes: string[] }> = {
  CA: { statute: "Cal. Civ. Code §§ 1798.100 et seq.", effective: "Jan 2020; CPRA Jan 2023", node: "ccpa.applicability.threshold", allNodes: ["ccpa.applicability.threshold"] },
  VA: { statute: "Va. Code §§ 59.1-575 to -585", effective: "Jan 2023", node: "vcdpa.applicability.threshold", allNodes: ["vcdpa.applicability.threshold"] },
  CO: { statute: "Colo. Rev. Stat. §§ 6-1-1301 et seq.", effective: "Jul 2023", node: "cpa.applicability.threshold", allNodes: ["cpa.applicability.threshold"] },
  CT: { statute: "Conn. Gen. Stat. §§ 42-515 et seq.", effective: "Jul 2023", node: "ctdpa.applicability.threshold", allNodes: ["ctdpa.applicability.threshold"] },
  UT: { statute: "Utah Code §§ 13-61-101 et seq.", effective: "Dec 2023", node: "ucpa.applicability.threshold", allNodes: ["ucpa.applicability.threshold"] },
  TX: { statute: "Tex. Bus. & Com. Code §§ 541.001 et seq.", effective: "Jul 2024", node: "tdpsa.applicability.threshold", allNodes: ["tdpsa.applicability.threshold"] },
  OR: { statute: "Or. Rev. Stat. §§ 646A.570 et seq.", effective: "Jul 2024", node: "ocpa.applicability.threshold", allNodes: ["ocpa.applicability.threshold"] },
  MT: { statute: "Mont. Code §§ 30-14-2801 et seq.", effective: "Oct 2024", node: "mcdpa.applicability.threshold", allNodes: ["mcdpa.applicability.threshold"] },
  FL: { statute: "Fla. Stat. §§ 501.701 et seq.", effective: "Jul 2024", node: "fdbr.applicability.threshold", allNodes: ["fdbr.applicability.threshold"] },
  IA: { statute: "Iowa Code §§ 715D.1 et seq.", effective: "Jan 2025", node: "icdpa.applicability.threshold", allNodes: ["icdpa.applicability.threshold"] },
  DE: { statute: "Del. Code tit. 6, ch. 12D", effective: "Jan 2025", node: "dpdpa.applicability.threshold", allNodes: ["dpdpa.applicability.threshold"] },
  NJ: { statute: "N.J. Stat. §§ 56:8-166.4 et seq.", effective: "Jan 2025", node: "njdpa.applicability.threshold", allNodes: ["njdpa.applicability.threshold"] },
  NH: { statute: "N.H. Rev. Stat. ch. 507-H", effective: "Jan 2025", node: "nhdpa.applicability.threshold", allNodes: ["nhdpa.applicability.threshold"] },
  NE: { statute: "Neb. Rev. Stat. §§ 87-1101 et seq.", effective: "Jan 2025", node: "ndpa.applicability.threshold", allNodes: ["ndpa.applicability.threshold"] },
  MN: { statute: "Minn. Stat. ch. 325O", effective: "Jul 2025", node: "mcdpa_mn.applicability.threshold", allNodes: ["mcdpa_mn.applicability.threshold"] },
  MD: { statute: "Md. Code Com. Law §§ 14-4601 et seq.", effective: "Oct 2025", node: "modpa.applicability.threshold", allNodes: ["modpa.applicability.threshold"] },
  TN: { statute: "Tenn. Code §§ 47-18-3201 et seq.", effective: "Jul 2025", node: "tipa.applicability.threshold", allNodes: ["tipa.applicability.threshold"] },
  IN: { statute: "Ind. Code §§ 24-15 et seq.", effective: "Jan 2026", node: "incdpa.applicability.threshold", allNodes: ["incdpa.applicability.threshold"] },
  KY: { statute: "Ky. Rev. Stat. §§ 367.3611 et seq.", effective: "Jan 2026", node: "kcdpa.applicability.threshold", allNodes: ["kcdpa.applicability.threshold"] },
  RI: { statute: "R.I. Gen. Laws §§ 6-48.1-1 et seq.", effective: "Jan 2026", node: "ridtppa.applicability.threshold", allNodes: ["ridtppa.applicability.threshold"] },
};

const STATE_ORDER = ["CA", "VA", "CO", "CT", "UT", "TX", "OR", "MT", "FL", "IA", "DE", "NJ", "NH", "NE", "MN", "MD", "TN", "IN", "KY", "RI"];

function num(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function bool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function revenue(intake: Intake): number | undefined {
  return num(intake.revenue?.annual_gross);
}

function percentRevenueFromSale(intake: Intake): number | undefined {
  return num(intake.sale_practices?.percent_revenue_from_sale);
}

function sells(intake: Intake): boolean | undefined {
  return bool(intake.sale_practices?.sells_pd);
}

function anySaleRevenue(intake: Intake): boolean | undefined {
  return bool(intake.sale_practices?.any_revenue_from_sale);
}

function stateCount(intake: Intake, state: string): number | undefined {
  return num(intake.consumers?.by_state?.[state]);
}

function hasPersonalDataFootprint(intake: Intake, state: string): boolean {
  const count = stateCount(intake, state);
  return Boolean(intake.data_categories) || (count !== undefined && count > 0);
}

function result(state: string, verdict: Verdict, reasoning: string, needed_inputs: string[] = []): StateResult {
  const meta = STATE_META[state];
  return {
    state,
    statute: meta.statute,
    effective: meta.effective,
    verdict,
    reasoning,
    needed_inputs,
    applicability_node_id: meta.node,
    node_ids_to_consider: verdict === "Applies" || verdict === "Likely Applies" ? meta.allNodes : [],
  };
}

function sectoralEntityExempt(intake: Intake, state: string): { exempt: boolean; reason: string } {
  const overlay = intake.sectoral_overlay ?? {};
  const glbaEntityStates = new Set(["VA", "CT", "UT", "TN", "KY", "IA", "IN", "NJ", "TX", "NE"]);
  const hipaaEntityStates = new Set(["VA", "CT", "UT", "TN", "KY", "IA", "IN", "NJ", "TX", "NE"]);
  const nonprofitExemptStates = new Set(["VA", "CT", "UT", "TN", "KY", "IA", "IN", "NJ", "TX", "NE", "MT", "NH", "RI"]);
  const higherEdExemptStates = new Set(["VA", "CT", "UT", "TN", "KY", "IA", "IN", "TX", "NE", "MT", "NH"]);

  if (overlay.government_entity) return { exempt: true, reason: "Government-entity exemption applies." };
  if (overlay.glba_financial_institution && glbaEntityStates.has(state)) return { exempt: true, reason: `Entity-level GLBA exemption applies in ${state}.` };
  if (overlay.hipaa_covered_entity_or_ba && hipaaEntityStates.has(state)) return { exempt: true, reason: `Entity-level HIPAA exemption applies in ${state}.` };
  if (overlay.non_profit && nonprofitExemptStates.has(state)) return { exempt: true, reason: `Non-profit exemption applies in ${state}.` };
  if (overlay.higher_ed_institution && higherEdExemptStates.has(state)) return { exempt: true, reason: `Higher-education exemption applies in ${state}.` };
  return { exempt: false, reason: "" };
}

function testCalifornia(intake: Intake): StateResult {
  const rev = revenue(intake);
  const count = stateCount(intake, "CA");
  const pct = percentRevenueFromSale(intake);
  const overlay = intake.sectoral_overlay ?? {};

  if (intake.entity?.for_profit === false && overlay.non_profit) {
    return result("CA", "Does Not Apply", "CCPA generally applies only to for-profit entities. Verify narrow nonprofit amendments separately if relevant.");
  }

  const needed: string[] = [];
  if (rev === undefined) needed.push("revenue.annual_gross");
  if (count === undefined) needed.push("consumers.by_state.CA");
  if (pct === undefined && sells(intake) === true) needed.push("sale_practices.percent_revenue_from_sale");
  if (needed.length) return result("CA", "Insufficient Info", "Cannot evaluate CCPA thresholds without specified inputs.", needed);

  const reasons: string[] = [];
  if (rev! >= 25_000_000) reasons.push(`Revenue ($${rev!.toLocaleString()}) meets or exceeds the $25M threshold.`);
  if (count! >= 100_000) reasons.push(`CA consumer count (${count!.toLocaleString()}) meets or exceeds the 100,000 threshold.`);
  if (pct !== undefined && pct >= 50) reasons.push(`Sale/share revenue share (${pct}%) meets or exceeds the 50% threshold.`);

  if (reasons.length) return result("CA", "Applies", `${reasons.join(" ")} Cal. Civ. Code § 1798.140(d).`);
  return result("CA", "Does Not Apply", `No CCPA threshold met. Revenue $${rev!.toLocaleString()} < $25M; CA consumers ${count!.toLocaleString()} < 100,000; sale/share revenue ${pct ?? 0}% < 50%.`);
}

type TwoTierOptions = {
  primary: number;
  secondary: number;
  secondaryPct?: number;
  useAnySaleRevenue?: boolean;
  revenueFloor?: number;
};

function twoTier(intake: Intake, state: string, options: TwoTierOptions): StateResult {
  const exempt = sectoralEntityExempt(intake, state);
  if (exempt.exempt) return result(state, "Does Not Apply", exempt.reason);

  const rev = revenue(intake);
  const count = stateCount(intake, state);
  const pct = percentRevenueFromSale(intake);
  const saleFlag = sells(intake);
  const anySale = anySaleRevenue(intake);

  const needed: string[] = [];
  if (count === undefined) needed.push(`consumers.by_state.${state}`);
  if (options.revenueFloor !== undefined && rev === undefined) needed.push("revenue.annual_gross");
  if (needed.length) return result(state, "Insufficient Info", "Cannot evaluate without specified inputs.", needed);

  if (options.revenueFloor !== undefined && (rev === undefined || rev < options.revenueFloor)) {
    return result(state, "Does Not Apply", `Revenue $${(rev ?? 0).toLocaleString()} is below the mandatory $${options.revenueFloor.toLocaleString()} floor.`);
  }

  const reasons: string[] = [];
  if (count! >= options.primary) reasons.push(`${state} consumer count (${count!.toLocaleString()}) meets or exceeds the ${options.primary.toLocaleString()} primary threshold.`);

  if (count! >= options.secondary) {
    if (options.useAnySaleRevenue) {
      if (anySale === true || saleFlag === true) {
        reasons.push(`${state} consumer count (${count!.toLocaleString()}) meets or exceeds ${options.secondary.toLocaleString()} and sale activity/revenue is present.`);
      } else if (saleFlag === undefined && anySale === undefined && reasons.length === 0) {
        return result(state, "Insufficient Info", "Tier-2 consumer threshold reached but sale activity/revenue input is missing.", ["sale_practices.any_revenue_from_sale", "sale_practices.sells_pd"]);
      }
    } else if (options.secondaryPct !== undefined) {
      if (pct === undefined && (saleFlag === true || saleFlag === undefined) && reasons.length === 0) {
        return result(state, "Insufficient Info", "Tier-2 consumer threshold reached but percent-of-revenue-from-sale input is missing.", ["sale_practices.percent_revenue_from_sale"]);
      }
      if (pct !== undefined && pct >= options.secondaryPct) {
        reasons.push(`${state} consumer count (${count!.toLocaleString()}) meets or exceeds ${options.secondary.toLocaleString()} and sale revenue ${pct}% meets or exceeds ${options.secondaryPct}%.`);
      }
    }
  }

  if (reasons.length) return result(state, "Applies", reasons.join(" "));
  return result(state, "Does Not Apply", `Neither threshold met. Consumer count ${count!.toLocaleString()}${rev !== undefined ? `; revenue $${rev.toLocaleString()}` : ""}${pct !== undefined ? `; sale revenue share ${pct}%.` : "."}`);
}

function sbaTest(intake: Intake, state: string): StateResult {
  const exempt = sectoralEntityExempt(intake, state);
  if (exempt.exempt) return result(state, "Does Not Apply", exempt.reason);

  const saleFlag = sells(intake);
  const sellsSensitiveNoConsent = bool(intake.sale_practices?.sells_sensitive_data_without_consent);
  const naics = intake.entity?.naics_code;
  const rev = revenue(intake);

  if (saleFlag === undefined) return result(state, "Insufficient Info", "Cannot evaluate without sale-practice input.", ["sale_practices.sells_pd"]);
  if (!saleFlag && !hasPersonalDataFootprint(intake, state) && intake.data_categories !== undefined) {
    return result(state, "Does Not Apply", "Entity does not process or sell personal data per inputs.");
  }
  if (sellsSensitiveNoConsent) {
    return result(state, "Applies", "Sale of sensitive data without consent eliminates the small-business carve-out; statute applies regardless of size.");
  }
  if (!naics || rev === undefined) {
    return result(state, "Insufficient Info", "SBA size status cannot be evaluated without NAICS code and revenue.", ["entity.naics_code", "revenue.annual_gross"]);
  }

  const verdict: Verdict = rev >= 47_000_000 ? "Likely Applies" : "Insufficient Info";
  const needed = verdict === "Insufficient Info" ? ["sba_size_status_for_naics_code"] : [];
  return result(state, verdict, `NAICS ${naics}, revenue $${rev.toLocaleString()}. SBA small-business status must be determined against the SBA NAICS size standards table. If the entity exceeds the relevant SBA threshold, the statute applies subject to carve-outs.`, needed);
}

function florida(intake: Intake): StateResult {
  const rev = revenue(intake);
  if (rev === undefined) return result("FL", "Insufficient Info", "Cannot evaluate FDBR without revenue.", ["revenue.annual_gross"]);
  if (rev < 1_000_000_000) return result("FL", "Does Not Apply", `Revenue $${rev.toLocaleString()} is below the $1B FDBR threshold.`);
  return result("FL", "Likely Applies", "Revenue meets or exceeds the $1B FDBR threshold. Confirm one activity prong: online ad revenue, smart-speaker/voice assistant service, or app store/digital distribution platform with at least 250,000 software applications.", ["fl_activity_prong_status"]);
}

function evaluateState(intake: Intake, state: string): StateResult {
  switch (state) {
    case "CA": return testCalifornia(intake);
    case "VA": return twoTier(intake, "VA", { primary: 100_000, secondary: 25_000, secondaryPct: 50 });
    case "CO": return twoTier(intake, "CO", { primary: 100_000, secondary: 25_000, useAnySaleRevenue: true });
    case "CT": return twoTier(intake, "CT", { primary: 100_000, secondary: 25_000, secondaryPct: 25 });
    case "UT": return twoTier(intake, "UT", { primary: 100_000, secondary: 25_000, secondaryPct: 50, revenueFloor: 25_000_000 });
    case "TX": return sbaTest(intake, "TX");
    case "OR": return twoTier(intake, "OR", { primary: 100_000, secondary: 25_000, secondaryPct: 25 });
    case "MT": return twoTier(intake, "MT", { primary: 50_000, secondary: 25_000, secondaryPct: 25 });
    case "FL": return florida(intake);
    case "IA": return twoTier(intake, "IA", { primary: 100_000, secondary: 25_000, secondaryPct: 50 });
    case "DE": return twoTier(intake, "DE", { primary: 35_000, secondary: 10_000, secondaryPct: 20 });
    case "NJ": return twoTier(intake, "NJ", { primary: 100_000, secondary: 25_000, useAnySaleRevenue: true });
    case "NH": return twoTier(intake, "NH", { primary: 35_000, secondary: 10_000, secondaryPct: 25 });
    case "NE": return sbaTest(intake, "NE");
    case "MN": return twoTier(intake, "MN", { primary: 100_000, secondary: 25_000, secondaryPct: 25 });
    case "MD": return twoTier(intake, "MD", { primary: 35_000, secondary: 10_000, secondaryPct: 20 });
    case "TN": return twoTier(intake, "TN", { primary: 175_000, secondary: 25_000, secondaryPct: 50, revenueFloor: 25_000_000 });
    case "IN": return twoTier(intake, "IN", { primary: 100_000, secondary: 25_000, secondaryPct: 50 });
    case "KY": return twoTier(intake, "KY", { primary: 100_000, secondary: 25_000, secondaryPct: 50 });
    case "RI": return twoTier(intake, "RI", { primary: 35_000, secondary: 10_000, secondaryPct: 20 });
    default: return result(state, "Insufficient Info", "Unsupported state code.", ["supported_state_code"]);
  }
}

function normalizeStates(states?: unknown): string[] {
  if (!Array.isArray(states) || states.length === 0) return STATE_ORDER;
  const set = new Set<string>();
  for (const item of states) {
    if (typeof item !== "string") continue;
    const upper = item.trim().toUpperCase();
    if (STATE_META[upper]) set.add(upper);
  }
  return set.size ? [...set] : STATE_ORDER;
}

export function runApplicabilityCheck(intake: Intake): ApplicabilityOutput {
  const states = normalizeStates(intake.states);
  const results = states.map((state) => evaluateState(intake, state));
  return {
    summary: {
      applies: results.filter((r) => r.verdict === "Applies").map((r) => r.state),
      likely_applies: results.filter((r) => r.verdict === "Likely Applies").map((r) => r.state),
      does_not_apply: results.filter((r) => r.verdict === "Does Not Apply").map((r) => r.state),
      insufficient: results.filter((r) => r.verdict === "Insufficient Info").map((r) => r.state),
    },
    results,
    notes: [
      "This deterministic threshold check is a triage aid, not legal advice.",
      "The engine refuses to infer missing facts; review any Insufficient Info result before relying on the summary.",
      "Entity-level sectoral exemptions and SBA-size determinations may require counsel review and external lookup.",
    ],
  };
}

export function registerApplicabilityCheckerTool(server: ToolServer): void {
  server.registerTool(
    "pq_check_applicability",
    {
      title: "Check State Privacy Law Applicability",
      description: `Determine which covered US state consumer privacy laws likely apply to an entity based on deterministic threshold inputs.

This tool is migrated from the old US State Privacy Navigator applicability engine. It does not call an LLM and does not guess missing facts. Use it before drafting clauses, routing DSARs, or resolving multi-state conflicts.`,
      inputSchema: {
        states: z.array(z.string()).optional().describe("Optional state abbreviations to evaluate. Defaults to all PrivacyQuant-covered states."),
        entity: z.object({
          legal_name: z.string().optional(),
          for_profit: z.boolean().optional(),
          naics_code: z.string().optional(),
        }).optional(),
        revenue: z.object({
          annual_gross: z.number().optional(),
        }).optional(),
        consumers: z.object({
          by_state: z.record(z.number()).optional(),
        }).optional(),
        sale_practices: z.object({
          sells_pd: z.boolean().optional(),
          any_revenue_from_sale: z.boolean().optional(),
          percent_revenue_from_sale: z.number().optional(),
          sells_sensitive_data_without_consent: z.boolean().optional(),
        }).optional(),
        sectoral_overlay: z.object({
          government_entity: z.boolean().optional(),
          glba_financial_institution: z.boolean().optional(),
          hipaa_covered_entity_or_ba: z.boolean().optional(),
          non_profit: z.boolean().optional(),
          higher_ed_institution: z.boolean().optional(),
        }).optional(),
        data_categories: z.array(z.string()).optional(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const output = runApplicabilityCheck(args);
      return { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] };
    }
  );
}
