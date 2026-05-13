# PrivacyQuant Tool Reference

15 MCP tools. 13 are fully deterministic (no LLM, no external API).
All tools are registered in `mcp-server/src/index.ts`.

---

## Core statutory graph

### `pq_fetch_requirement`

Fetch a single statutory node by exact ID.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Node ID, e.g. `ccpa.rights.deletion` |

Returns full requirement text, exceptions, contract signals, cross-refs, source URL, and git hash.

Use when you have a specific node ID from search results or a citation, and need the full text.

---

### `pq_search_requirements`

Search the statutory graph by keyword or contract clause text. Supports date-range and
obligation-bearer filters for targeted compliance research.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | Yes | Keyword query (2–2000 chars) |
| `clause_text` | string | No | Raw DPA/contract clause — signal terms extracted automatically |
| `statute` | string | No | Filter to specific statute, e.g. `CCPA`, `MODPA` |
| `requirement_type` | enum | No | `hard`, `threshold`, or `soft` |
| `limit` | integer | No | Max results (default 5, max 20) |
| `effective_after` | string | No | ISO date (YYYY-MM-DD). Only return nodes effective on or after this date. Use to find future requirements, e.g. CT AI training disclosure effective Aug 1, 2026. |
| `effective_before` | string | No | ISO date (YYYY-MM-DD). Only return nodes effective on or before this date. Use for point-in-time compliance analysis. |
| `bearer` | enum | No | `business`, `service_provider`, `third_party`, `processor`, `controller`, or `all`. Filters by obligation bearer. |

All filters (`requirement_type`, `effective_after`, `effective_before`, `bearer`) are applied
post-search, after the hybrid BM25 + keyword merge, before slicing to the result limit.

When `clause_text` is provided, the tool runs the existing contract-signal extraction pipeline
and merges extracted signals with the `query`. The user does not need to identify keywords manually.

---

### `pq_list_statutes`

List all covered statutes and their node IDs.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `statute` | string | No | Filter to a specific statute acronym |

Returns node counts per statute and a flat list of node IDs for browsing.

---

## Applicability

### `pq_check_applicability`

Determine which US state consumer privacy laws likely apply.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `annual_revenue_usd` | number | No | Annual gross revenue in USD |
| `consumers_processed` | integer | No | Number of consumers' PI processed annually |
| `households_processed` | integer | No | Number of households' PI processed annually |
| `revenue_pct_from_sale` | number | No | % of annual revenue from selling PI (0–100) |
| `states_operating` | string[] | No | States where business operates — if omitted, evaluates all 20 |
| `is_nonprofit` | boolean | No | Non-profit entity |
| `is_government` | boolean | No | Government entity |
| `is_hipaa_covered_entity` | boolean | No | HIPAA-covered entity |
| `is_glba_covered` | boolean | No | GLBA-covered financial institution |

**Verdicts:** `Applies` | `Likely Applies` | `Does Not Apply` | `Insufficient Info`

The tool refuses to guess on missing threshold facts and returns `needed_inputs` specifying
what information would resolve the `Insufficient Info` verdict.

**Coverage specifics:**
- CCPA/CPRA: all three prongs (revenue > $26.6M, 100K consumers/households, 50% sale revenue)
- Utah/Tennessee: revenue floor ($25M) applied before consumer-count threshold
- Florida FDBR: $1B revenue prong — flagged as `Likely Applies` pending activity-prong verification
- Entity exemptions: government (full exemption), nonprofit (statute-specific)

---

## Conflict resolution

### `pq_resolve_conflict`

Multi-state compliance-ceiling synthesis. Uses curated static rules across 12 dimensions.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `statutes` | string[] | Yes | Statutes to resolve across (minimum 2) |
| `dimensions` | string[] | No | Specific dimensions — omit for all 12 |

**12 compliance dimensions:**
`sensitive_data_treatment`, `sensitive_data_sale`, `minor_treatment`, `uoom_recognition`,
`response_time`, `appeal_right`, `cure_period`, `penalty_max`, `data_minimization`,
`processor_contract`, `right_to_correction`, `right_to_profiling_optout`

---

### `pq_resolve_conflict_nodes`

Same compliance-ceiling analysis enriched with live node evidence.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `statutes` | string[] | Yes | Statutes to resolve across (minimum 2) |
| `dimensions` | string[] | No | Specific dimensions — omit for all 12 |
| `evidence_limit_per_position` | integer | No | Max node evidence items per dimension (default 2, max 5) |

Adds requirement excerpts, section citations, effective dates, and source URLs from the
loaded graph for each binding rule. Flags dimension positions where node evidence was not
found in the graph.

---

## Clause review and drafting

### `pq_check_clause`

Review a DPA or contract clause against statutory requirements.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `clause` | string | Yes | Raw clause text (20–10,000 chars) — paste in full |
| `statutes` | string[] | No | Applicable statutes |
| `topics` | string[] | No | Topic hints, e.g. `["deletion", "processor contract"]` |
| `max_nodes` | integer | No | Max nodes to evaluate against (default 6, max 12) |

**Requires `ANTHROPIC_API_KEY`.**

Returns: overall verdict (GREEN/YELLOW/RED), per-node assessments with gap descriptions and
suggested redlines, top priority fix. Response time 10–20 seconds.

---

### `pq_draft_dpa_clause`

Generate first-draft DPA clause language from statutory node IDs.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `node_ids` | string[] | Yes | Node IDs to draft for (1–8) — use `pq_search_requirements` to find them |
| `role` | enum | No | `controller`, `processor`, or `both` (default: `processor`) |
| `style` | enum | No | `brief`, `standard`, or `detailed` (default: `standard`) |
| `context` | string | No | Additional context from the attorney (max 500 chars) |

**Requires `ANTHROPIC_API_KEY`.**

Returns: drafted clause text, coverage summary mapping each sentence to the node requirement
it satisfies, identified gaps, and practitioner notes. Always run `pq_check_clause` against
the final edited text before execution.

---

### `pq_draft_notice_clause`

Draft privacy notice language from processing facts.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `notice_type` | enum | Yes | `notice_at_collection`, `privacy_notice`, `opt_out_disclosure`, `sensitive_data_notice`, `financial_incentive`, `ai_training_disclosure` |
| `states` | string[] | Yes | Applicable states |
| `business_name` | string | No | Business name for the notice |
| `data_categories` | string[] | No | Categories of PI collected |
| `purposes` | string[] | No | Processing purposes |
| `sale_or_sharing` | boolean | No | Business sells or shares PI |
| `targeted_advertising` | boolean | No | Uses targeted advertising |
| `profiling_or_admt` | boolean | No | Uses profiling or ADMT |
| `sensitive_data` | boolean | No | Processes sensitive PI |
| `minors_data` | boolean | No | Processes known minors' data |
| `uses_llm_training` | boolean | No | Uses PI to train AI/LLM systems |
| `universal_opt_out` | boolean | No | Recognizes GPC/UOOM signals |
| `contact_method` | string | No | Consumer contact method (email, URL, phone) |

Returns: draft notice text, list of missing business facts, drafting notes tied to specific
statutory requirements, and supporting PrivacyQuant node IDs. Always run `pq_audit_citations`
before publication.

---

## DSAR routing and workflow

### `pq_dsar_router`

Route a consumer rights request to the applicable statute and deadline.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `consumer_state` | string | Yes | Two-letter state abbreviation |
| `right_invoked` | enum | Yes | `access`, `deletion`, `correction`, `portability`, `opt_out_sale`, `opt_out_targeted_advertising`, `opt_out_profiling`, `limit_sensitive_pi`, `appeal` |
| `controller_statutes` | string[] | No | Statutes the controller is subject to (generates multi-state notes) |

Returns: whether the right exists, initial deadline, extension availability, appeal requirement,
specific limitations, practitioner notes, and node references.

Key gotchas surfaced automatically: Iowa 90-day window, UT/IA/KY no correction right,
Iowa no targeted-advertising opt-out, MD flat bans on minor and sensitive data sale.

---

### `pq_route_dsar_workflow`

Convert a received consumer request into an operational workflow.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `consumer_state` | string | Yes | Two-letter state abbreviation |
| `right_invoked` | enum | Yes | Same enum as `pq_dsar_router` |
| `controller_status` | enum | No | `controller`, `processor`, `dual`, `unknown` (default: `controller`) |
| `request_received_date` | string | No | ISO date (YYYY-MM-DD) — enables deadline calculation |
| `residency_verified` | boolean | No | Whether consumer residency has been verified |
| `authorized_agent` | boolean | No | Request submitted by authorized agent |
| `sensitive_data_involved` | boolean | No | Request involves sensitive PI |
| `specific_pieces_requested` | boolean | No | Consumer requested specific pieces (triggers enhanced verification) |
| `deletion_scope` | enum | No | `all`, `partial`, `unknown` |

Returns: calculated due date, step-by-step checklist, escalation flags, processor handoff
guidance, and disclaimer. Steps include logging, residency verification, identity verification,
right-specific actions, and documentation retention.

---

## Enforcement and risk

### `pq_find_precedent`

Search the enforcement corpus for analogous actions.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `tags` | string[] | No | Violation-theory tags from the 48-tag taxonomy |
| `states` | string[] | No | States to weight results toward |
| `query` | string | No | Free-text fallback when tags are unknown |
| `top_n` | integer | No | Number of results (default 5, max 10) |

At least one of `tags` or `query` is required.

**Scoring:** tag overlap (100 pts/match) + state proximity (35 pts) + recency (max 20, decays
2/yr) + severity (settlement size + remediation, max 25 pts).

**48 violation-theory tags (abbreviated):** `gpc_not_honored`, `uoom_not_honored`,
`dark_pattern_optout`, `no_donotsell_link`, `notice_at_collection_missing`,
`sensitive_data_no_consent`, `sensitive_data_sale_md_ban`, `minor_data_sold`,
`deletion_failure`, `rights_request_response_late`, `processor_contract_inadequate`,
`dpa_missing`, `verification_excessive`, `security_failure_breach`, `biometric_no_written_consent`,
`risk_assessment_missing`, and 32 others. Use `pq_find_precedent` with no args to see the full list.

---

### `pq_score_privacy_risk`

Deterministic privacy exposure triage score.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `states` | string[] | No | Applicable states |
| `sale_or_sharing` | boolean | No | Sells or shares PI |
| `targeted_advertising` | boolean | No | Uses targeted advertising |
| `profiling_or_admt` | boolean | No | Uses profiling or ADMT |
| `sensitive_data` | boolean | No | Processes sensitive PI |
| `minors_data` | boolean | No | Processes minors' data |
| `health_data` | boolean | No | Processes consumer health data |
| `biometric_data` | boolean | No | Processes biometric data |
| `precise_geolocation` | boolean | No | Processes precise geolocation |
| `universal_opt_out_gap` | boolean | No | GPC/UOOM not currently honored |
| `dsar_backlog` | boolean | No | Outstanding/overdue consumer rights requests |
| `processor_contract_gap` | boolean | No | Missing or deficient processor contracts |
| `notice_gap` | boolean | No | Notice at collection missing or deficient |
| `security_incident` | boolean | No | Active or recent security incident |
| `repeat_issue` | boolean | No | Known or repeat compliance issue |
| `remediation_started` | boolean | No | Active remediation underway (10-pt credit) |
| `top_precedents` | integer | No | Analogous actions to return (default 3, max 5) |

**Score bands:** Minimal (0–10), Low (11–30), Moderate (31–55), High (56–75), Critical (76–100)

**Score components (max points):** Data activity risk (30) + Special category data (20) +
Compliance gap risk (30) + Aggravating factors (20) − Remediation credit (10)

---

## Legislative monitoring

### `pq_watch_legislation`

Search Open States / Plural Policy API for active privacy bills.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `states` | string[] | No | States to search (2-letter) — omit for all 20 |
| `keywords` | string[] | No | Search keywords — defaults to `["consumer privacy", "personal data", "personal information", "data protection"]` |
| `updated_since` | string | No | ISO date — only bills updated since this date |
| `per_state_limit` | integer | No | Max bills per state (default 5, max 20) |

**Requires `OPENSTATES_API_KEY` or `PLURAL_API_KEY`.**

Returns bills grouped by state with `[verify]` markers, latest action dates, source links,
and a 5-step review workflow for evaluating whether a bill requires a YAML node update.
Does not auto-update nodes — human review is required.

---

## Citation QA

### `pq_audit_citations`

Flag citation-discipline issues in privacy-law work product.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `text` | string | Yes | Work product text to audit (50–50,000 chars) |
| `strict` | boolean | No | Strict mode: uncited legal claims become errors (default: warnings) |
| `include_passed_claims` | boolean | No | Include sentences that passed the citation check |

**Flag types:**
- `unresolved_placeholder` (error): `[citation needed]`, `[verify]`, `[cite needed]`
- `suspicious_ccpa_section` (warning): Cal. Civ. Code sections outside §§ 1798.100–1798.199
- `standalone_cpra` (info): Repeated standalone "CPRA" without "CCPA/CPRA" context
- `uncited_legal_claim` (warning/error): Substantive legal claim without inline citation
- `unresolvable_node_ref` (warning): PrivacyQuant node reference that does not resolve in the loaded graph

Conservative: flags possible issues without making legal judgments. Does not verify that
cited authority actually supports the claim.
