/**
 * conflict_resolver.ts
 *
 * For a set of applicable statutes and a compliance dimension, returns:
 * - The binding rule (strictest across all applicable states)
 * - The controlling state
 * - Each state's position
 * - Whether a true conflict exists (rare — most differences are gradients)
 * - Implementation notes
 */

export type Dimension =
  | "sensitive_data_treatment"
  | "sensitive_data_sale"
  | "minor_treatment"
  | "uoom_recognition"
  | "response_time"
  | "appeal_right"
  | "cure_period"
  | "penalty_max"
  | "data_minimization"
  | "processor_contract"
  | "right_to_correction"
  | "right_to_profiling_optout";

export const ALL_DIMENSIONS: Dimension[] = [
  "sensitive_data_treatment",
  "sensitive_data_sale",
  "minor_treatment",
  "uoom_recognition",
  "response_time",
  "appeal_right",
  "cure_period",
  "penalty_max",
  "data_minimization",
  "processor_contract",
  "right_to_correction",
  "right_to_profiling_optout",
];

export interface StatePosition {
  statute: string;
  state: string;
  position: string;
  /** Higher = stricter. Used to determine binding constraint. */
  strictness_rank: number;
  /** Node IDs backing this position */
  node_refs: string[];
}

export interface ConflictResult {
  dimension: Dimension;
  dimension_label: string;
  binding_rule: string;
  controlling_statute: string;
  is_true_conflict: boolean;
  conflict_note?: string;
  implementation_note: string;
  positions: StatePosition[];
}

// ─── Per-dimension, per-state positions ───────────────────────────────────
// strictness_rank: higher = stricter. Binding constraint = highest rank.
// Ties go to the state with the broadest applicability (usually CA).

type DimensionData = Record<string, StatePosition>;

const DIMENSION_DATA: Record<Dimension, DimensionData> = {

  sensitive_data_treatment: {
    "ccpa/cpra": {
      statute: "CCPA/CPRA", state: "CA",
      position: "Right to LIMIT (opt-out) — not opt-in consent. Consumer can direct business to limit use to what is necessary to provide the requested service. Unique structure.",
      strictness_rank: 3,
      node_refs: ["ccpa.sensitive_data.categories", "ccpa.rights.limit_sensitive_pi"],
    },
    "vcdpa": {
      statute: "VCDPA", state: "VA",
      position: "Opt-in consent required before processing.",
      strictness_rank: 4,
      node_refs: ["vcdpa.sensitive_data.consent"],
    },
    "cpa": {
      statute: "CPA", state: "CO",
      position: "Opt-in consent required. CPA Rules add specificity: clear, affirmative, freely given, specific, informed, unambiguous. Pre-checked boxes and agree-by-use are non-compliant.",
      strictness_rank: 5,
      node_refs: ["cpa.sensitive_data.consent"],
    },
    "ctdpa": {
      statute: "CTDPA", state: "CT",
      position: "Opt-in consent required before processing.",
      strictness_rank: 4,
      node_refs: ["ctdpa.sensitive_data.consent"],
    },
    "ucpa": {
      statute: "UCPA", state: "UT",
      position: "Opt-OUT only — notice plus opportunity to opt out before processing. One of two states not requiring opt-in.",
      strictness_rank: 2,
      node_refs: ["ucpa.sensitive_data.opt_out"],
    },
    "tdpsa": {
      statute: "TDPSA", state: "TX",
      position: "Opt-in consent required before processing.",
      strictness_rank: 4,
      node_refs: ["tdpsa.sensitive_data.consent"],
    },
    "ocpa": {
      statute: "OCPA", state: "OR",
      position: "Opt-in consent required. Expanded categories include crime victim status and transgender/non-binary status.",
      strictness_rank: 5,
      node_refs: ["ocpa.sensitive_data.expanded_categories"],
    },
    "mcdpa": {
      statute: "MCDPA", state: "MT",
      position: "Opt-in consent required before processing.",
      strictness_rank: 4,
      node_refs: ["mcdpa.applicability.threshold"],
    },
    "icdpa": {
      statute: "ICDPA", state: "IA",
      position: "Opt-OUT only — notice plus opportunity to opt out. One of two states not requiring opt-in.",
      strictness_rank: 2,
      node_refs: ["icdpa.sensitive_data.opt_out"],
    },
    "incdpa": {
      statute: "INCDPA", state: "IN",
      position: "Opt-in consent required before processing.",
      strictness_rank: 4,
      node_refs: ["incdpa.applicability.threshold"],
    },
    "tipa": {
      statute: "TIPA", state: "TN",
      position: "Opt-in consent required before processing.",
      strictness_rank: 4,
      node_refs: ["tipa.applicability.threshold"],
    },
    "dpdpa": {
      statute: "DPDPA", state: "DE",
      position: "Opt-in consent required before processing.",
      strictness_rank: 4,
      node_refs: ["dpdpa.applicability.threshold"],
    },
    "njdpa": {
      statute: "NJDPA", state: "NJ",
      position: "Opt-in consent required. Expanded categories include financial account info and transgender/non-binary status.",
      strictness_rank: 5,
      node_refs: ["njdpa.sensitive_data.expanded_categories"],
    },
    "nhdpa": {
      statute: "NHDPA", state: "NH",
      position: "Opt-in consent required before processing.",
      strictness_rank: 4,
      node_refs: ["nhdpa.applicability.threshold"],
    },
    "ndpa": {
      statute: "NDPA", state: "NE",
      position: "Opt-in consent required before processing. Small-business exemption forfeit if selling sensitive data without consent.",
      strictness_rank: 4,
      node_refs: ["ndpa.applicability.threshold"],
    },
    "kcdpa": {
      statute: "KCDPA", state: "KY",
      position: "Opt-in consent required before processing.",
      strictness_rank: 4,
      node_refs: ["kcdpa.applicability.threshold"],
    },
    "modpa": {
      statute: "MODPA", state: "MD",
      position: "Opt-in consent required to process AND flat ban on sale — consent does not cure the sale prohibition.",
      strictness_rank: 6,
      node_refs: ["modpa.sensitive_data.ban_on_sale"],
    },
    "mcdpa-mn": {
      statute: "MCDPA-MN", state: "MN",
      position: "Opt-in consent required before processing.",
      strictness_rank: 4,
      node_refs: ["mcdpa_mn.applicability.threshold"],
    },
    "ridtppa": {
      statute: "RIDTPPA", state: "RI",
      position: "Opt-in consent required before processing.",
      strictness_rank: 4,
      node_refs: ["ridtppa.applicability.threshold"],
    },
    "fdbr": {
      statute: "FDBR", state: "FL",
      position: "Opt-in consent required before processing.",
      strictness_rank: 4,
      node_refs: ["fdbr.applicability.threshold"],
    },
  },

  sensitive_data_sale: {
    "ccpa/cpra": {
      statute: "CCPA/CPRA", state: "CA",
      position: "No flat ban. Consumers may opt out of sale/sharing of sensitive PI. Limit-use right applies to use beyond necessary service delivery.",
      strictness_rank: 2,
      node_refs: ["ccpa.sensitive_data.categories", "ccpa.rights.opt_out_sale_sharing"],
    },
    "vcdpa": {
      statute: "VCDPA", state: "VA",
      position: "No flat ban. Opt-in consent required to process; opt-out of sale available.",
      strictness_rank: 3,
      node_refs: ["vcdpa.sensitive_data.consent"],
    },
    "cpa": {
      statute: "CPA", state: "CO",
      position: "No flat ban. Opt-in consent required to process.",
      strictness_rank: 3,
      node_refs: ["cpa.sensitive_data.consent"],
    },
    "tdpsa": {
      statute: "TDPSA", state: "TX",
      position: "No flat ban. Opt-in consent required to process. Specific verbatim notice required when selling sensitive PD.",
      strictness_rank: 3,
      node_refs: ["tdpsa.sensitive_data.consent", "tdpsa.controller_duties.sensitive_data_notice"],
    },
    "modpa": {
      statute: "MODPA", state: "MD",
      position: "FLAT BAN on sale of sensitive data. Consent does not cure the prohibition. Strictest position of any state.",
      strictness_rank: 5,
      node_refs: ["modpa.sensitive_data.ban_on_sale"],
    },
    "ocpa": {
      statute: "OCPA", state: "OR",
      position: "No flat ban. Opt-in consent required to process.",
      strictness_rank: 3,
      node_refs: ["ocpa.sensitive_data.expanded_categories"],
    },
    "ctdpa": {
      statute: "CTDPA", state: "CT",
      position: "No flat ban. Opt-in consent required to process.",
      strictness_rank: 3,
      node_refs: ["ctdpa.sensitive_data.consent"],
    },
  },

  minor_treatment: {
    "ccpa/cpra": {
      statute: "CCPA/CPRA", state: "CA",
      position: "Opt-in required for sale of PI of consumers 13–15. Parental consent for consumers under 13. No flat ban.",
      strictness_rank: 3,
      node_refs: ["ccpa.sensitive_data.categories"],
    },
    "ctdpa": {
      statute: "CTDPA", state: "CT",
      position: "Default OFF for targeted advertising, sale, profiling for consumers known to be 13–15. Under 13: COPPA-aligned.",
      strictness_rank: 4,
      node_refs: ["ctdpa.minors.teen_protections"],
    },
    "njdpa": {
      statute: "NJDPA", state: "NJ",
      position: "Opt-in consent required for consumers 13–16 for sale, targeted advertising, profiling with significant effects.",
      strictness_rank: 4,
      node_refs: ["njdpa.minors.teen_protections"],
    },
    "modpa": {
      statute: "MODPA", state: "MD",
      position: "FLAT BAN (not opt-in, not opt-out — absolute prohibition regardless of consent) on sale and targeted advertising for consumers known to be under 18. Strictest in any US state.",
      strictness_rank: 6,
      node_refs: ["modpa.minors.flat_ban"],
    },
    "vcdpa": {
      statute: "VCDPA", state: "VA",
      position: "Sensitive data definition includes PD of known children. Opt-in consent required to process. No teen-specific provisions beyond child definition.",
      strictness_rank: 2,
      node_refs: ["vcdpa.sensitive_data.consent"],
    },
    "cpa": {
      statute: "CPA", state: "CO",
      position: "Sensitive data includes PD of known children. Opt-in consent required to process.",
      strictness_rank: 2,
      node_refs: ["cpa.sensitive_data.consent"],
    },
    "tdpsa": {
      statute: "TDPSA", state: "TX",
      position: "Sensitive data includes PD of known children. Opt-in consent required. AG active on children's privacy enforcement.",
      strictness_rank: 3,
      node_refs: ["tdpsa.sensitive_data.consent"],
    },
    "mcdpa-mn": {
      statute: "MCDPA-MN", state: "MN",
      position: "Opt-in consent required for processing PD of known consumers under 17 for sale, targeted advertising.",
      strictness_rank: 4,
      node_refs: ["mcdpa_mn.applicability.threshold"],
    },
    "fdbr": {
      statute: "FDBR", state: "FL",
      position: "Penalties trebled ($150k/violation) for violations involving known minor data. Age verification required for under-14 users on covered platforms.",
      strictness_rank: 4,
      node_refs: ["fdbr.enforcement.parameters"],
    },
  },

  uoom_recognition: {
    "ccpa/cpra": {
      statute: "CCPA/CPRA", state: "CA",
      position: "Required. GPC must be recognized as valid opt-out of sale/sharing.",
      strictness_rank: 4,
      node_refs: ["ccpa.rights.opt_out_sale_sharing"],
    },
    "vcdpa": {
      statute: "VCDPA", state: "VA",
      position: "NOT required. Virginia is the notable outlier — no UOOM mandate.",
      strictness_rank: 1,
      node_refs: ["vcdpa.rights.opt_out_sale"],
    },
    "cpa": {
      statute: "CPA", state: "CO",
      position: "Required effective July 2024. Must apply to known users (not just devices).",
      strictness_rank: 4,
      node_refs: ["cpa.rights.opt_out_sale"],
    },
    "ctdpa": {
      statute: "CTDPA", state: "CT",
      position: "Required effective January 1, 2025. Must apply to known users.",
      strictness_rank: 4,
      node_refs: ["ctdpa.uoom.gpc"],
    },
    "ucpa": {
      statute: "UCPA", state: "UT",
      position: "NOT required.",
      strictness_rank: 1,
      node_refs: ["ucpa.rights.narrow_regime"],
    },
    "tdpsa": {
      statute: "TDPSA", state: "TX",
      position: "Not mandated by name. Confirm against current AG guidance.",
      strictness_rank: 2,
      node_refs: ["tdpsa.rights.opt_out_sale"],
    },
    "ocpa": {
      statute: "OCPA", state: "OR",
      position: "Required effective January 1, 2026.",
      strictness_rank: 4,
      node_refs: ["ocpa.uoom.gpc"],
    },
    "mcdpa": {
      statute: "MCDPA", state: "MT",
      position: "Required effective January 1, 2025.",
      strictness_rank: 4,
      node_refs: ["mcdpa.uoom.gpc"],
    },
    "icdpa": {
      statute: "ICDPA", state: "IA",
      position: "NOT required.",
      strictness_rank: 1,
      node_refs: ["icdpa.rights.narrow_regime"],
    },
    "incdpa": {
      statute: "INCDPA", state: "IN",
      position: "Required effective January 1, 2026.",
      strictness_rank: 4,
      node_refs: ["incdpa.uoom_required"],
    },
    "tipa": {
      statute: "TIPA", state: "TN",
      position: "NOT required.",
      strictness_rank: 1,
      node_refs: ["tipa.applicability.threshold"],
    },
    "dpdpa": {
      statute: "DPDPA", state: "DE",
      position: "Required effective January 1, 2026.",
      strictness_rank: 4,
      node_refs: ["dpdpa.uoom.gpc"],
    },
    "njdpa": {
      statute: "NJDPA", state: "NJ",
      position: "Required effective July 15, 2025.",
      strictness_rank: 4,
      node_refs: ["njdpa.uoom.gpc"],
    },
    "nhdpa": {
      statute: "NHDPA", state: "NH",
      position: "Required at effective date (January 1, 2025).",
      strictness_rank: 4,
      node_refs: ["nhdpa.uoom.gpc"],
    },
    "ndpa": {
      statute: "NDPA", state: "NE",
      position: "NOT required.",
      strictness_rank: 1,
      node_refs: ["ndpa.applicability.threshold"],
    },
    "kcdpa": {
      statute: "KCDPA", state: "KY",
      position: "NOT required.",
      strictness_rank: 1,
      node_refs: ["kcdpa.rights.no_correction"],
    },
    "modpa": {
      statute: "MODPA", state: "MD",
      position: "Required at effective date (October 1, 2025).",
      strictness_rank: 4,
      node_refs: ["modpa.uoom.gpc"],
    },
    "mcdpa-mn": {
      statute: "MCDPA-MN", state: "MN",
      position: "Required effective January 1, 2026.",
      strictness_rank: 4,
      node_refs: ["mcdpa_mn.uoom.gpc"],
    },
    "ridtppa": {
      statute: "RIDTPPA", state: "RI",
      position: "Required at effective date (January 1, 2026).",
      strictness_rank: 4,
      node_refs: ["ridtppa.uoom.gpc"],
    },
    "fdbr": {
      statute: "FDBR", state: "FL",
      position: "Required for covered entities.",
      strictness_rank: 4,
      node_refs: ["fdbr.applicability.threshold"],
    },
  },

  response_time: {
    "ccpa/cpra": {
      statute: "CCPA/CPRA", state: "CA",
      position: "45 calendar days, extendable once by 45 days with notice. Total max: 90 days.",
      strictness_rank: 3,
      node_refs: ["ccpa.rights.access"],
    },
    "vcdpa": {
      statute: "VCDPA", state: "VA",
      position: "45 days, extendable once by 45 days with notice. Total max: 90 days.",
      strictness_rank: 3,
      node_refs: ["vcdpa.rights.access"],
    },
    "cpa": {
      statute: "CPA", state: "CO",
      position: "45 days, extendable once by 45 days with notice. Total max: 90 days.",
      strictness_rank: 3,
      node_refs: ["cpa.rights.access"],
    },
    "ctdpa": {
      statute: "CTDPA", state: "CT",
      position: "45 days, extendable once by 45 days with notice. Total max: 90 days.",
      strictness_rank: 3,
      node_refs: ["ctdpa.rights.access"],
    },
    "ucpa": {
      statute: "UCPA", state: "UT",
      position: "45 days, extendable once by 45 days with notice. Total max: 90 days.",
      strictness_rank: 3,
      node_refs: ["ucpa.rights.narrow_regime"],
    },
    "tdpsa": {
      statute: "TDPSA", state: "TX",
      position: "45 days, extendable once by 45 days with notice. Total max: 90 days.",
      strictness_rank: 3,
      node_refs: ["tdpsa.rights.access"],
    },
    "ocpa": {
      statute: "OCPA", state: "OR",
      position: "45 days, extendable once by 45 days with notice. Total max: 90 days.",
      strictness_rank: 3,
      node_refs: ["ocpa.rights.access"],
    },
    "icdpa": {
      statute: "ICDPA", state: "IA",
      position: "90 days initial response — the longest of any state. Extendable by 45 days with notice.",
      strictness_rank: 1,
      node_refs: ["icdpa.rights.narrow_regime"],
    },
    "modpa": {
      statute: "MODPA", state: "MD",
      position: "45 days, extendable once by 45 days with notice. Total max: 90 days.",
      strictness_rank: 3,
      node_refs: ["modpa.rights.access"],
    },
  },

  appeal_right: {
    "ccpa/cpra": {
      statute: "CCPA/CPRA", state: "CA",
      position: "No statutory appeal right. CPPA enforcement is the recourse.",
      strictness_rank: 1,
      node_refs: ["ccpa.enforcement.parameters"],
    },
    "vcdpa": {
      statute: "VCDPA", state: "VA",
      position: "Required. Controller must complete appeal within 60 days. Denial must include AG contact method.",
      strictness_rank: 4,
      node_refs: ["vcdpa.rights.appeal"],
    },
    "cpa": {
      statute: "CPA", state: "CO",
      position: "Required. Appeal must be completed within 45 days (extendable by 60 days). Denial must include AG contact.",
      strictness_rank: 4,
      node_refs: ["cpa.rights.appeal"],
    },
    "ctdpa": {
      statute: "CTDPA", state: "CT",
      position: "Required. Appeal must be completed within 60 days. Denial must include AG contact.",
      strictness_rank: 4,
      node_refs: ["ctdpa.rights.appeal"],
    },
    "ucpa": {
      statute: "UCPA", state: "UT",
      position: "No appeal right — narrowest rights regime.",
      strictness_rank: 1,
      node_refs: ["ucpa.rights.narrow_regime"],
    },
    "tdpsa": {
      statute: "TDPSA", state: "TX",
      position: "Required. Appeal must be completed within 45 days (extendable by 60 days). Denial must include AG contact.",
      strictness_rank: 4,
      node_refs: ["tdpsa.rights.appeal"],
    },
    "ocpa": {
      statute: "OCPA", state: "OR",
      position: "Required. Appeal must be completed within 45 days (extendable by 60 days). Denial must include AG contact.",
      strictness_rank: 4,
      node_refs: ["ocpa.rights.appeal"],
    },
    "icdpa": {
      statute: "ICDPA", state: "IA",
      position: "No appeal right.",
      strictness_rank: 1,
      node_refs: ["icdpa.rights.narrow_regime"],
    },
    "modpa": {
      statute: "MODPA", state: "MD",
      position: "Required. Appeal must be completed within 60 days. Denial must include AG contact.",
      strictness_rank: 4,
      node_refs: ["modpa.rights.appeal"],
    },
    "mcdpa": {
      statute: "MCDPA", state: "MT",
      position: "Required. Appeal must be completed within 60 days.",
      strictness_rank: 4,
      node_refs: ["mcdpa.applicability.threshold"],
    },
    "njdpa": {
      statute: "NJDPA", state: "NJ",
      position: "Required. Appeal must be completed within 45 days.",
      strictness_rank: 4,
      node_refs: ["njdpa.applicability.threshold"],
    },
  },

  cure_period: {
    "ccpa/cpra": {
      statute: "CCPA/CPRA", state: "CA",
      position: "No mandatory cure period as of January 2023. CPPA has discretion to provide opportunity to cure.",
      strictness_rank: 5,
      node_refs: ["ccpa.enforcement.parameters"],
    },
    "vcdpa": {
      statute: "VCDPA", state: "VA",
      position: "30-day cure period in effect.",
      strictness_rank: 2,
      node_refs: ["vcdpa.enforcement.parameters"],
    },
    "cpa": {
      statute: "CPA", state: "CO",
      position: "Cure period SUNSET January 1, 2025. Violations now immediately actionable.",
      strictness_rank: 5,
      node_refs: ["cpa.enforcement.parameters"],
    },
    "ctdpa": {
      statute: "CTDPA", state: "CT",
      position: "Cure period SUNSET January 1, 2025. Violations now immediately actionable.",
      strictness_rank: 5,
      node_refs: ["ctdpa.enforcement.parameters"],
    },
    "ucpa": {
      statute: "UCPA", state: "UT",
      position: "30-day cure period in effect.",
      strictness_rank: 2,
      node_refs: ["ucpa.enforcement.parameters"],
    },
    "tdpsa": {
      statute: "TDPSA", state: "TX",
      position: "30-day cure period in effect.",
      strictness_rank: 2,
      node_refs: ["tdpsa.enforcement.parameters"],
    },
    "ocpa": {
      statute: "OCPA", state: "OR",
      position: "Cure period sunset January 1, 2026.",
      strictness_rank: 4,
      node_refs: ["ocpa.rights.deletion"],
    },
    "mcdpa": {
      statute: "MCDPA", state: "MT",
      position: "Cure period sunset April 1, 2026.",
      strictness_rank: 3,
      node_refs: ["mcdpa.enforcement.parameters"],
    },
    "icdpa": {
      statute: "ICDPA", state: "IA",
      position: "90-day cure period — longest of any state.",
      strictness_rank: 1,
      node_refs: ["icdpa.enforcement.parameters"],
    },
    "tipa": {
      statute: "TIPA", state: "TN",
      position: "60-day cure period in effect.",
      strictness_rank: 2,
      node_refs: ["tipa.enforcement.parameters"],
    },
    "dpdpa": {
      statute: "DPDPA", state: "DE",
      position: "60-day cure period at enactment — verify current status.",
      strictness_rank: 2,
      node_refs: ["dpdpa.enforcement.parameters"],
    },
    "njdpa": {
      statute: "NJDPA", state: "NJ",
      position: "18-month cure period for non-willful violations through approximately July 2026; thereafter AG discretion.",
      strictness_rank: 1,
      node_refs: ["njdpa.enforcement.parameters"],
    },
    "ndpa": {
      statute: "NDPA", state: "NE",
      position: "30-day cure period.",
      strictness_rank: 2,
      node_refs: ["ndpa.enforcement.parameters"],
    },
    "kcdpa": {
      statute: "KCDPA", state: "KY",
      position: "30-day cure period.",
      strictness_rank: 2,
      node_refs: ["kcdpa.enforcement.parameters"],
    },
    "modpa": {
      statute: "MODPA", state: "MD",
      position: "60-day cure period at enactment — verify current status.",
      strictness_rank: 2,
      node_refs: ["modpa.enforcement.parameters"],
    },
    "mcdpa-mn": {
      statute: "MCDPA-MN", state: "MN",
      position: "30-day cure period for entities with documented written privacy programs.",
      strictness_rank: 2,
      node_refs: ["mcdpa_mn.enforcement.parameters"],
    },
    "fdbr": {
      statute: "FDBR", state: "FL",
      position: "45-day cure period.",
      strictness_rank: 2,
      node_refs: ["fdbr.enforcement.parameters"],
    },
  },

  penalty_max: {
    "ccpa/cpra": {
      statute: "CCPA/CPRA", state: "CA",
      position: "$2,500 per violation; $7,500 per intentional violation or violation involving a known minor. Plus private right of action for data breaches ($750/consumer or actual damages).",
      strictness_rank: 4,
      node_refs: ["ccpa.enforcement.parameters"],
    },
    "vcdpa": {
      statute: "VCDPA", state: "VA",
      position: "$7,500 per violation. No private right of action.",
      strictness_rank: 3,
      node_refs: ["vcdpa.enforcement.parameters"],
    },
    "cpa": {
      statute: "CPA", state: "CO",
      position: "$20,000 per violation, capped at $500,000 per related series. No private right of action.",
      strictness_rank: 5,
      node_refs: ["cpa.enforcement.parameters"],
    },
    "ctdpa": {
      statute: "CTDPA", state: "CT",
      position: "$5,000 per willful violation under CUTPA. No private right of action.",
      strictness_rank: 2,
      node_refs: ["ctdpa.enforcement.parameters"],
    },
    "njdpa": {
      statute: "NJDPA", state: "NJ",
      position: "$10,000 first violation, $20,000 subsequent violations under NJ CFA. No private right of action.",
      strictness_rank: 4,
      node_refs: ["njdpa.enforcement.parameters"],
    },
    "tipa": {
      statute: "TIPA", state: "TN",
      position: "$7,500 per violation plus treble damages (3x) for willful violations. No private right of action.",
      strictness_rank: 4,
      node_refs: ["tipa.enforcement.parameters"],
    },
    "fdbr": {
      statute: "FDBR", state: "FL",
      position: "$50,000 per violation; trebled to $150,000 for violations involving minor data, data deletion without consent, or dark patterns. Highest base penalty of any state.",
      strictness_rank: 6,
      node_refs: ["fdbr.enforcement.parameters"],
    },
    "tdpsa": {
      statute: "TDPSA", state: "TX",
      position: "$7,500 per violation. No private right of action.",
      strictness_rank: 3,
      node_refs: ["tdpsa.enforcement.parameters"],
    },
    "ocpa": {
      statute: "OCPA", state: "OR",
      position: "$7,500 per violation. No private right of action.",
      strictness_rank: 3,
      node_refs: ["ocpa.applicability.threshold"],
    },
    "mcdpa": {
      statute: "MCDPA", state: "MT",
      position: "$7,500 per violation. No private right of action.",
      strictness_rank: 3,
      node_refs: ["mcdpa.enforcement.parameters"],
    },
    "modpa": {
      statute: "MODPA", state: "MD",
      position: "Civil penalties under MD CFA framework. No private right of action.",
      strictness_rank: 3,
      node_refs: ["modpa.enforcement.parameters"],
    },
  },

  data_minimization: {
    "ccpa/cpra": {
      statute: "CCPA/CPRA", state: "CA",
      position: "Collect only what is 'reasonably necessary and proportionate' to the disclosed purpose. Standard formulation.",
      strictness_rank: 3,
      node_refs: ["ccpa.controller_duties.privacy_notice"],
    },
    "vcdpa": {
      statute: "VCDPA", state: "VA",
      position: "Collection limited to what is 'adequate, relevant, and reasonably necessary' for the disclosed purpose.",
      strictness_rank: 3,
      node_refs: ["vcdpa.controller_duties.privacy_notice"],
    },
    "cpa": {
      statute: "CPA", state: "CO",
      position: "Collection limited to what is 'reasonably necessary and proportionate' for disclosed purposes.",
      strictness_rank: 3,
      node_refs: ["cpa.controller_duties.privacy_notice"],
    },
    "modpa": {
      statute: "MODPA", state: "MD",
      position: "STRICTEST standard: collection limited to what is 'reasonably necessary AND proportionate' to provide or maintain a specific product or service REQUESTED BY THE CONSUMER. Cannot collect for generalized analytics, product improvement, or third-party marketing without separate justification. Privacy-by-default required.",
      strictness_rank: 6,
      node_refs: ["modpa.data_minimization.strict_standard"],
    },
    "tdpsa": {
      statute: "TDPSA", state: "TX",
      position: "Collection limited to what is 'adequate, relevant, and reasonably necessary' for disclosed purposes.",
      strictness_rank: 3,
      node_refs: ["tdpsa.controller_duties.privacy_notice"],
    },
    "ocpa": {
      statute: "OCPA", state: "OR",
      position: "Collection limited to what is 'adequate, relevant, and reasonably necessary' for disclosed purposes.",
      strictness_rank: 3,
      node_refs: ["ocpa.controller_duties.privacy_notice"],
    },
    "ctdpa": {
      statute: "CTDPA", state: "CT",
      position: "Collection limited to what is 'adequate, relevant, and reasonably necessary.' 2023 amendments added specific data minimization commitments requirement in privacy notices.",
      strictness_rank: 4,
      node_refs: ["ctdpa.controller_duties.privacy_notice"],
    },
  },

  processor_contract: {
    "ccpa/cpra": {
      statute: "CCPA/CPRA", state: "CA",
      position: "Most prescriptive in the US. Contract must include: processing limits; no sale/sharing; no combining with other sources except as permitted; audit rights; certification of understanding; subprocessor flow-down. CCPA Regs § 7051.",
      strictness_rank: 6,
      node_refs: ["ccpa.controller_duties.service_provider_contract"],
    },
    "vcdpa": {
      statute: "VCDPA", state: "VA",
      position: "Standard processor contract requirements: processing only per instructions; confidentiality; deletion/return; audit assistance; subprocessor flow-down; consumer rights and security assistance.",
      strictness_rank: 3,
      node_refs: ["vcdpa.controller_duties.processor_contract"],
    },
    "cpa": {
      statute: "CPA", state: "CO",
      position: "Standard processor contract requirements matching VCDPA baseline.",
      strictness_rank: 3,
      node_refs: ["cpa.controller_duties.processor_contract"],
    },
    "ctdpa": {
      statute: "CTDPA", state: "CT",
      position: "Standard processor contract requirements matching VCDPA baseline.",
      strictness_rank: 3,
      node_refs: ["ctdpa.controller_duties.processor_contract"],
    },
    "tdpsa": {
      statute: "TDPSA", state: "TX",
      position: "Standard processor contract requirements matching VCDPA baseline.",
      strictness_rank: 3,
      node_refs: ["tdpsa.controller_duties.processor_contract"],
    },
    "ocpa": {
      statute: "OCPA", state: "OR",
      position: "Standard processor contract requirements matching VCDPA baseline.",
      strictness_rank: 3,
      node_refs: ["ocpa.controller_duties.processor_contract"],
    },
    "modpa": {
      statute: "MODPA", state: "MD",
      position: "Standard processor contract requirements plus MODPA's strict data minimization standard must be reflected in processor handling obligations.",
      strictness_rank: 4,
      node_refs: ["modpa.controller_duties.processor_contract", "modpa.data_minimization.strict_standard"],
    },
  },

  right_to_correction: {
    "ccpa/cpra": {
      statute: "CCPA/CPRA", state: "CA",
      position: "Available (added by CPRA, effective January 2023).",
      strictness_rank: 3,
      node_refs: ["ccpa.rights.correction"],
    },
    "vcdpa": {
      statute: "VCDPA", state: "VA",
      position: "Available.",
      strictness_rank: 3,
      node_refs: ["vcdpa.rights.correction"],
    },
    "cpa": {
      statute: "CPA", state: "CO",
      position: "Available.",
      strictness_rank: 3,
      node_refs: ["cpa.rights.correction"],
    },
    "ctdpa": {
      statute: "CTDPA", state: "CT",
      position: "Available.",
      strictness_rank: 3,
      node_refs: ["ctdpa.rights.correction"],
    },
    "ucpa": {
      statute: "UCPA", state: "UT",
      position: "NOT available — one of three states without a correction right.",
      strictness_rank: 1,
      node_refs: ["ucpa.rights.narrow_regime"],
    },
    "tdpsa": {
      statute: "TDPSA", state: "TX",
      position: "Available.",
      strictness_rank: 3,
      node_refs: ["tdpsa.rights.correction"],
    },
    "ocpa": {
      statute: "OCPA", state: "OR",
      position: "Available.",
      strictness_rank: 3,
      node_refs: ["ocpa.rights.correction"],
    },
    "icdpa": {
      statute: "ICDPA", state: "IA",
      position: "NOT available.",
      strictness_rank: 1,
      node_refs: ["icdpa.rights.narrow_regime"],
    },
    "kcdpa": {
      statute: "KCDPA", state: "KY",
      position: "NOT available — one of three states without a correction right.",
      strictness_rank: 1,
      node_refs: ["kcdpa.rights.no_correction"],
    },
    "modpa": {
      statute: "MODPA", state: "MD",
      position: "Available.",
      strictness_rank: 3,
      node_refs: ["modpa.rights.correction"],
    },
    "mcdpa-mn": {
      statute: "MCDPA-MN", state: "MN",
      position: "Available. Additionally: right to question profiling decisions and have inaccurate data corrected with re-evaluation — most explicit correction-adjacent right in any US state.",
      strictness_rank: 4,
      node_refs: ["mcdpa_mn.rights.question_profiling"],
    },
  },

  right_to_profiling_optout: {
    "ccpa/cpra": {
      statute: "CCPA/CPRA", state: "CA",
      position: "Limited — automated decision-making technology (ADMT) regulations effective March 2025 impose opt-out rights and risk assessment requirements for consequential profiling.",
      strictness_rank: 3,
      node_refs: ["ccpa.controller_duties.data_protection_assessment"],
    },
    "vcdpa": {
      statute: "VCDPA", state: "VA",
      position: "Opt-out right for profiling that produces legal or similarly significant effects.",
      strictness_rank: 3,
      node_refs: ["vcdpa.rights.opt_out_sale"],
    },
    "cpa": {
      statute: "CPA", state: "CO",
      position: "Opt-out right for profiling with significant effects. CPA Rules § 9 adds: right to access logic and consequences; heightened DPA requirements.",
      strictness_rank: 4,
      node_refs: ["cpa.rights.opt_out_sale", "cpa.controller_duties.data_protection_assessment"],
    },
    "ctdpa": {
      statute: "CTDPA", state: "CT",
      position: "Opt-out right for profiling that produces legal or similarly significant effects.",
      strictness_rank: 3,
      node_refs: ["ctdpa.rights.opt_out_sale"],
    },
    "ucpa": {
      statute: "UCPA", state: "UT",
      position: "NOT available — no profiling opt-out in UCPA.",
      strictness_rank: 1,
      node_refs: ["ucpa.rights.narrow_regime"],
    },
    "icdpa": {
      statute: "ICDPA", state: "IA",
      position: "NOT available.",
      strictness_rank: 1,
      node_refs: ["icdpa.rights.narrow_regime"],
    },
    "incdpa": {
      statute: "INCDPA", state: "IN",
      position: "NOT available — no profiling opt-out in INCDPA.",
      strictness_rank: 1,
      node_refs: ["incdpa.applicability.threshold"],
    },
    "kcdpa": {
      statute: "KCDPA", state: "KY",
      position: "Opt-out right for profiling with significant effects.",
      strictness_rank: 3,
      node_refs: ["kcdpa.rights.no_correction"],
    },
    "modpa": {
      statute: "MODPA", state: "MD",
      position: "Opt-out right for profiling with significant effects.",
      strictness_rank: 3,
      node_refs: ["modpa.rights.opt_out_sale"],
    },
    "mcdpa-mn": {
      statute: "MCDPA-MN", state: "MN",
      position: "Opt-out right PLUS the right to question profiling decisions: request reasoning; be informed of actions to secure a different decision; have inaccurate data corrected and decision re-evaluated. Most explicit profiling accountability right in any US state.",
      strictness_rank: 5,
      node_refs: ["mcdpa_mn.rights.question_profiling"],
    },
    "tdpsa": {
      statute: "TDPSA", state: "TX",
      position: "Opt-out right for profiling with significant effects.",
      strictness_rank: 3,
      node_refs: ["tdpsa.rights.opt_out_sale"],
    },
    "ocpa": {
      statute: "OCPA", state: "OR",
      position: "Opt-out right for profiling with significant effects.",
      strictness_rank: 3,
      node_refs: ["ocpa.rights.opt_out_sale"],
    },
  },

};

const DIMENSION_LABELS: Record<Dimension, string> = {
  sensitive_data_treatment: "Sensitive Data — Processing Standard (opt-in vs opt-out)",
  sensitive_data_sale:      "Sensitive Data — Sale Prohibition",
  minor_treatment:          "Minor and Teen Data Protections",
  uoom_recognition:         "Universal Opt-Out Mechanism (GPC) Recognition",
  response_time:            "Consumer Rights Request Response Deadline",
  appeal_right:             "Right to Appeal Denied Request",
  cure_period:              "Enforcement Cure Period",
  penalty_max:              "Maximum Civil Penalty per Violation",
  data_minimization:        "Data Minimization Standard",
  processor_contract:       "Processor / Service Provider Contract Requirements",
  right_to_correction:      "Right to Correction of Inaccurate Data",
  right_to_profiling_optout:"Right to Opt Out of Profiling / ADM",
};

const IMPLEMENTATION_NOTES: Record<Dimension, string> = {
  sensitive_data_treatment:
    "Design to the strictest opt-in standard (CO CPA Rules specificity). A program meeting CO's standard satisfies all other states. For CA, implement the 'Limit Use' link and notice in addition — it is structurally different but not more burdensome than opt-in.",
  sensitive_data_sale:
    "If operating in MD, architecture must prevent sale of sensitive data entirely — consent cannot cure this. Adtech and data-broker pipelines touching sensitive PD must exclude MD-resident consumers at the data layer.",
  minor_treatment:
    "Design to MD's flat under-18 ban. This means: (a) age detection or known-minor flagging; (b) downstream suppression of sale and targeted advertising for flagged users. No consent mechanism can override MD's prohibition. Programs built to MD exceed all other states.",
  uoom_recognition:
    "Implement GPC recognition in your CMP. Apply it to authenticated (logged-in) users, not only device-level signals. This satisfies CA, CO, CT, MT, NH, NJ, OR, DE, MN, RI, IN, and FL. VA, UT, IA, TN, KY, NE have no mandate — GPC recognition over-satisfies them at no cost.",
  response_time:
    "45-day initial response with a single 45-day extension is the universal standard. IA's 90-day initial window is an outlier — a controller responding in 45 days always satisfies Iowa. Build your intake workflow around 45 days.",
  appeal_right:
    "Build an appeal workflow even if CA and UT don't require one — 16+ states do. The appeal must result in either reversal or a written denial with an AG contact link. CO requires the appeal itself to be resolved in 45 days (extendable 60); most states allow 60 days.",
  cure_period:
    "Do not design your compliance program to rely on cure periods as a safety net. CA, CO, and CT have no mandatory cure period. OR's sunset is January 2026. Treat every state as having no cure right when assessing risk.",
  penalty_max:
    "FL's $50k/$150k penalties apply only to FDBR-covered entities (≥$1B revenue, specific activities). For most controllers, CO's $20k/violation (capped at $500k/series) is the binding ceiling. Build your risk model around CO for the broadest applicability.",
  data_minimization:
    "Design to MD's standard: collect only what is necessary to provide the specific service requested. This means per-purpose collection justification, privacy-by-default settings, and no passive collection for analytics or marketing without explicit user action. A program meeting MD's standard exceeds all others.",
  processor_contract:
    "Build to CA's CCPA Regs § 7051 service provider contract requirements — they are the most prescriptive. A DPA meeting CA's standard (processing limits; no sale/sharing; no data combination; audit rights; subprocessor flow-down; certification) satisfies all other states' processor contract requirements.",
  right_to_correction:
    "Implement correction for all consumers. UT, IA, and KY do not require it, but having the workflow costs nothing and satisfies 17 other states. For MN, also implement the profiling re-evaluation workflow — correction of data used in ADM must trigger re-evaluation of the decision.",
  right_to_profiling_optout:
    "Implement opt-out of profiling with significant effects as standard. For MN, also implement the right to question profiling decisions: consumers can request reasoning, be informed of what to do differently, and trigger re-evaluation after data correction. This is GDPR Art. 22-adjacent and the most complex profiling obligation in any US state.",
};

/** Normalise a statute string to the key used in DIMENSION_DATA */
function normaliseKey(statute: string): string {
  return statute.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

/** Find a state position by statute name (fuzzy) */
function findPosition(
  data: DimensionData,
  statute: string
): StatePosition | undefined {
  const key = normaliseKey(statute);
  // Direct match
  if (data[key]) return data[key];
  // Partial match
  for (const [k, v] of Object.entries(data)) {
    if (k.includes(key) || key.includes(k)) return v;
  }
  return undefined;
}

export function resolveConflict(
  statutes: string[],
  dimensions: Dimension[]
): ConflictResult[] {
  const results: ConflictResult[] = [];

  for (const dim of dimensions) {
    const data = DIMENSION_DATA[dim];
    if (!data) continue;

    // Gather positions for requested statutes
    const positions: StatePosition[] = [];
    for (const statute of statutes) {
      const pos = findPosition(data, statute);
      if (pos) {
        positions.push(pos);
      } else {
        // Not in our data for this dimension — add a placeholder
        positions.push({
          statute,
          state: statute.toUpperCase(),
          position: `No specific data available for ${statute} on this dimension. Verify against the statute directly.`,
          strictness_rank: 0,
          node_refs: [],
        });
      }
    }

    if (positions.length === 0) continue;

    // Find binding constraint (highest strictness_rank)
    const sorted = [...positions].sort((a, b) => b.strictness_rank - a.strictness_rank);
    const binding = sorted[0];

    // True conflict: positions where complying with the strictest rule
    // would affirmatively violate another state's rule (extremely rare)
    // In US privacy law, the stricter rule almost always satisfies the others —
    // the main exception is CA's opt-out/limit-use structure vs other states' opt-in.
    let is_true_conflict = false;
    let conflict_note: string | undefined;

    if (dim === "sensitive_data_treatment") {
      const hasCA = positions.some((p) => p.statute === "CCPA/CPRA");
      const hasOptIn = positions.some((p) => p.strictness_rank >= 4);
      if (hasCA && hasOptIn) {
        is_true_conflict = true;
        conflict_note =
          "CA uses a 'right to limit' (opt-out) structure while other states use opt-in consent. " +
          "These are structurally different — implement both: opt-in consent for non-CA consumers, " +
          "and a 'Limit Use of Sensitive PI' link for CA consumers. A single opt-in flow that also " +
          "provides the CA limit-use mechanism satisfies both.";
      }
    }

    results.push({
      dimension: dim,
      dimension_label: DIMENSION_LABELS[dim],
      binding_rule: binding.position,
      controlling_statute: binding.statute,
      is_true_conflict,
      conflict_note,
      implementation_note: IMPLEMENTATION_NOTES[dim],
      positions,
    });
  }

  return results;
}
