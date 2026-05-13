# PrivacyQuant Tool Reference

This document groups the current MCP tools by workflow area. For the canonical registration surface, see `mcp-server/src/index.ts`.

## Core statutory graph

- `pq_fetch_requirement`: Return the full node record for a known node ID.
- `pq_search_requirements`: Find candidate nodes by keyword or pasted clause text.
- `pq_list_statutes`: Enumerate covered statutes and available node IDs.

## Applicability

- `pq_check_applicability`: Estimate which statutes likely apply from organization and processing profile inputs.

## Drafting

- `pq_draft_dpa_clause`: Draft deterministic DPA language mapped to selected requirements.
- `pq_draft_notice_clause`: Draft privacy notice language keyed to statutory duties.
- `pq_check_clause`: Check a proposed clause against requirement coverage and highlight gaps.

## DSAR

- `pq_dsar_router`: Map inbound request language to rights categories and relevant statutes.
- `pq_route_dsar_workflow`: Build DSAR processing workflows and decision branches.

## Conflict resolution

- `pq_resolve_conflict`: Resolve cross-state conflicts by legal dimension.
- `pq_resolve_conflict_nodes`: Resolve conflicts from explicit node selections with node-aware output.

## Enforcement and risk

- `pq_find_precedent`: Match topics to local enforcement action/precedent corpus.
- `pq_score_privacy_risk`: Generate a structured privacy risk score from provided facts.

## Legislative monitoring

- `pq_watch_legislation`: Check bill/amendment movement via OpenStates or Plural APIs.

## Citation QA

- `pq_audit_citations`: Validate citation structure/traceability in work product.

## Notes

- Most tools are deterministic and local.
- `pq_check_clause` may require `ANTHROPIC_API_KEY` depending on runtime path.
- `pq_watch_legislation` requires `OPENSTATES_API_KEY` or `PLURAL_API_KEY`.
- Outputs are legal workflow aids, not legal advice.
