export type RequirementType = "hard" | "threshold" | "soft";

export type ObligationBearer =
  | "business"
  | "service_provider"
  | "third_party"
  | "processor"
  | "controller"
  | "all";

export interface StatuteNode {
  id: string;
  statute: string;
  section: string;
  title: string;
  effective_date: string;
  supersedes: string[];
  amended_by: string[];
  requirement_type: RequirementType;
  obligation_bearer: ObligationBearer;
  trigger: string;
  requirement: string;
  exceptions: string[];
  contract_signals: string[];
  /** Optional: IAB/Fideslang data category keys — see references/fideslang-mapping.yaml */
  data_categories?: string[];
  /** Optional: NIST SP 800-53 Rev. 5 control IDs — see references/nist-controls-mapping.yaml */
  nist_controls?: string[];
  cross_refs: string[];
  source_url: string;
  git_hash: string;
}

export interface SearchResult {
  node: StatuteNode;
  matched_signals: string[];
  score: number;
}

export interface StatuteIndex {
  /** All nodes keyed by id */
  byId: Map<string, StatuteNode>;
  /** All nodes keyed by statute acronym (lowercase) */
  byStatute: Map<string, StatuteNode[]>;
  /** Flat list of all nodes */
  all: StatuteNode[];
}
