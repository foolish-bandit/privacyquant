# Texas — Texas Data Privacy and Security Act (TDPSA)
**Effective:** 7/1/2024  **Section:** Tex. Bus. & Com. Code § 541.001 et seq.  **Enforcer:** Attorney General
**Use alongside:** `pq_fetch_requirement`, `pq_dsar_router`, `pq_resolve_conflict_nodes`

---

## 1. Applicability Threshold

The TDPSA applies to persons that conduct business in Texas or produce products or services consumed by Texas residents **and** process or engage in the sale of personal data. Texas uses a **tiered applicability structure** — two separate prongs that unlock different obligations:

| Prong | Threshold | Obligation Unlocked |
|-------|-----------|---------------------|
| Prong A — consumer count | ≥ 100,000 Texas consumers (excluding payment processing) | Access, deletion, portability, correction; opt-out of sale/targeted ads/profiling |
| Prong B — sale revenue | ≥ 25,000 Texas consumers AND ≥ 50% of revenue from sale of personal data | All rights + heightened obligations |

- **No standalone revenue threshold** (unlike California and Utah/Tennessee two-part tests).
- **Small business exemption:** Entities meeting the U.S. Small Business Administration's definition of a "small business" are **exempt** from most requirements. This is a distinctive feature — no other comprehensive state privacy law uses the SBA small business definition as an exemption gate.
- Nonprofits, government entities, HIPAA covered entities (entity-level), GLBA financial institutions (entity-level), higher education, and COPPA-regulated entities are exempt.

Node IDs: `tdpsa.applicability.consumer_count`, `tdpsa.applicability.sale_revenue_pct`, `tdpsa.applicability.small_business_exemption`

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

**Appeal Right:** Yes. Controllers must establish and disclose an internal appeal mechanism. If the appeal is denied, the consumer must be provided information on how to contact the AG.

**Correction Right:** Yes.

**Universal Opt-Out Mechanism (UOOM):** Required as of **1/1/2025**. Texas TDPSA requires controllers to honor UOOM signals for opt-out of targeted advertising and sale. The mechanism is framed separately from GPC — TDPSA specifies the AG will publish a list of recognized opt-out signals.

Node IDs: `tdpsa.rights.access`, `tdpsa.rights.deletion`, `tdpsa.rights.correction`, `tdpsa.rights.portability`, `tdpsa.rights.opt_out_sale`, `tdpsa.rights.opt_out_targeted_ads`, `tdpsa.rights.opt_out_profiling`, `tdpsa.rights.appeal`, `tdpsa.rights.uoom`

---

## 3. Controller Duties

### Privacy Notice
Must be reasonably accessible. Must include: categories of personal data processed; purposes; rights and how to exercise them; categories shared with third parties; whether data is sold; whether data is used for targeted advertising; and how to submit an appeal.

### Data Processing Agreements
Controllers must have written contracts with processors. Contracts must specify: processing instructions, scope, and purpose; data security; confidentiality; subprocessor requirements; return or deletion of data; and cooperation on consumer requests and breach notification.

### Data Protection Assessments (DPIAs)
Required for high-risk processing activities:
- Targeted advertising
- Sale of personal data
- Profiling with legal or significant effects
- Processing sensitive data
- Any processing presenting material risk

DPIAs must be documented and made available to the AG upon request.

### Sensitive Data — Heightened Penalties
Violations involving sensitive data are subject to trebled penalties — up to **$150,000 per violation** (versus the standard $7,500). This creates a strong incentive to treat sensitive data with particular care.

Node IDs: `tdpsa.controller_duties.privacy_notice`, `tdpsa.controller_duties.processor_contract`, `tdpsa.controller_duties.dpia`, `tdpsa.controller_duties.sensitive_data_penalty`

---

## 4. Sensitive Data

TDPSA sensitive data categories:

- Racial or ethnic origin
- Religious beliefs
- Mental or physical health condition or diagnosis (including pregnancy)
- Sexual orientation or gender identity
- Citizenship or immigration status
- Genetic or biometric data (processed for unique identification)
- Children's personal data (under 13 per COPPA; also 13–17 for certain processing)
- Precise geolocation (within a radius sufficient to identify a home or place of worship)
- Financial account credentials
- Social Security number, driver's license, or government ID number

**Consent Mechanism:** **Opt-in consent** required before processing sensitive data. Texas follows the standard opt-in model.

**Heightened enforcement for sensitive data:** Knowing violations involving sensitive categories may result in penalties up to $150,000 per violation, rather than the standard $7,500. This is unique to Texas — no other state has codified a separate heightened penalty tier for sensitive data violations.

Node IDs: `tdpsa.sensitive_data.categories`, `tdpsa.sensitive_data.opt_in_consent`, `tdpsa.sensitive_data.heightened_penalty`

---

## 5. Enforcement

| Item | Detail |
|------|--------|
| Enforcer | Attorney General exclusively |
| Cure period | 30 days |
| Civil penalty — standard | Up to $7,500 per violation |
| Civil penalty — sensitive data (knowing) | Up to $150,000 per violation |
| Private Right of Action | **None** (except as may exist under other Texas consumer protection statutes) |

The AG may bring civil enforcement actions after a 30-day cure period. The trebled sensitive data penalty is the most significant financial exposure asymmetry in any current state privacy law.

Node IDs: `tdpsa.enforcement.civil_penalty`, `tdpsa.enforcement.sensitive_data_penalty`, `tdpsa.enforcement.cure_period`

---

## 6. Key Quirks

- **SBA small business exemption.** TDPSA is the only comprehensive state privacy law that uses the federal SBA small business definition as an exemption gate. Because SBA size standards vary by industry (NAICS code), whether a business qualifies requires industry-specific analysis — it is not simply a revenue or headcount floor.

- **Tiered applicability prongs with distinct obligations.** Texas's two-prong structure means a controller may be subject to some TDPSA requirements (e.g., privacy notice) but not others depending on which threshold it meets. Practitioners should map which prong applies before advising on specific obligations.

- **$150,000 sensitive data penalty.** Texas has the only statutory provision trebling the per-violation penalty for knowing violations involving sensitive personal data. Entities processing health, biometric, or geolocation data must treat TDPSA compliance as a high-stakes obligation.

- **UOOM is AG-defined.** Unlike Colorado (GPC-aligned) and California (GPC required), Texas directs the AG to publish a recognized list of opt-out signals. Businesses must monitor AG publications to ensure their honored signal list matches the current AG-approved list.

- **Pregnancy data is expressly listed.** TDPSA explicitly includes pregnancy-related health conditions as sensitive personal data. This has post-Dobbs significance for reproductive health app operators and healthcare platforms serving Texas consumers.

Node IDs: `tdpsa.quirks.sba_exemption`, `tdpsa.quirks.tiered_applicability`, `tdpsa.quirks.sensitive_penalty`, `tdpsa.quirks.ag_uoom_list`, `tdpsa.quirks.pregnancy_sensitive`

---

## 7. Node ID Reference

| Area | Node ID |
|------|---------|
| Applicability — consumer count | `tdpsa.applicability.consumer_count` |
| Applicability — sale revenue % | `tdpsa.applicability.sale_revenue_pct` |
| Applicability — SBA exemption | `tdpsa.applicability.small_business_exemption` |
| Right to access | `tdpsa.rights.access` |
| Right to deletion | `tdpsa.rights.deletion` |
| Right to correction | `tdpsa.rights.correction` |
| Right to portability | `tdpsa.rights.portability` |
| Right to opt-out of sale | `tdpsa.rights.opt_out_sale` |
| Right to opt-out of targeted ads | `tdpsa.rights.opt_out_targeted_ads` |
| Right to opt-out of profiling | `tdpsa.rights.opt_out_profiling` |
| Appeal right | `tdpsa.rights.appeal` |
| UOOM | `tdpsa.rights.uoom` |
| Sensitive data categories | `tdpsa.sensitive_data.categories` |
| Sensitive data opt-in | `tdpsa.sensitive_data.opt_in_consent` |
| Sensitive data heightened penalty | `tdpsa.sensitive_data.heightened_penalty` |
| Privacy notice | `tdpsa.controller_duties.privacy_notice` |
| Processor contract | `tdpsa.controller_duties.processor_contract` |
| DPIA | `tdpsa.controller_duties.dpia` |
| Civil penalty | `tdpsa.enforcement.civil_penalty` |
| Cure period | `tdpsa.enforcement.cure_period` |

---

**Limitations**: This analysis is based on the PrivacyQuant statutory knowledge graph as of the node version dates. Laws change; statutory graph nodes may not reflect the most recent amendments or regulatory guidance. This output is a draft for review by qualified counsel admitted in the relevant jurisdiction — it is not legal advice and does not constitute the practice of law.
