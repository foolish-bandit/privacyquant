/**
 * privacy_exposure_scorer.ts
 *
 * Deterministic privacy exposure triage scorer.
 * Produces a 0–100 score with band, component breakdown, regulator-interest
 * notes, and remediation priorities.
 *
 * Uses findPrecedents (from precedent_matcher) to surface analogous enforcement.
 * Deterministic. No LLM. No live API.
 */

import { rankActions } from "./precedent_matcher.js";
import type { PrecedentMatch } from "./precedent_matcher.js";

export type ExposureBand = "Minimal" | "Low" | "Moderate" | "High" | "Critical";

export interface ExposureScoreInput {
  states?: string[];
  industry?: string;
  sale_or_sharing?: boolean;
  targeted_advertising?: boolean;
  profiling_or_admt?: boolean;
  sensitive_data?: boolean;
  minors_data?: boolean;
  health_data?: boolean;
  biometric_data?: boolean;
  precise_geolocation?: boolean;
  universal_opt_out_gap?: boolean;
  dsar_backlog?: boolean;
  processor_contract_gap?: boolean;
  notice_gap?: boolean;
  security_incident?: boolean;
  repeat_issue?: boolean;
  remediation_started?: boolean;
  top_precedents?: number;
}

export interface ScoreComponent {
  label: string;
  points: number;
  max: number;
  note: string;
}

export interface ExposureScoreResult {
  score: number;
  band: ExposureBand;
  components: ScoreComponent[];
  regulator_interest_notes: string[];
  remediation_priorities: string[];
  analogous_precedents: PrecedentMatch[];
  disclaimer: string;
}

function band(score: number): ExposureBand {
  if (score <= 10) return "Minimal";
  if (score <= 30) return "Low";
  if (score <= 55) return "Moderate";
  if (score <= 75) return "High";
  return "Critical";
}

export function scorePrivacyExposure(
  input: ExposureScoreInput
): ExposureScoreResult {
  const components: ScoreComponent[] = [];
  const regulatorNotes: string[] = [];
  const remediationPriorities: string[] = [];
  const gapTags: string[] = [];

  // ── Data activity risk (max 30) ──────────────────────────────────────────
  let activityPts = 0;
  if (input.sale_or_sharing) { activityPts += 8; gapTags.push("sale_not_disclosed"); }
  if (input.targeted_advertising) { activityPts += 5; gapTags.push("targeted_ads_no_optout"); }
  if (input.profiling_or_admt) { activityPts += 7; gapTags.push("risk_assessment_missing"); }
  if (input.sensitive_data) { activityPts += 5; gapTags.push("sensitive_data_no_consent"); }
  if (input.minors_data) { activityPts += 5; gapTags.push("minor_data_sold"); }
  components.push({
    label: "Data activity risk",
    points: Math.min(activityPts, 30),
    max: 30,
    note:
      activityPts > 0
        ? `Active: ${[
            input.sale_or_sharing ? "sale/sharing" : null,
            input.targeted_advertising ? "targeted advertising" : null,
            input.profiling_or_admt ? "ADMT/profiling" : null,
            input.sensitive_data ? "sensitive data" : null,
            input.minors_data ? "minors data" : null,
          ]
            .filter(Boolean)
            .join(", ")}`
        : "No high-risk data activities flagged.",
  });

  // ── Special category data (max 20) ──────────────────────────────────────
  let specialPts = 0;
  if (input.health_data) { specialPts += 8; gapTags.push("pixel_health_data_disclosure"); }
  if (input.biometric_data) { specialPts += 8; gapTags.push("biometric_no_written_consent"); }
  if (input.precise_geolocation) { specialPts += 4; }
  components.push({
    label: "Special category data",
    points: Math.min(specialPts, 20),
    max: 20,
    note:
      specialPts > 0
        ? `Categories: ${[
            input.health_data ? "health" : null,
            input.biometric_data ? "biometric" : null,
            input.precise_geolocation ? "precise geolocation" : null,
          ]
            .filter(Boolean)
            .join(", ")}`
        : "No special category data flagged.",
  });

  // ── Compliance gap risk (max 30) ─────────────────────────────────────────
  let gapPts = 0;
  if (input.universal_opt_out_gap) { gapPts += 10; gapTags.push("gpc_not_honored"); }
  if (input.dsar_backlog) { gapPts += 8; gapTags.push("rights_request_response_late"); }
  if (input.processor_contract_gap) { gapPts += 7; gapTags.push("processor_contract_inadequate"); }
  if (input.notice_gap) { gapPts += 5; gapTags.push("notice_at_collection_missing"); }
  components.push({
    label: "Compliance gap risk",
    points: Math.min(gapPts, 30),
    max: 30,
    note:
      gapPts > 0
        ? `Gaps: ${[
            input.universal_opt_out_gap ? "GPC/UOOM not honored" : null,
            input.dsar_backlog ? "DSAR backlog" : null,
            input.processor_contract_gap ? "processor contract gap" : null,
            input.notice_gap ? "notice gap" : null,
          ]
            .filter(Boolean)
            .join(", ")}`
        : "No compliance gaps flagged.",
  });

  // ── Aggravating factors (max 20) ─────────────────────────────────────────
  let aggPts = 0;
  if (input.security_incident) { aggPts += 10; gapTags.push("security_failure_breach"); }
  if (input.repeat_issue) aggPts += 10;
  components.push({
    label: "Aggravating factors",
    points: Math.min(aggPts, 20),
    max: 20,
    note:
      aggPts > 0
        ? `Aggravated by: ${[
            input.security_incident ? "security incident" : null,
            input.repeat_issue ? "repeat/known issue" : null,
          ]
            .filter(Boolean)
            .join(", ")}`
        : "No aggravating factors.",
  });

  // ── Remediation credit (max -10) ──────────────────────────────────────────
  let remediationCredit = 0;
  if (input.remediation_started) {
    remediationCredit = -10;
    components.push({
      label: "Remediation credit",
      points: -10,
      max: 0,
      note: "Active remediation underway — 10-point credit applied.",
    });
  }

  const rawScore = components.reduce((sum, c) => sum + c.points, 0);
  const score = Math.max(0, Math.min(100, rawScore));
  const scoreBand = band(score);

  // ── Regulator interest notes ───────────────────────────────────────────────
  const statesUpper = (input.states ?? []).map((s) => s.toUpperCase());
  if (statesUpper.includes("CA") && input.universal_opt_out_gap) {
    regulatorNotes.push(
      "CPPA has made GPC enforcement a top priority. GPC non-compliance was cited in every 2025 CA settlement."
    );
  }
  if (statesUpper.includes("TX") && (input.minors_data || input.biometric_data)) {
    regulatorNotes.push(
      "Texas AG secured a $1B+ settlement in 2025 for biometric data processing without consent."
    );
  }
  if (statesUpper.includes("MD")) {
    regulatorNotes.push(
      "Maryland MODPA's data minimization standard is strictest of any US state law — all processing must be necessary and proportionate."
    );
  }
  if (input.health_data) {
    regulatorNotes.push(
      "Health data at the intersection of CCPA and HIPAA triggers FTC HBNR obligations for non-HIPAA-covered apps."
    );
  }
  if (input.repeat_issue) {
    regulatorNotes.push(
      "Repeat issues are treated as willful violations under most state laws, triggering enhanced penalty tiers."
    );
  }

  // ── Remediation priorities ─────────────────────────────────────────────────
  if (input.universal_opt_out_gap)
    remediationPriorities.push(
      "1. Implement GPC recognition — highest enforcement frequency of any CCPA violation."
    );
  if (input.dsar_backlog)
    remediationPriorities.push(
      "2. Clear DSAR backlog — late responses are independently actionable in most states."
    );
  if (input.processor_contract_gap)
    remediationPriorities.push(
      "3. Execute DPA/service-provider contracts with all processors — use pq_draft_dpa_clause."
    );
  if (input.notice_gap)
    remediationPriorities.push(
      "4. Publish compliant notice at collection — use pq_draft_notice_clause."
    );
  if (input.sensitive_data && input.minors_data)
    remediationPriorities.push(
      "5. Address minors/sensitive data handling — flat bans apply in MD, OR; opt-in required in most states."
    );
  if (input.security_incident)
    remediationPriorities.push(
      "6. Engage breach response counsel — document incident and assess notification obligations."
    );

  // ── Analogous enforcement precedents ──────────────────────────────────────
  const topN = input.top_precedents ?? 3;
  const precedents =
    gapTags.length > 0
      ? rankActions(gapTags, statesUpper, topN)
      : [];

  return {
    score,
    band: scoreBand,
    components,
    regulator_interest_notes: regulatorNotes,
    remediation_priorities: remediationPriorities,
    analogous_precedents: precedents,
    disclaimer:
      "This score is a deterministic triage aid based on the inputs provided. " +
      "It is not an enforcement prediction or legal opinion. " +
      "Actual enforcement risk depends on many factors not captured here.",
  };
}
