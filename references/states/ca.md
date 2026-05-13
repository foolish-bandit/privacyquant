# California — California Consumer Privacy Act / California Privacy Rights Act (CCPA/CPRA)
**Effective:** 1/1/2020 (CCPA); 1/1/2023 (CPRA amendments)  **Section:** Cal. Civ. Code §§ 1798.100–1798.199.100  **Enforcer:** California Privacy Protection Agency (CPPA) + Attorney General
**Use alongside:** `pq_fetch_requirement`, `pq_dsar_router`, `pq_resolve_conflict_nodes`

---

## 1. Applicability Threshold

CCPA/CPRA applies to for-profit businesses that collect personal information from California consumers and meet **any one** of three prongs:

| Prong | Threshold |
|-------|-----------|
| Annual gross revenue | > $25,000,000 |
| Personal information buying/selling/sharing | ≥ 100,000 consumers or households annually |
| Revenue from selling/sharing PI | ≥ 50% of annual revenue |

- The revenue threshold is measured on a **calendar-year** basis.
- A business outside California that serves California consumers is still covered if it meets any prong.
- Nonprofit organizations are **not** covered (unlike some other states).
- Employment/B2B personal information exemptions expired 1/1/2023; CPRA brought those in scope.

Node IDs: `ccpa.applicability.revenue_threshold`, `ccpa.applicability.consumer_count`, `ccpa.applicability.sale_revenue_pct`

---

## 2. Consumer Rights

| Right | Exists | Deadline | Extension |
|-------|--------|----------|-----------|
| Right to Know / Access | Yes | 45 calendar days | +45 days with notice |
| Right to Delete | Yes | 45 calendar days | +45 days with notice |
| Right to Correct | Yes (CPRA) | 45 calendar days | +45 days with notice |
| Right to Portability (data export) | Yes | 45 calendar days | +45 days with notice |
| Right to Opt-Out of Sale/Sharing | Yes | 15 business days to honor | N/A |
| Right to Limit Use of Sensitive PI | Yes (CPRA) — unique structure | 15 business days to honor | N/A |
| Right to Non-Discrimination | Yes | N/A | N/A |

**Appeal Right:** No formal internal appeal mechanism is required. California operates on a consumer-direct model — consumers may file complaints with the CPPA or AG rather than appealing to the business.

**Correction Right:** Yes (added by CPRA effective 1/1/2023).

**GPC (Global Privacy Control):** **Required.** Businesses must treat a GPC signal as a valid opt-out of sale and sharing. This is the only state with a mandatory GPC honor obligation.

Node IDs: `ccpa.rights.access`, `ccpa.rights.deletion`, `ccpa.rights.correction`, `ccpa.rights.portability`, `ccpa.rights.opt_out_sale`, `ccpa.rights.limit_sensitive`, `ccpa.rights.non_discrimination`

---

## 3. Controller Duties

### Privacy Notice
- Must be provided at or before collection; must disclose categories collected, purposes, third-party disclosures, and consumer rights.
- Must include a "Do Not Sell or Share My Personal Information" link (or combined opt-out link) on homepage.
- Annual update required or whenever there is a material change.

### Data Processing Agreements
- Service provider contracts must include statutory terms prohibiting the service provider from retaining, using, or disclosing PI outside the business purpose.
- CPRA added contractor and third-party categories with distinct obligations.

### Data Protection Impact Assessments (DPIAs)
- CPRA authorizes CPPA to promulgate DPIA regulations; draft rules have been circulating.
- Businesses conducting high-risk processing should prepare for formal DPIA requirements once CPPA finalizes rules.

### Data Minimization / Purpose Limitation
- CPRA added explicit data minimization and purpose limitation requirements: collect only what is reasonably necessary for the disclosed purpose.

### Retention Periods
- CPRA requires disclosure of retention periods (or criteria used to determine retention) in the privacy notice.

Node IDs: `ccpa.controller_duties.privacy_notice`, `ccpa.controller_duties.service_provider_contract`, `ccpa.controller_duties.data_minimization`, `ccpa.controller_duties.retention_disclosure`

---

## 4. Sensitive Data

CPRA created a specific list of **sensitive personal information (SPI)** categories:

- Social Security / government ID numbers
- Financial account credentials (log-in + credentials)
- Precise geolocation (within 1/4 mile)
- Racial/ethnic origin, religious or philosophical beliefs
- Union membership
- Mail/email/text contents (not directed to the business)
- Genetic data; biometric data for identification purposes
- Health or medical information
- Sex life or sexual orientation

**Consent Mechanism — UNIQUE TO CALIFORNIA:**
California does **not** require opt-in consent for SPI. Instead, consumers have a **right to limit** the use and disclosure of SPI to what is necessary to perform the services requested. Businesses must offer a "Limit the Use of My Sensitive Personal Information" link (which may be combined with the opt-out link).

This is a structural distinction from all other comprehensive state privacy laws, which use opt-in consent for sensitive data. When resolving multi-state sensitive data conflicts, this asymmetry must be surfaced explicitly — satisfying California's limit-right structure does not satisfy other states' opt-in requirements, and vice versa.

Node IDs: `ccpa.sensitive_data.categories`, `ccpa.sensitive_data.limit_right`, `ccpa.sensitive_data.disclosure_link`

---

## 5. Enforcement

| Item | Detail |
|------|--------|
| Regulator | California Privacy Protection Agency (primary); AG (retains concurrent authority) |
| Civil penalty — unintentional | $2,500 per violation |
| Civil penalty — intentional | $7,500 per violation |
| Civil penalty — children's data | $7,500 per violation (automatic; no intent required for minors under 16) |
| Cure period | CPPA must issue notice and allow opportunity to cure before certain enforcement actions; no fixed statutory cure window |
| Private Right of Action | Limited: data breach PRA for unauthorized access/exfiltration of non-encrypted PI — $100–$750 per consumer per incident or actual damages, whichever is greater |
| Enforcement authority | CPPA can issue administrative enforcement orders; AG can bring civil actions |

Node IDs: `ccpa.enforcement.civil_penalty`, `ccpa.enforcement.breach_pra`, `ccpa.enforcement.cppa_authority`

---

## 6. Key Quirks

- **GPC is mandatory.** California is the only state that requires businesses to honor the Global Privacy Control browser signal as an automatic opt-out of sale and sharing. Failure to honor GPC is an independently enforceable violation.

- **Right to LIMIT, not opt-in.** California's sensitive data mechanism is a consumer-invoked limit right, not a business obligation to obtain opt-in consent before processing. This creates a true structural conflict with opt-in states (CO, CT, VA, etc.) in multi-state compliance.

- **CPPA is a standalone agency.** No other state has an independent privacy enforcement agency (FL and TX have dedicated units within the AG). CPPA has independent rulemaking authority and active regulatory agenda (DPIAs, automated decision-making, cybersecurity audits).

- **HIPAA/GLBA are data-level exemptions.** CCPA/CPRA exempts specific categories of data governed by HIPAA or GLBA — it does not exempt the entire entity. A healthcare company still needs to comply with CCPA/CPRA for PI not covered by HIPAA.

- **Aggregated and deidentified data.** Deidentified data is exempt, but businesses must publicly commit to non-reidentification, contractually prohibit downstream reidentification, and take reasonable technical measures.

- **Children's data (under 16).** Opt-in consent required to sell/share PI of known minors under 16 (under 13 requires parental consent). The $7,500 penalty applies automatically regardless of intent.

Node IDs: `ccpa.quirks.gpc_mandatory`, `ccpa.quirks.limit_vs_optin`, `ccpa.quirks.cppa_agency`, `ccpa.quirks.hipaa_data_level`, `ccpa.quirks.children_optin`

---

## 7. Node ID Reference

| Area | Node ID |
|------|---------|
| Applicability — revenue | `ccpa.applicability.revenue_threshold` |
| Applicability — consumer count | `ccpa.applicability.consumer_count` |
| Applicability — sale revenue % | `ccpa.applicability.sale_revenue_pct` |
| Right to access | `ccpa.rights.access` |
| Right to deletion | `ccpa.rights.deletion` |
| Right to correction | `ccpa.rights.correction` |
| Right to portability | `ccpa.rights.portability` |
| Right to opt-out of sale | `ccpa.rights.opt_out_sale` |
| Right to limit sensitive PI | `ccpa.rights.limit_sensitive` |
| Right to non-discrimination | `ccpa.rights.non_discrimination` |
| Sensitive data categories | `ccpa.sensitive_data.categories` |
| Sensitive data limit right | `ccpa.sensitive_data.limit_right` |
| Privacy notice | `ccpa.controller_duties.privacy_notice` |
| Service provider contract | `ccpa.controller_duties.service_provider_contract` |
| Data minimization | `ccpa.controller_duties.data_minimization` |
| Retention disclosure | `ccpa.controller_duties.retention_disclosure` |
| Civil penalty | `ccpa.enforcement.civil_penalty` |
| Breach PRA | `ccpa.enforcement.breach_pra` |
| CPPA authority | `ccpa.enforcement.cppa_authority` |

---

**Limitations**: This analysis is based on the PrivacyQuant statutory knowledge graph as of the node version dates. Laws change; statutory graph nodes may not reflect the most recent amendments or regulatory guidance. This output is a draft for review by qualified counsel admitted in the relevant jurisdiction — it is not legal advice and does not constitute the practice of law.
