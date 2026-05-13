/**
 * applicability_checker.ts
 *
 * Deterministic evaluation of which US state consumer privacy laws likely apply
 * based on controller/business threshold inputs. No LLM. No live API.
 *
 * Returns verdicts: Applies | Likely Applies | Does Not Apply | Insufficient Info
 */

export type ApplicabilityVerdict =
  | "Applies"
  | "Likely Applies"
  | "Does Not Apply"
  | "Insufficient Info";

export interface ApplicabilityInput {
  annual_revenue_usd?: number;
  consumers_processed?: number;
  households_processed?: number;
  revenue_pct_from_sale?: number;
  states_operating?: string[];
  is_nonprofit?: boolean;
  is_government?: boolean;
  is_hipaa_covered_entity?: boolean;
  is_glba_covered?: boolean;
  is_higher_education?: boolean;
}

export interface StatuteApplicabilityResult {
  statute: string;
  state: string;
  verdict: ApplicabilityVerdict;
  reason: string;
  threshold_met: string[];
  threshold_not_met: string[];
  node_ids: string[];
  needed_inputs: string[];
}

export interface ApplicabilityCheckResult {
  results: StatuteApplicabilityResult[];
  any_applies: boolean;
  applicable_statutes: string[];
  summary: string;
  needed_inputs: string[];
  disclaimer: string;
}

const DISCLAIMER =
  "Applicability determinations are triage aids only. Entity-level and data-level " +
  "exemptions require fact-specific analysis by qualified counsel. This output is not " +
  "legal advice.";

function missingAll(inputs: ApplicabilityInput): boolean {
  return (
    inputs.annual_revenue_usd === undefined &&
    inputs.consumers_processed === undefined &&
    inputs.households_processed === undefined &&
    inputs.revenue_pct_from_sale === undefined
  );
}

function checkEntityExemptions(inputs: ApplicabilityInput): string | null {
  if (inputs.is_government) return "Government entity — exempt from all covered state laws.";
  if (inputs.is_hipaa_covered_entity)
    return "HIPAA-covered entity — note data-level exemptions apply; entity itself may still be covered for non-PHI data.";
  return null;
}

function evaluateCCPA(inputs: ApplicabilityInput): StatuteApplicabilityResult {
  const needed: string[] = [];
  const met: string[] = [];
  const notMet: string[] = [];
  let verdict: ApplicabilityVerdict = "Insufficient Info";
  let reason = "";

  // Entity exemptions
  if (inputs.is_nonprofit)
    return {
      statute: "CCPA/CPRA",
      state: "CA",
      verdict: "Does Not Apply",
      reason: "Non-profit entities are generally exempt from CCPA/CPRA.",
      threshold_met: [],
      threshold_not_met: [],
      node_ids: ["ccpa.applicability.threshold"],
      needed_inputs: [],
    };

  const rev = inputs.annual_revenue_usd;
  const consumers =
    (inputs.consumers_processed ?? 0) + (inputs.households_processed ?? 0);
  const salePct = inputs.revenue_pct_from_sale;

  if (rev === undefined) needed.push("annual_revenue_usd");
  if (inputs.consumers_processed === undefined && inputs.households_processed === undefined)
    needed.push("consumers_processed");
  if (salePct === undefined) needed.push("revenue_pct_from_sale");

  // Prong (a): revenue > $26,625,000
  if (rev !== undefined) {
    if (rev > 26_625_000) met.push("Revenue > $26,625,000 (prong a)");
    else notMet.push("Revenue ≤ $26,625,000 (prong a not met)");
  }

  // Prong (b): ≥ 100,000 consumers or households
  if (inputs.consumers_processed !== undefined || inputs.households_processed !== undefined) {
    if (consumers >= 100_000) met.push("≥ 100,000 consumers/households (prong b)");
    else notMet.push("< 100,000 consumers/households (prong b not met)");
  }

  // Prong (c): ≥ 50% revenue from sale/sharing
  if (salePct !== undefined) {
    if (salePct >= 50) met.push("≥ 50% revenue from sale/sharing (prong c)");
    else notMet.push("< 50% revenue from sale/sharing (prong c not met)");
  }

  if (met.length > 0) {
    verdict = "Applies";
    reason = `Meets prong(s): ${met.join("; ")}`;
  } else if (needed.length > 0) {
    verdict = "Insufficient Info";
    reason = "Cannot determine — missing threshold inputs.";
  } else {
    verdict = "Does Not Apply";
    reason = "Does not meet any of the three CCPA applicability prongs.";
  }

  return {
    statute: "CCPA/CPRA",
    state: "CA",
    verdict,
    reason,
    threshold_met: met,
    threshold_not_met: notMet,
    node_ids: ["ccpa.applicability.threshold"],
    needed_inputs: needed,
  };
}

function evaluateGenericState(
  statute: string,
  state: string,
  nodeId: string,
  consumerThreshold: number,
  inputs: ApplicabilityInput,
  revenueFloor?: number,
  salePctThreshold?: number
): StatuteApplicabilityResult {
  const needed: string[] = [];
  const met: string[] = [];
  const notMet: string[] = [];
  let verdict: ApplicabilityVerdict = "Insufficient Info";
  let reason = "";

  if (inputs.is_nonprofit && ["VCDPA", "CPA", "CTDPA", "OCPA", "MODPA"].includes(statute))
    return {
      statute,
      state,
      verdict: "Does Not Apply",
      reason: `Non-profits are exempt from ${statute}.`,
      threshold_met: [],
      threshold_not_met: [],
      node_ids: [nodeId],
      needed_inputs: [],
    };

  const consumers =
    (inputs.consumers_processed ?? 0) + (inputs.households_processed ?? 0);

  if (inputs.consumers_processed === undefined && inputs.households_processed === undefined)
    needed.push("consumers_processed");

  if (revenueFloor !== undefined && inputs.annual_revenue_usd === undefined)
    needed.push("annual_revenue_usd");

  // Revenue floor (e.g. UT requires ≥ $25M, TN requires ≥ $25M)
  if (revenueFloor !== undefined && inputs.annual_revenue_usd !== undefined) {
    if (inputs.annual_revenue_usd < revenueFloor) {
      return {
        statute,
        state,
        verdict: "Does Not Apply",
        reason: `Annual revenue < $${revenueFloor.toLocaleString()} — below ${statute} revenue floor.`,
        threshold_met: [],
        threshold_not_met: [`Revenue < $${revenueFloor.toLocaleString()}`],
        node_ids: [nodeId],
        needed_inputs: [],
      };
    }
    met.push(`Revenue ≥ $${revenueFloor.toLocaleString()}`);
  }

  // Primary consumer-count threshold
  if (inputs.consumers_processed !== undefined || inputs.households_processed !== undefined) {
    if (consumers >= consumerThreshold) {
      met.push(`≥ ${consumerThreshold.toLocaleString()} consumers processed`);
    } else if (salePctThreshold !== undefined && inputs.revenue_pct_from_sale !== undefined) {
      if (inputs.revenue_pct_from_sale >= salePctThreshold) {
        met.push(`≥ ${salePctThreshold}% revenue from sale of PI`);
      } else {
        notMet.push(`< ${consumerThreshold.toLocaleString()} consumers AND < ${salePctThreshold}% sale revenue`);
      }
    } else {
      notMet.push(`< ${consumerThreshold.toLocaleString()} consumers processed`);
    }
  }

  if (met.length > 0) {
    verdict = "Applies";
    reason = met.join("; ");
  } else if (needed.length > 0) {
    verdict = "Insufficient Info";
    reason = "Missing threshold inputs.";
  } else {
    verdict = "Does Not Apply";
    reason = `Does not meet ${statute} applicability threshold.`;
  }

  return {
    statute,
    state,
    verdict,
    reason,
    threshold_met: met,
    threshold_not_met: notMet,
    node_ids: [nodeId],
    needed_inputs: needed,
  };
}

function evaluateFDBR(inputs: ApplicabilityInput): StatuteApplicabilityResult {
  const rev = inputs.annual_revenue_usd;
  if (rev === undefined)
    return {
      statute: "FDBR",
      state: "FL",
      verdict: "Insufficient Info",
      reason: "FDBR requires annual revenue > $1 billion — revenue not provided.",
      threshold_met: [],
      threshold_not_met: [],
      node_ids: ["fdbr.applicability.threshold"],
      needed_inputs: ["annual_revenue_usd"],
    };
  if (rev < 1_000_000_000)
    return {
      statute: "FDBR",
      state: "FL",
      verdict: "Does Not Apply",
      reason: "Annual revenue < $1B — below FDBR revenue threshold.",
      threshold_met: [],
      threshold_not_met: ["Revenue < $1,000,000,000"],
      node_ids: ["fdbr.applicability.threshold"],
      needed_inputs: [],
    };
  return {
    statute: "FDBR",
    state: "FL",
    verdict: "Likely Applies",
    reason:
      "Revenue ≥ $1B meets the FDBR revenue prong. FDBR also requires specific activity prongs — verify independently.",
    threshold_met: ["Revenue ≥ $1,000,000,000"],
    threshold_not_met: [],
    node_ids: ["fdbr.applicability.threshold"],
    needed_inputs: [],
  };
}

export function checkApplicability(
  inputs: ApplicabilityInput
): ApplicabilityCheckResult {
  const states = inputs.states_operating?.map((s) => s.toUpperCase()) ?? [];

  // Entity-level full exemption
  if (inputs.is_government) {
    return {
      results: [],
      any_applies: false,
      applicable_statutes: [],
      summary: "Government entity — exempt from all covered state consumer privacy laws.",
      needed_inputs: [],
      disclaimer: DISCLAIMER,
    };
  }

  // Define which statutes to evaluate based on states_operating, or all if not specified
  const allStatutes: Array<() => StatuteApplicabilityResult> = [];

  const wantState = (s: string) => states.length === 0 || states.includes(s);

  if (wantState("CA")) allStatutes.push(() => evaluateCCPA(inputs));
  if (wantState("VA"))
    allStatutes.push(() =>
      evaluateGenericState("VCDPA", "VA", "vcdpa.applicability.threshold", 100_000, inputs)
    );
  if (wantState("CO"))
    allStatutes.push(() =>
      evaluateGenericState("CPA", "CO", "cpa.applicability.threshold", 100_000, inputs, undefined, 25)
    );
  if (wantState("CT"))
    allStatutes.push(() =>
      evaluateGenericState("CTDPA", "CT", "ctdpa.applicability.threshold", 100_000, inputs, undefined, 25)
    );
  if (wantState("UT"))
    allStatutes.push(() =>
      evaluateGenericState("UCPA", "UT", "ucpa.rights.narrow_regime", 100_000, inputs, 25_000_000)
    );
  if (wantState("TX"))
    allStatutes.push(() =>
      evaluateGenericState("TDPSA", "TX", "tdpsa.rights.access", 100_000, inputs)
    );
  if (wantState("OR"))
    allStatutes.push(() =>
      evaluateGenericState("OCPA", "OR", "ocpa.applicability.threshold", 100_000, inputs, undefined, 25)
    );
  if (wantState("MT"))
    allStatutes.push(() =>
      evaluateGenericState("MCDPA", "MT", "mcdpa.applicability.threshold", 50_000, inputs, undefined, 25)
    );
  if (wantState("IA"))
    allStatutes.push(() =>
      evaluateGenericState("ICDPA", "IA", "icdpa.rights.narrow_regime", 100_000, inputs, undefined, 50)
    );
  if (wantState("MD"))
    allStatutes.push(() =>
      evaluateGenericState("MODPA", "MD", "modpa.rights.access", 35_000, inputs, undefined, 20)
    );
  if (wantState("NJ"))
    allStatutes.push(() =>
      evaluateGenericState("NJDPA", "NJ", "njdpa.applicability.threshold", 100_000, inputs, undefined, 25)
    );
  if (wantState("NH"))
    allStatutes.push(() =>
      evaluateGenericState("NHDPA", "NH", "nhdpa.applicability.threshold", 35_000, inputs, undefined, 10)
    );
  if (wantState("DE"))
    allStatutes.push(() =>
      evaluateGenericState("DPDPA", "DE", "dpdpa.applicability.threshold", 35_000, inputs, undefined, 20)
    );
  if (wantState("MN"))
    allStatutes.push(() =>
      evaluateGenericState("MCDPA-MN", "MN", "mcdpa_mn.applicability.threshold", 100_000, inputs, undefined, 25)
    );
  if (wantState("KY"))
    allStatutes.push(() =>
      evaluateGenericState("KCDPA", "KY", "kcdpa.applicability.threshold", 100_000, inputs, undefined, 25)
    );
  if (wantState("IN"))
    allStatutes.push(() =>
      evaluateGenericState("INCDPA", "IN", "incdpa.rights.access", 100_000, inputs, undefined, 25)
    );
  if (wantState("TN"))
    allStatutes.push(() =>
      evaluateGenericState("TIPA", "TN", "tipa.rights.access", 175_000, inputs, 25_000_000, 25)
    );
  if (wantState("NE"))
    allStatutes.push(() =>
      evaluateGenericState("NDPA", "NE", "ndpa.rights.access", 100_000, inputs, undefined, 25)
    );
  if (wantState("RI"))
    allStatutes.push(() =>
      evaluateGenericState("RIDTPPA", "RI", "ridtppa.rights.access", 35_000, inputs, undefined, 20)
    );
  if (wantState("FL"))
    allStatutes.push(() => evaluateFDBR(inputs));

  const results = allStatutes.map((fn) => fn());
  const applicable = results.filter(
    (r) => r.verdict === "Applies" || r.verdict === "Likely Applies"
  );
  const neededAll = [
    ...new Set(results.flatMap((r) => r.needed_inputs)),
  ];

  const summary =
    applicable.length > 0
      ? `${applicable.length} statute(s) likely apply: ${applicable.map((r) => r.statute).join(", ")}.`
      : results.every((r) => r.verdict === "Does Not Apply")
      ? "No covered state privacy laws appear to apply based on inputs provided."
      : "Applicability cannot be fully determined — provide missing inputs.";

  return {
    results,
    any_applies: applicable.length > 0,
    applicable_statutes: applicable.map((r) => r.statute),
    summary,
    needed_inputs: neededAll,
    disclaimer: DISCLAIMER,
  };
}
