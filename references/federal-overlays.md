# Federal Law Overlays Reference

Covers intersections between federal sectoral laws and the 20 US state comprehensive privacy statutes.
Use alongside `pq_check_applicability` to determine which state obligations survive federal exemptions.
Key practitioner warning: California's data-level approach for HIPAA is a critical structural distinction from all other states.

---

## Critical Distinction: Entity-Level vs. Data-Level Exemptions

**Entity-level exemption:** The entire organization is exempt from the state privacy law if it qualifies as a covered entity under the federal sectoral law. All data the entity holds — PHI and non-PHI alike — is outside the state law's scope.

**Data-level exemption:** Only the specific data covered by the federal sectoral law is exempt. The organization itself remains subject to the state privacy law for all non-covered data.

California (CCPA/CPRA) takes a **data-level approach for HIPAA**. Every other state takes an **entity-level approach** for HIPAA covered entities. This is the single most consequential federal overlay issue in multi-state practice.

---

## HIPAA

### CA (CCPA/CPRA) — Data-Level Exemption

- Cal. Civ. Code § 1798.145(c)(1)(A): Exempts "medical information governed by the Confidentiality of Medical Information Act (CMIA) or protected health information collected by a covered entity or business associate governed by [HIPAA/HITECH]."
- **Effect:** A hospital, health plan, or clearinghouse that is a HIPAA covered entity is NOT exempt as an entity. Only the PHI it holds is exempt. Its employee data, marketing data, website visitor data, and other non-PHI personal information is fully subject to CCPA/CPRA.
- **Practical consequence:** A health system that operates a consumer website, a mobile app for appointment scheduling, or a loyalty/rewards program collects non-PHI personal data. That data is subject to CCPA/CPRA even though the entity is a HIPAA covered entity.
- **CMIA overlap:** California's CMIA provides additional protections for medical information. The intersection of CMIA, HIPAA, and CCPA requires separate analysis.

### All Other 19 States — Entity-Level Exemption for HIPAA

| State | Statutory Basis | Scope of HIPAA Exemption |
|-------|----------------|--------------------------|
| VA (VCDPA) | Va. Code § 59.1-577(B)(6) | Covered entity or business associate — full entity exempt |
| CO (CPA) | Colo. Rev. Stat. § 6-1-1304(2)(a) | Protected health information under HIPAA — data-level; entity-level for covered entities via (2)(b) |
| CT (CTDPA) | Conn. Gen. Stat. § 42-524(a)(1) | Covered entity or business associate — entity-level |
| UT (UCPA) | Utah Code § 13-61-102(3)(b) | HIPAA covered entity — entity-level |
| TX (TDPSA) | Tex. Bus. & Com. Code § 541.002(b)(1) | Covered entity or business associate — entity-level |
| OR (OCPA) | ORS 646A.556(1)(b) | HIPAA covered entity or business associate — entity-level |
| MT (MCDPA) | Mont. Code § 30-14-2803(3)(a) | HIPAA covered entity — entity-level |
| IA (ICDPA) | Iowa Code § 715D.2(2)(a) | HIPAA covered entity — entity-level |
| IN (INCDPA) | Ind. Code § 24-15-1-1(c)(1) | HIPAA covered entity or business associate — entity-level |
| TN (TIPA) | Tenn. Code § 47-18-3202(b)(1) | HIPAA covered entity or business associate — entity-level |
| DE (DPDPA) | Del. Code tit. 6 § 12D-102(b)(1) | HIPAA covered entity or business associate — entity-level |
| NJ (NJDPA) | N.J. Stat. § 56:8-166.2(b)(1) | HIPAA covered entity — entity-level |
| NH (NHDPA) | RSA 507-H:2(II)(a) | HIPAA covered entity or business associate — entity-level |
| NE (NDPA) | Neb. Rev. Stat. § 87-402(3)(a) | HIPAA covered entity — entity-level |
| KY (KCDPA) | KRS § 367.392(1)(a) | HIPAA covered entity or business associate — entity-level |
| MD (MODPA) | Md. Code Com. Law § 14-4602(b)(1) | HIPAA covered entity or business associate — entity-level |
| MN (MCDPA-MN) | Minn. Stat. § 325O.02(2)(a) | HIPAA covered entity — entity-level |
| RI (RIDTPPA) | R.I. Gen. Laws § 6-48.1-2(b)(1) | HIPAA covered entity or business associate — entity-level |
| FL (FDBR) | Fla. Stat. § 501.702(4) | Covered platform definition excludes HIPAA entities; entity-level effectively |

**Note on CO:** Colorado has a hybrid approach — HIPAA-protected PHI data is separately exempted at the data level (§ 6-1-1304(2)(a)), AND covered entities operating under HIPAA are exempt at the entity level (§ 6-1-1304(2)(b)). The entity-level exemption is the operative one for full covered entities.

### Business Associate Agreements and State Law

Where a covered entity (exempt under most states) engages a business associate, the business associate may be independently covered by the state privacy law if:
- The business associate processes non-PHI data for other clients
- The business associate's operations in the state meet applicability thresholds
- The state applies entity-level exemption only to "covered entities" and "business associates" in the HIPAA sense, and the business associate handles non-HIPAA data for other clients

In CA, a business associate of a CA HIPAA covered entity must separately comply with CCPA for its own non-PHI operations.

---

## GLBA (Gramm-Leach-Bliley Act)

### Scope of Federal Exemption

GLBA covers "financial institutions" — broadly defined to include banks, credit unions, insurance companies, securities firms, mortgage brokers, check cashing businesses, payday lenders, and any business "significantly engaged" in financial activities (12 C.F.R. § 1016.3(l)).

### State Law Treatment — All 20 States: Entity-Level Exemption

All 20 state privacy laws exempt GLBA-covered financial institutions at the entity level (for their GLBA-covered data). Unlike HIPAA/CA, no state currently applies a data-level GLBA exemption. However, the scope of the exemption depends on what data the statute exempts.

| State | Notes on GLBA Exemption |
|-------|------------------------|
| CA (CCPA/CPRA) | Cal. Civ. Code § 1798.145(e): exempts personal information collected, processed, sold, or disclosed pursuant to GLBA — **data-level for GLBA**; a bank's non-GLBA-covered data (e.g., employee data, marketing data for non-financial products) is not exempt |
| VA, CO, CT, TX, OR, MT, IA, IN, TN, DE, NJ, NH, NE, KY, MD, MN, RI, UT, FL | Entity-level: GLBA-covered financial institution is fully exempt |

**CA is again the outlier.** A bank operating a non-financial loyalty program, a credit card company operating a travel booking portal, or an insurer operating a wellness app collects non-GLBA-covered personal data. In CA, that data is covered by CCPA/CPRA.

### What Counts as a GLBA-Covered Financial Institution

Entities that are "significantly engaged" in financial activities (Federal Reserve definition). This includes:
- Banks, thrifts, credit unions
- Insurance companies and agents
- Securities brokers and investment advisers
- Mortgage brokers and servicers
- Auto dealers providing financing
- Check cashing businesses
- Payday lenders
- Tax preparation services that provide refund anticipation loans

**Does NOT include:** Retailers that offer their own branded credit cards via a third-party bank (the retailer is not a financial institution; the bank is). E-commerce platforms that use third-party payment processors (not themselves financial institutions).

### GLBA Safeguards Rule Interaction

The FTC Safeguards Rule (16 C.F.R. Part 314, updated 2023) requires written information security programs. States that exempt GLBA entities do so because GLBA/Safeguards Rule already provides equivalent or stronger data security obligations. However, the GLBA exemption applies to applicability, not to all obligations — some states' breach notification laws apply independently of state privacy law applicability.

---

## COPPA (Children's Online Privacy Protection Act)

### Scope

COPPA applies to operators of websites/online services directed to children under 13, or that have actual knowledge they are collecting personal information from children under 13 (15 U.S.C. § 6501 et seq.). COPPA requires verifiable parental consent before collecting, using, or disclosing personal information from children under 13.

### COPPA Does NOT Preempt State Privacy Laws for Teen Data

COPPA's preemption clause (15 U.S.C. § 6502(d)) preempts state laws that are "inconsistent" with COPPA. It does not preempt state laws that are more protective or that address teen data (ages 13-17) outside COPPA's scope.

**Critical point:** COPPA protects children **under 13**. State privacy laws independently protect **teenagers (13-17)** in several states, and this protection is not preempted by COPPA.

### State Law Treatment of COPPA-Covered Data

Most states exempt COPPA-covered data (data from children under 13) at the data level. The operator itself may still be covered by state law for non-COPPA-covered data.

| State | COPPA/Children's Data Exemption Approach |
|-------|------------------------------------------|
| CA (CCPA) | Data-level exemption for COPPA-covered data; teen data (13-15) requires opt-in for sale under § 1798.120(c) |
| CO | Data exempted at data level; Children's personal data is sensitive — opt-in required |
| CT | COPPA data exempted; children's data treated as sensitive requiring opt-in consent |
| TX | COPPA data exempted at data level; known minors' sensitive data protected independently |
| OR | Data-level exemption; children and teen data has independent OCPA protections |
| MD | MODPA: ban on sale of sensitive data of minors under 18; strongest teen provision — applies to all minors not just under-13 |
| VA, MT, IA, IN, TN, UT, DE, NJ, NH, NE, KY, MN, RI, FL | COPPA data exempted; teen data (13-17) may be covered as sensitive data depending on state definition |

### Verifiable Parental Consent Interaction

State laws requiring opt-in consent for children's data processing create a parallel but non-conflicting obligation alongside COPPA VPC. For a COPPA-covered operator:
1. Obtain VPC for under-13 data (COPPA)
2. Separately comply with state law requirements for teen data (13-17) in applicable states
3. Do not assume COPPA compliance satisfies state law for 13-17 year old data

---

## FERPA (Family Educational Rights and Privacy Act)

### Scope

FERPA (20 U.S.C. § 1232g) protects education records of students at educational institutions receiving federal funding. It governs disclosure of education records and grants students/parents rights to inspect and amend those records.

### State Law Treatment

Most states provide both entity-level and data-level exemptions for FERPA.

| Exemption Type | States |
|---------------|--------|
| Entity-level (educational institution exempt) | VA, CO, CT, TX, OR, MT, IA, IN, TN, UT, DE, NJ, NH, NE, KY, MN, RI, FL |
| Data-level (education records exempt; institution otherwise covered) | CA (§ 1798.145(b)) |

**CA again:** An educational institution that operates an alumni relations program, a continuing education website, or a university hospital that collects non-FERPA data is subject to CCPA/CPRA for that data.

### FERPA-Covered vs. Non-FERPA Data from Educational Institutions

FERPA covers "education records" — records directly related to a student maintained by the institution or its agent. It does NOT cover:
- Faculty and staff personnel records
- Sole-possession records (instructor's personal notes not shared)
- Law enforcement unit records
- Alumni data after graduation (no longer enrolled)
- Applicant data before enrollment
- Website visitor data for prospective students

In CA, all of the above categories are subject to CCPA/CPRA from an educational institution.

---

## FCRA (Fair Credit Reporting Act)

### Scope

FCRA (15 U.S.C. § 1681 et seq.) governs consumer reporting agencies (CRAs) and the use of consumer reports for credit, employment, insurance, housing, and other purposes (permissible purposes).

### State Law Treatment

| Exemption Type | States |
|---------------|--------|
| Consumer reporting agency (CRA) entity-level | VA, CO, CT, TX, OR, MT, IA, IN, TN, UT, DE, NJ, NH, NE, KY, MN, RI, FL |
| FCRA-covered data (data-level) | CA (§ 1798.145(d)) — consumer reports as defined under FCRA are exempt; the CRA itself is not entity-exempt |

**What is NOT FCRA-covered (and therefore not exempt in most states):**
- Data collected for marketing that does not constitute a consumer report
- Data sold for purposes outside FCRA's permissible purposes framework
- Business credit data (FCRA covers consumer credit, not business credit)
- Employment screening data not derived from consumer reports

A data broker selling personal data for marketing purposes that is not a "consumer reporting agency" is not FCRA-exempt under any state law.

### FCRA Preemption

FCRA contains specific preemption provisions (15 U.S.C. § 1681t) for state laws relating to consumer reports. However, FCRA preemption does not preempt general state consumer protection laws (including state privacy laws) for activities outside FCRA's coverage.

---

## FTC Act § 5 and Health Breach Notification Rule

### FTC Act § 5 — Not Preemptive

FTC Act § 5 (15 U.S.C. § 45) prohibits unfair or deceptive acts or practices. It does not preempt state privacy laws. States may enforce stricter standards. FTC enforcement provides a floor, not a ceiling, for consumer privacy protections.

### Health Breach Notification Rule (HBNR) — 16 C.F.R. Part 318

The HBNR applies to "personal health record vendors" — entities not covered by HIPAA that maintain individually identifiable health information. Amended in 2024, the HBNR now covers:
- Health apps
- Fitness trackers
- Direct-to-consumer genetic testing companies
- Digital health platforms

**HBNR + State Law Interaction:**
- The HBNR applies independently of state comprehensive privacy laws
- State breach notification laws also apply to health app data in most states
- Where a health app collects non-PHI health data, it faces: HBNR notification obligations + state comprehensive privacy law sensitive data requirements + state breach notification laws
- No state's comprehensive privacy law exempts HBNR-covered entities

---

## Federal Overlay Quick Reference Table

| State | HIPAA Exemption Level | GLBA Exemption Level | COPPA Exemption | FERPA Exemption | FCRA Exemption |
|-------|----------------------|---------------------|-----------------|-----------------|----------------|
| CA (CCPA/CPRA) | **DATA-LEVEL** | Data-level (GLBA-covered data only) | Data-level | Data-level | Data-level |
| VA (VCDPA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| CO (CPA) | Entity-level (+ data-level PHI) | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| CT (CTDPA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| UT (UCPA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| TX (TDPSA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| OR (OCPA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| MT (MCDPA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| IA (ICDPA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| IN (INCDPA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| TN (TIPA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| DE (DPDPA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| NJ (NJDPA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| NH (NHDPA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| NE (NDPA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| KY (KCDPA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| MD (MODPA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| MN (MCDPA-MN) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| RI (RIDTPPA) | Entity-level | Entity-level | Data-level | Entity-level | Entity-level (CRA) |
| FL (FDBR) | Entity-level (large platforms) | Entity-level | Data-level | Entity-level | Entity-level (CRA) |

**Key:** "Data-level" = only that type of data is exempt; the entity may still be covered for other data. "Entity-level" = entire entity exempt if it qualifies.

---

## Practical Scenarios

### Scenario A: Hospital System in California
- HIPAA covered entity
- Operates patient portal (PHI — HIPAA-covered, CCPA data-level exempt)
- Operates marketing website collecting name/email (non-PHI — **CCPA applies**)
- Operates employee records (non-PHI — CCPA employee exemption under AB 1891 applies, but check current status)
- Action required: Segment data sources; maintain CCPA compliance program for non-PHI data streams

### Scenario B: Regional Bank Operating in 5 States Including CA
- GLBA covered financial institution
- Non-CA states: entity-level exempt — no state comprehensive privacy law obligations for banking data
- CA: GLBA-covered financial data exempt at data level; marketing/analytics data from website visitors **not exempt** — CCPA applies
- Action required: CCPA compliance for CA non-financial-data processing; GLBA Safeguards Rule for everything else

### Scenario C: Health App (Not HIPAA Covered Entity)
- Not a HIPAA covered entity or business associate
- No entity-level or data-level exemption in any state
- Subject to HBNR (FTC enforcement)
- Health data = sensitive data in all 20 states → opt-in consent required (except CA = right to limit)
- All 20 state comprehensive privacy law obligations apply if thresholds met
- Action required: Full multi-state sensitive data consent program; HBNR notification plan

### Scenario D: University in Multiple States
- FERPA covered institution
- Non-CA states: entity-level exempt for education records and typically the whole institution
- CA: Only FERPA-protected education records are exempt; alumni data, website visitor data, prospective student data **covered by CCPA**
- Action required: Data mapping to distinguish education records from other personal data; CCPA compliance for non-FERPA data in CA

---

**Limitations**: This analysis is based on the PrivacyQuant statutory knowledge graph as of the node version dates. Laws change; statutory graph nodes may not reflect the most recent amendments or regulatory guidance. This output is a draft for review by qualified counsel admitted in the relevant jurisdiction — it is not legal advice and does not constitute the practice of law.
