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
  src/index.ts     ← server entry point (3 tools)
  src/loader.ts    ← reads YAML nodes at startup
  src/search.ts    ← keyword matching against contract_signals
  src/types.ts     ← TypeScript interfaces

scripts/
  generate_nodes.py  ← regenerates all YAML from source data

.mcp.json          ← Claude Code plugin config
```

## Tools

| Tool | Description |
|------|-------------|
| `pq_fetch_requirement` | Fetch a node by exact ID (e.g. `ccpa.rights.deletion`) |
| `pq_search_requirements` | Search by keyword or pasted contract clause text |
| `pq_list_statutes` | List all statutes and browse node IDs |

## Statutes covered

CCPA/CPRA, VCDPA, CPA, CTDPA, UCPA, TDPSA, OCPA, MCDPA (Montana), ICDPA, INCDPA, TIPA, DPDPA, NJDPA, NHDPA, NDPA, KCDPA, MODPA, MCDPA-MN, RIDTPPA, FDBR

## Using in Claude Code

1. Clone the repo
2. `cd mcp-server && npm install`
3. Open the repo root in Claude Code — it picks up `.mcp.json` automatically
4. Claude now has `pq_fetch_requirement`, `pq_search_requirements`, and `pq_list_statutes`

## Contributing

The fastest way to contribute is to write missing nodes for underrepresented statutes. See `statutes/README.md` for the schema and coverage gaps.

The "PR as legislative patch" model: when a state amends its law, push a PR updating the relevant YAML node. Every user of the plugin gets the update on next pull.

## License

MIT
