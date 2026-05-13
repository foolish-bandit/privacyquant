# Colorado — Colorado Privacy Act (CPA)
**Effective:** 7/1/2023  **Section:** Colo. Rev. Stat. § 6-1-1301 et seq.  **Enforcer:** Attorney General + District Attorneys
**Use alongside:** `pq_fetch_requirement`, `pq_dsar_router`, `pq_resolve_conflict_nodes`

---

## 1. Applicability Threshold

The CPA applies to controllers that conduct business in Colorado or produce commercial products or services intentionally targeted to Colorado residents **and** meet **either** of two prongs:

| Prong | Threshold |
|-------|-----------|
| Consumer count — standalone | ≥ 100,000 Colorado consumers in a calendar year |
| Consumer count + sale revenue | ≥ 25,000 Colorado consumers AND ≥ 50% of annual revenue from the sale of personal data |

- **No standalone revenue threshold.**
- Nonprofits and state/local government entities are exempt.
- Higher education institutions are exempt.
- Colorado's CPA has a more expansive rulemaking process than most states — the AG's office issued detailed rules effective 7/1/2023.

Node IDs: `cpa.applicability.consumer_count`, `cpa.applicability.sale_revenue_pct`

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

**Appeal Right:** Yes. Controllers must establish an **internal appeal process** that must be easy to use. If appeal is denied, the controller must provide a method to submit a complaint to the AG.

**Correction Right:** Yes.

**Universal Opt-Out Mechanism (UOOM):** Colorado requires controllers to honor **universal opt-out signals** (such as GPC). The obligation became effective **7/1/2024**. Controllers must process UOOM signals as opt-outs from sale and targeted advertising. This places CO alongside CA as a state with mandatory opt-out signal compliance.

Node IDs: `cpa.rights.access`, `cpa.rights.deletion`, `cpa.rights.correction`, `cpa.rights.portability`, `cpa.rights.opt_out_sale`, `cpa.rights.opt_out_targeted_ads`, `cpa.rights.opt_out_profiling`, `cpa.rights.appeal`, `cpa.rights.uoom`

---

## 3. Controller Duties

### Privacy Notice
Must be provided before or at the time of collection. Must include: categories collected, purposes, opt-out rights, categories shared with third parties, how to submit rights requests, and whether personal data is sold or used for targeted advertising.

### Data Processing Agreements (DPAs)
Required between controllers and processors. Must address: instructions and limitations on processing, confidentiality, subprocessor requirements, data deletion/return, audit rights, and breach notification cooperation.

### Data Protection Assessments (DPIAs)
Required for high-risk processing, including:
- Targeted advertising
- Sale of personal data
- Certain profiling with legal or similarly significant effects
- Processing sensitive data
- Any processing presenting a heightened risk

DPIAs must be made available to the AG on request. Colorado's AG rules elaborate on the content required in DPIAs more than the statute alone.

### Biometric Data
Businesses processing biometric data must have a **publicly available policy** establishing a retention schedule and destruction guidelines. Colorado's biometric-specific disclosure obligation is distinct from the general DPIA requirement.

Node IDs: `cpa.controller_duties.privacy_notice`, `cpa.controller_duties.processor_contract`, `cpa.controller_duties.dpia`, `cpa.controller_duties.biometric_policy`

---

## 4. Sensitive Data

CPA sensitive data categories:

- Racial or ethnic origin
- Religious beliefs
- Mental or physical health condition or diagnosis
- Sex life or sexual orientation
- Citizenship or immigration status
- Genetic or biometric data (processed for unique identification)
- **Children's personal data** — defined as data from a known child; children's data = sensitive under CPA
- Precise geolocation (within 1,750 feet)

**Consent Mechanism:** **Opt-in consent** required before processing sensitive data. This is the standard model and is distinct from California's limit-right structure.

**Children's data as sensitive:** CPA explicitly treats all personal data of children as sensitive, requiring opt-in consent regardless of whether the specific category would otherwise be sensitive. This is a higher bar than some other states.

Node IDs: `cpa.sensitive_data.categories`, `cpa.sensitive_data.opt_in_consent`, `cpa.sensitive_data.children`

---

## 5. Enforcement

| Item | Detail |
|------|--------|
| Enforcer | AG + District Attorneys (concurrent authority) |
| Cure period | 60 days (AG or DA must notify and provide cure opportunity) |
| Civil penalty — per violation | Up to $20,000 per violation |
| Civil penalty — maximum per action | Up to $500,000 |
| Private Right of Action | **None** |
| Enforcement note | DA enforcement is unique to Colorado — no other comprehensive state law grants DA concurrent enforcement authority |

The 60-day cure period is the longest statutory cure window in any opt-out state (Iowa matches at 90 days but is framed differently). The $20,000/$500,000 structure makes Colorado's per-violation penalty among the higher mid-tier states.

Node IDs: `cpa.enforcement.civil_penalty`, `cpa.enforcement.cure_period`, `cpa.enforcement.da_authority`

---

## 6. Key Quirks

- **District Attorney enforcement.** Colorado is the only comprehensive state privacy law that grants concurrent enforcement authority to county District Attorneys. A local DA could investigate a business with significant Colorado consumer exposure without AG involvement.

- **UOOM required since 7/1/2024.** Colorado mandated universal opt-out mechanism compliance earlier than most states. Businesses that were CPA-compliant at launch but did not implement UOOM by July 2024 are now out of compliance on opt-out signals specifically.

- **AG rulemaking is substantive.** The Colorado AG promulgated detailed implementing rules that clarify concepts left ambiguous in the statute — including specifics on DPIA content, authentication of requests, and UOOM signal formats. Practitioners should review the rules alongside the statute.

- **Children's data is categorically sensitive.** Unlike Virginia (which limits children's sensitivity to COPPA-defined under-13), Colorado treats all personal data from children as sensitive, requiring opt-in consent for any processing of such data.

- **$500,000 aggregate cap per action** creates a practical enforcement ceiling for single investigations. Regulators may bring multiple actions for separate courses of conduct to exceed this cap in theory.

Node IDs: `cpa.quirks.da_enforcement`, `cpa.quirks.uoom_required`, `cpa.quirks.ag_rules`, `cpa.quirks.children_sensitive`

---

## 7. Node ID Reference

| Area | Node ID |
|------|---------|
| Applicability — consumer count | `cpa.applicability.consumer_count` |
| Applicability — sale revenue % | `cpa.applicability.sale_revenue_pct` |
| Right to access | `cpa.rights.access` |
| Right to deletion | `cpa.rights.deletion` |
| Right to correction | `cpa.rights.correction` |
| Right to portability | `cpa.rights.portability` |
| Right to opt-out of sale | `cpa.rights.opt_out_sale` |
| Right to opt-out of targeted ads | `cpa.rights.opt_out_targeted_ads` |
| Right to opt-out of profiling | `cpa.rights.opt_out_profiling` |
| Appeal right | `cpa.rights.appeal` |
| UOOM | `cpa.rights.uoom` |
| Sensitive data categories | `cpa.sensitive_data.categories` |
| Sensitive data — children | `cpa.sensitive_data.children` |
| Privacy notice | `cpa.controller_duties.privacy_notice` |
| Processor contract | `cpa.controller_duties.processor_contract` |
| DPIA | `cpa.controller_duties.dpia` |
| Biometric policy | `cpa.controller_duties.biometric_policy` |
| Civil penalty | `cpa.enforcement.civil_penalty` |
| Cure period | `cpa.enforcement.cure_period` |
| DA authority | `cpa.enforcement.da_authority` |

---

**Limitations**: This analysis is based on the PrivacyQuant statutory knowledge graph as of the node version dates. Laws change; statutory graph nodes may not reflect the most recent amendments or regulatory guidance. This output is a draft for review by qualified counsel admitted in the relevant jurisdiction — it is not legal advice and does not constitute the practice of law.
