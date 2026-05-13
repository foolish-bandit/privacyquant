# PrivacyQuant Statutory Knowledge Graph

This directory contains the versioned statutory requirement nodes for US state consumer privacy laws.

## Coverage

| Statute | State | Effective | Nodes | Directory |
|---|---|---|---|---|
| CCPA/CPRA | California | Jan 2020 / Jan 2023 | 14 | `ccpa/` |
| VCDPA | Virginia | Jan 2023 | 11 | `vcdpa/` |
| CPA | Colorado | Jul 2023 | 5 | `cpa/` |
| CTDPA | Connecticut | Jul 2023 | 5 | `ctdpa/` |
| UCPA | Utah | Dec 2023 | 4 | `ucpa/` |
| TDPSA | Texas | Jul 2024 | 3 | `tdpsa/` |
| OCPA | Oregon | Jul 2024 | 3 | `ocpa/` |
| MCDPA | Montana | Oct 2024 | 3 | `mcdpa/` |
| ICDPA | Iowa | Jan 2025 | 4 | `icdpa/` |
| DPDPA | Delaware | Jan 2025 | 4 | `dpdpa/` |
| NJDPA | New Jersey | Jan 2025 | 5 | `njdpa/` |
| NHDPA | New Hampshire | Jan 2025 | 3 | `nhdpa/` |
| NDPA | Nebraska | Jan 2025 | 2 | `ndpa/` |
| MODPA | Maryland | Oct 2025 | 6 | `modpa/` |
| TIPA | Tennessee | Jul 2025 | 3 | `tipa/` |
| MCDPA-MN | Minnesota | Jul 2025 | 5 | `mcdpa_mn/` |
| INCDPA | Indiana | Jan 2026 | 3 | `incdpa/` |
| KCDPA | Kentucky | Jan 2026 | 3 | `kcdpa/` |
| RIDTPPA | Rhode Island | Jan 2026 | 4 | `ridtppa/` |
| FDBR | Florida | Jul 2024 | 2 | `fdbr/` |

**Total: 93 nodes across 20 statutes.**

## Node structure

See `schema.yaml` for the full schema. Key fields:

- **`requirement_type`**: `hard` (binary), `threshold` (ranged/conditional), or `soft` (flagged-for-human)
- **`contract_signals`**: keywords that appear in real DPA/contract language indicating this requirement is relevant — used for clause-to-node matching
- **`cross_refs`**: links to equivalent requirements in other statutes, enabling compliance-ceiling synthesis
- **`git_hash`**: auto-populated on commit; links every AI-generated redline to a specific law version

## ID convention

`<statute_lowercase>.<area>.<aspect>`

Examples:
- `ccpa.rights.deletion`
- `modpa.sensitive_data.ban_on_sale`
- `mcdpa_mn.rights.specific_third_parties`

## Contributing

1. Read `schema.yaml` before writing a new node.
2. One node per distinct requirement/right/duty/threshold.
3. Every non-trivial assertion in `requirement` must be backed by the `section` field.
4. `git_hash` must always be `""` in hand-edited files — it is populated automatically.
5. Open a PR with a link to the official source in `source_url`.

## Known gaps (v0.1)

The following nodes exist but have reduced coverage relative to CA/VA/CO — PRs welcome:

- CPA: missing individual rights nodes (access, deletion, correction, portability, appeal)
- TDPSA, NDPA, OCPA, MCDPA, ICDPA, INCDPA, TIPA, KCDPA, NHDPA, DPDPA, RIDTPPA, FDBR:
  individual rights nodes and processor contract nodes not yet written
- Cross-state: `pq_resolve_conflict` synthesizes compliance ceilings across 12 dimensions; `pq_resolve_conflict_nodes` adds live node evidence to the same analysis
