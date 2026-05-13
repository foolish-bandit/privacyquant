# PrivacyQuant Connectors

PrivacyQuant's five built-in MCP tools cover statutory lookup, multi-state synthesis,
DPA clause checking, DSAR routing, and enforcement precedent matching. The tools below
extend that capability with live primary source data.

---

## CourtListener (Free Law Project)

**What it adds:** Live access to 18+ million US court records, dockets, PACER filings,
and citation networks. Free API — create an account at courtlistener.com to get a key.

**Why it pairs with PrivacyQuant:** `pq_find_precedent` returns enforcement action
records from the PrivacyQuant corpus (84 actions, updated periodically). CourtListener
lets you verify those citations against primary court records, pull full opinion text,
see subsequent citations, and check docket status for pending matters.

**Install (Claude Code):**

```bash
/plugin marketplace add freelawproject/courtlistener-mcp
/plugin install courtlistener@courtlistener-mcp
```

Set your API key:

```bash
export COURTLISTENER_API_KEY=your_key_here
```

Get a free key: https://www.courtlistener.com/api/

**Workflow example:**

```
# 1. Find enforcement precedents in PrivacyQuant corpus
pq_find_precedent(tags: ["gpc_not_honored", "dark_pattern_optout"], states: ["CA"])
→ returns ca-ag-disney-streaming-2026, ca-sephora-2022, ca-cppa-tractor-supply-2025

# 2. Pull the full docket for any matter via CourtListener
courtlistener:search_cases(query: "Disney streaming CCPA opt-out")
→ returns full court record, opinion text, citation network

# 3. Check for subsequent developments, related cases, or pending appeals
courtlistener:find_similar_precedents(reference_case_id: "...")
```

**Notes:**
- CourtListener has strong coverage of federal courts and select state courts.
  CPPA administrative enforcement orders (Honda, Todd Snyder, Tractor Supply) are
  not federal court records — use cppa.ca.gov directly for those.
- CourtListener's free tier provides 5,000 API requests/hour.
- CA AG settlements (Sephora, DoorDash, Disney) may appear as filed stipulated
  judgments in CA Superior Court; search by case caption.

---

## Ansvar Systems US-law-mcp

**What it adds:** Verified text of 130+ US federal statutes and regulations from
official eCFR and US Code sources. Zero LLM summarization — regulation text only.
Covers HIPAA, CCPA, SOX, GLBA, FERPA, COPPA, FISMA, FTC HBNR, and more.

**Why it pairs with PrivacyQuant:** PrivacyQuant covers state comprehensive privacy
laws. US-law-mcp covers the federal sectoral overlay — HIPAA, GLBA, COPPA, FTC Act
§ 5, Health Breach Notification Rule — that modify or preempt state obligations in
specific contexts. [`references/federal-overlays.md`](references/federal-overlays.md)
documents these interactions in detail (HIPAA entity-level vs. data-level exemptions
by state, GLBA preemption boundaries, COPPA teen-data interaction, FERPA and FCRA
overlap analysis); US-law-mcp lets you query the underlying federal text directly to
verify specific preemption language.

**Install:**

```bash
git clone https://github.com/Ansvar-Systems/US-law-mcp
```

Follow their README for setup and API key configuration.

**Workflow example:**

```
# Check HIPAA preemption question when PrivacyQuant flags a state deletion obligation
pq_fetch_requirement(id: "ccpa.rights.deletion")
→ notes HIPAA-covered data is exempt at data level

# Verify the HIPAA preemption boundary via federal text
us_law_mcp:search(query: "HIPAA preemption state privacy law", statute: "HIPAA")
→ returns 45 CFR § 160.203 preemption analysis
```

---

## Open States / Plural (Legislative Tracking)

**What it adds:** Real-time bill tracking across all 50 state legislatures via the
Plural Policy API. Search active privacy bills, get amendment text, track committee
actions and effective dates.

**Why it pairs with PrivacyQuant:** PrivacyQuant nodes are versioned snapshots.
Open States tells you when a node is about to go stale — when a state has an active
amendment bill that would change a deadline, penalty figure, or right.

**API key:** https://open.pluralpolicy.com (free tier available)

**PrivacyQuant has a built-in tool for this:** `pq_watch_legislation` queries the
Plural API for active privacy bills in covered states. Set `OPENSTATES_API_KEY` to
enable it.

---

## Adding a Connector

See the Anthropic [CONNECTORS.md](https://github.com/anthropics/claude-for-legal/blob/main/CONNECTORS.md)
guide for what a good legal MCP server looks like. PrivacyQuant follows the same
plugin conventions as `claude-for-legal`. If you build a connector that pairs well
with PrivacyQuant, open a PR adding it here.
