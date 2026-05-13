# PrivacyQuant (LQ)

**Research, draft, and cite US state consumer privacy law — inside Claude or any compatible AI assistant.**

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6)
![MCP](https://img.shields.io/badge/MCP-compatible-8b5cf6)
![Claude plugin](https://img.shields.io/badge/Claude-plugin-d97706)
![Codex plugin](https://img.shields.io/badge/Codex-plugin-6366f1)
![Nodes](https://img.shields.io/badge/statutory_nodes-146-16a34a)
![Tools](https://img.shields.io/badge/MCP_tools-18-0891b2)
![Statutes](https://img.shields.io/badge/statutes-20-dc2626)
![Deterministic](https://img.shields.io/badge/deterministic_by_default-16_of_18_tools-15803d)
![Attorney review](https://img.shields.io/badge/output-draft_for_attorney_review-64748b)

`US State Privacy` `MCP` `CCPA/CPRA` `DSAR` `DPA Drafting` `Privacy Notices` `Enforcement Research` `Legislative Monitoring` `Citation QA` `Risk Scoring`

---

## For attorneys: what this is and how to use it

PrivacyQuant gives your AI assistant accurate, citable knowledge of US state consumer privacy laws — all 20 statutes, from CCPA/CPRA to the newest state laws. Instead of relying on the AI's general training (which may be out of date or imprecise), every answer pulls from a curated library of law that is locked to a specific version and carries a traceable citation.

**In plain terms:** you ask Claude a privacy law question, and PrivacyQuant supplies the answer from the actual statutory text — with the statute name, section number, and version reference included. The output is a draft for your review, not legal advice.

### What you can do with it

| Task | What to ask Claude |
|---|---|
| **Check if a law applies** | "Does California privacy law apply to my client? Their revenue is $45M and they process data for 90,000 California residents." |
| **Multi-state compliance** | "My client operates in CA, VA, TX, and CO. What is the strictest rule on sensitive data consent across those states?" |
| **Review a contract clause** | "Review this data processing agreement clause against CCPA and Virginia law." (Paste the clause.) |
| **Draft contract language** | "Draft a deletion-right provision for a DPA covering California and Maryland." |
| **Draft a privacy notice** | "Draft a notice at collection for a California and Colorado consumer-facing website that sells user data." |
| **Respond to a consumer request** | "A California resident submitted a deletion request today. What are the deadlines and steps?" |
| **Research enforcement** | "Find enforcement actions involving GPC non-compliance and dark-pattern opt-outs in California." |
| **Assess risk exposure** | "Score the privacy risk for a company selling consumer data in CA, VA, and TX without honoring opt-out signals." |
| **Generate a client memo** | "Generate a compliance memo for Acme Corp operating in CA, VA, CO, TX, and MD with $40M revenue." |

Every response includes the statute name, section number, and version identifier so you can verify the source. Claims that come from general reasoning rather than the library are flagged `[verify — not from graph]`.

All output is a **draft for review by qualified counsel**. PrivacyQuant is a research and drafting aid, not a substitute for legal judgment or an attorney admitted in the relevant jurisdiction.

---

## How to load PrivacyQuant

### Option 1 — Claude Code (self-hosted)

If you want to run PrivacyQuant locally from your own machine:

```bash
git clone https://github.com/foolish-bandit/privacyquant
cd privacyquant/mcp-server && npm install && npm run build
```

Claude Code will detect the configuration file in the repository and connect automatically.

### Option 2 — Codex or another AI assistant

See the [Installation](#installation) section below for Codex setup and instructions for any other MCP-compatible AI assistant.

---

## Works with

| Client | How |
|---|---|
| **Claude Code** | Plugin marketplace (two commands above) or `.mcp.json` auto-loaded by Claude Code |
| **Codex** | `.codex-plugin/plugin.json` plugin manifest + `.codex-mcp.json` MCP config + `skills/` instructions |
| **Any MCP-compatible client** | Run the server directly: `npx tsx mcp-server/src/index.ts` |

---

## What PrivacyQuant does (technical overview)

PrivacyQuant is a structured, versioned legal workflow system. Every statutory requirement, consumer right, deadline, and threshold is stored as an individually citable entry locked to a specific version of the law. When you cite a PrivacyQuant node, you are citing a specific version of the statute — not a model's recollection of it.

The 18 tools expose deterministic workflows across these areas:

| Workflow | Tools |
|---|---|
| **Applicability analysis** | `pq_check_applicability` — determines which state laws apply given revenue, consumer count, and sale-revenue thresholds |
| **Multi-state conflict resolution** | `pq_resolve_conflict`, `pq_resolve_conflict_nodes` — synthesizes the compliance ceiling across applicable states |
| **DPA clause review** | `pq_check_clause` — returns GREEN / YELLOW / RED verdicts with redlines against statutory requirements |
| **DPA clause drafting** | `pq_draft_dpa_clause`, `pq_draft_dpa_clause_deterministic` — first-draft DPA language from node IDs |
| **Privacy notice drafting** | `pq_draft_notice_clause` — notice at collection, full privacy notice, opt-out, sensitive data, financial incentive, AI training |
| **DSAR routing** | `pq_dsar_router`, `pq_route_dsar_workflow` — right existence, deadline, appeal requirement, step-by-step checklist |
| **Enforcement research** | `pq_find_precedent` — 84 curated enforcement actions searchable by violation theory, state, industry |
| **Risk scoring** | `pq_score_privacy_risk` — deterministic 0-100 exposure score with component breakdown and remediation priorities |
| **Citation auditing** | `pq_audit_citations` — flags uncited claims, unresolved placeholders, and suspicious section numbers in work product |
| **DOCX memo generation** | `pq_generate_memo`, `pq_memo_from_analysis` — formal client-ready compliance memo with cover, disclaimer, TOC, and appendix stubs |
| **Legislative monitoring** | `pq_watch_legislation` — active privacy bills in covered states via Open States / Plural API |
| **Statutory graph access** | `pq_fetch_requirement`, `pq_search_requirements`, `pq_list_statutes` — direct node retrieval and search |

Sixteen of the eighteen tools require no LLM and no external API.

## What it is not

- Legal advice or a substitute for qualified counsel
- A court-record database (see [CONNECTORS.md](CONNECTORS.md) for CourtListener pairing)
- An automatically-updated law tracker — nodes reflect law at node version dates
- Proof of compliance with any applicable statute
- A cloud SaaS product — it runs as a local STDIO MCP server you host yourself
- A GDPR, HIPAA, GLBA, FCRA, COPPA, FERPA, BIPA, or state AI law engine (see [scope exclusions](#scope-exclusions))

---

## At a glance

| | |
|---|---|
| Statutory nodes | 146 across 20 statutes |
| MCP tools | 18 |
| Deterministic tools | 16 (no LLM, no external API) |
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

### Deliverables

| Tool | Purpose |
|---|---|
| `pq_generate_memo` | Generate a formal client-ready DOCX privacy compliance memorandum from structured inputs. Includes cover, disclaimer, TOC, entity profile, applicability, status determination, gap analysis, remediation roadmap, cross-cutting recommendations, limitations, next steps, and appendix stubs. Deterministic. |
| `pq_memo_from_analysis` | Convenience generator that runs `pq_check_applicability` internally and auto-populates the memo's entity profile and applicability sections. Other sections accept optional structured inputs or render as placeholders. Deterministic. |

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

### Memo deliverable from applicability analysis

```
1. pq_memo_from_analysis(client_name: "Acme SaaS Corp.",
                         annual_revenue_usd: 40000000,
                         consumers_processed: 150000,
                         revenue_pct_from_sale: 5,
                         states_operating: ["CA","VA","CO","TX","MD"],
                         executive_summary: "Acme SaaS Corp. ...",
                         next_steps: ["Implement GPC ...", "Update contracts ..."])
   -> writes privacyquant-memo-acme-saas-corp-YYYYMMDD.docx with cover,
      disclaimer, TOC, entity profile, applicability (auto-populated from
      pq_check_applicability), placeholder status/gaps/remediation, defaults
      for limitations, and the provided next steps

2. [Attorney review and complete placeholder sections]

3. pq_generate_memo(...)  # re-run with full sections populated for final delivery
```

---

## Architecture

PrivacyQuant is the product. Claude and Codex are distribution targets. One repo avoids
statutory graph and tool version drift between clients — the MCP server and YAML data layer
are shared; only the thin client wrappers differ.

```
privacyquant/
  ├─ mcp-server/               shared MCP tool engine (18 tools, TypeScript)
  ├─ statutes/                 shared statutory graph (146 YAML nodes, 20 statutes)
  ├─ references/               shared reference data (enforcement corpus, workflows, state guides)
  ├─ .claude-plugin/           Claude Code marketplace manifest
  ├─ .codex-plugin/            Codex plugin manifest
  ├─ .mcp.json                 Claude Code / manual MCP config
  ├─ .codex-mcp.json           Codex MCP config
  ├─ skills/                   Codex skill instructions
  ├─ CLAUDE.md                 Claude Code practice profile (auto-loaded by Claude Code)
  └─ scripts/                  Validation and node-generation utilities
```

---

## Scope exclusions

The following regimes are outside PrivacyQuant's current scope. Flag them when they arise
alongside covered state law, then handle the sectoral or AI layer with a separate resource.

GDPR / UK GDPR · HIPAA · GLBA · FCRA · COPPA · FERPA · Illinois BIPA ·
Washington MHMDA · Colorado AI Act · NYC Local Law 144 · standalone state AI laws

---

## Installation

### Claude — plugin (recommended)

```
/plugin marketplace add foolish-bandit/privacyquant
/plugin install privacyquant@privacyquant
```

### Claude Code — manual / self-hosted

```bash
git clone https://github.com/foolish-bandit/privacyquant
cd privacyquant/mcp-server && npm install && npm run build
```

The repo root contains `.mcp.json` — Claude Code reads it automatically. The MCP server
entrypoint is `mcp-server/src/index.ts`.

### Codex

**Option A — Local MCP config**

Add the following to `~/.codex/config.toml` (replace `cwd` with the absolute path to your
local clone):

```toml
[mcp_servers.privacyquant]
command = "npx"
args = ["tsx", "mcp-server/src/index.ts"]
cwd = "/absolute/path/to/privacyquant"
env_vars = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "OPENSTATES_API_KEY", "PLURAL_API_KEY"]
startup_timeout_sec = 20
tool_timeout_sec = 120
```

`cwd` must be the absolute path to the cloned repository root — relative paths are not
supported by the Codex MCP config.

**Option B — Bundled plugin**

This repository includes Codex plugin files for local or repo-based plugin loading:

- `.codex-plugin/plugin.json` — Codex plugin manifest
- `.codex-mcp.json` — Codex MCP server config (`mcp_servers` shape)
- `skills/privacyquant-legal-workflows/SKILL.md` — skill instructions

Point your Codex client at the repository root to load the plugin locally. Official public
marketplace distribution is not yet configured and can be added later if desired.

### Any MCP-compatible client

```bash
npx tsx mcp-server/src/index.ts
```

The server communicates over STDIO using the MCP protocol. Point any MCP-compatible client
at this command.

### Cowork

Install from the Cowork plugin browser — search **privacyquant**.

---

## Environment variables

| Variable | Required for | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `pq_check_clause`, `pq_draft_dpa_clause` | Required only for these two LLM-backed tools. Uses `claude-sonnet-4-20250514`. All 16 other tools are fully deterministic and need no API key. |
| `OPENAI_API_KEY` | Future OpenAI provider support | Included for forward compatibility. Not currently used unless an OpenAI provider is explicitly configured. |
| `OPENSTATES_API_KEY` or `PLURAL_API_KEY` | `pq_watch_legislation` | Only needed for legislative monitoring. Free key at [open.pluralpolicy.com](https://open.pluralpolicy.com). |

Most PrivacyQuant tools require no API key at all.

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
│       ├── notice-at-collection.md   CA-specific notice-at-collection model clause
│       ├── opt-out-disclosures.md    Multi-state "Your Privacy Choices" disclosures
│       ├── sensitive-data-notice.md  Opt-in / limit-use / MD-ban modules
│       └── financial-incentive.md    CA financial-incentive + CO loyalty-program notices
├── scripts/
│   ├── generate_nodes.py         Node generation utility (see dev notes before use)
│   └── populate_git_hashes.sh    Backfills git_hash fields in all statutes/ YAML nodes
├── .githooks/
│   └── pre-commit                Auto-populates git_hash on commit (requires core.hooksPath)
├── mcp-server/
│   ├── src/index.ts              Entrypoint — all 18 tools registered here
│   └── src/*.ts                  Tool modules
├── docs/
│   ├── TOOLS.md                  Grouped tool reference
│   └── SMOKE_TESTS.md            Example inputs for each tool
├── CLAUDE.md                     Practice profile read automatically by Claude Code
├── CONNECTORS.md                 Companion connector docs (CourtListener, etc.)
├── .claude-plugin/plugin.json    Claude Code marketplace manifest
├── .codex-plugin/plugin.json     Codex plugin manifest
├── .mcp.json                     Claude Code / manual MCP config
├── .codex-mcp.json               Codex MCP config
└── skills/
    └── privacyquant-legal-workflows/SKILL.md  Codex skill instructions
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

For Codex packaging changes, also run `node scripts/validate-codex-plugin.mjs` from the repo root to verify that the Codex plugin manifest, MCP config, and skill file are well-formed.

---

## License

MIT — see LICENSE.

Statutory text is public law. Node content is original analytical work product of contributors.
IAB/Fideslang taxonomy (CC-BY 4.0). NIST crosswalk data (public domain).
