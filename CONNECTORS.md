# Connector Pairings

PrivacyQuant is designed to stay small and focused: it maps statutory privacy requirements, contract signals, DSAR routing, clause checks, and enforcement-action precedent metadata. It should not try to become a full court-record database.

This document tracks external MCP connectors that pair well with PrivacyQuant.

## CourtListener MCP

**Status:** Recommended companion connector.

Free Law Project announced on May 12, 2026 that CourtListener is available as an MCP connector inside Claude. CourtListener's connector gives Claude access to case law, PACER/RECAP dockets and filings, citation analysis, oral argument transcripts, judge data, alerts, search, and citation verification.

CourtListener is not a replacement for PrivacyQuant. It fills a lookup gap after PrivacyQuant identifies a relevant enforcement action, citation, or precedent candidate.

### Why pair it with PrivacyQuant?

PrivacyQuant's enforcement-action tooling is intentionally narrow: it points users toward relevant privacy enforcement actions from the local `references/enforcement_actions.json` corpus. That corpus is useful for deterministic precedent matching, but it does not provide a full court-record workflow.

CourtListener covers the next step:

1. Use PrivacyQuant to identify the relevant statutory node, clause gap, or enforcement action.
2. Use the CourtListener MCP connector to verify the citation, pull the full record, inspect docket history, and review citing or cited authority.
3. Return to PrivacyQuant to connect the researched precedent back to the statutory requirement or DPA drafting task.

### Recommended user instruction

When doing enforcement-action or precedent research in Claude Code, install CourtListener MCP alongside PrivacyQuant:

> Install CourtListener MCP alongside PrivacyQuant to verify citations and expand enforcement-action research.

### Practical examples

- If PrivacyQuant returns an enforcement action with a citation, use CourtListener to verify the citation and retrieve the underlying record.
- If PrivacyQuant flags a privacy-law clause gap, use CourtListener to look for litigation, docket activity, or citing authority around related enforcement theories.
- If PrivacyQuant returns a regulator action URL but not a docket trail, use CourtListener to determine whether there are related court filings, opinions, or subsequent citations.

### Setup

1. Create or log in to a CourtListener account.
2. In Claude, open **Customize** → **Connectors** → **Browse Connectors**.
3. Add **CourtListener**.
4. Authorize Claude to access your CourtListener account.
5. Use CourtListener for primary-source expansion after PrivacyQuant identifies the relevant privacy issue.

### Sources

- Free Law Project announcement: https://free.law/2026/05/12/courtlistener-is-now-available-inside-claude/
- CourtListener MCP help page: https://www.courtlistener.com/help/mcp/
- CourtListener project overview: https://free.law/projects/courtlistener/

## Design rule for future connector pairings

A connector pairing should be documented here when it expands PrivacyQuant's workflow without duplicating PrivacyQuant's core purpose.

Good connector pairings should:

- verify or enrich a PrivacyQuant result;
- avoid adding fragile network dependencies to core deterministic tools;
- keep statutory-node matching and schema logic local to this repo;
- make the user better at legal research without pretending PrivacyQuant is a complete legal-research platform.
