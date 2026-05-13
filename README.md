# PrivacyQuant

A versioned statutory knowledge graph for US state consumer privacy laws, exposed as a Claude Code MCP plugin.

**Concept**: treat US privacy law as a version-controlled dependency. Every statutory requirement is a YAML node with a Git hash. When a state amends its law, contributors push a PR — not a client alert PDF.

## What's here

```
statutes/          ← 93 YAML nodes across 20 state privacy laws
  schema.yaml      ← node schema (the contribution contract)
  README.md        ← coverage table and contributing guide
  ccpa/            ← CCPA/CPRA (14 nodes)
  vcdpa/           ← VCDPA Virginia (11 nodes)
  cpa/             ← CPA Colorado (5 nodes)
  ... (17 more statutes)

mcp-server/        ← TypeScript MCP server
  src/index.ts     ← server entry point
  src/loader.ts    ← reads YAML nodes at startup
  src/search.ts    ← keyword matching against contract_signals
  src/types.ts     ← TypeScript interfaces

scripts/
  generate_nodes.py  ← regenerates all YAML from source data

.mcp.json          ← Claude Code plugin config
CONNECTORS.md      ← recommended companion MCP connectors
```

## Tools

| Tool | Description |
|------|-------------|
| `pq_fetch_requirement` | Fetch a node by exact ID (e.g. `ccpa.rights.deletion`) |
| `pq_search_requirements` | Search by keyword or pasted contract clause text |
| `pq_list_statutes` | List all statutes and browse node IDs |

## Companion connectors

PrivacyQuant works best as a focused statutory knowledge graph, not a full legal-research database. For citation verification and court-record expansion, see [CONNECTORS.md](./CONNECTORS.md).

Recommended pairing:

- **CourtListener MCP** — install alongside PrivacyQuant to verify citations and expand enforcement-action research with case law, PACER/RECAP docket records, citation analysis, alerts, and citation verification.

## Statutes covered

CCPA/CPRA, VCDPA, CPA, CTDPA, UCPA, TDPSA, OCPA, MCDPA (Montana), ICDPA, INCDPA, TIPA, DPDPA, NJDPA, NHDPA, NDPA, KCDPA, MODPA, MCDPA-MN, RIDTPPA, FDBR

## Installing

### Claude Code (plugin — recommended)

```bash
/plugin marketplace add foolish-bandit/privacyquant
/plugin install privacyquant@privacyquant
```

Then set your API key (required for `pq_check_clause`):

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### Claude Code (manual MCP)

```bash
git clone https://github.com/foolish-bandit/privacyquant
cd privacyquant/mcp-server && npm install
```

Open the repo root in Claude Code — it reads `.mcp.json` automatically.

### Claude Cowork

Install from the Cowork plugin browser — search for **privacyquant**.

Once installed, Claude has five tools: `pq_fetch_requirement`, `pq_search_requirements`,
`pq_list_statutes`, `pq_resolve_conflict`, and `pq_check_clause`.

## Contributing

The fastest way to contribute is to write missing nodes for underrepresented statutes. See `statutes/README.md` for the schema and coverage gaps.

The "PR as legislative patch" model: when a state amends its law, push a PR updating the relevant YAML node. Every user of the plugin gets the update on next pull.

## License

MIT
