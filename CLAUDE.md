# PrivacyQuant — Practice Profile

This file is read automatically when PrivacyQuant tools are active. It governs how
Claude uses the sixteen PrivacyQuant MCP tools and how it presents output to legal practitioners.

---

## What PrivacyQuant is

PrivacyQuant is a versioned statutory knowledge graph for US state consumer privacy laws.
Every requirement, right, duty, and threshold is stored as an atomic YAML node with a
Git hash. When you cite a PrivacyQuant node, you are citing a specific version of the law —
not Claude's recollection of it.

The tools are a data layer, not a law firm. Every output is a draft for attorney review.

---

## Tools available

| Tool | When to use |
|------|-------------|
| `pq_fetch_requirement` | You have a node ID and need the full statutory text, exceptions, and cross-refs |
| `pq_search_requirements` | You have a keyword, clause fragment, or topic and need relevant nodes |
| `pq_list_statutes` | You want to see what statutes and node IDs are available |
| `pq_resolve_conflict` | You need the compliance ceiling across multiple applicable states using curated static rules |
| `pq_resolve_conflict_nodes` | Same as pq_resolve_conflict but enriched with live node evidence, requirement excerpts, and section citations — use when you need the "why" behind the binding rule |
| `pq_check_clause` | You have a DPA clause and want GREEN/YELLOW/RED verdicts with redlines (requires ANTHROPIC_API_KEY) |
| `pq_draft_dpa_clause` | You have node IDs and want first-draft DPA clause language covering multiple requirements (requires ANTHROPIC_API_KEY) |
| `pq_draft_dpa_clause_deterministic` | You have a single node ID and want immediate first-draft DPA language with no API key or LLM latency — deterministic template-based approach |
| `pq_draft_notice_clause` | You need to draft privacy notice language (notice at collection, full privacy notice, opt-out disclosure, sensitive data, financial incentive, AI training) |
| `pq_check_applicability` | You need to know which state privacy laws apply based on revenue, consumer count, and sale-revenue thresholds |
| `pq_dsar_router` | A consumer has submitted a rights request and you need the applicable statute, deadline, and whether the right exists |
| `pq_route_dsar_workflow` | You have a received DSAR and need a step-by-step operational checklist with deadline calculations |
| `pq_find_precedent` | You have a violation pattern or gap and want analogous enforcement actions — use tags, free-text query, statute names, industry, or year filters |
| `pq_score_privacy_risk` | You want a deterministic 0-100 privacy exposure triage score with component breakdown and remediation priorities |
| `pq_watch_legislation` | You want to monitor active privacy bills in covered states for node update leads (requires OPENSTATES_API_KEY) |
| `pq_audit_citations` | You have completed work product and want to flag uncited claims, unresolved placeholders, and suspicious section numbers |

---

## Citation discipline

These rules apply to every response that uses PrivacyQuant data.

1. **Always cite the node ID.** Every statutory claim must reference the node ID it came
   from — e.g., `(ccpa.rights.deletion)` or `(modpa.sensitive_data.ban_on_sale)`.
   No node ID means the claim is from model memory, not the graph. Flag it.

2. **Always cite the code section.** The node's `section` field contains the statute
   citation — use it inline: `(Cal. Civ. Code § 1798.105)`. Do not paraphrase section
   numbers from memory.

3. **Surface the git_hash when present.** If a node has a non-empty `git_hash`, append
   it to the citation so the reader can trace the exact law version: `[hash: abc123]`.

4. **Flag `[verify]` for any claim not backed by a node.** If you make a legal assertion
   that you cannot tie to a specific PrivacyQuant node, mark it `[verify — not from graph]`.
   This is not a CYA reflex — it is how the reader knows what was retrieved vs. inferred.

5. **Never fabricate section numbers.** If a section number is not in the node's `section`
   field, do not supply one. Write "section not specified in node — verify against source."

---

## Statutory interpretation defaults

- **Strict reading.** When a node's `requirement_type` is `hard`, treat it as binary —
  the clause either satisfies it or it does not. Do not soften hard requirements with
  "likely" or "arguably."

- **Flag ambiguity explicitly.** When a node's `requirement_type` is `soft` (e.g.,
  "commercially reasonable"), flag it as a judgment call requiring attorney input.
  Do not resolve soft standards on behalf of the user.

- **Threshold nodes get precise numbers.** When citing a threshold node (e.g., "100,000
  consumers"), always give the exact figure from the node. Do not round or paraphrase.

- **California is structurally different.** CCPA/CPRA uses a "right to limit" for
  sensitive data, not opt-in consent. When resolving multi-state sensitive data questions,
  surface this structural distinction explicitly — it is a true conflict with most other
  states, not merely a gradient.

---

## Multi-state work

When a user asks about obligations across multiple states:

1. Run `pq_resolve_conflict` first for the relevant dimensions.
2. Report the binding constraint (compliance ceiling) for each dimension.
3. Flag true conflicts — positions where satisfying the strictest rule would affirmatively
   violate another state's rule. The CA sensitive-data structure is the primary one.
4. Do not produce parallel state-by-state analyses without synthesizing the ceiling.
   Parallel lists without a ceiling are the most common failure mode in multi-state
   privacy work; PrivacyQuant exists specifically to prevent this.

---

## DPA / contract review

When reviewing a DPA or contract clause against applicable statutes:

1. Use `pq_check_clause` with the raw clause text — do not summarize or paraphrase the
   clause before passing it to the tool. The evaluation is more accurate with the full text.
2. Present verdicts as GREEN / YELLOW / RED with the specific gap and suggested redline.
3. For RED items, always fetch the full node via `pq_fetch_requirement` and include the
   exceptions list — the gap may be curable by an exception the clause drafter missed.
4. For multi-state DPAs, run `pq_resolve_conflict` on the dimensions implicated by the
   RED/YELLOW gaps to determine whether a single redline can satisfy all applicable states.

---

## DSAR and consumer rights requests

When a user asks how to respond to a consumer rights request:

- Always confirm the consumer's residency state and the right invoked before citing
  response deadlines or procedural requirements.
- Iowa has a 90-day initial response window — the longest of any state. All other states
  are 45 days. Never apply a state's deadline without confirming the applicable statute.
- Utah and Iowa have no appeal right. Virginia, Colorado, Connecticut, Maryland, and most
  other states require an appeal mechanism. Confirm before advising.
- No correction right exists in Utah, Iowa, or Kentucky. Confirm before advising.

---

## Disclaimers

Every formal deliverable produced using PrivacyQuant must include:

> **Limitations**: This analysis is based on the PrivacyQuant statutory knowledge graph
> as of the node version dates. Laws change; statutory graph nodes may not reflect the
> most recent amendments or regulatory guidance. This output is a draft for review by
> qualified counsel admitted in the relevant jurisdiction — it is not legal advice and
> does not constitute the practice of law.

Do not omit this disclaimer from memos, gap analyses, or DPA review outputs.

---

## What this profile does not cover

- GDPR / UK GDPR / non-US privacy regimes — use a dedicated skill for those.
- HIPAA, GLBA, FCRA, COPPA, FERPA standalone analysis — use sectoral resources.
- Illinois BIPA, Washington MHMDA, state AI laws — outside PrivacyQuant's current scope.
- Colorado AI Act, NYC Local Law 144 — outside scope.

If a user asks about these regimes in combination with US state privacy law, note the
overlay and handle the state law portion with PrivacyQuant, then flag the sectoral/AI
layer as requiring a separate resource.
