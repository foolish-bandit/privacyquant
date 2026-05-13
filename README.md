# PrivacyQuant

Versioned statutory infrastructure for U.S. state consumer privacy law, exposed through an MCP server for deterministic research, triage, and drafting workflows.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)
![MCP](https://img.shields.io/badge/MCP-Model_Context_Protocol-6f42c1)
![US State Privacy](https://img.shields.io/badge/US_State_Privacy-20_laws-0a7f5a)
![Deterministic Tools](https://img.shields.io/badge/Deterministic-By_Default-1f6feb)
![Statutory Nodes](https://img.shields.io/badge/Statutory_Nodes-99-informational)
![MCP Tools](https://img.shields.io/badge/MCP_Tools-15-informational)
![Cloud Requirement](https://img.shields.io/badge/Cloud-Not_Required_for_Most_Tools-555)

## What PrivacyQuant is

PrivacyQuant is a legal engineering project that treats statutory privacy requirements as versioned, reviewable source files. Each node is a YAML record with statute metadata, requirement text, exceptions, cross-references, and source links.

### What it is

- A versioned statutory knowledge graph.
- An MCP workflow layer for U.S. state privacy law.
- A deterministic triage and drafting assistant.
- A structured legal research support tool.

### What it is not

- Legal advice.
- A substitute for counsel.
- A court-record database.
- An automatically updated law feed.
- Proof of compliance.

## At a glance

`US State Privacy` · `MCP` · `CCPA/CPRA` · `DSAR` · `DPA Drafting` · `Privacy Notices` · `Enforcement Research` · `Legislative Monitoring` · `Citation QA` · `Risk Scoring`

## Repository structure

```text
statutes/              99 YAML nodes across 20 state privacy laws
  schema.yaml          Node schema and contribution contract
  README.md            Coverage table and authoring guidance

mcp-server/
  src/index.ts         MCP entrypoint and explicit tool registration surface
  src/loader.ts        YAML graph loading
  src/search.ts        Keyword and clause-signal matching
  src/*.ts             Tool modules (applicability, drafting, DSAR, risk, citation QA)

references/            Enforcement corpus, control/crosswalk references, intake examples
scripts/
  generate_nodes.py    Generator utility (use with care; may lag hand-authored nodes)

.mcp.json              Local MCP configuration (points to mcp-server/src/index.ts)
CONNECTORS.md          Companion connector guidance
```

## Tool index

| Tool | Practical use |
|---|---|
| `pq_fetch_requirement` | Retrieve one node by ID with section, requirement text, exceptions, and source metadata. |
| `pq_search_requirements` | Search the statutory graph by keywords or by pasted clause text with signal extraction. |
| `pq_list_statutes` | List covered statutes and available node IDs for browsing and scoping. |
| `pq_resolve_conflict` | Compute stricter multi-state constraints across common privacy compliance dimensions. |
| `pq_resolve_conflict_nodes` | Resolve conflicts using specific node sets and return node-aware synthesis guidance. |
| `pq_check_clause` | Evaluate a draft clause against relevant requirements and return coverage verdicts and gaps. |
| `pq_draft_dpa_clause` | Generate deterministic first-pass DPA language mapped to selected requirement nodes. |
| `pq_draft_notice_clause` | Draft privacy-notice language anchored to applicable statutory duties. |
| `pq_dsar_router` | Classify DSAR request types and map them to likely rights and statutory paths. |
| `pq_route_dsar_workflow` | Produce a structured DSAR handling workflow with decision points and evidence prompts. |
| `pq_check_applicability` | Triage whether selected statutes likely apply based on organization/profile inputs. |
| `pq_find_precedent` | Find relevant enforcement actions and precedent candidates from local reference corpus. |
| `pq_score_privacy_risk` | Score privacy exposure based on operational and statutory factors. |
| `pq_watch_legislation` | Track bill or amendment activity for covered states using legislative APIs. |
| `pq_audit_citations` | Check citation format and traceability of cited authorities in generated text. |

A fuller grouped reference is available in [`docs/TOOLS.md`](./docs/TOOLS.md).

## Workflow examples

### Applicability-first review

1. `pq_check_applicability`
2. `pq_search_requirements`
3. `pq_resolve_conflict_nodes`
4. `pq_score_privacy_risk`

### DPA drafting

1. `pq_search_requirements`
2. `pq_draft_dpa_clause`
3. `pq_check_clause`

### Privacy notice drafting

1. `pq_check_applicability`
2. `pq_draft_notice_clause`
3. `pq_audit_citations`

### DSAR intake

1. `pq_check_applicability`
2. `pq_dsar_router`
3. `pq_route_dsar_workflow`

### Enforcement research

1. `pq_find_precedent`
2. CourtListener MCP
3. `pq_audit_citations`

### Legislative maintenance

1. `pq_watch_legislation`
2. Manual source review
3. YAML node pull request

## Installation

### Claude Code plugin

```bash
/plugin marketplace add foolish-bandit/privacyquant
/plugin install privacyquant@privacyquant
```

### Manual MCP setup

```bash
git clone https://github.com/foolish-bandit/privacyquant
cd privacyquant/mcp-server
npm install
npm run dev
```

The repository includes `.mcp.json`, which runs the server via `npx tsx mcp-server/src/index.ts`.

## Environment variables

Most tools are deterministic and require no API key.

- `ANTHROPIC_API_KEY`: required only for `pq_check_clause` (when clause evaluation uses Anthropic).
- `OPENSTATES_API_KEY` or `PLURAL_API_KEY`: required for `pq_watch_legislation`.

## Companion connectors

PrivacyQuant and CourtListener MCP serve different layers of a legal workflow.

- PrivacyQuant: statutory/workflow intelligence over state privacy requirements.
- CourtListener MCP: court records, citation expansion, and docket verification.

See [`CONNECTORS.md`](./CONNECTORS.md) for setup and pairing guidance.

## Development notes

- MCP entrypoint is `mcp-server/src/index.ts`.
- Tools should be explicitly registered in `index.ts`.
- Do not reintroduce bootstrap monkey-patching as startup control flow.
- The node generator can lag hand-authored nodes; review diffs carefully before running `scripts/generate_nodes.py` and opening a PR.

## Contributing

- Read `statutes/schema.yaml` and `statutes/README.md` before adding or revising nodes.
- Keep claims tied to statutory text and section citations.
- Prefer small, reviewable PRs tied to a specific statutory change or tool behavior.
- For tool behavior checks and payload examples, see [`docs/SMOKE_TESTS.md`](./docs/SMOKE_TESTS.md).

## License

MIT
