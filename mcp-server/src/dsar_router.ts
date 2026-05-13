/**
 * dsar_router.ts
 *
 * Deterministic routing for Data Subject Access Requests (DSARs) under US state privacy laws.
 *
 * Given a consumer's state of residence and the right invoked, returns:
 * - Whether the right exists under the applicable statute
 * - Response deadline (initial + maximum with extension)
 * - Appeal requirement and deadline
 * - Operative exceptions and practitioner notes
 * - Node IDs backing every answer
 *
 * No LLM sub-call. Entirely deterministic from statutory data encoded here.
 */

export type RightType =
  | "access"
  | "deletion"
  | "correction"
  | "portability"
  | "opt_out_sale"
  | "opt_out_targeted_advertising"
  | "opt_out_profiling"
  | "limit_sensitive_pi"
  | "appeal";

export const RIGHT_LABELS: Record<RightType, string> = {
  access:                      "Right to Access / Confirm Processing",
  deletion:                    "Right to Deletion",
  correction:                  "Right to Correction",
  portability:                 "Right to Data Portability",
  opt_out_sale:                "Right to Opt Out of Sale",
  opt_out_targeted_advertising:"Right to Opt Out of Targeted Advertising",
  opt_out_profiling:           "Right to Opt Out of Profiling",
  limit_sensitive_pi:          "Right to Limit Use of Sensitive PI (CA only)",
  appeal:                      "Right to Appeal Denied Request",
};

export interface RightAvailability {
  exists: boolean;
  /** If exists: initial response deadline in days */
  initial_deadline_days?: number;
  /** If exists: maximum deadline with extension in days */
  max_deadline_days?: number;
  /** If exists: whether a right to appeal exists for denied requests */
  appeal_right?: boolean;
  /** If appeal_right: deadline to complete appeal in days */
  appeal_deadline_days?: number;
  /** Specific limitations or conditions on this right */
  limitations: string[];
  /** Practitioner notes — edge cases, gotchas, things to flag */
  notes: string[];
  /** Node IDs backing this answer */
  node_refs: string[];
}

export interface StatuteRights {
  statute: string;
  state: string;
  /** Effective date of the applicable statute */
  effective_date: string;
  /** Whether a cure period is currently in effect */
  cure_period?: string;
  rights: Partial<Record<RightType, RightAvailability>>;
}

export interface DSARRouteResult {
  consumer_state: string;
  right_invoked: RightType;
  right_label: string;
  applicable_statute: StatuteRights | null;
  /** Whether the controller must respond at all */
  must_respond: boolean;
  /** Concise response directive for the practitioner */
  directive: string;
  /** Any cross-state considerations if controller is subject to multiple laws */
  multi_state_notes: string[];
}

// ─── Statutory data ────────────────────────────────────────────────────────
// Keyed by lowercase state abbreviation → statutory rights profile

const STATUTE_DATA: Record<string, StatuteRights> = {
  ca: {
    statute: "CCPA/CPRA",
    state: "CA",
    effective_date: "2020-01-01",
    cure_period: "None — CPPA has discretion; no mandatory cure period since Jan 2023",
    rights: {
      access: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [
          "Free twice per 12-month period; reasonable fee may apply for subsequent requests",
          "Verification standard: 'reasonably calculated' to confirm requester identity",
          "For sensitive requests (specific pieces, high-risk deletion): stricter verification",
        ],
        notes: [
          "CA covers employee and B2B contact data — broader scope than all other states",
          "Must provide both categories AND specific pieces upon request",
          "Designate two request methods (web form + email or toll-free number)",
        ],
        node_refs: ["ccpa.rights.access"],
      },
      deletion: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [
          "Must direct service providers and contractors to delete",
          "Nine enumerated exceptions including transactional, security, legal compliance",
        ],
        notes: [
          "Unlike most states, no appeal right — denial is subject to CPPA/AG enforcement",
          "Must inform consumer if deletion is impossible or would require disproportionate effort",
        ],
        node_refs: ["ccpa.rights.deletion"],
      },
      correction: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: ["Must use 'commercially reasonable efforts'"],
        notes: ["Added by CPRA; effective January 2023"],
        node_refs: ["ccpa.rights.correction"],
      },
      portability: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: ["Machine-readable format where technically feasible", "Trade secrets need not be disclosed"],
        notes: [],
        node_refs: ["ccpa.rights.portability"],
      },
      opt_out_sale: {
        exists: true,
        initial_deadline_days: 15,
        max_deadline_days: 15,
        appeal_right: false,
        limitations: [
          "Must honor within 15 business days",
          "GPC must be recognized as valid opt-out signal",
          "Both 'sale' (monetary consideration) AND 'sharing' (cross-context behavioral advertising) covered",
        ],
        notes: [
          "CA's 'sharing' concept is broader than other states' sale definitions",
          "Must post 'Do Not Sell or Share My Personal Information' link on homepage",
          "Must honor GPC signal — unlike VA, UT, IA, TN, KY, NE",
        ],
        node_refs: ["ccpa.rights.opt_out_sale_sharing", "ccpa.sale_sharing.distinction"],
      },
      opt_out_targeted_advertising: {
        exists: true,
        initial_deadline_days: 15,
        max_deadline_days: 15,
        appeal_right: false,
        limitations: ["Covered under 'sharing' for cross-context behavioral advertising"],
        notes: ["Structural overlap with opt-out of sale in CA — both use the same 'Do Not Sell or Share' mechanism"],
        node_refs: ["ccpa.rights.opt_out_sale_sharing"],
      },
      opt_out_profiling: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: ["ADMT (Automated Decision-Making Technology) regs effective March 2025", "Applies to consequential decisions: employment, housing, credit, health, education"],
        notes: ["Most complex profiling regime of any US state — CPPA regs are detailed and prescriptive"],
        node_refs: ["ccpa.controller_duties.data_protection_assessment"],
      },
      limit_sensitive_pi: {
        exists: true,
        initial_deadline_days: 15,
        max_deadline_days: 15,
        appeal_right: false,
        limitations: [
          "CA-unique right — no equivalent in other states",
          "Opt-out structure (right to limit), NOT opt-in consent",
          "Must provide 'Limit the Use of My Sensitive Personal Information' link",
        ],
        notes: [
          "This is structurally different from other states' opt-in consent for sensitive data",
          "Processing can continue for necessary service delivery even after consumer limits use",
        ],
        node_refs: ["ccpa.rights.limit_sensitive_pi", "ccpa.sensitive_data.categories"],
      },
      appeal: {
        exists: false,
        limitations: [],
        notes: ["No appeal right in CA — CPPA/AG enforcement is the consumer's recourse for denied requests"],
        node_refs: ["ccpa.enforcement.parameters"],
      },
    },
  },

  va: {
    statute: "VCDPA",
    state: "VA",
    effective_date: "2023-01-01",
    cure_period: "30 days — in effect",
    rights: {
      access: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 60,
        limitations: ["Free twice per 12-month period; reasonable fee thereafter"],
        notes: ["Excludes employees and B2B contacts from 'consumer'"],
        node_refs: ["vcdpa.rights.access", "vcdpa.rights.appeal"],
      },
      deletion: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 60,
        limitations: ["Standard exceptions (transactional, security, legal obligation, legal claims)"],
        notes: [],
        node_refs: ["vcdpa.rights.deletion", "vcdpa.rights.appeal"],
      },
      correction: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 60,
        limitations: [],
        notes: [],
        node_refs: ["vcdpa.rights.correction", "vcdpa.rights.appeal"],
      },
      portability: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 60,
        limitations: ["Trade secrets need not be disclosed"],
        notes: [],
        node_refs: ["vcdpa.rights.portability", "vcdpa.rights.appeal"],
      },
      opt_out_sale: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [
          "VA 'sale' defined narrowly — monetary consideration only",
          "Does NOT cover sharing for targeted advertising as 'sale'",
          "No UOOM (GPC) recognition required — controller may use a form-based mechanism",
        ],
        notes: [
          "VA's narrow sale definition is a key difference from CA — many ad-tech transfers that are 'sale' in CA are not 'sale' in VA",
          "Still need separate opt-out for targeted advertising",
        ],
        node_refs: ["vcdpa.rights.opt_out_sale"],
      },
      opt_out_targeted_advertising: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [],
        notes: ["Separate right from opt-out of sale — targeted advertising opt-out is broader than VA's narrow sale definition"],
        node_refs: ["vcdpa.rights.opt_out_sale"],
      },
      opt_out_profiling: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: ["Only for profiling that produces legal or similarly significant effects"],
        notes: [],
        node_refs: ["vcdpa.rights.opt_out_sale"],
      },
      appeal: {
        exists: true,
        initial_deadline_days: 60,
        max_deadline_days: 60,
        appeal_right: false,
        limitations: ["Appeal must be completed within 60 days of receipt", "Denial must include mechanism to contact VA AG"],
        notes: [],
        node_refs: ["vcdpa.rights.appeal"],
      },
    },
  },

  co: {
    statute: "CPA",
    state: "CO",
    effective_date: "2023-07-01",
    cure_period: "SUNSET January 1, 2025 — violations now immediately actionable",
    rights: {
      access: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 45,
        limitations: ["Free twice per 12-month period"],
        notes: ["Cure period has sunset — no mandatory opportunity to cure before enforcement"],
        node_refs: ["cpa.rights.access", "cpa.rights.appeal"],
      },
      deletion: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 45,
        limitations: ["Standard exceptions apply"],
        notes: [],
        node_refs: ["cpa.rights.deletion", "cpa.rights.appeal"],
      },
      correction: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 45,
        limitations: [],
        notes: [],
        node_refs: ["cpa.rights.correction", "cpa.rights.appeal"],
      },
      portability: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 45,
        limitations: ["Trade secrets need not be disclosed"],
        notes: [],
        node_refs: ["cpa.rights.portability", "cpa.rights.appeal"],
      },
      opt_out_sale: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [
          "GPC recognition required effective July 2024",
          "Must apply to known users (not just device-level)",
        ],
        notes: [],
        node_refs: ["cpa.rights.opt_out_sale"],
      },
      opt_out_targeted_advertising: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: ["GPC required"],
        notes: [],
        node_refs: ["cpa.rights.opt_out_sale"],
      },
      opt_out_profiling: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [
          "Only for profiling with legal or significant effects",
          "CPA Rules § 9 adds right to access logic and consequences",
        ],
        notes: ["CPA has the most detailed profiling rules of any state after MN"],
        node_refs: ["cpa.rights.opt_out_sale", "cpa.controller_duties.data_protection_assessment"],
      },
      appeal: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 105,
        appeal_right: false,
        limitations: [
          "Appeal must be completed within 45 days (extendable by 60 days with notice)",
          "Denial must include mechanism to contact CO AG",
        ],
        notes: ["CO has the shortest appeal completion window at 45 days (extendable)"],
        node_refs: ["cpa.rights.appeal"],
      },
    },
  },

  ct: {
    statute: "CTDPA",
    state: "CT",
    effective_date: "2023-07-01",
    cure_period: "SUNSET January 1, 2025 — violations now immediately actionable",
    rights: {
      access: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 60,
        limitations: ["Excludes solely-payment-transaction data from consumer count threshold"],
        notes: [],
        node_refs: ["ctdpa.rights.access", "ctdpa.rights.appeal"],
      },
      deletion: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 60,
        limitations: [],
        notes: [],
        node_refs: ["ctdpa.rights.deletion", "ctdpa.rights.appeal"],
      },
      correction: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 60,
        limitations: [],
        notes: [],
        node_refs: ["ctdpa.rights.correction", "ctdpa.rights.appeal"],
      },
      portability: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 60,
        limitations: [],
        notes: [],
        node_refs: ["ctdpa.rights.portability", "ctdpa.rights.appeal"],
      },
      opt_out_sale: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: ["GPC recognition required effective January 1, 2025"],
        notes: [],
        node_refs: ["ctdpa.rights.opt_out_sale", "ctdpa.uoom.gpc"],
      },
      opt_out_targeted_advertising: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: ["GPC required"],
        notes: [],
        node_refs: ["ctdpa.rights.opt_out_sale"],
      },
      opt_out_profiling: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: ["Only for profiling with legal or significant effects"],
        notes: [],
        node_refs: ["ctdpa.rights.opt_out_sale"],
      },
      appeal: {
        exists: true,
        initial_deadline_days: 60,
        max_deadline_days: 60,
        appeal_right: false,
        limitations: ["Appeal must be completed within 60 days", "Denial must include mechanism to contact CT AG"],
        notes: [],
        node_refs: ["ctdpa.rights.appeal"],
      },
    },
  },

  ut: {
    statute: "UCPA",
    state: "UT",
    effective_date: "2023-12-31",
    cure_period: "30 days — in effect",
    rights: {
      access: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [],
        notes: ["No appeal right — narrowest rights regime"],
        node_refs: ["ucpa.rights.narrow_regime"],
      },
      deletion: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [],
        notes: [],
        node_refs: ["ucpa.rights.narrow_regime"],
      },
      correction: {
        exists: false,
        limitations: [],
        notes: ["⚠️ No correction right in Utah — one of three states lacking this right (with IA and KY)"],
        node_refs: ["ucpa.rights.narrow_regime"],
      },
      portability: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [],
        notes: [],
        node_refs: ["ucpa.rights.narrow_regime"],
      },
      opt_out_sale: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: ["No UOOM recognition required"],
        notes: [],
        node_refs: ["ucpa.rights.narrow_regime"],
      },
      opt_out_targeted_advertising: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [],
        notes: [],
        node_refs: ["ucpa.rights.narrow_regime"],
      },
      opt_out_profiling: {
        exists: false,
        limitations: [],
        notes: ["⚠️ No profiling opt-out in UCPA"],
        node_refs: ["ucpa.rights.narrow_regime"],
      },
      appeal: {
        exists: false,
        limitations: [],
        notes: ["⚠️ No appeal right in Utah"],
        node_refs: ["ucpa.rights.narrow_regime"],
      },
    },
  },

  tx: {
    statute: "TDPSA",
    state: "TX",
    effective_date: "2024-07-01",
    cure_period: "30 days — in effect",
    rights: {
      access: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 45,
        limitations: [],
        notes: ["AG has been notably active post-enactment — assume scrutiny on process"],
        node_refs: ["tdpsa.rights.access", "tdpsa.rights.appeal"],
      },
      deletion: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 45,
        limitations: [],
        notes: [],
        node_refs: ["tdpsa.rights.deletion", "tdpsa.rights.appeal"],
      },
      correction: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 45,
        limitations: [],
        notes: [],
        node_refs: ["tdpsa.rights.correction", "tdpsa.rights.appeal"],
      },
      portability: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 45,
        limitations: [],
        notes: [],
        node_refs: ["tdpsa.rights.portability", "tdpsa.rights.appeal"],
      },
      opt_out_sale: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: ["UOOM (GPC) recognition not mandated by name — verify against current AG guidance"],
        notes: [],
        node_refs: ["tdpsa.rights.opt_out_sale"],
      },
      opt_out_targeted_advertising: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [],
        notes: [],
        node_refs: ["tdpsa.rights.opt_out_sale"],
      },
      opt_out_profiling: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: ["Only for profiling with significant effects"],
        notes: [],
        node_refs: ["tdpsa.rights.opt_out_sale"],
      },
      appeal: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 105,
        appeal_right: false,
        limitations: ["Appeal must be completed within 45 days (extendable by 60 days)", "Denial must include method to contact TX AG"],
        notes: [],
        node_refs: ["tdpsa.rights.appeal"],
      },
    },
  },

  or: {
    statute: "OCPA",
    state: "OR",
    effective_date: "2024-07-01",
    cure_period: "Sunset January 1, 2026",
    rights: {
      access: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 45,
        limitations: [],
        notes: [],
        node_refs: ["ocpa.rights.access", "ocpa.rights.appeal"],
      },
      deletion: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 45,
        limitations: [],
        notes: [],
        node_refs: ["ocpa.rights.deletion", "ocpa.rights.appeal"],
      },
      correction: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 45,
        limitations: [],
        notes: [],
        node_refs: ["ocpa.rights.correction", "ocpa.rights.appeal"],
      },
      portability: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 45,
        limitations: [],
        notes: [],
        node_refs: ["ocpa.rights.portability", "ocpa.rights.appeal"],
      },
      opt_out_sale: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: ["GPC recognition required effective January 1, 2026"],
        notes: [],
        node_refs: ["ocpa.rights.opt_out_sale", "ocpa.uoom.gpc"],
      },
      opt_out_targeted_advertising: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [],
        notes: [],
        node_refs: ["ocpa.rights.opt_out_sale"],
      },
      opt_out_profiling: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [],
        notes: [],
        node_refs: ["ocpa.rights.opt_out_sale"],
      },
      appeal: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 105,
        appeal_right: false,
        limitations: ["Denial must include method to contact OR AG"],
        notes: [],
        node_refs: ["ocpa.rights.appeal"],
      },
    },
  },

  ia: {
    statute: "ICDPA",
    state: "IA",
    effective_date: "2025-01-01",
    cure_period: "90 days — longest of any state",
    rights: {
      access: {
        exists: true,
        initial_deadline_days: 90,
        max_deadline_days: 135,
        appeal_right: false,
        limitations: ["90-day initial response — longest of any state"],
        notes: [
          "⚠️ Iowa's 90-day window is the longest of any state — do not apply a 45-day deadline to Iowa DSARs",
          "No appeal right",
        ],
        node_refs: ["icdpa.rights.narrow_regime"],
      },
      deletion: {
        exists: true,
        initial_deadline_days: 90,
        max_deadline_days: 135,
        appeal_right: false,
        limitations: [],
        notes: ["90-day initial window"],
        node_refs: ["icdpa.rights.narrow_regime"],
      },
      correction: {
        exists: false,
        limitations: [],
        notes: ["⚠️ No correction right in Iowa — one of three states lacking this right (with UT and KY)"],
        node_refs: ["icdpa.rights.narrow_regime"],
      },
      portability: {
        exists: true,
        initial_deadline_days: 90,
        max_deadline_days: 135,
        appeal_right: false,
        limitations: [],
        notes: [],
        node_refs: ["icdpa.rights.narrow_regime"],
      },
      opt_out_sale: {
        exists: true,
        initial_deadline_days: 90,
        max_deadline_days: 135,
        appeal_right: false,
        limitations: ["Iowa opt-out covers SALE only — no targeted advertising opt-out"],
        notes: ["⚠️ Iowa does NOT provide a right to opt out of targeted advertising — only sale"],
        node_refs: ["icdpa.rights.narrow_regime"],
      },
      opt_out_targeted_advertising: {
        exists: false,
        limitations: [],
        notes: ["⚠️ No opt-out of targeted advertising in Iowa — opt-out of sale only"],
        node_refs: ["icdpa.rights.narrow_regime"],
      },
      opt_out_profiling: {
        exists: false,
        limitations: [],
        notes: ["⚠️ No profiling opt-out in Iowa"],
        node_refs: ["icdpa.rights.narrow_regime"],
      },
      appeal: {
        exists: false,
        limitations: [],
        notes: ["⚠️ No appeal right in Iowa"],
        node_refs: ["icdpa.rights.narrow_regime"],
      },
    },
  },

  md: {
    statute: "MODPA",
    state: "MD",
    effective_date: "2025-10-01",
    cure_period: "60 days at enactment — verify current status",
    rights: {
      access: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 60,
        limitations: [],
        notes: ["MODPA is the strictest comprehensive state privacy law — full rights regime"],
        node_refs: ["modpa.rights.access", "modpa.rights.appeal"],
      },
      deletion: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 60,
        limitations: ["MODPA's strict data minimization standard limits what can be collected — and thus what must be deleted"],
        notes: [],
        node_refs: ["modpa.rights.deletion", "modpa.rights.appeal"],
      },
      correction: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 60,
        limitations: [],
        notes: [],
        node_refs: ["modpa.rights.correction", "modpa.rights.appeal"],
      },
      portability: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: true,
        appeal_deadline_days: 60,
        limitations: [],
        notes: [],
        node_refs: ["modpa.rights.portability", "modpa.rights.appeal"],
      },
      opt_out_sale: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [
          "GPC recognition required at effective date (October 1, 2025)",
          "Flat ban on sale of sensitive data — no opt-out possible for sensitive data sale",
          "Flat ban on sale of known-minor data — no opt-out possible for under-18 consumers",
        ],
        notes: [
          "⚠️ If consumer is under 18: flat ban on sale — no opt-out mechanism, simply cannot sell",
          "⚠️ If request involves sensitive data: sale is flatly prohibited regardless of opt-out status",
        ],
        node_refs: ["modpa.rights.opt_out_sale", "modpa.sensitive_data.ban_on_sale", "modpa.minors.flat_ban"],
      },
      opt_out_targeted_advertising: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [
          "GPC required",
          "Flat ban on targeted advertising for known consumers under 18",
        ],
        notes: ["⚠️ If consumer is under 18: flat ban — cannot engage in targeted advertising regardless of consent"],
        node_refs: ["modpa.rights.opt_out_sale", "modpa.minors.flat_ban"],
      },
      opt_out_profiling: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: ["Only for profiling with significant effects"],
        notes: [],
        node_refs: ["modpa.rights.opt_out_sale"],
      },
      appeal: {
        exists: true,
        initial_deadline_days: 60,
        max_deadline_days: 60,
        appeal_right: false,
        limitations: ["Denial must include method to contact MD AG"],
        notes: [],
        node_refs: ["modpa.rights.appeal"],
      },
    },
  },

  nj: {
    statute: "NJDPA",
    state: "NJ",
    effective_date: "2025-01-15",
    cure_period: "18-month cure period for non-willful violations through July 2026",
    rights: {
      access: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 45, limitations: [], notes: [], node_refs: ["njdpa.applicability.threshold"] },
      deletion: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 45, limitations: [], notes: [], node_refs: ["njdpa.applicability.threshold"] },
      correction: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 45, limitations: [], notes: [], node_refs: ["njdpa.applicability.threshold"] },
      portability: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 45, limitations: [], notes: [], node_refs: ["njdpa.applicability.threshold"] },
      opt_out_sale: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: ["GPC required effective July 15, 2025"],
        notes: [],
        node_refs: ["njdpa.uoom.gpc"],
      },
      opt_out_targeted_advertising: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: [], notes: [], node_refs: ["njdpa.applicability.threshold"] },
      opt_out_profiling: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: [], notes: [], node_refs: ["njdpa.applicability.threshold"] },
      appeal: { exists: true, initial_deadline_days: 45, max_deadline_days: 45, appeal_right: false, limitations: [], notes: [], node_refs: ["njdpa.applicability.threshold"] },
    },
  },

  mt: {
    statute: "MCDPA",
    state: "MT",
    effective_date: "2024-10-01",
    cure_period: "Sunset April 1, 2026",
    rights: {
      access: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: [], notes: [], node_refs: ["mcdpa.applicability.threshold"] },
      deletion: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: [], notes: [], node_refs: ["mcdpa.applicability.threshold"] },
      correction: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: [], notes: [], node_refs: ["mcdpa.applicability.threshold"] },
      portability: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: [], notes: [], node_refs: ["mcdpa.applicability.threshold"] },
      opt_out_sale: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: ["GPC required effective January 1, 2025"], notes: [], node_refs: ["mcdpa.uoom.gpc"] },
      opt_out_targeted_advertising: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: [], notes: [], node_refs: ["mcdpa.applicability.threshold"] },
      opt_out_profiling: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: [], notes: [], node_refs: ["mcdpa.applicability.threshold"] },
      appeal: { exists: true, initial_deadline_days: 60, max_deadline_days: 60, appeal_right: false, limitations: [], notes: [], node_refs: ["mcdpa.applicability.threshold"] },
    },
  },

  mn: {
    statute: "MCDPA-MN",
    state: "MN",
    effective_date: "2025-07-31",
    cure_period: "30 days for entities with documented written privacy programs",
    rights: {
      access: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 45, limitations: [], notes: [], node_refs: ["mcdpa_mn.applicability.threshold"] },
      deletion: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 45, limitations: [], notes: [], node_refs: ["mcdpa_mn.applicability.threshold"] },
      correction: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 45, limitations: [], notes: ["MN adds right to question profiling decisions — if correction is of ADM-input data, also triggers re-evaluation obligation"], node_refs: ["mcdpa_mn.rights.question_profiling"] },
      portability: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 45, limitations: [], notes: [], node_refs: ["mcdpa_mn.applicability.threshold"] },
      opt_out_sale: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: ["GPC required effective January 1, 2026"], notes: [], node_refs: ["mcdpa_mn.uoom.gpc"] },
      opt_out_targeted_advertising: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: [], notes: [], node_refs: ["mcdpa_mn.applicability.threshold"] },
      opt_out_profiling: {
        exists: true,
        initial_deadline_days: 45,
        max_deadline_days: 90,
        appeal_right: false,
        limitations: [],
        notes: ["⚠️ MN's profiling right is the most extensive in any US state — includes right to question the decision, understand the reasoning, and trigger re-evaluation after data correction"],
        node_refs: ["mcdpa_mn.rights.question_profiling"],
      },
      appeal: { exists: true, initial_deadline_days: 45, max_deadline_days: 45, appeal_right: false, limitations: [], notes: [], node_refs: ["mcdpa_mn.applicability.threshold"] },
    },
  },

  de: {
    statute: "DPDPA",
    state: "DE",
    effective_date: "2025-01-01",
    cure_period: "60 days at enactment",
    rights: {
      access: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: [], notes: [], node_refs: ["dpdpa.applicability.threshold"] },
      deletion: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: [], notes: [], node_refs: ["dpdpa.applicability.threshold"] },
      correction: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: [], notes: [], node_refs: ["dpdpa.applicability.threshold"] },
      portability: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: [], notes: [], node_refs: ["dpdpa.applicability.threshold"] },
      opt_out_sale: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: ["GPC required effective January 1, 2026"], notes: [], node_refs: ["dpdpa.uoom.gpc"] },
      opt_out_targeted_advertising: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: [], notes: [], node_refs: ["dpdpa.applicability.threshold"] },
      opt_out_profiling: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: [], notes: [], node_refs: ["dpdpa.applicability.threshold"] },
      appeal: { exists: true, initial_deadline_days: 60, max_deadline_days: 60, appeal_right: false, limitations: [], notes: [], node_refs: ["dpdpa.enforcement.parameters"] },
    },
  },

  nh: {
    statute: "NHDPA",
    state: "NH",
    effective_date: "2025-01-01",
    cure_period: "60 days at enactment",
    rights: {
      access: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: [], notes: [], node_refs: ["nhdpa.applicability.threshold"] },
      deletion: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: [], notes: [], node_refs: ["nhdpa.applicability.threshold"] },
      correction: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: [], notes: [], node_refs: ["nhdpa.applicability.threshold"] },
      portability: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: [], notes: [], node_refs: ["nhdpa.applicability.threshold"] },
      opt_out_sale: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: ["GPC required at effective date"], notes: [], node_refs: ["nhdpa.uoom.gpc"] },
      opt_out_targeted_advertising: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: [], notes: [], node_refs: ["nhdpa.applicability.threshold"] },
      opt_out_profiling: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: [], notes: [], node_refs: ["nhdpa.applicability.threshold"] },
      appeal: { exists: true, initial_deadline_days: 60, max_deadline_days: 60, appeal_right: false, limitations: [], notes: [], node_refs: ["nhdpa.enforcement.parameters"] },
    },
  },

  ky: {
    statute: "KCDPA",
    state: "KY",
    effective_date: "2026-01-01",
    cure_period: "30 days",
    rights: {
      access: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 45, limitations: [], notes: [], node_refs: ["kcdpa.applicability.threshold"] },
      deletion: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 45, limitations: [], notes: [], node_refs: ["kcdpa.applicability.threshold"] },
      correction: {
        exists: false,
        limitations: [],
        notes: ["⚠️ No correction right in Kentucky — one of three states lacking this right (with UT and IA)"],
        node_refs: ["kcdpa.rights.no_correction"],
      },
      portability: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 45, limitations: [], notes: [], node_refs: ["kcdpa.applicability.threshold"] },
      opt_out_sale: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: ["No UOOM/GPC recognition required"], notes: [], node_refs: ["kcdpa.applicability.threshold"] },
      opt_out_targeted_advertising: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: [], notes: [], node_refs: ["kcdpa.applicability.threshold"] },
      opt_out_profiling: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: [], notes: [], node_refs: ["kcdpa.applicability.threshold"] },
      appeal: { exists: true, initial_deadline_days: 45, max_deadline_days: 45, appeal_right: false, limitations: [], notes: [], node_refs: ["kcdpa.enforcement.parameters"] },
    },
  },

  // States with no comprehensive privacy law (yet) or only narrow applicability
  fl: {
    statute: "FDBR",
    state: "FL",
    effective_date: "2024-07-01",
    cure_period: "45 days",
    rights: {
      access: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: ["Only applies if controller meets FDBR's narrow applicability threshold (≥$1B revenue + specific activities)"], notes: ["⚠️ Most controllers are NOT subject to FDBR — verify applicability first"], node_refs: ["fdbr.applicability.threshold"] },
      deletion: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: ["FDBR narrow applicability"], notes: [], node_refs: ["fdbr.applicability.threshold"] },
      correction: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: ["FDBR narrow applicability"], notes: [], node_refs: ["fdbr.applicability.threshold"] },
      portability: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: true, appeal_deadline_days: 60, limitations: ["FDBR narrow applicability"], notes: [], node_refs: ["fdbr.applicability.threshold"] },
      opt_out_sale: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: ["FDBR narrow applicability", "GPC required"], notes: [], node_refs: ["fdbr.applicability.threshold"] },
      opt_out_targeted_advertising: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: ["FDBR narrow applicability"], notes: [], node_refs: ["fdbr.applicability.threshold"] },
      opt_out_profiling: { exists: true, initial_deadline_days: 45, max_deadline_days: 90, appeal_right: false, limitations: ["FDBR narrow applicability"], notes: [], node_refs: ["fdbr.applicability.threshold"] },
      appeal: { exists: true, initial_deadline_days: 60, max_deadline_days: 60, appeal_right: false, limitations: ["FDBR narrow applicability"], notes: [], node_refs: ["fdbr.enforcement.parameters"] },
    },
  },

  // States with no general comprehensive privacy law — response guidance only
  no_law: {
    statute: "None",
    state: "N/A",
    effective_date: "N/A",
    rights: {},
  },
};

// States with no comprehensive consumer privacy law currently in effect
const NO_LAW_STATES = new Set([
  "ak", "al", "ar", "az", "ga", "hi", "id", "il", "ks", "la",
  "ma", "me", "mi", "ms", "mo", "nd", "nm", "nv", "ny", "oh",
  "ok", "pa", "sc", "sd", "vt", "wa", "wi", "wv", "wy",
  // IL has BIPA but no general privacy law
  // WA has My Health Data Act but no general privacy law
  // NV has opt-out law but narrow
]);

// States with laws not yet effective (as of May 2026) — future effective
const FUTURE_LAW_STATES: Record<string, { statute: string; effective_date: string }> = {
  in: { statute: "INCDPA", effective_date: "2026-01-01" },
  ne: { statute: "NDPA", effective_date: "2025-01-01" }, // effective but minimal data in graph
  ri: { statute: "RIDTPPA", effective_date: "2026-01-01" },
  tn: { statute: "TIPA",    effective_date: "2025-07-01" },
};

/** Return every node_ref string used in the DSAR router's right-availability data.
 *  Used by the startup validator to detect stale references after node renames. */
export function getAllDsarNodeRefs(): string[] {
  const refs = new Set<string>();
  for (const statuteRights of Object.values(STATUTE_DATA)) {
    for (const rightAvailability of Object.values(statuteRights.rights)) {
      for (const ref of (rightAvailability?.node_refs ?? [])) {
        refs.add(ref);
      }
    }
  }
  return [...refs];
}

export function routeDSAR(
  consumerState: string,
  rightInvoked: RightType
): DSARRouteResult {
  const stateKey = consumerState.toLowerCase().trim();
  const multi_state_notes: string[] = [];

  // Check for no-law states
  if (NO_LAW_STATES.has(stateKey)) {
    return {
      consumer_state: consumerState.toUpperCase(),
      right_invoked: rightInvoked,
      right_label: RIGHT_LABELS[rightInvoked],
      applicable_statute: null,
      must_respond: false,
      directive: `No comprehensive state privacy law applies to consumers in ${consumerState.toUpperCase()}. ` +
        `No statutory obligation to respond to this DSAR under state privacy law. ` +
        `Check whether any sector-specific law (HIPAA, GLBA, COPPA) applies to this data and requester.`,
      multi_state_notes: [
        "Consider whether your privacy policy makes voluntary commitments that exceed statutory requirements",
        "Federal sectoral laws (HIPAA, GLBA, FCRA, COPPA) may independently require a response",
      ],
    };
  }

  // Check for future-effective states
  if (FUTURE_LAW_STATES[stateKey]) {
    const info = FUTURE_LAW_STATES[stateKey];
    return {
      consumer_state: consumerState.toUpperCase(),
      right_invoked: rightInvoked,
      right_label: RIGHT_LABELS[rightInvoked],
      applicable_statute: null,
      must_respond: false,
      directive: `${info.statute} (${consumerState.toUpperCase()}) has an effective date of ${info.effective_date}. ` +
        `Verify whether the law is now in effect. If so, re-run this router — rights data will be needed.`,
      multi_state_notes: [],
    };
  }

  const statuteData = STATUTE_DATA[stateKey];
  if (!statuteData) {
    return {
      consumer_state: consumerState.toUpperCase(),
      right_invoked: rightInvoked,
      right_label: RIGHT_LABELS[rightInvoked],
      applicable_statute: null,
      must_respond: false,
      directive: `No statutory data available for ${consumerState.toUpperCase()}. ` +
        `Verify manually whether a comprehensive state privacy law applies.`,
      multi_state_notes: [],
    };
  }

  const rightData = statuteData.rights[rightInvoked];
  if (!rightData) {
    return {
      consumer_state: consumerState.toUpperCase(),
      right_invoked: rightInvoked,
      right_label: RIGHT_LABELS[rightInvoked],
      applicable_statute: statuteData,
      must_respond: false,
      directive: `${RIGHT_LABELS[rightInvoked]} is not provided under ${statuteData.statute}. ` +
        `No statutory obligation to respond to this specific right.`,
      multi_state_notes,
    };
  }

  // Build directive
  let directive: string;
  if (!rightData.exists) {
    directive = `⚠️ ${RIGHT_LABELS[rightInvoked]} does NOT exist under ${statuteData.statute} (${consumerState.toUpperCase()}). ` +
      `No statutory obligation to respond to this right. Inform the consumer that this right is not available under applicable law.`;
  } else {
    const deadline = rightData.initial_deadline_days === 90
      ? "90 calendar days (Iowa's extended window — longest of any state)"
      : `45 calendar days`;
    const extension = rightData.max_deadline_days && rightData.max_deadline_days > (rightData.initial_deadline_days ?? 45)
      ? ` (extendable once by ${rightData.max_deadline_days - (rightData.initial_deadline_days ?? 45)} days with written notice to the consumer)`
      : "";
    const appealNote = rightData.appeal_right
      ? ` If denied, provide appeal instructions — appeal must be completed within ${rightData.appeal_deadline_days} days.`
      : ` No appeal right under ${statuteData.statute}.`;
    directive = `Respond within ${deadline}${extension}.${appealNote}`;
  }

  return {
    consumer_state: consumerState.toUpperCase(),
    right_invoked: rightInvoked,
    right_label: RIGHT_LABELS[rightInvoked],
    applicable_statute: statuteData,
    must_respond: rightData.exists,
    directive,
    multi_state_notes,
  };
}
