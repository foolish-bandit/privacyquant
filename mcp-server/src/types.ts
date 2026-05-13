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
  data_categories: string[];
  nist_controls: string[];
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
