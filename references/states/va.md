# Virginia — Virginia Consumer Data Protection Act (VCDPA)
**Effective:** 1/1/2023  **Section:** Va. Code § 59.1-571 et seq.  **Enforcer:** Attorney General
**Use alongside:** `pq_fetch_requirement`, `pq_dsar_router`, `pq_resolve_conflict_nodes`

---

## 1. Applicability Threshold

The VCDPA applies to persons that conduct business in Virginia or produce products/services targeted to Virginia residents **and** meet **either** of two prongs:

| Prong | Threshold |
|-------|-----------|
| Consumer count — standalone | ≥ 100,000 Virginia consumers in a calendar year |
| Consumer count + sale revenue | ≥ 25,000 Virginia consumers AND ≥ 50% of gross revenue from the sale of personal data |

- **No revenue threshold.** Unlike California, Virginia does not include a standalone annual gross revenue trigger.
- The 25,000/50% prong requires satisfying **both** conditions simultaneously.
- Nonprofits and higher education institutions are exempt.
- Virginia served as the **template** for the majority of subsequent state privacy laws (IN, KY, NE, IA, and others closely follow its structure).

Node IDs: `vcdpa.applicability.consumer_count`, `vcdpa.applicability.sale_revenue_pct`

---

## 2. Consumer Rights

| Right | Exists | Deadline | Extension |
|-------|--------|----------|-----------|
| Right to Access / Confirm | Yes | 45 days | +45 days with notice |
| Right to Delete | Yes | 45 days | +45 days with notice |
| Right to Correct | Yes | 45 days | +45 days with notice |
| Right to Portability | Yes | 45 days | +45 days with notice |
| Right to Opt-Out of Sale | Yes | Promptly / 45 days | N/A |
| Right to Opt-Out of Targeted Advertising | Yes | Promptly / 45 days | N/A |
| Right to Opt-Out of Profiling (consequential decisions) | Yes | Promptly / 45 days | N/A |

**Appeal Right:** Yes. Controllers must establish an **internal appeal process**. If the appeal is denied, the controller must provide the consumer with information on how to submit a complaint to the AG.

**Correction Right:** Yes.

**GPC:** No statutory obligation to honor GPC signals.

Node IDs: `vcdpa.rights.access`, `vcdpa.rights.deletion`, `vcdpa.rights.correction`, `vcdpa.rights.portability`, `vcdpa.rights.opt_out_sale`, `vcdpa.rights.opt_out_targeted_ads`, `vcdpa.rights.opt_out_profiling`, `vcdpa.rights.appeal`

---

## 3. Controller Duties

### Privacy Notice
Must be reasonably accessible and clear. Must disclose: categories of personal data processed, purposes of processing, how to exercise rights, categories of personal data shared with third parties, and categories of third parties with whom data is shared.

### Data Processing Agreements (DPAs)
Controllers must enter into **contracts with processors** that govern the nature, purpose, and duration of processing. Contracts must include: processor obligations, subprocessor restrictions, audit/assessment rights, return or deletion of data on termination, and confidentiality requirements.

### Data Protection Assessments (DPIAs)
Required for processing activities that present a **heightened risk of harm**, including:
- Targeted advertising
- Sale of personal data
- Certain profiling activities with legal or similarly significant effects
- Processing sensitive data
- Any processing that presents a heightened risk determined by the controller

Assessments must be documented and made available to the AG upon request.

### Purpose Limitation / Data Minimization
Controllers must limit collection to what is adequate, relevant, and reasonably necessary for the disclosed purpose.

Node IDs: `vcdpa.controller_duties.privacy_notice`, `vcdpa.controller_duties.processor_contract`, `vcdpa.controller_duties.dpia`, `vcdpa.controller_duties.data_minimization`

---

## 4. Sensitive Data

VCDPA sensitive data categories:

- Racial or ethnic origin
- Religious beliefs
- Mental or physical health diagnosis
- Sexual orientation or gender identity
- Immigration status
- Genetic or biometric data (processed for unique identification)
- Children's personal data (under 13 as defined under COPPA)
- Precise geolocation (within 1,750 feet / ~1/3 mile radius)
- Financial information (not defined further in statute — verify scope)

**Consent Mechanism:** **Opt-in consent** required before processing sensitive data. This is the default model for most comprehensive state laws — and is structurally distinct from California's limit-right model.

Node IDs: `vcdpa.sensitive_data.categories`, `vcdpa.sensitive_data.opt_in_consent`

---

## 5. Enforcement

| Item | Detail |
|------|--------|
| Enforcer | Attorney General exclusively |
| Cure period | 30 days (AG must notify and provide opportunity to cure) |
| Civil penalty — per violation | Up to $7,500 per violation |
| Civil penalty — maximum | No stated aggregate cap |
| Private Right of Action | **None** |
| Data breach PRA | None (separate Virginia breach notification law governs) |

The AG has exclusive enforcement authority. There is no private right of action and no data breach-specific civil damages provision in VCDPA. The 30-day cure period is mandatory before the AG may bring a civil action.

Node IDs: `vcdpa.enforcement.civil_penalty`, `vcdpa.enforcement.cure_period`, `vcdpa.enforcement.ag_exclusive`

---

## 6. Key Quirks

- **Template statute.** Virginia's VCDPA was the second comprehensive state privacy law enacted (after California) and became the structural model for Indiana, Kentucky, Nebraska, Iowa, and several others. Understanding VCDPA is essential for multi-state compliance because its framework recurs frequently.

- **Entity-level HIPAA/GLBA exemptions.** Unlike California, Virginia exempts the **entire entity** (not just the data) if the entity is subject to HIPAA or GLBA. A covered entity or financial institution is wholly exempt — including for personal data unrelated to health or financial services.

- **No revenue threshold — only consumer-count triggers.** A startup with $500M in revenue but only 80,000 Virginia consumers is not covered. Conversely, a free app with 100,000 Virginia users is covered regardless of revenue.

- **DPIAs are forward-looking and document-on-demand.** The AG can request DPIA documentation as part of an enforcement investigation. There is no obligation to proactively file or register DPIAs with any agency.

- **Appeal process must be "easy to use."** The statute requires that the appeal mechanism be "conspicuously available" and "similar to the process for submitting the initial request." A cumbersome or buried appeal link likely fails this standard.

Node IDs: `vcdpa.quirks.template_statute`, `vcdpa.quirks.entity_level_hipaa`, `vcdpa.quirks.no_revenue_threshold`, `vcdpa.quirks.dpia_on_demand`

---

## 7. Node ID Reference

| Area | Node ID |
|------|---------|
| Applicability — consumer count | `vcdpa.applicability.consumer_count` |
| Applicability — sale revenue % | `vcdpa.applicability.sale_revenue_pct` |
| Right to access | `vcdpa.rights.access` |
| Right to deletion | `vcdpa.rights.deletion` |
| Right to correction | `vcdpa.rights.correction` |
| Right to portability | `vcdpa.rights.portability` |
| Right to opt-out of sale | `vcdpa.rights.opt_out_sale` |
| Right to opt-out of targeted ads | `vcdpa.rights.opt_out_targeted_ads` |
| Right to opt-out of profiling | `vcdpa.rights.opt_out_profiling` |
| Appeal right | `vcdpa.rights.appeal` |
| Sensitive data categories | `vcdpa.sensitive_data.categories` |
| Sensitive data opt-in | `vcdpa.sensitive_data.opt_in_consent` |
| Privacy notice | `vcdpa.controller_duties.privacy_notice` |
| Processor contract | `vcdpa.controller_duties.processor_contract` |
| DPIA | `vcdpa.controller_duties.dpia` |
| Data minimization | `vcdpa.controller_duties.data_minimization` |
| Civil penalty | `vcdpa.enforcement.civil_penalty` |
| Cure period | `vcdpa.enforcement.cure_period` |

---

**Limitations**: This analysis is based on the PrivacyQuant statutory knowledge graph as of the node version dates. Laws change; statutory graph nodes may not reflect the most recent amendments or regulatory guidance. This output is a draft for review by qualified counsel admitted in the relevant jurisdiction — it is not legal advice and does not constitute the practice of law.
