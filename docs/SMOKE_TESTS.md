# PrivacyQuant Smoke Tests

Example inputs for each tool. Use these to verify that the MCP server starts correctly
and all tools respond. Run from Claude Code after installing PrivacyQuant.

---

## pq_search_requirements — new filters

Find CT AI training disclosure requirements effective August 2026 or later:

```json
{
  "query": "ai training disclosure",
  "statute": "CTDPA",
  "effective_after": "2026-08-01"
}
```

Expected: nodes whose `effective_date` is 2026-08-01 or later, trimmed to those matching the query.

Find only processor obligations related to deletion across all statutes:

```json
{
  "query": "deletion",
  "bearer": "processor",
  "limit": 10
}
```

Expected: deletion-related nodes where `obligation_bearer` is `processor`.

Point-in-time search — what deletion rights were in effect as of 2023-01-01:

```json
{
  "query": "right to deletion",
  "effective_before": "2023-01-01",
  "requirement_type": "hard"
}
```

Expected: hard deletion-right nodes whose `effective_date` is on or before 2023-01-01.

---

## pq_check_applicability

SaaS company with $40M revenue processing 150K California consumers:

```json
{
  "annual_revenue_usd": 40000000,
  "consumers_processed": 150000,
  "revenue_pct_from_sale": 5,
  "states_operating": ["CA", "VA", "CO", "TX", "MD"],
  "is_nonprofit": false
}
```

Expected: CCPA Applies (prong b: 100K consumers), VCDPA Applies, CPA Applies, TDPSA Applies, MODPA Applies.

Non-profit in Virginia:

```json
{
  "annual_revenue_usd": 5000000,
  "consumers_processed": 200000,
  "states_operating": ["VA"],
  "is_nonprofit": true
}
```

Expected: VCDPA Does Not Apply (nonprofit exempt).

---

## pq_draft_dpa_clause

Processor obligations under CCPA service-provider contract + MODPA deletion:

```json
{
  "node_ids": ["ccpa.controller_duties.service_provider_contract", "modpa.rights.deletion"],
  "role": "processor",
  "style": "standard",
  "context": "SaaS vendor acting as service provider. Counterparty is a California law firm."
}
```

Expected: drafted clause with coverage summary, gap list, and practitioner notes.
Requires `ANTHROPIC_API_KEY`.

---

## pq_draft_notice_clause

Notice at collection for a health app selling data in California and Colorado:

```json
{
  "notice_type": "notice_at_collection",
  "states": ["CA", "CO"],
  "business_name": "HealthTrack Inc.",
  "data_categories": ["health and medical data", "precise geolocation", "device identifiers"],
  "purposes": ["service delivery", "analytics", "targeted advertising"],
  "sale_or_sharing": true,
  "targeted_advertising": true,
  "sensitive_data": true,
  "universal_opt_out": true,
  "contact_method": "privacy@healthtrack.example.com"
}
```

AI training disclosure for a CT business effective August 2026:

```json
{
  "notice_type": "ai_training_disclosure",
  "states": ["CT"],
  "business_name": "LegalAI Corp.",
  "data_categories": ["professional/employment data", "user-generated content"],
  "contact_method": "https://legalai.example.com/privacy-request"
}
```

---

## pq_dsar_router

Iowa consumer requesting correction:

```json
{
  "consumer_state": "IA",
  "right_invoked": "correction"
}
```

Expected: Does not apply — no correction right in Iowa.

California consumer requesting deletion, controller subject to multiple statutes:

```json
{
  "consumer_state": "CA",
  "right_invoked": "deletion",
  "controller_statutes": ["CCPA/CPRA", "VCDPA", "CPA", "MODPA"]
}
```

Expected: 45-day deadline, no appeal right, multi-state notes.

Maryland consumer requesting opt-out of sale, known minor:

```json
{
  "consumer_state": "MD",
  "right_invoked": "opt_out_sale"
}
```

Expected: Flat ban on sale for known minors — opt-out mechanism is irrelevant.

---

## pq_route_dsar_workflow

California deletion request received today from a consumer who may have provided sensitive data:

```json
{
  "consumer_state": "CA",
  "right_invoked": "deletion",
  "controller_status": "controller",
  "request_received_date": "2026-05-13",
  "residency_verified": false,
  "sensitive_data_involved": true,
  "specific_pieces_requested": false,
  "deletion_scope": "unknown"
}
```

Expected: 9+ step checklist, due date 2026-06-27, enhanced verification escalation flag,
processor handoff step included.

Iowa access request with authorized agent:

```json
{
  "consumer_state": "IA",
  "right_invoked": "access",
  "controller_status": "controller",
  "request_received_date": "2026-05-13",
  "authorized_agent": true
}
```

Expected: 90-day deadline (Iowa's extended window), authorized-agent verification step.

---

## pq_find_precedent

GPC non-compliance in California:

```json
{
  "tags": ["gpc_not_honored", "dark_pattern_optout"],
  "states": ["CA"],
  "top_n": 3
}
```

Expected top results: Disney streaming ($2.75M), Sephora ($1.2M), Todd Snyder ($345K).

Processor contract gap (free-text):

```json
{
  "query": "missing data processing agreement service provider",
  "top_n": 5
}
```

Health data pixel disclosure:

```json
{
  "tags": ["pixel_health_data_disclosure"],
  "states": ["CA"],
  "top_n": 3
}
```

---

## pq_resolve_conflict_nodes

Sensitive data treatment across CA, CO, VA, MD:

```json
{
  "statutes": ["CCPA/CPRA", "CPA", "VCDPA", "MODPA"],
  "dimensions": ["sensitive_data_treatment", "sensitive_data_sale", "uoom_recognition"],
  "evidence_limit_per_position": 2
}
```

Expected: CA's "limit use" opt-out structure flagged as a structural conflict with
other states' opt-in consent. MD's flat ban on sensitive data sale flagged. Node
evidence from `ccpa.sensitive_data.categories`, `modpa.sensitive_data.ban_on_sale`, etc.

Response time and appeal right comparison:

```json
{
  "statutes": ["ICDPA", "CCPA/CPRA", "VCDPA", "UCPA"],
  "dimensions": ["response_time", "appeal_right"]
}
```

Expected: Iowa 90-day window as binding constraint; UCPA and ICDPA no appeal right flagged.

---

## pq_score_privacy_risk

High-risk profile — health app with GPC gap, known minor data, biometrics:

```json
{
  "states": ["CA", "TX", "MD"],
  "health_data": true,
  "biometric_data": true,
  "minors_data": true,
  "sale_or_sharing": true,
  "universal_opt_out_gap": true,
  "processor_contract_gap": false,
  "notice_gap": false,
  "repeat_issue": false,
  "top_precedents": 3
}
```

Expected: score 70–85 / High or Critical; GPC and biometric remediation as top priorities;
TX biometric precedent and CA GPC precedents in analogous actions.

Low-risk profile — B2B SaaS, no sale, active remediation:

```json
{
  "states": ["VA"],
  "sale_or_sharing": false,
  "targeted_advertising": false,
  "sensitive_data": false,
  "universal_opt_out_gap": false,
  "remediation_started": true
}
```

Expected: score < 15 / Minimal or Low.

---

## pq_audit_citations

Text with missing citations:

```json
{
  "text": "Controllers must delete consumer data within 45 days of a valid request. The right to correction does not exist in Iowa or Utah. Sensitive data requires opt-in consent in Virginia.",
  "strict": false
}
```

Expected: 3 warnings — each claim has no inline citation.

Text with PrivacyQuant node references (some valid, one invalid):

```json
{
  "text": "Under ccpa.rights.deletion, businesses must honor deletion requests within 45 days. Under ccpa.rights.telepathy, consumers may transmit preferences by thought.",
  "strict": true
}
```

Expected: 1 error — `ccpa.rights.telepathy` does not resolve.

---

## pq_watch_legislation

Oregon and Connecticut, privacy keywords, bills updated in 2026:

```json
{
  "states": ["OR", "CT"],
  "keywords": ["personal data", "privacy"],
  "updated_since": "2026-01-01",
  "per_state_limit": 5
}
```

Expected: active OR and CT privacy bills with latest action dates and verify markers.
Requires `OPENSTATES_API_KEY`.

Without API key — expected graceful error:

```json
{
  "states": ["CA"]
}
```

Expected: `api_status: "no_key"` with instructions for obtaining a free key.

---

## Build verification

```bash
cd privacyquant/mcp-server
npm install
npm run build
```

Expected: clean TypeScript compilation with no errors. The server outputs:

```
PrivacyQuant: loaded 141 nodes across 20 statutes
```

to stderr on startup (stderr is the correct channel for MCP server diagnostic output).
