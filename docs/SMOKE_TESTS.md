# PrivacyQuant Smoke Test Payloads

These sample JSON payloads are intended for quick manual checks in MCP clients.

## `pq_check_applicability`

```json
{
  "entity_type": "for_profit_company",
  "annual_revenue_usd": 120000000,
  "states_of_operation": ["CA", "CO", "VA"],
  "consumers_processed_annually": 250000,
  "sells_personal_data": true,
  "processes_sensitive_data": true
}
```

## `pq_draft_dpa_clause`

```json
{
  "id": "ccpa.rights.deletion",
  "role": "business_service_provider",
  "style": "standard"
}
```

## `pq_draft_notice_clause`

```json
{
  "jurisdictions": ["CA", "CT", "VA"],
  "topic": "consumer_rights",
  "audience": "general_consumer",
  "tone": "plain_language"
}
```

## `pq_dsar_router`

```json
{
  "request_text": "Please delete my personal information and tell me what categories you sold.",
  "jurisdiction_hint": "CA",
  "channel": "email"
}
```

## `pq_route_dsar_workflow`

```json
{
  "request_type": "deletion",
  "jurisdiction": "CO",
  "identity_verified": false,
  "appeal_requested": false
}
```

## `pq_find_precedent`

```json
{
  "query": "dark patterns consent flow",
  "jurisdiction": "CA",
  "limit": 5
}
```

## `pq_resolve_conflict_nodes`

```json
{
  "node_ids": [
    "ccpa.rights.deletion",
    "vcdpa.rights.deletion",
    "ctdpa.rights.deletion"
  ],
  "dimensions": ["response_deadline", "appeal_process"]
}
```

## `pq_score_privacy_risk`

```json
{
  "jurisdictions": ["CA", "TX", "VA"],
  "data_types": ["precise_geolocation", "biometric", "financial"],
  "processing_activities": ["targeted_advertising", "sale_or_share"],
  "consumer_volume": 500000,
  "minor_data_in_scope": true
}
```

## `pq_audit_citations`

```json
{
  "text": "The controller must honor deletion rights under Cal. Civ. Code § 1798.105 and provide an appeal process under Va. Code Ann. § 59.1-577.",
  "jurisdictions": ["CA", "VA"]
}
```

## `pq_watch_legislation`

```json
{
  "states": ["CA", "CO", "VA", "TX"],
  "topics": ["consumer rights", "sensitive data", "dark patterns"],
  "lookback_days": 30
}
```

## Suggested local check

```bash
npm --prefix mcp-server run build
```
