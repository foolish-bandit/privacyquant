# PrivacyQuant — Plugin Directory Submission

## Submission metadata

**Plugin name**: privacyquant  
**Publisher**: foolish-bandit (Zachary Brenner / Sonomos, Inc.)  
**Repository**: https://github.com/foolish-bandit/privacyquant  
**License**: MIT  
**Submit via**: https://clau.de/plugin-directory-submission

---

## plugin.json fields (for review pipeline)

```json
{
  "name": "privacyquant",
  "version": "0.1.0",
  "description": "Versioned statutory knowledge graph for US state consumer privacy laws. 18 MCP tools covering applicability analysis, DPA clause review and drafting, privacy notice drafting, DSAR routing, multi-state conflict resolution, enforcement precedent research, legislative monitoring, citation auditing, risk scoring, and DOCX memo deliverable generation. Covers CCPA/CPRA, VCDPA, CPA, CTDPA, UCPA, TDPSA, OCPA, MCDPA, ICDPA, INCDPA, TIPA, DPDPA, NJDPA, NHDPA, NDPA, KCDPA, MODPA, MCDPA-MN, RIDTPPA, and FDBR across 146 atomic requirement nodes.",
  "author": {
    "name": "Zachary Brenner",
    "url": "https://github.com/foolish-bandit"
  },
  "homepage": "https://github.com/foolish-bandit/privacyquant",
  "repository": "https://github.com/foolish-bandit/privacyquant",
  "license": "MIT",
  "keywords": [
    "privacy", "legal", "CCPA", "CPRA", "VCDPA", "DPA", "DSAR",
    "compliance", "US privacy law", "data protection", "enforcement",
    "privacy risk", "legislative monitoring"
  ]
}
```

---

## legal-builder-hub registry entry

For inclusion in the `claude-for-legal` legal-builder-hub registry 
(`anthropics/claude-for-legal/legal-builder-hub/registry/`):

```json
{
  "id": "privacyquant",
  "name": "PrivacyQuant",
  "publisher": "foolish-bandit",
  "repository": "https://github.com/foolish-bandit/privacyquant",
  "license": "MIT",
  "practice_areas": ["privacy-legal", "compliance", "regulatory-legal"],
  "description": "Versioned statutory knowledge graph for US state consumer privacy laws — the missing data layer for Anthropic's privacy-legal plugin. 18 MCP tools including DPA clause review with GREEN/YELLOW/RED verdicts, multi-state compliance ceiling synthesis, enforcement precedent matching (84 actions, 48 violation theory tags), DSAR routing with Iowa/UT/KY edge cases, legislative monitoring via OpenStates API, BM25 semantic search over 146 atomic requirement nodes across 20 states, and DOCX memo deliverable generation.",
  "complements": ["privacy-legal"],
  "install": "/plugin marketplace add foolish-bandit/privacyquant",
  "requires_api_key": {
    "ANTHROPIC_API_KEY": "Required for pq_check_clause and pq_draft_dpa_clause",
    "OPENSTATES_API_KEY": "Optional — enables pq_watch_legislation (free at open.pluralpolicy.com)"
  },
  "tools": 18,
  "deterministic_tools": 16,
  "node_count": 146,
  "statutes_covered": 20,
  "last_verified": "2026-05-13"
}
```

---

## QA checklist (legal-builder-hub skills-qa framework)

| Parameter | Status |
|-----------|--------|
| Citation discipline | ✅ Every output cites node IDs and statutory sections |
| Hallucination surface | ✅ 16/18 tools are fully deterministic — no LLM in the path |
| Jurisdiction specificity | ✅ 20 covered states, explicit no-law routing for ~30 states |
| Disclaimer coverage | ✅ Every output includes attorney-review disclaimer per CLAUDE.md |
| Trust surface | ✅ YAML nodes are version-controlled with git_hash field |
| License compliance | ✅ MIT; enforcement corpus v2.3 sourced from public AG/CPPA records |
| Freshness gate | ✅ YAML schema has effective_date + amended_by fields; pq_watch_legislation monitors active bills |
| Injection resistance | ✅ No user-controlled strings passed to shell; all API calls use SDK |
| Sensitive data handling | ✅ No user data stored; all processing is stateless MCP calls |

---

## Submission notes

PrivacyQuant is designed as the data layer complement to Anthropic's `privacy-legal` 
plugin, not a replacement. The `privacy-legal` plugin handles workflow orchestration 
(DPA review as controller/processor, DSAR response drafting, PIA generation). 
PrivacyQuant provides the statutory ground truth those workflows reason against — 
versioned, citable, queryable nodes with multi-state synthesis that `privacy-legal` 
does not include.

The two plugins are designed to be installed together. PrivacyQuant's CLAUDE.md 
practice profile explicitly says: "if the privacy-legal plugin is also installed, 
use PrivacyQuant tools for statutory citation and multi-state synthesis, and 
privacy-legal for workflow orchestration."

Suggested legal-builder-hub listing category: **Privacy & Data Protection > 
US State Law Data Layer**
