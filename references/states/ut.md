# Utah — Utah Consumer Privacy Act (UCPA)
**Effective:** 12/31/2023  **Section:** Utah Code § 13-61-101 et seq.  **Enforcer:** Attorney General
**Use alongside:** `pq_fetch_requirement`, `pq_dsar_router`, `pq_resolve_conflict_nodes`

---

## 1. Applicability Threshold

The UCPA applies to controllers or processors that (a) conduct business in Utah or target products/services to Utah residents, (b) have **annual revenues of at least $25,000,000**, **and** (c) meet **either** of two additional prongs:

| Prong | Threshold |
|-------|-----------|
| Consumer count — standalone | ≥ 100,000 Utah consumers in a calendar year |
| Consumer count + sale revenue | ≥ 25,000 Utah consumers AND ≥ 50% of gross revenue from the sale of personal data |

**Critical distinction: Utah uses a TWO-PART TEST.** The $25M revenue floor must be met **in addition to** either consumer-count prong. This is unlike most other states, where a single prong is sufficient. A high-volume free service with $10M in revenue that processes 500,000 Utah consumers is **not covered** under UCPA.

- Nonprofits, government entities, and financial institutions subject to GLBA are exempt.
- Covered entities under HIPAA are exempt at the entity level.
- The dual threshold makes UCPA the most restrictive trigger nationally alongside Tennessee.

Node IDs: `ucpa.applicability.revenue_floor`, `ucpa.applicability.consumer_count`, `ucpa.applicability.sale_revenue_pct`

---

## 2. Consumer Rights

| Right | Exists | Deadline | Extension |
|-------|--------|----------|-----------|
| Right to Access / Confirm | Yes | 45 days | +45 days with notice |
| Right to Delete (provided data) | Yes — limited scope | 45 days | +45 days with notice |
| Right to Correct | **No** | N/A | N/A |
| Right to Portability | Yes | 45 days | +45 days with notice |
| Right to Opt-Out of Sale | Yes | 45 days | N/A |
| Right to Opt-Out of Targeted Advertising | Yes | 45 days | N/A |
| Right to Opt-Out of Profiling | **No** — UCPA does not include a profiling opt-out | N/A | N/A |

**Appeal Right:** **No.** Utah is one of only two comprehensive state laws (with Iowa) that does not require controllers to provide an internal appeal mechanism.

**Correction Right:** **No.** Utah is one of three states without a correction right (with Iowa and Kentucky — verify current KY status).

**GPC / UOOM:** Not required. No universal opt-out signal obligation.

**Deletion right scope:** Utah's deletion right applies only to personal data **provided by the consumer** — it is narrower than other states' deletion rights, which apply to personal data the controller holds regardless of source.

Node IDs: `ucpa.rights.access`, `ucpa.rights.deletion`, `ucpa.rights.portability`, `ucpa.rights.opt_out_sale`, `ucpa.rights.opt_out_targeted_ads`, `ucpa.rights.no_correction`, `ucpa.rights.no_appeal`

---

## 3. Controller Duties

### Privacy Notice
Must be reasonably accessible. Must include: categories of personal data processed; purposes; how consumers may exercise rights; categories shared with third parties; whether data is sold or used for targeted advertising.

### Data Processing Agreements
Controllers must have contracts with processors governing the nature, purpose, and duration of processing. Contracts must address data security, subprocessor obligations, and data return or deletion.

### Data Protection Assessments (DPIAs)
**Not expressly required** under UCPA. This is a major departure from CA, CO, CT, VA, and most other states. Controllers are not required to conduct and document DPIAs for high-risk processing activities.

### Data Minimization
Limited data minimization concept — controllers must not process personal data beyond what is "reasonably necessary and proportionate" to the disclosed purpose, but the standard is softer than CA's CPRA.

Node IDs: `ucpa.controller_duties.privacy_notice`, `ucpa.controller_duties.processor_contract`, `ucpa.controller_duties.no_dpia`, `ucpa.controller_duties.data_minimization`

---

## 4. Sensitive Data

UCPA sensitive data categories:

- Racial or ethnic origin
- Religious beliefs
- Sexual orientation
- Citizenship or immigration status
- Health condition or diagnosis
- Genetic or biometric data (processed to uniquely identify)
- Precise geolocation (within 1,750 feet)
- Financial account credentials

**Consent Mechanism:** **Opt-in consent** required before processing sensitive data. Controllers must present a clear notice and opportunity to opt-in before processing any sensitive category.

**Children's data:** UCPA does not treat all children's personal data as categorically sensitive (unlike CO). Children's data obligations follow COPPA standards for the under-13 population.

Node IDs: `ucpa.sensitive_data.categories`, `ucpa.sensitive_data.opt_in_consent`

---

## 5. Enforcement

| Item | Detail |
|------|--------|
| Enforcer | Attorney General exclusively |
| Cure period | 30 days |
| Civil penalty — per violation | Up to $7,500 per violation |
| FTC referral | AG may refer matters to the FTC where federal jurisdiction applies |
| Private Right of Action | **None** |

The 30-day cure period is mandatory before the AG may bring a civil action. UCPA includes an express provision allowing the AG to refer cases to the FTC — a unique feature that signals intent to coordinate enforcement with federal regulators rather than act alone.

Node IDs: `ucpa.enforcement.civil_penalty`, `ucpa.enforcement.cure_period`, `ucpa.enforcement.ftc_referral`

---

## 6. Key Quirks

- **Most business-friendly comprehensive state law** (alongside Iowa). The two-part applicability test, absence of appeal right, no correction right, narrower deletion right, no DPIA requirement, and no UOOM obligation collectively make UCPA the lightest compliance burden of any enacted comprehensive state privacy law.

- **UCPA as the floor.** In multi-state compliance programs, UCPA represents the minimum obligation. Any business that is compliant with CA, CO, VA, CT, and OR will automatically exceed Utah's requirements. However, the UCPA's narrower deletion right (applies only to "provided by the consumer" data) should not be applied in other states.

- **Dual threshold means many businesses are not covered.** Companies below $25M in annual revenue are categorically exempt regardless of how many Utah consumers they serve. Free apps and startups are very unlikely to be covered.

- **No right to opt-out of profiling.** Unlike VA, CO, CT, OR, and most other states, UCPA does not include an opt-out right for profiling that produces legal or similarly significant effects. This is a material gap in consumer protections relative to the national trend.

- **FTC referral provision.** The express FTC referral language signals legislative intent to leverage federal enforcement resources for larger matters. Businesses receiving a Utah AG inquiry should assess whether conduct also implicates FTC Section 5 or COPPA.

Node IDs: `ucpa.quirks.dual_threshold`, `ucpa.quirks.floor_law`, `ucpa.quirks.no_dpia`, `ucpa.quirks.no_profiling_optout`, `ucpa.quirks.ftc_referral`

---

## 7. Node ID Reference

| Area | Node ID |
|------|---------|
| Applicability — revenue floor | `ucpa.applicability.revenue_floor` |
| Applicability — consumer count | `ucpa.applicability.consumer_count` |
| Applicability — sale revenue % | `ucpa.applicability.sale_revenue_pct` |
| Right to access | `ucpa.rights.access` |
| Right to deletion | `ucpa.rights.deletion` |
| Right to portability | `ucpa.rights.portability` |
| Right to opt-out of sale | `ucpa.rights.opt_out_sale` |
| Right to opt-out of targeted ads | `ucpa.rights.opt_out_targeted_ads` |
| No correction right | `ucpa.rights.no_correction` |
| No appeal right | `ucpa.rights.no_appeal` |
| Sensitive data categories | `ucpa.sensitive_data.categories` |
| Sensitive data opt-in | `ucpa.sensitive_data.opt_in_consent` |
| Privacy notice | `ucpa.controller_duties.privacy_notice` |
| Processor contract | `ucpa.controller_duties.processor_contract` |
| No DPIA requirement | `ucpa.controller_duties.no_dpia` |
| Civil penalty | `ucpa.enforcement.civil_penalty` |
| Cure period | `ucpa.enforcement.cure_period` |
| FTC referral | `ucpa.enforcement.ftc_referral` |

---

**Limitations**: This analysis is based on the PrivacyQuant statutory knowledge graph as of the node version dates. Laws change; statutory graph nodes may not reflect the most recent amendments or regulatory guidance. This output is a draft for review by qualified counsel admitted in the relevant jurisdiction — it is not legal advice and does not constitute the practice of law.
