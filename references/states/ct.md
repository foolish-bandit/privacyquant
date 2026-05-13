# Connecticut — Connecticut Data Privacy Act (CTDPA)
**Effective:** 7/1/2023  **Section:** Conn. Gen. Stat. § 42-520 et seq.  **Enforcer:** Attorney General
**Use alongside:** `pq_fetch_requirement`, `pq_dsar_router`, `pq_resolve_conflict_nodes`

---

## 1. Applicability Threshold

The CTDPA applies to persons that conduct business in Connecticut or produce products or services targeted to Connecticut residents **and** meet **either** of two prongs:

| Prong | Threshold |
|-------|-----------|
| Consumer count — standalone | ≥ 100,000 Connecticut consumers in a calendar year |
| Consumer count + sale revenue | ≥ 25,000 Connecticut consumers AND ≥ 25% of gross revenue from the sale of personal data |

- **No standalone revenue threshold.**
- Connecticut's sale-revenue prong uses **25%** — lower than Virginia's and Iowa's 50%, and matching Oregon's. This means a business with a moderately ad-supported revenue model can reach the second prong more easily than in VA/CO/UT.
- Nonprofits and government entities are exempt.
- Higher education institutions are exempt.
- Entity-level exemptions for HIPAA covered entities, financial institutions subject to GLBA, and FCRA-regulated entities.

Node IDs: `ctdpa.applicability.consumer_count`, `ctdpa.applicability.sale_revenue_pct`

---

## 2. Consumer Rights

| Right | Exists | Deadline | Extension |
|-------|--------|----------|-----------|
| Right to Access / Confirm | Yes | 45 days | +45 days with notice |
| Right to Delete | Yes | 45 days | +45 days with notice |
| Right to Correct | Yes | 45 days | +45 days with notice |
| Right to Portability | Yes | 45 days | +45 days with notice |
| Right to Opt-Out of Sale | Yes | 45 days | N/A |
| Right to Opt-Out of Targeted Advertising | Yes | 45 days | N/A |
| Right to Opt-Out of Profiling (significant decisions) | Yes | 45 days | N/A |

**Appeal Right:** Yes. Controllers must establish an internal appeal process. If the appeal is denied, the controller must provide the consumer with the AG's online complaint portal address.

**Correction Right:** Yes.

**Universal Opt-Out Mechanism (UOOM):** Required. Controllers must honor UOOM signals (such as GPC) as of **1/1/2025**. Connecticut was among the early states to codify a mandatory UOOM effective date in the original statute.

Node IDs: `ctdpa.rights.access`, `ctdpa.rights.deletion`, `ctdpa.rights.correction`, `ctdpa.rights.portability`, `ctdpa.rights.opt_out_sale`, `ctdpa.rights.opt_out_targeted_ads`, `ctdpa.rights.opt_out_profiling`, `ctdpa.rights.appeal`, `ctdpa.rights.uoom`

---

## 3. Controller Duties

### Privacy Notice
Must be reasonably accessible, clear, and meaningfully provide the following: categories of personal data processed; purposes of processing; categories shared with third parties; categories of third parties; how to submit rights requests; how to appeal a denial; and whether data is sold or used for targeted advertising.

### Data Processing Agreements (DPAs)
Controllers must enter written contracts with processors specifying: processing instructions and scope; data security obligations; subprocessor conditions; confidentiality; return/deletion of data on termination; and cooperation on consumer rights requests and breach notification.

### Data Protection Assessments (DPIAs)
Required for processing that presents a heightened risk:
- Targeted advertising
- Sale of personal data
- Profiling with legal or significant effects
- Processing sensitive data
- Any processing presenting material risk as determined by the controller

DPIAs are available to the AG on request during enforcement proceedings.

### ADMT Disclosure — LLM Training (Effective 8/1/2026)
Connecticut enacted an amendment requiring controllers that use personal data to train **large language models** to disclose this in privacy notices and provide an opt-out mechanism. This is the first US state statute with an express LLM training disclosure requirement. The obligation applies to automated decision-making tools (ADMT) that include LLMs as a component.

Node IDs: `ctdpa.controller_duties.privacy_notice`, `ctdpa.controller_duties.processor_contract`, `ctdpa.controller_duties.dpia`, `ctdpa.controller_duties.admt_llm_disclosure`

---

## 4. Sensitive Data

CTDPA sensitive data categories:

- Racial or ethnic origin
- Religious beliefs
- Mental or physical health condition or diagnosis
- Sex life or sexual orientation
- Immigration status
- Genetic or biometric data (processed to uniquely identify)
- Children's personal data (under 13 per COPPA; also children 13–16 for certain purposes)
- Precise geolocation (within 1,750 feet)
- Financial account credentials (account + access credentials)
- Citizenship status

**Consent Mechanism:** **Opt-in consent** required before processing sensitive data. Connecticut follows the standard opt-in model and does not use California's limit-right structure.

Node IDs: `ctdpa.sensitive_data.categories`, `ctdpa.sensitive_data.opt_in_consent`

---

## 5. Enforcement

| Item | Detail |
|------|--------|
| Enforcer | Attorney General exclusively |
| Cure period | 60 days until **1/1/2026**; **no cure period after 1/1/2026** |
| Civil penalty — per violation | Up to $5,000 per violation |
| Private Right of Action | **None** |

Connecticut is the **first state to legislatively eliminate its cure period** — setting a sunset date of 1/1/2026 in the original statute. After that date, the AG may bring enforcement without any prior cure notice. This makes Connecticut enforcement posture from 2026 onward similar to California's (no fixed cure window).

Node IDs: `ctdpa.enforcement.civil_penalty`, `ctdpa.enforcement.cure_period`, `ctdpa.enforcement.cure_sunset`

---

## 6. Key Quirks

- **First state to eliminate the cure period by statute.** Connecticut's original 2022 bill included a built-in sunset on the 60-day cure period, effective 1/1/2026. No other state at enactment had scheduled its own cure period elimination. Businesses should treat CT enforcement as no-cure after 1/1/2026.

- **LLM training disclosure (8/1/2026).** CTDPA is the first US state law to expressly require disclosure when personal data is used to train large language models, with an opt-out right. The `ctdpa.controller_duties.admt_llm_disclosure` node governs this requirement. Practitioners advising AI companies must monitor this provision carefully.

- **25% sale-revenue prong.** Connecticut's second applicability prong uses 25% of revenue from sale, not 50%. A digital publisher deriving a quarter of revenue from data monetization reaches this prong with half the consumer count required by the standalone prong.

- **UOOM effective 1/1/2025.** Connecticut's mandatory UOOM obligation aligns with its broader consumer-empowerment posture. Non-compliance with UOOM signals after 1/1/2025 is independently enforceable.

- **AG complaint portal required in appeal denials.** When a controller denies a consumer's appeal, it must specifically direct the consumer to the AG's online privacy complaint submission portal. Controllers should verify the current AG portal URL and include it in denial communications.

Node IDs: `ctdpa.quirks.cure_sunset`, `ctdpa.quirks.llm_disclosure`, `ctdpa.quirks.25pct_revenue`, `ctdpa.quirks.uoom_2025`, `ctdpa.quirks.appeal_ag_portal`

---

## 7. Node ID Reference

| Area | Node ID |
|------|---------|
| Applicability — consumer count | `ctdpa.applicability.consumer_count` |
| Applicability — sale revenue % | `ctdpa.applicability.sale_revenue_pct` |
| Right to access | `ctdpa.rights.access` |
| Right to deletion | `ctdpa.rights.deletion` |
| Right to correction | `ctdpa.rights.correction` |
| Right to portability | `ctdpa.rights.portability` |
| Right to opt-out of sale | `ctdpa.rights.opt_out_sale` |
| Right to opt-out of targeted ads | `ctdpa.rights.opt_out_targeted_ads` |
| Right to opt-out of profiling | `ctdpa.rights.opt_out_profiling` |
| Appeal right | `ctdpa.rights.appeal` |
| UOOM | `ctdpa.rights.uoom` |
| Sensitive data categories | `ctdpa.sensitive_data.categories` |
| Sensitive data opt-in | `ctdpa.sensitive_data.opt_in_consent` |
| Privacy notice | `ctdpa.controller_duties.privacy_notice` |
| Processor contract | `ctdpa.controller_duties.processor_contract` |
| DPIA | `ctdpa.controller_duties.dpia` |
| ADMT/LLM disclosure | `ctdpa.controller_duties.admt_llm_disclosure` |
| Civil penalty | `ctdpa.enforcement.civil_penalty` |
| Cure period | `ctdpa.enforcement.cure_period` |
| Cure sunset | `ctdpa.enforcement.cure_sunset` |

---

**Limitations**: This analysis is based on the PrivacyQuant statutory knowledge graph as of the node version dates. Laws change; statutory graph nodes may not reflect the most recent amendments or regulatory guidance. This output is a draft for review by qualified counsel admitted in the relevant jurisdiction — it is not legal advice and does not constitute the practice of law.
