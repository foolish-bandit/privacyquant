# PrivacyQuant

**Versioned statutory knowledge graph and MCP workflow layer for US state consumer privacy law.**

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6)
![MCP](https://img.shields.io/badge/MCP-compatible-8b5cf6)
![Nodes](https://img.shields.io/badge/statutory_nodes-146-16a34a)
![Tools](https://img.shields.io/badge/MCP_tools-16-0891b2)
![Statutes](https://img.shields.io/badge/statutes-20-dc2626)
![Deterministic](https://img.shields.io/badge/deterministic_by_default-14_of_16_tools-15803d)

`US State Privacy` `MCP` `CCPA/CPRA` `DSAR` `DPA Drafting` `Privacy Notices` `Enforcement Research` `Legislative Monitoring` `Citation QA` `Risk Scoring`

---

## What it is

PrivacyQuant is a structured, versioned, auditable legal workflow system built around atomic YAML statutory nodes and curated reference datasets.

Every statutory requirement, consumer right, deadline, and threshold is stored as an individually citable node with a Git hash. When you cite a PrivacyQuant node, you are citing a specific version of the law — not a model's recollection of it.

The 16 MCP tools expose deterministic workflows for applicability analysis, DPA clause review and drafting, privacy notice drafting, DSAR routing, multi-state conflict resolution, enforcement precedent research, legislative monitoring, citation auditing, and risk scoring. Fourteen of the sixteen tools require no LLM and no external API.

**What PrivacyQuant is not:**
- Legal advice or a substitute for qualified counsel
- A court-record database (see [CONNECTORS.md](CONNECTORS.md) for CourtListener pairing)
- An automatically-updated law tracker
- Proof of compliance with any applicable statute

---

## At a glance

| | |
|---|---|
| Statutory nodes | 146 across 20 statutes |
| MCP tools | 16 |
| Deterministic tools | 14 (no LLM, no external API) |
| LLM-dependent tools | `pq_check_clause`, `pq_draft_dpa_clause` (require `ANTHROPIC_API_KEY`) |
| Live API tools | `pq_watch_legislation` (requires `OPENSTATES_API_KEY`) |
| Enforcement corpus | 84 actions, v2.3, 48 violation-theory tags |
| Statutes | CCPA/CPRA, VCDPA, CPA, CTDPA, UCPA, TDPSA, OCPA, MCDPA, ICDPA, INCDPA, TIPA, DPDPA, NJDPA, NHDPA, NDPA, KCDPA, MODPA, MCDPA-MN, RIDTPPA, FDBR |

---

## Tool index

### Core statutory graph

| Tool | Purpose |
|---|---|
| `pq_fetch_requirement` | Fetch a node by exact ID. Returns full statutory text, exceptions, cross-refs, and source URL. |
| `pq_search_requirements` | Search nodes by keyword or pasted contract clause text. Signal terms are extracted automatically from clause text. |
| `pq_list_statutes` | List all covered statutes and their node IDs. |

### Applicability

| Tool | Purpose |
|---|---|
| `pq_check_applicability` | Determine which state privacy laws likely apply based on revenue, consumer count, and sale-revenue thresholds. Returns Applies / Likely Applies / Does Not Apply / Insufficient Info per statute. Deterministic. |

### Conflict resolution

| Tool | Purpose |
|---|---|
| `pq_resolve_conflict` | Multi-state compliance-ceiling synthesis across 12 dimensions using curated static rules. |
| `pq_resolve_conflict_nodes` | Same analysis enriched with live statutory node evidence, requirement excerpts, and section citations from the loaded graph. |

### Clause review and drafting

| Tool | Purpose |
|---|---|
| `pq_check_clause` | Review a DPA or contract clause against statutory requirements. Returns GREEN / YELLOW / RED verdicts with gap analysis and suggested redlines. Requires `ANTHROPIC_API_KEY`. |
| `pq_draft_dpa_clause` | Generate first-draft DPA clause language from multiple statutory node IDs. Inverse of `pq_check_clause`. Requires `ANTHROPIC_API_KEY`. |
| `pq_draft_dpa_clause_deterministic` | Template-based first-draft DPA clause from a single node ID. No LLM, no API key. Use when you need draft language immediately from one node. |
| `pq_draft_notice_clause` | Draft privacy notice language from processing facts. Supports notice at collection, full privacy notice, opt-out disclosure, sensitive data notice, financial incentive, and AI/LLM training disclosure. Deterministic. |

### DSAR routing and workflow

| Tool | Purpose |
|---|---|
| `pq_dsar_router` | Route a consumer rights request: whether the right exists, deadline, appeal requirement, and node references. |
| `pq_route_dsar_workflow` | Convert a received consumer request into a step-by-step operational checklist with calculated deadlines, verification guidance, and processor handoff steps. |

### Enforcement and risk

| Tool | Purpose |
|---|---|
| `pq_find_precedent` | Search the enforcement corpus for analogous actions by violation-theory tag, free-text query, state, and industry. Returns settlement amounts, factual patterns, and operational lessons. Deterministic. |
| `pq_score_privacy_risk` | 0-100 privacy exposure triage score with band, component breakdown, regulator-interest notes, remediation priorities, and analogous precedents. Deterministic. |

### Legislative monitoring

| Tool | Purpose |
|---|---|
| `pq_watch_legislation` | Search Open States / Plural Policy API for active privacy bills in covered states. Requires `OPENSTATES_API_KEY`. |

### Citation QA

| Tool | Purpose |
|---|---|
| `pq_audit_citations` | Flag citation-discipline issues in privacy-law work product: uncited claims, unresolved placeholders, suspicious section numbers, and unresolvable node references. Deterministic. |

---

## Workflow examples

### Applicability-first review

```
1. pq_check_applicability(annual_revenue_usd: 50000000, consumers_processed: 120000,
                          states_operating: ["CA", "VA", "TX"])
   -> CCPA/CPRA Applies, VCDPA Applies, TDPSA Applies

2. pq_resolve_conflict_nodes(statutes: ["CCPA/CPRA", "VCDPA", "TDPSA"],
                              dimensions: ["sensitive_data_treatment", "uoom_recognition"])
   -> binding rules + node evidence per dimension

3. pq_score_privacy_risk(states: ["CA","VA","TX"], sale_or_sharing: true,
                         universal_opt_out_gap: true)
   -> score: 62 / High — GPC gap is top remediation priority
```

### DPA review and drafting

```
1. pq_search_requirements(query: "processor contract deletion", statutes: ["CCPA","MODPA"])
   -> ccpa.controller_duties.service_provider_contract, modpa.rights.deletion, ...

2. pq_draft_dpa_clause(node_ids: ["ccpa.controller_duties.service_provider_contract",
                                   "modpa.rights.deletion"], role: "processor")
   -> first-draft DPA clause with coverage summary and practitioner notes

3. pq_check_clause(clause: "<edited clause text>", statutes: ["CCPA","MODPA"])
   -> GREEN / YELLOW / RED per matched node + redlines for gaps
```

### Privacy notice drafting

```
1. pq_check_applicability(...) -> identifies applicable statutes

2. pq_draft_notice_clause(notice_type: "notice_at_collection",
                           states: ["CA","CO","CT"],
                           sale_or_sharing: true, uses_llm_training: true)
   -> first-draft notice including CT LLM training disclosure (eff. Aug 1, 2026)

3. pq_audit_citations(text: "<final notice text>")
   -> flags any uncited claims before publication
```

### DSAR intake

```
1. pq_dsar_router(consumer_state: "IA", right_invoked: "correction")
   -> No correction right in Iowa — no obligation to respond

2. pq_dsar_router(consumer_state: "CA", right_invoked: "deletion")
   -> 45-day deadline; no appeal right; node: ccpa.rights.deletion

3. pq_route_dsar_workflow(consumer_state: "CA", right_invoked: "deletion",
                          request_received_date: "2026-05-13",
                          sensitive_data_involved: true)
   -> 9-step checklist; due 2026-06-27; enhanced verification required
```

### Enforcement research

```
1. pq_find_precedent(tags: ["gpc_not_honored", "dark_pattern_optout"], states: ["CA"])
   -> ca-ag-disney-streaming-2026 ($2.75M), ca-sephora-2022 ($1.2M), ...

2. [CourtListener MCP] search_cases(query: "Disney streaming CCPA opt-out")
   -> full docket record and citation network

3. pq_audit_citations(text: "<draft enforcement memo>")
   -> citation discipline check
```

### Legislative maintenance

```
1. pq_watch_legislation(states: ["OR","CT","CO"], keywords: ["personal data"])
   -> OR HB 2008 enacted — [verify] ocpa.minors nodes
   -> CT amendment active — [verify] ctdpa.controller_duties nodes

2. Manual review against bill text

3. PR: update YAML node with amended effective date and source URL
```

---

## Installation

### Claude Code (plugin — recommended)

```bash
/plugin marketplace add foolish-bandit/privacyquant
/plugin install privacyquant@privacyquant
```

### Claude Code (manual MCP)

```bash
git clone https://github.com/foolish-bandit/privacyquant
cd privacyquant/mcp-server && npm install && npm run build
```

The repo root contains `.mcp.json` — Claude Code reads it automatically. The MCP server
entrypoint is `mcp-server/src/index.ts`.

### Cowork

Install from the Cowork plugin browser — search **privacyquant**.

---

## Environment variables

| Variable | Required for | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `pq_check_clause`, `pq_draft_dpa_clause` | Uses `claude-sonnet-4-20250514`. |
| `OPENSTATES_API_KEY` or `PLURAL_API_KEY` | `pq_watch_legislation` | Free key at [open.pluralpolicy.com](https://open.pluralpolicy.com). |

All other tools require no API key.

---

## Repository structure

```
privacyquant/
├── statutes/                     146 YAML nodes across 20 statutes
│   ├── schema.yaml               Node schema with all supported fields
│   ├── ccpa/ vcdpa/ cpa/ ...     One directory per statute
├── references/
│   ├── enforcement_actions.json  84 enforcement actions, v2.3, 48 tags
│   ├── fideslang-mapping.yaml    IAB/Fideslang data category crosswalk
│   ├── nist-controls-mapping.yaml  NIST SP 800-53 Rev. 5 crosswalk
│   ├── ag-priorities.md          Regulator priority weighting
│   ├── defense-arguments.md      Litigation defense framing (pairs with pq_find_precedent)
│   ├── federal-overlays.md       HIPAA/GLBA/COPPA/FERPA/FCRA intersection with state law
│   ├── applicability-matrix.md   Master threshold matrix for all 20 states
│   ├── rights-comparison.md      Cross-state consumer rights comparison table
│   ├── controller-duties.md      Cross-state controller obligation comparison
│   ├── sensitive-data.md         Sensitive data categories and treatment by state
│   ├── kids-and-teens.md         Minor/teen provisions and COPPA interaction
│   ├── universal-opt-out.md      GPC/UOOM recognition by state and effective dates
│   ├── enforcement.md            Penalties, cure periods, and enforcement mechanisms
│   ├── states/                   Per-state deep-dive reference files
│   │   ├── ca.md  va.md  co.md   One file per statute (20 total)
│   │   └── ...
│   └── workflows/                Operational workflow guides
│       ├── dsar-routing.md       DSAR intake, routing, and response workflow
│       ├── gap-analysis-method.md  Multi-state compliance gap analysis methodology
│       ├── intake-questionnaire.md  Client intake questionnaire
│       └── status-determination.md  Applicability determination guide
├── assets/
│   ├── memo-template.md          Multi-state privacy compliance memo template
│   ├── applicability-questions.json  Structured intake questions for pq_check_applicability
│   └── notice-clauses/           Privacy notice and consent templates
│       ├── notice-at-collection.md
│       ├── full-privacy-notice.md
│       ├── opt-out-disclosure.md
│       └── sensitive-data-notice.md
├── scripts/
│   ├── generate_nodes.py         Node generation utility (see dev notes before use)
│   └── populate_git_hashes.sh    Backfills git_hash fields in all statutes/ YAML nodes
├── .githooks/
│   └── pre-commit                Auto-populates git_hash on commit (requires core.hooksPath)
├── mcp-server/
│   ├── src/index.ts              Entrypoint — all 16 tools registered here
│   └── src/*.ts                  Tool modules
├── docs/
│   ├── TOOLS.md                  Grouped tool reference
│   └── SMOKE_TESTS.md            Example inputs for each tool
├── CLAUDE.md                     Practice profile read automatically by Claude Code
├── CONNECTORS.md                 Companion connector docs (CourtListener, etc.)
└── .claude-plugin/plugin.json    Claude Code marketplace manifest
```

---

## Companion connectors

**CourtListener MCP** — Free Law Project's official MCP provides access to 18+ million
court records, PACER dockets, and citation networks. Pairs with `pq_find_precedent` to
verify citations and expand into full court records. Free API at courtlistener.com.

**Ansvar Systems US-law-mcp** — Verified text of 130+ US federal statutes from official
eCFR and US Code sources (HIPAA, GLBA, COPPA, FTC HBNR, etc.). Use for federal sectoral
overlay analysis alongside PrivacyQuant's state-law focus.

See [CONNECTORS.md](CONNECTORS.md) for setup instructions and workflow examples.

---

## Development notes

**git_hash population:** Each YAML node in `statutes/` carries a `git_hash` field that
records the commit hash of the last change to that file, enabling downstream consumers
to verify the exact law version they are citing. Run `git config core.hooksPath .githooks`
after cloning to enable automatic population on every commit via the pre-commit hook in
`.githooks/pre-commit`. To backfill all existing nodes manually, run
`bash scripts/populate_git_hashes.sh`. The script is idempotent — re-running it twice
produces no changes if nothing was modified.

**Tool registration:** All 16 tools are registered in `mcp-server/src/index.ts` before
`server.connect(...)`. Do not reintroduce bootstrap monkey-patching. The `bootstrap.ts`
entrypoint has been permanently removed.

**Adding a tool:** Create a module in `mcp-server/src/`, import it in `index.ts`, and add
a `server.registerTool(...)` block. Keep tools deterministic by default. Run
`npm --prefix mcp-server run build` to verify compilation.

**Running tests:** Run `npm test` in `mcp-server/` to execute the test suite (`vitest run`). Tests cover corpus integrity, applicability checking, DSAR routing, conflict resolution, loader, and search.

**Node authoring:** Hand-authored YAML in `statutes/` is the source of truth. The
`scripts/generate_nodes.py` generator contains embedded source data that may be stale
relative to hand-authored nodes — do not run it without reviewing its embedded data first.
Every node requires `id`, `statute`, `section`, `requirement`, and `source_url`.

**NIST crosswalk:** Use `references/nist-controls-mapping.yaml` to map node IDs to NIST
SP 800-53 Rev. 5 control IDs. Do not add `nist_controls` inline to generated YAML files.
The loader merges crosswalk data at runtime.

---

## Contributing

Node updates, enforcement corpus entries, and new tool PRs are welcome.

- **Node updates:** Include the bill number, effective date, and source URL in the PR description.
- **Enforcement corpus:** Follow the v2.3 schema in `enforcement_actions.json`; include `violation_theories` from the 48-tag taxonomy.
- **New tools:** Register in `index.ts`; keep deterministic by default; document in `docs/TOOLS.md`.

Run `npm run validate` from `mcp-server/` before submitting a PR. The script checks node counts, cross-refs, tool registration counts, enforcement corpus integrity, and required field presence. PRs that break validation will fail CI.

---

## License

MIT — see LICENSE.

Statutory text is public law. Node content is original analytical work product of contributors.
IAB/Fideslang taxonomy (CC-BY 4.0). NIST crosswalk data (public domain).
