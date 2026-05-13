#!/usr/bin/env python3
"""
generate_nodes.py — Generate all PrivacyQuant YAML statute nodes for 20 US state
privacy laws from embedded reference data.

Run: python generate_nodes.py
Output: ../statutes/<statute_dir>/<node_id>.yaml
"""

import os
from pathlib import Path

OUTPUT_DIR = Path("/home/claude/privacyquant/statutes")

# All nodes, organized by statute directory
NODES = {

# ─────────────────────────────────────────
# CCPA / CPRA  (California)
# ─────────────────────────────────────────
"ccpa": [

"""id: "ccpa.applicability.threshold"
statute: "CCPA/CPRA"
section: "Cal. Civ. Code § 1798.140(d)"
title: "Applicability Threshold"
effective_date: "2020-01-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: business
trigger: "For-profit entity doing business in California"
requirement: >
  A for-profit entity is subject if it does business in California, alone or jointly determines
  purposes and means of processing California consumers' PI, AND meets ANY ONE of:
  (a) annual gross revenues exceeding $25 million (inflation-adjusted; confirm current figure);
  (b) annually buys, sells, or shares PI of 100,000 or more consumers or households;
  (c) derives 50% or more of annual revenues from selling or sharing consumers' PI.
  Also covers entities controlled by, controlling, or in a joint venture (≥40% common ownership)
  with a covered business that processes CA PI under shared branding.
exceptions:
  - "Most non-profits (verify current amendment activity)"
  - "HIPAA-covered data (data-level)"
  - "GLBA-covered data (data-level)"
  - "FCRA-covered data (data-level)"
  - "DPPA-covered data (data-level)"
  - "De-identified or aggregate consumer information"
contract_signals:
  - "California Consumer Privacy Act"
  - "CCPA"
  - "CPRA"
  - "California Privacy Rights Act"
  - "California residents"
  - "Cal. Civ. Code § 1798"
cross_refs:
  - "vcdpa.applicability.threshold"
  - "cpa.applicability.threshold"
  - "ctdpa.applicability.threshold"
source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.140.&lawCode=CIV"
git_hash: ""
""",

"""id: "ccpa.rights.access"
statute: "CCPA/CPRA"
section: "Cal. Civ. Code § 1798.110"
title: "Right to Know / Access"
effective_date: "2020-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: business
trigger: "Consumer submits a verifiable consumer request to know categories or specific pieces of PI collected"
requirement: >
  Upon a verifiable consumer request, the business must disclose to the consumer:
  the categories of PI it has collected; the categories of sources; the business or commercial
  purpose for collecting, selling, or sharing; the categories of third parties to whom PI is
  disclosed; and the specific pieces of PI collected about the consumer.
  Response deadline: 45 calendar days (extendable once by 45 days with notice).
  Must be provided free of charge, twice per 12-month period.
exceptions:
  - "PI collected for a single, one-time transaction if not sold or disclosed"
  - "PI resubmitted as part of a new request within 12 months"
  - "Impossible or disproportionate effort where PI has been de-identified"
contract_signals:
  - "right to know"
  - "access request"
  - "right of access"
  - "data subject access request"
  - "DSAR"
  - "verifiable consumer request"
  - "categories of personal information"
cross_refs:
  - "vcdpa.rights.access"
  - "cpa.rights.access"
  - "ctdpa.rights.access"
source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.110.&lawCode=CIV"
git_hash: ""
""",

"""id: "ccpa.rights.deletion"
statute: "CCPA/CPRA"
section: "Cal. Civ. Code § 1798.105"
title: "Right to Deletion"
effective_date: "2020-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: business
trigger: "Consumer submits a verifiable consumer request to delete their personal information"
requirement: >
  Upon a verifiable consumer request, the business must delete the consumer's PI from its records
  and direct service providers and contractors to delete the PI from their records.
  Response deadline: 45 calendar days (extendable once by 45 days with notice).
exceptions:
  - "Complete the transaction for which PI was collected"
  - "Detect security incidents; protect against malicious, deceptive, fraudulent, or illegal activity"
  - "Debug products to identify and repair errors"
  - "Exercise free speech or another legal right"
  - "Comply with California Electronic Communications Privacy Act"
  - "Engage in public or peer-reviewed scientific, historical, or statistical research in the public interest"
  - "Enable solely internal uses reasonably aligned with consumer expectations"
  - "Comply with a legal obligation"
  - "Otherwise use PI internally in a lawful manner compatible with the context in which the consumer provided it"
contract_signals:
  - "right to erasure"
  - "right to deletion"
  - "delete personal data"
  - "data deletion request"
  - "erase personal information"
  - "right to be forgotten"
cross_refs:
  - "vcdpa.rights.deletion"
  - "cpa.rights.deletion"
  - "ctdpa.rights.deletion"
  - "modpa.rights.deletion"
source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.105.&lawCode=CIV"
git_hash: ""
""",

"""id: "ccpa.rights.correction"
statute: "CCPA/CPRA"
section: "Cal. Civ. Code § 1798.106"
title: "Right to Correction"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: business
trigger: "Consumer submits a verifiable consumer request to correct inaccurate personal information"
requirement: >
  Upon a verifiable consumer request, the business must use commercially reasonable efforts to
  correct inaccurate PI held about the consumer. The business must also direct service providers
  and contractors to correct the inaccurate PI. Response deadline: 45 calendar days.
exceptions:
  - "Business determines, with supporting documentation, that the consumer's request is fraudulent"
  - "Keeping original version necessary for legal, audit, or tax purposes"
contract_signals:
  - "right to rectification"
  - "right to correction"
  - "correct inaccurate data"
  - "rectify personal information"
  - "data correction request"
cross_refs:
  - "vcdpa.rights.correction"
  - "cpa.rights.correction"
  - "ctdpa.rights.correction"
source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.106.&lawCode=CIV"
git_hash: ""
""",

"""id: "ccpa.rights.opt_out_sale_sharing"
statute: "CCPA/CPRA"
section: "Cal. Civ. Code § 1798.120"
title: "Right to Opt Out of Sale or Sharing"
effective_date: "2020-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: business
trigger: "Business sells or shares consumers' personal information"
requirement: >
  Consumers have the right to direct a business not to sell or share their PI.
  The business must provide a clear and conspicuous 'Do Not Sell or Share My Personal Information'
  link on its homepage and honor opt-out requests. The business must also recognize opt-out
  preference signals (e.g., Global Privacy Control) as a valid opt-out (CCPA Regs § 7025).
  Once opted out, the business may not sell or share the PI unless the consumer subsequently
  provides express authorization.
exceptions:
  - "Transfers to service providers or contractors acting under a written contract limiting processing"
  - "PI disclosed or transferred as part of a merger, acquisition, or similar transaction where recipient is bound by the same obligations"
contract_signals:
  - "do not sell"
  - "do not sell or share"
  - "opt-out of sale"
  - "opt out of sharing"
  - "Global Privacy Control"
  - "GPC"
  - "sale of personal information"
  - "sharing for cross-context behavioral advertising"
cross_refs:
  - "vcdpa.rights.opt_out_sale"
  - "cpa.rights.opt_out_sale"
  - "ctdpa.rights.opt_out_sale"
source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.120.&lawCode=CIV"
git_hash: ""
""",

"""id: "ccpa.rights.limit_sensitive_pi"
statute: "CCPA/CPRA"
section: "Cal. Civ. Code § 1798.121; Cal. Code Regs. tit. 11, § 7027"
title: "Right to Limit Use of Sensitive Personal Information"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: business
trigger: "Business collects or uses sensitive personal information beyond what is necessary to perform requested services"
requirement: >
  Consumers may direct a business to limit its use and disclosure of sensitive PI to that necessary
  to perform the services or provide the goods reasonably expected by an average consumer who
  requests those goods or services. The business must provide a 'Limit the Use of My Sensitive
  Personal Information' link on its homepage (or a combined opt-out/limit link). Processing
  outside the limit requires either the consumer's express consent or an enumerated exception.
exceptions:
  - "Providing requested goods or services"
  - "Preventing, detecting, or investigating security incidents"
  - "Resisting malicious, deceptive, fraudulent, or illegal actions"
  - "Ensuring physical safety of natural persons"
  - "Short-term, transient use not for building consumer profiles"
  - "Performing services on behalf of the business (e.g., customer service)"
  - "Verifying or maintaining quality and safety of a product or service"
contract_signals:
  - "limit use of sensitive personal information"
  - "sensitive PI"
  - "sensitive personal information opt-out"
  - "right to limit"
cross_refs:
  - "vcdpa.sensitive_data.consent"
  - "cpa.sensitive_data.consent"
source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.121.&lawCode=CIV"
git_hash: ""
""",

"""id: "ccpa.rights.portability"
statute: "CCPA/CPRA"
section: "Cal. Civ. Code § 1798.130(a)(2)"
title: "Right to Data Portability"
effective_date: "2020-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: business
trigger: "Consumer submits verifiable request to receive specific pieces of PI the business has collected"
requirement: >
  The business must provide the specific pieces of PI the consumer has requested in a portable,
  readily usable format that allows the consumer to transmit the PI to another entity without
  hindrance. Format must be machine-readable where technically feasible.
exceptions:
  - "Trade secrets need not be disclosed if doing so would reveal trade secret information"
contract_signals:
  - "data portability"
  - "portable format"
  - "machine-readable"
  - "transmit to another entity"
  - "right to data portability"
cross_refs:
  - "vcdpa.rights.portability"
  - "cpa.rights.portability"
source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.130.&lawCode=CIV"
git_hash: ""
""",

"""id: "ccpa.sensitive_data.categories"
statute: "CCPA/CPRA"
section: "Cal. Civ. Code § 1798.140(ae)"
title: "Sensitive Personal Information — Categories"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: business
trigger: "Business collects, uses, discloses, or otherwise processes any category of sensitive personal information"
requirement: >
  The following categories constitute sensitive personal information under CCPA/CPRA and trigger
  the right to limit (§ 1798.121) and enhanced disclosure obligations:
  government identifiers (SSN, driver's license, passport, state ID);
  complete financial account number combined with access credentials;
  precise geolocation;
  racial or ethnic origin;
  religious or philosophical beliefs;
  union membership;
  contents of mail, email, or text messages unless the business is the intended recipient;
  genetic data;
  biometric data processed for the purpose of uniquely identifying a consumer;
  PI concerning health;
  PI concerning sex life or sexual orientation;
  citizenship or immigration status.
  Note: unlike most other states, CA uses a 'right to limit' structure — NOT opt-in consent.
exceptions:
  - "Aggregate or de-identified information"
  - "Publicly available information (as defined)"
contract_signals:
  - "sensitive personal information"
  - "sensitive PI"
  - "biometric data"
  - "precise geolocation"
  - "racial or ethnic origin"
  - "health information"
  - "genetic data"
  - "government identifier"
cross_refs:
  - "vcdpa.sensitive_data.consent"
  - "cpa.sensitive_data.consent"
  - "modpa.sensitive_data.ban_on_sale"
source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.140.&lawCode=CIV"
git_hash: ""
""",

"""id: "ccpa.controller_duties.notice_at_collection"
statute: "CCPA/CPRA"
section: "Cal. Code Regs. tit. 11, § 7012"
title: "Notice at Collection"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: business
trigger: "Business collects personal information from a California consumer"
requirement: >
  At or before the point of collection, the business must provide a notice that includes:
  the categories of PI to be collected and the purposes for which each category will be used;
  whether PI is sold or shared; a link to the privacy policy; and, if applicable, a link to
  the Do Not Sell or Share page. The notice must be accessible from the page where collection
  occurs, be written in plain language, and be available in each language in which the business
  provides services.
exceptions:
  - "PI collected in the course of employment (limited carve-outs apply)"
  - "PI collected from employees for HR purposes subject to separate notice"
contract_signals:
  - "notice at collection"
  - "notice at point of collection"
  - "collection notice"
  - "privacy notice at collection"
cross_refs:
  - "cpa.controller_duties.privacy_notice"
  - "vcdpa.controller_duties.privacy_notice"
source_url: "https://govt.westlaw.com/calregs/Document/I5E4ED6507A6711EDB3C9A1C0CF44ED9D"
git_hash: ""
""",

"""id: "ccpa.controller_duties.privacy_notice"
statute: "CCPA/CPRA"
section: "Cal. Civ. Code § 1798.130(a)(5); Cal. Code Regs. tit. 11, § 7011"
title: "Privacy Policy / Privacy Notice Requirements"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: business
trigger: "Business processes personal information of California consumers"
requirement: >
  The business must maintain a comprehensive privacy policy that includes at minimum:
  categories of PI collected and the purposes; categories of PI sold, shared, or disclosed and
  the categories of third parties; consumer rights and how to exercise them (including two
  designated methods for submitting requests); how to submit an appeal; the effective date and
  how the business will notify consumers of material changes; categories of sources; retention
  period or criteria for each category of PI; and whether any financial incentives are offered.
  The policy must be updated at least every 12 months.
exceptions: []
contract_signals:
  - "privacy policy"
  - "privacy notice"
  - "privacy statement"
  - "data processing notice"
cross_refs:
  - "vcdpa.controller_duties.privacy_notice"
  - "cpa.controller_duties.privacy_notice"
source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.130.&lawCode=CIV"
git_hash: ""
""",

"""id: "ccpa.controller_duties.data_protection_assessment"
statute: "CCPA/CPRA"
section: "Cal. Civ. Code § 1798.185(a)(15); Cal. Code Regs. tit. 11, §§ 7150-7158"
title: "Data Protection Assessment (Risk Assessment)"
effective_date: "2024-03-29"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: business
trigger: "Business conducts processing activities that present significant risk to consumer privacy including sale, sharing, profiling with significant effects, processing sensitive PI, automated decision-making"
requirement: >
  Before initiating high-risk processing, the business must conduct and document a risk assessment
  (referred to as a 'privacy risk assessment' in CPPA regs) that identifies and weighs the
  benefits of the processing against the risks to consumers. Assessments must be retained and
  made available to the CPPA upon request. Automated Decision-making Technology (ADMT) regs
  impose additional requirements effective March 29, 2025 for profiling, ADM in consequential
  decisions (employment, housing, credit, health, education, access to services).
exceptions:
  - "Processing already subject to a substantially similar assessment under another applicable law"
contract_signals:
  - "data protection assessment"
  - "privacy risk assessment"
  - "DPIA"
  - "data protection impact assessment"
  - "risk assessment"
  - "automated decision-making"
  - "ADMT"
cross_refs:
  - "vcdpa.controller_duties.data_protection_assessment"
  - "cpa.controller_duties.data_protection_assessment"
  - "modpa.controller_duties.data_protection_assessment"
source_url: "https://cppa.ca.gov/regulations/"
git_hash: ""
""",

"""id: "ccpa.controller_duties.service_provider_contract"
statute: "CCPA/CPRA"
section: "Cal. Civ. Code § 1798.140(ag); Cal. Code Regs. tit. 11, § 7051"
title: "Service Provider and Contractor Contract Requirements"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: business
trigger: "Business discloses personal information to a service provider or contractor for a business purpose"
requirement: >
  The written contract with a service provider or contractor must specify that the service provider
  or contractor: processes PI only for the business purposes specified in the contract; retains,
  uses, or discloses PI only as directed; does not sell or share PI; does not combine PI received
  with PI received from other sources except as permitted; grants the business the right to audit
  and monitor compliance; certifies it understands and will comply with the restrictions; and
  subcontracts only to entities meeting the same obligations. The CCPA contract requirements
  are the most prescriptive of any US state.
exceptions: []
contract_signals:
  - "service provider agreement"
  - "data processing agreement"
  - "DPA"
  - "subprocessor"
  - "business purpose"
  - "processor contract"
  - "CCPA service provider"
  - "contractor agreement"
cross_refs:
  - "vcdpa.controller_duties.processor_contract"
  - "cpa.controller_duties.processor_contract"
source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.140.&lawCode=CIV"
git_hash: ""
""",

"""id: "ccpa.enforcement.parameters"
statute: "CCPA/CPRA"
section: "Cal. Civ. Code §§ 1798.155, 1798.199.90; Cal. Bus. & Prof. Code § 17206"
title: "Enforcement — CPPA and AG; Civil Penalties"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: business
trigger: "Business violates CCPA/CPRA or implementing regulations"
requirement: >
  The California Privacy Protection Agency (CPPA) and California Attorney General have concurrent
  enforcement authority. Civil penalties: up to $2,500 per violation; up to $7,500 per intentional
  violation or violation involving a known minor. No mandatory cure period as of Jan 2023 (CPPA has
  discretion to provide cure opportunity). Private right of action available under § 1798.150 for
  data breaches resulting from failure to implement reasonable security — up to $750 per consumer
  per incident or actual damages, whichever is greater, plus injunctive relief and attorney fees.
exceptions: []
contract_signals:
  - "CPPA"
  - "California Privacy Protection Agency"
  - "California Attorney General"
  - "civil penalty"
  - "CCPA violation"
  - "data breach notification"
cross_refs:
  - "vcdpa.enforcement.parameters"
  - "cpa.enforcement.parameters"
source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.155.&lawCode=CIV"
git_hash: ""
""",

"""id: "ccpa.sale_sharing.distinction"
statute: "CCPA/CPRA"
section: "Cal. Civ. Code §§ 1798.140(ad), 1798.140(ah)"
title: "Sale vs. Sharing Distinction"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: business
trigger: "Business transfers personal information to a third party for monetary consideration or for cross-context behavioral advertising"
requirement: >
  'Sale' (§ 1798.140(ad)): selling, renting, releasing, disclosing, disseminating, making available,
  transferring, or otherwise communicating PI to a third party for monetary or other valuable
  consideration. 'Sharing' (§ 1798.140(ah)): disclosing PI to a third party for cross-context
  behavioral advertising, whether or not for monetary or other valuable consideration.
  A transfer to a third party via Meta/Google/TikTok pixels for retargeting constitutes 'sharing'
  and likely also 'sale.' Both sale and sharing trigger the opt-out obligation and required disclosures.
  Service providers and contractors receiving PI under a compliant contract are neither sale nor sharing.
exceptions:
  - "Transfers to service providers/contractors acting under compliant written contract"
  - "Consumers directing transfer to a third party intentionally"
  - "Disclosures to third parties as part of a merger/acquisition where recipient is bound"
contract_signals:
  - "sale of personal information"
  - "sharing for cross-context behavioral advertising"
  - "cross-context behavioral advertising"
  - "third-party advertising"
  - "retargeting"
  - "Meta Pixel"
  - "advertising pixel"
  - "valuable consideration"
cross_refs:
  - "vcdpa.sale_targeted_advertising.distinction"
  - "cpa.sale_targeted_advertising.distinction"
source_url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.140.&lawCode=CIV"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# VCDPA (Virginia)
# ─────────────────────────────────────────
"vcdpa": [

"""id: "vcdpa.applicability.threshold"
statute: "VCDPA"
section: "Va. Code § 59.1-576"
title: "Applicability Threshold"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Virginia or producing products/services targeted to Virginia residents"
requirement: >
  Applies to persons that conduct business in Virginia or produce products or services targeted
  to Virginia residents AND, during a calendar year, control or process PD of:
  (a) at least 100,000 consumers; OR
  (b) at least 25,000 consumers AND derive over 50% of gross revenue from the sale of PD.
exceptions:
  - "State agencies"
  - "Financial institutions covered by GLBA (entity-level exemption)"
  - "Covered entities and business associates under HIPAA (entity-level)"
  - "Non-profits"
  - "Institutions of higher education"
  - "Employees and B2B contacts excluded from 'consumer' definition"
contract_signals:
  - "Virginia Consumer Data Protection Act"
  - "VCDPA"
  - "Virginia residents"
  - "Va. Code § 59.1"
cross_refs:
  - "ccpa.applicability.threshold"
  - "cpa.applicability.threshold"
  - "ctdpa.applicability.threshold"
source_url: "https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-576/"
git_hash: ""
""",

"""id: "vcdpa.rights.access"
statute: "VCDPA"
section: "Va. Code § 59.1-577(A)(1)"
title: "Right to Confirm and Access"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Consumer submits authenticated request to confirm whether controller processes their personal data"
requirement: >
  Controller must confirm whether or not it is processing the consumer's PD and provide access
  to that PD. Response deadline: 45 days (extendable once by 45 days with notice).
  Must be provided free of charge twice per 12-month period.
exceptions:
  - "Request is manifestly unfounded, excessive, or repetitive"
  - "Complying would require revealing a trade secret"
contract_signals:
  - "right of access"
  - "confirm processing"
  - "access to personal data"
  - "data subject access"
  - "DSAR"
cross_refs:
  - "ccpa.rights.access"
  - "cpa.rights.access"
  - "modpa.rights.access"
source_url: "https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-577/"
git_hash: ""
""",

"""id: "vcdpa.rights.deletion"
statute: "VCDPA"
section: "Va. Code § 59.1-577(A)(3)"
title: "Right to Deletion"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Consumer submits authenticated request to delete personal data the consumer has provided or that the controller has obtained about the consumer"
requirement: >
  Controller must delete personal data provided by or obtained about the consumer.
  Response deadline: 45 days (extendable once by 45 days with notice).
exceptions:
  - "Processing necessary to complete a transaction or perform a contract"
  - "Processing necessary to protect against security incidents or fraudulent activity"
  - "Processing necessary for certain public interest research"
  - "Processing required to comply with a legal obligation"
  - "Processing necessary to exercise or defend legal claims"
contract_signals:
  - "right to erasure"
  - "right to deletion"
  - "delete personal data"
  - "data deletion"
  - "erase data"
cross_refs:
  - "ccpa.rights.deletion"
  - "cpa.rights.deletion"
  - "modpa.rights.deletion"
source_url: "https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-577/"
git_hash: ""
""",

"""id: "vcdpa.rights.correction"
statute: "VCDPA"
section: "Va. Code § 59.1-577(A)(2)"
title: "Right to Correction"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Consumer submits authenticated request to correct inaccurate personal data"
requirement: >
  Controller must correct inaccurate personal data about the consumer, taking into account the
  nature of the PD and the purposes of processing.
  Response deadline: 45 days (extendable once by 45 days with notice).
exceptions:
  - "Keeping original version necessary for legal compliance"
contract_signals:
  - "right to rectification"
  - "right to correction"
  - "correct inaccurate"
  - "rectify personal data"
cross_refs:
  - "ccpa.rights.correction"
  - "cpa.rights.correction"
source_url: "https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-577/"
git_hash: ""
""",

"""id: "vcdpa.rights.portability"
statute: "VCDPA"
section: "Va. Code § 59.1-577(A)(4)"
title: "Right to Data Portability"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Consumer submits authenticated request to obtain a copy of personal data in a portable format"
requirement: >
  Controller must provide a copy of the consumer's PD in a portable, readily usable format
  that allows transmission to another controller where technically feasible.
  Response deadline: 45 days.
exceptions:
  - "Disclosure would reveal a trade secret"
contract_signals:
  - "data portability"
  - "portable format"
  - "machine-readable copy"
  - "transmit to another controller"
cross_refs:
  - "ccpa.rights.portability"
  - "cpa.rights.portability"
source_url: "https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-577/"
git_hash: ""
""",

"""id: "vcdpa.rights.opt_out_sale"
statute: "VCDPA"
section: "Va. Code § 59.1-577(A)(5)"
title: "Right to Opt Out of Sale, Targeted Advertising, and Profiling"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller sells personal data, processes for targeted advertising, or profiles consumers for legal or similarly significant decisions"
requirement: >
  Consumers have the right to opt out of: (1) sale of PD (defined narrowly — monetary consideration
  only; Virginia does not cover non-monetary valuable consideration as a 'sale'); (2) processing for
  targeted advertising; (3) profiling that produces a legal or similarly significant effect.
  No requirement to recognize universal opt-out mechanism signals (e.g., GPC) — Virginia is the
  notable outlier. Controller must provide a clear and conspicuous mechanism to exercise opt-out.
exceptions: []
contract_signals:
  - "opt-out of sale"
  - "opt out of targeted advertising"
  - "opt out of profiling"
  - "right to opt out"
  - "sale of personal data"
cross_refs:
  - "ccpa.rights.opt_out_sale_sharing"
  - "cpa.rights.opt_out_sale"
  - "modpa.rights.opt_out_sale"
source_url: "https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-577/"
git_hash: ""
""",

"""id: "vcdpa.rights.appeal"
statute: "VCDPA"
section: "Va. Code § 59.1-577(C)"
title: "Right to Appeal Denied Request"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller declines to take action on a consumer rights request"
requirement: >
  If the controller declines to take action on a consumer's request, it must inform the consumer
  within 45 days of the reasons and provide instructions for how the consumer may appeal the
  decision. The controller must complete the appeal within 60 days of receipt. If the appeal is
  denied, the controller must provide the consumer with an online mechanism to contact the
  Virginia Attorney General to submit a complaint.
exceptions: []
contract_signals:
  - "right to appeal"
  - "appeal denied request"
  - "appeal process"
  - "consumer appeal"
cross_refs:
  - "cpa.rights.appeal"
  - "ctdpa.rights.appeal"
  - "modpa.rights.appeal"
source_url: "https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-577/"
git_hash: ""
""",

"""id: "vcdpa.sensitive_data.consent"
statute: "VCDPA"
section: "Va. Code § 59.1-578(B); § 59.1-575 (definitions)"
title: "Sensitive Data — Opt-In Consent Required"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller intends to process sensitive data"
requirement: >
  Controller must obtain the consumer's opt-in consent before processing sensitive data.
  Sensitive data categories include: racial or ethnic origin; religious beliefs;
  mental or physical health diagnosis; sexual orientation or gender identity;
  citizenship or immigration status; genetic or biometric data processed for unique identification;
  PD of a known child; precise geolocation data.
  Note: unlike California, VCDPA uses opt-in consent — not a 'right to limit.'
exceptions:
  - "Processing necessary to provide a requested product or service when the sensitive data is integral to that product or service, with appropriate disclosure"
contract_signals:
  - "sensitive data"
  - "sensitive personal data"
  - "opt-in consent"
  - "biometric data"
  - "precise geolocation"
  - "health diagnosis"
  - "racial or ethnic origin"
  - "consent to process sensitive"
cross_refs:
  - "ccpa.sensitive_data.categories"
  - "cpa.sensitive_data.consent"
  - "modpa.sensitive_data.ban_on_sale"
source_url: "https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-578/"
git_hash: ""
""",

"""id: "vcdpa.controller_duties.privacy_notice"
statute: "VCDPA"
section: "Va. Code § 59.1-578(A)"
title: "Privacy Notice Requirements"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller processes personal data of Virginia consumers"
requirement: >
  Controller must provide a reasonably accessible, clear, and meaningful privacy notice that
  includes: categories of PD processed; purposes for processing; how consumers may exercise
  their rights and appeal denials; categories of PD shared with third parties; categories of
  third parties with whom PD is shared; an active contact email address or other online
  mechanism to contact the controller.
exceptions: []
contract_signals:
  - "privacy notice"
  - "privacy policy"
  - "privacy statement"
  - "data processing disclosure"
cross_refs:
  - "ccpa.controller_duties.privacy_notice"
  - "cpa.controller_duties.privacy_notice"
source_url: "https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-578/"
git_hash: ""
""",

"""id: "vcdpa.controller_duties.data_protection_assessment"
statute: "VCDPA"
section: "Va. Code § 59.1-578(C)"
title: "Data Protection Assessment"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller engages in processing activities that present a heightened risk of harm to consumers including sale, targeted advertising, sensitive data processing, profiling with significant effects"
requirement: >
  Controller must conduct and document a data protection assessment for each processing activity
  that presents heightened risk of harm. Assessment must identify and weigh benefits against
  potential risks. Must be retained and made available to the AG upon request.
exceptions: []
contract_signals:
  - "data protection assessment"
  - "DPIA"
  - "risk assessment"
  - "data protection impact assessment"
  - "high-risk processing"
cross_refs:
  - "ccpa.controller_duties.data_protection_assessment"
  - "cpa.controller_duties.data_protection_assessment"
source_url: "https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-578/"
git_hash: ""
""",

"""id: "vcdpa.controller_duties.processor_contract"
statute: "VCDPA"
section: "Va. Code § 59.1-580"
title: "Processor Contract Requirements"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller engages a processor to process personal data on its behalf"
requirement: >
  A binding contract must govern the processor's data processing, including: nature and purpose
  of processing; type of data; duration; rights and obligations of both parties.
  The contract must require the processor to: process data only per controller instructions;
  maintain confidentiality; delete or return PD upon termination; provide audit assistance;
  engage subprocessors only under equivalent contractual obligations; assist with consumer rights
  fulfillment and security obligations.
exceptions: []
contract_signals:
  - "data processing agreement"
  - "DPA"
  - "processor agreement"
  - "subprocessor"
  - "controller-processor"
  - "processing on behalf of"
cross_refs:
  - "ccpa.controller_duties.service_provider_contract"
  - "cpa.controller_duties.processor_contract"
source_url: "https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-580/"
git_hash: ""
""",

"""id: "vcdpa.enforcement.parameters"
statute: "VCDPA"
section: "Va. Code § 59.1-584"
title: "Enforcement — AG Only; Civil Penalties"
effective_date: "2023-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates VCDPA"
requirement: >
  Enforced exclusively by the Virginia Attorney General. No private right of action.
  Civil penalty up to $7,500 per violation. 30-day cure period remains in effect.
  AG may seek injunctive relief and recovery of reasonable attorneys' fees and investigation costs.
exceptions: []
contract_signals:
  - "Virginia Attorney General"
  - "civil penalty"
  - "VCDPA violation"
  - "enforcement action"
  - "cure period"
cross_refs:
  - "ccpa.enforcement.parameters"
  - "cpa.enforcement.parameters"
source_url: "https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-584/"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# CPA (Colorado)
# ─────────────────────────────────────────
"cpa": [

"""id: "cpa.applicability.threshold"
statute: "CPA"
section: "Colo. Rev. Stat. § 6-1-1304"
title: "Applicability Threshold"
effective_date: "2023-07-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Colorado or producing/delivering products/services intentionally targeted to Colorado residents"
requirement: >
  Applies to controllers conducting business in Colorado or intentionally targeting products/services
  to Colorado residents AND either:
  (a) controlling or processing PD of at least 100,000 consumers in a calendar year; OR
  (b) deriving revenue or receiving a discount from the sale of PD AND controlling or processing
  PD of at least 25,000 consumers.
  Note: no minimum revenue threshold — purely activity-based.
exceptions:
  - "GLBA-covered data (data-level)"
  - "HIPAA-covered data (data-level)"
  - "FCRA-covered data (data-level)"
  - "DPPA-covered data (data-level)"
  - "FERPA-covered data (data-level)"
  - "COPPA-covered data (data-level)"
  - "Employment data"
  - "Air carriers"
  - "Certain state institutions"
contract_signals:
  - "Colorado Privacy Act"
  - "CPA"
  - "Colorado residents"
  - "Colo. Rev. Stat. § 6-1-13"
cross_refs:
  - "ccpa.applicability.threshold"
  - "vcdpa.applicability.threshold"
  - "ctdpa.applicability.threshold"
source_url: "https://leg.colorado.gov/sites/default/files/documents/2021A/bills/2021a_190_enr.pdf"
git_hash: ""
""",

"""id: "cpa.rights.opt_out_sale"
statute: "CPA"
section: "Colo. Rev. Stat. § 6-1-1306(1)(a)"
title: "Right to Opt Out of Sale, Targeted Advertising, and Profiling"
effective_date: "2023-07-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller sells personal data, uses it for targeted advertising, or uses it for profiling with significant effects"
requirement: >
  Consumers have the right to opt out of: (1) sale of PD; (2) targeted advertising; (3) profiling
  in furtherance of decisions that produce legal or similarly significant effects.
  Controller must provide a clear and conspicuous mechanism to opt out.
  Controller must recognize universal opt-out mechanism (UOOM) signals listed by the AG —
  currently Global Privacy Control (GPC). Recognition must apply to known users, not just devices.
  Effective July 2024.
exceptions: []
contract_signals:
  - "opt-out of sale"
  - "opt out of targeted advertising"
  - "Global Privacy Control"
  - "GPC"
  - "universal opt-out"
  - "UOOM"
  - "opt out of profiling"
cross_refs:
  - "ccpa.rights.opt_out_sale_sharing"
  - "vcdpa.rights.opt_out_sale"
  - "ctdpa.rights.opt_out_sale"
source_url: "https://leg.colorado.gov/sites/default/files/documents/2021A/bills/2021a_190_enr.pdf"
git_hash: ""
""",

"""id: "cpa.sensitive_data.consent"
statute: "CPA"
section: "Colo. Rev. Stat. § 6-1-1308(7); § 6-1-1303(24)"
title: "Sensitive Data — Opt-In Consent Required"
effective_date: "2023-07-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller intends to process sensitive data"
requirement: >
  Controller must obtain opt-in consent before processing sensitive data.
  Consent must be: clear and affirmative; freely given; specific; informed; unambiguous; and
  obtained without dark patterns (CPA Rules § 7). Pre-checked boxes and 'agree by use' clauses
  are facially non-compliant.
  Sensitive categories: racial/ethnic origin; religious beliefs; mental/physical health;
  sex life or sexual orientation; citizenship/immigration status; genetic or biometric data
  processed for unique ID; PD of a known child; precise geolocation.
  Loyalty programs require separate notice and consent structure (CPA Rules § 6.04).
exceptions:
  - "Processing for the specific purpose for which consent was given"
contract_signals:
  - "sensitive data consent"
  - "opt-in consent"
  - "sensitive personal data"
  - "biometric data"
  - "precise geolocation"
  - "health data"
  - "consent to process"
cross_refs:
  - "ccpa.sensitive_data.categories"
  - "vcdpa.sensitive_data.consent"
  - "modpa.sensitive_data.ban_on_sale"
source_url: "https://leg.colorado.gov/sites/default/files/documents/2021A/bills/2021a_190_enr.pdf"
git_hash: ""
""",

"""id: "cpa.enforcement.parameters"
statute: "CPA"
section: "Colo. Rev. Stat. § 6-1-1311"
title: "Enforcement — AG and District Attorneys; Civil Penalties"
effective_date: "2023-07-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates CPA"
requirement: >
  Enforced by the Colorado AG and district attorneys. No private right of action.
  Civil penalty up to $20,000 per violation, capped at $500,000 per related series.
  Cure period SUNSET January 1, 2025 — no longer mandatory. Violations committed after
  January 1, 2025 may be immediately actionable without cure opportunity.
exceptions: []
contract_signals:
  - "Colorado Attorney General"
  - "civil penalty"
  - "CPA violation"
  - "district attorney"
cross_refs:
  - "ccpa.enforcement.parameters"
  - "vcdpa.enforcement.parameters"
source_url: "https://leg.colorado.gov/sites/default/files/documents/2021A/bills/2021a_190_enr.pdf"
git_hash: ""
""",

"""id: "cpa.controller_duties.data_protection_assessment"
statute: "CPA"
section: "Colo. Rev. Stat. § 6-1-1309; 4 Colo. Code Regs. § 904-3, Rule 8"
title: "Data Protection Assessment"
effective_date: "2023-07-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller engages in high-risk processing including sale, targeted advertising, sensitive data, profiling with significant effects"
requirement: >
  Controller must document a data protection assessment for each processing activity presenting
  a heightened risk of harm to consumers. The CPA Rules (Rule 8) specify assessment content.
  The AG may request assessments. Assessments are confidential and not subject to public records laws.
exceptions: []
contract_signals:
  - "data protection assessment"
  - "DPIA"
  - "risk assessment"
  - "high-risk processing"
cross_refs:
  - "ccpa.controller_duties.data_protection_assessment"
  - "vcdpa.controller_duties.data_protection_assessment"
  - "modpa.controller_duties.data_protection_assessment"
source_url: "https://coag.gov/resources/colorado-privacy-act/"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# CTDPA (Connecticut)
# ─────────────────────────────────────────
"ctdpa": [

"""id: "ctdpa.applicability.threshold"
statute: "CTDPA"
section: "Conn. Gen. Stat. § 42-516"
title: "Applicability Threshold"
effective_date: "2023-07-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Connecticut or producing products/services targeted to Connecticut residents"
requirement: >
  Applies to persons conducting business in Connecticut or targeting CT residents AND, during the
  preceding calendar year:
  (a) controlled or processed PD of at least 100,000 consumers (excluding solely-payment-transaction data); OR
  (b) controlled or processed PD of at least 25,000 consumers AND derived >25% of gross revenue from sale of PD.
  The 25% threshold is lower than Virginia's 50% and catches more mid-sized businesses.
exceptions:
  - "State agencies and political subdivisions"
  - "Non-profits"
  - "Higher education institutions"
  - "National securities associations"
  - "Financial institutions (GLBA, entity-level)"
  - "HIPAA covered entities and business associates (entity-level)"
  - "Employment data"
  - "B2B contacts"
contract_signals:
  - "Connecticut Data Privacy Act"
  - "CTDPA"
  - "Connecticut residents"
  - "Conn. Gen. Stat. § 42-5"
cross_refs:
  - "vcdpa.applicability.threshold"
  - "cpa.applicability.threshold"
  - "njdpa.applicability.threshold"
source_url: "https://www.cga.ct.gov/2022/ACT/PA/PDF/2022PA-00015-R00SB-00006-PA.PDF"
git_hash: ""
""",

"""id: "ctdpa.uoom.gpc"
statute: "CTDPA"
section: "Conn. Gen. Stat. § 42-518"
title: "Universal Opt-Out Mechanism — GPC Recognition Required"
effective_date: "2025-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller sells personal data or processes for targeted advertising"
requirement: >
  Effective January 1, 2025, controllers must recognize and honor universal opt-out preference
  signals including Global Privacy Control (GPC). Recognition must apply to known users
  (logged-in or identified), not only to devices. Cure period sunset January 1, 2025.
exceptions: []
contract_signals:
  - "Global Privacy Control"
  - "GPC"
  - "universal opt-out"
  - "opt-out preference signal"
  - "UOOM"
cross_refs:
  - "cpa.rights.opt_out_sale"
  - "modpa.uoom.gpc"
  - "njdpa.uoom.gpc"
source_url: "https://www.cga.ct.gov/2022/ACT/PA/PDF/2022PA-00015-R00SB-00006-PA.PDF"
git_hash: ""
""",

"""id: "ctdpa.minors.teen_protections"
statute: "CTDPA"
section: "Conn. Gen. Stat. §§ 42-515 et seq. (2023 amendments)"
title: "Teen Protections — Ages 13 to 15"
effective_date: "2023-07-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller knows or has reason to believe a consumer is at least 13 and less than 16 years of age"
requirement: >
  For consumers known to be between 13 and under 16 years of age, processing for purposes of
  targeted advertising, sale, or profiling with legal or significant effects is DEFAULT OFF —
  the controller may not engage in such processing without opt-in consent.
  Heightened data minimization applies to known minors.
  For consumers known to be under 13, COPPA-aligned obligations apply.
exceptions: []
contract_signals:
  - "minor"
  - "teen"
  - "known minor"
  - "13 to 16"
  - "children's data"
  - "age-appropriate"
  - "COPPA"
cross_refs:
  - "modpa.minors.flat_ban"
  - "njdpa.minors.teen_protections"
  - "ccpa.sensitive_data.categories"
source_url: "https://www.cga.ct.gov/2022/ACT/PA/PDF/2022PA-00015-R00SB-00006-PA.PDF"
git_hash: ""
""",

"""id: "ctdpa.sensitive_data.consent"
statute: "CTDPA"
section: "Conn. Gen. Stat. § 42-515(27); § 42-520"
title: "Sensitive Data — Opt-In Consent Required"
effective_date: "2023-07-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller intends to process sensitive data"
requirement: >
  Controller must obtain opt-in consent before processing sensitive data.
  Sensitive categories: racial or ethnic origin; religious beliefs; mental or physical health;
  sex life or sexual orientation; citizenship or immigration status; genetic or biometric data
  for unique identification; PD of a known child; precise geolocation.
exceptions: []
contract_signals:
  - "sensitive data"
  - "opt-in consent"
  - "sensitive personal data"
  - "biometric"
  - "health data"
  - "consent to process sensitive"
cross_refs:
  - "ccpa.sensitive_data.categories"
  - "vcdpa.sensitive_data.consent"
  - "cpa.sensitive_data.consent"
source_url: "https://www.cga.ct.gov/2022/ACT/PA/PDF/2022PA-00015-R00SB-00006-PA.PDF"
git_hash: ""
""",

"""id: "ctdpa.enforcement.parameters"
statute: "CTDPA"
section: "Conn. Gen. Stat. § 42-524"
title: "Enforcement — AG Only; Civil Penalties"
effective_date: "2023-07-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates CTDPA"
requirement: >
  Enforced exclusively by the Connecticut Attorney General under the CUTPA framework.
  No private right of action. Civil penalty up to $5,000 per willful violation.
  Cure period sunset January 1, 2025 — AG enforcement now immediate without statutory cure right.
  AG may seek injunctive and equitable relief.
exceptions: []
contract_signals:
  - "Connecticut Attorney General"
  - "civil penalty"
  - "CTDPA violation"
  - "CUTPA"
cross_refs:
  - "vcdpa.enforcement.parameters"
  - "cpa.enforcement.parameters"
source_url: "https://www.cga.ct.gov/2022/ACT/PA/PDF/2022PA-00015-R00SB-00006-PA.PDF"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# UCPA (Utah)
# ─────────────────────────────────────────
"ucpa": [

"""id: "ucpa.applicability.threshold"
statute: "UCPA"
section: "Utah Code § 13-61-102"
title: "Applicability Threshold — Combined Revenue and Activity Test"
effective_date: "2023-12-31"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Utah or producing products/services targeted to Utah consumers"
requirement: >
  Applies to controllers/processors that: (a) conduct business in Utah or target Utah consumers;
  AND (b) have annual revenue of $25 million or more; AND (c) satisfy ONE of:
  control or process PD of at least 100,000 Utah consumers in a calendar year; OR
  derive over 50% of gross revenue from sale of PD AND control or process PD of at least
  25,000 Utah consumers.
  The mandatory $25M revenue floor in addition to the activity test makes UCPA the hardest
  threshold to meet — many businesses in scope elsewhere will not meet it.
exceptions:
  - "GLBA, HIPAA, FCRA, DPPA, FERPA, COPPA carve-outs"
  - "Air carriers"
  - "Non-profits"
  - "Higher education"
  - "Tribal entities"
  - "State agencies"
  - "Employees and B2B contacts"
contract_signals:
  - "Utah Consumer Privacy Act"
  - "UCPA"
  - "Utah residents"
  - "Utah Code § 13-61"
cross_refs:
  - "vcdpa.applicability.threshold"
  - "cpa.applicability.threshold"
source_url: "https://le.utah.gov/xcode/Title13/Chapter61/C13-61_2022050420220504.pdf"
git_hash: ""
""",

"""id: "ucpa.sensitive_data.opt_out"
statute: "UCPA"
section: "Utah Code § 13-61-302; § 13-61-101"
title: "Sensitive Data — Opt-OUT Structure (Not Opt-In)"
effective_date: "2023-12-31"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller intends to process sensitive data"
requirement: >
  Utah and Iowa are the ONLY comprehensive state laws using an opt-OUT (notice + ability to opt out)
  structure for sensitive data — not opt-in consent.
  Controller must provide clear notice before processing sensitive data and must provide the
  consumer an opportunity to opt out BEFORE processing commences.
  Sensitive categories: standard (racial/ethnic origin, religious beliefs, mental/physical health,
  sex life/orientation, citizenship, genetic/biometric, precise geolocation, child PD).
  WARNING: A program built to other states' opt-in standard satisfies UCPA, but a program built
  only to UCPA's opt-out standard will fail in 17 other states.
exceptions: []
contract_signals:
  - "sensitive data"
  - "sensitive personal data"
  - "opt-out of sensitive data processing"
  - "notice before processing"
cross_refs:
  - "icdpa.sensitive_data.opt_out"
  - "vcdpa.sensitive_data.consent"
  - "cpa.sensitive_data.consent"
source_url: "https://le.utah.gov/xcode/Title13/Chapter61/C13-61_2022050420220504.pdf"
git_hash: ""
""",

"""id: "ucpa.rights.narrow_regime"
statute: "UCPA"
section: "Utah Code § 13-61-201"
title: "Consumer Rights — Narrowest Regime"
effective_date: "2023-12-31"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Consumer submits authenticated request under UCPA"
requirement: >
  UCPA provides the narrowest consumer rights regime of any comprehensive state privacy law:
  Right to access (confirm and obtain copy); right to delete; right to portability; right to
  opt out of sale and targeted advertising.
  NO correction right; NO profiling opt-out; NO right to appeal; NO UOOM recognition required.
  Controller must respond within 45 days (extendable once by 45 days).
exceptions:
  - "Requests that are manifestly unfounded or excessive"
contract_signals:
  - "access request"
  - "deletion request"
  - "opt-out of sale"
  - "portability request"
  - "consumer rights request"
cross_refs:
  - "vcdpa.rights.access"
  - "cpa.rights.opt_out_sale"
  - "icdpa.rights.narrow_regime"
source_url: "https://le.utah.gov/xcode/Title13/Chapter61/C13-61_2022050420220504.pdf"
git_hash: ""
""",

"""id: "ucpa.enforcement.parameters"
statute: "UCPA"
section: "Utah Code §§ 13-61-401 to -404"
title: "Enforcement — AG; Cure Period in Effect"
effective_date: "2023-12-31"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates UCPA"
requirement: >
  Enforced by the Utah AG after referral from the Division of Consumer Protection following
  an opportunity to cure. 30-day cure period in effect. No private right of action.
  Civil penalty up to $7,500 per violation plus actual damages.
exceptions: []
contract_signals:
  - "Utah Attorney General"
  - "civil penalty"
  - "UCPA violation"
  - "Division of Consumer Protection"
cross_refs:
  - "vcdpa.enforcement.parameters"
  - "icdpa.enforcement.parameters"
source_url: "https://le.utah.gov/xcode/Title13/Chapter61/C13-61_2022050420220504.pdf"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# TDPSA (Texas)
# ─────────────────────────────────────────
"tdpsa": [

"""id: "tdpsa.applicability.threshold"
statute: "TDPSA"
section: "Tex. Bus. & Com. Code § 541.002"
title: "Applicability — SBA Size-Based, No Numerical Consumer Threshold"
effective_date: "2024-07-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Texas or producing products/services consumed by Texas residents"
requirement: >
  Applies to persons that: (a) conduct business in Texas or produce products/services consumed
  by Texas residents; AND (b) process or engage in the sale of PD; AND (c) are NOT a small
  business as defined by the SBA size standards (which vary by NAICS code — confirm by industry).
  EXCEPTION: if the entity sells sensitive PD without obtaining consent, the small-business
  exemption is forfeit and TDPSA applies regardless of size.
  No numerical consumer threshold — applicability turns on SBA size status.
exceptions:
  - "Government entities"
  - "Non-profits"
  - "Higher education institutions"
  - "Financial institutions (GLBA, entity-level)"
  - "HIPAA covered entities and business associates (entity-level)"
  - "Electric utilities"
  - "Non-profit insurer associations"
  - "Employment data"
  - "B2B contacts"
contract_signals:
  - "Texas Data Privacy and Security Act"
  - "TDPSA"
  - "Texas residents"
  - "Tex. Bus. & Com. Code § 541"
cross_refs:
  - "ndpa.applicability.threshold"
  - "vcdpa.applicability.threshold"
source_url: "https://capitol.texas.gov/tlodocs/88R/billtext/pdf/HB04.pdf"
git_hash: ""
""",

"""id: "tdpsa.controller_duties.sensitive_data_notice"
statute: "TDPSA"
section: "Tex. Bus. & Com. Code § 541.053"
title: "Specific Notice Required for Sale of Sensitive Personal Data"
effective_date: "2024-07-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller sells sensitive personal data including biometric or genetic data"
requirement: >
  Controller that sells sensitive PD must disclose at the point of collection or in its privacy
  policy: 'NOTICE: We may sell your sensitive personal data.'
  Similar verbatim disclosure required specifically for sale of biometric or genetic data.
  Generic privacy policy language does not satisfy this requirement — verbatim statutory language required.
exceptions: []
contract_signals:
  - "sensitive personal data"
  - "sale of sensitive data"
  - "biometric data"
  - "genetic data"
  - "notice of sale"
  - "TDPSA notice"
cross_refs:
  - "ccpa.sensitive_data.categories"
  - "vcdpa.sensitive_data.consent"
  - "modpa.sensitive_data.ban_on_sale"
source_url: "https://capitol.texas.gov/tlodocs/88R/billtext/pdf/HB04.pdf"
git_hash: ""
""",

"""id: "tdpsa.enforcement.parameters"
statute: "TDPSA"
section: "Tex. Bus. & Com. Code § 541.155"
title: "Enforcement — AG Only; 30-Day Cure; No Private Right of Action"
effective_date: "2024-07-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates TDPSA"
requirement: >
  Enforced exclusively by the Texas Attorney General. No private right of action.
  Civil penalty up to $7,500 per violation. 30-day cure period in effect.
  AG has been notably active under TDPSA with particular focus on children's privacy,
  biometric data, and health data practices.
exceptions: []
contract_signals:
  - "Texas Attorney General"
  - "civil penalty"
  - "TDPSA violation"
  - "cure period"
cross_refs:
  - "ndpa.enforcement.parameters"
  - "vcdpa.enforcement.parameters"
source_url: "https://capitol.texas.gov/tlodocs/88R/billtext/pdf/HB04.pdf"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# OCPA (Oregon)
# ─────────────────────────────────────────
"ocpa": [

"""id: "ocpa.applicability.threshold"
statute: "OCPA"
section: "ORS § 646A.572"
title: "Applicability Threshold"
effective_date: "2024-07-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Oregon or providing products/services targeted to Oregon residents"
requirement: >
  Applies to persons conducting business in Oregon or targeting OR residents AND, during the
  preceding calendar year:
  (a) controlled or processed PD of at least 100,000 consumers (excluding solely-payment-transaction data); OR
  (b) controlled or processed PD of at least 25,000 consumers AND derived at least 25% of gross
  revenue from sale of PD.
  Non-profits initially in scope with delayed effective date of July 1, 2025.
exceptions:
  - "Insurance / GLBA-aligned data (narrowly)"
  - "HIPAA PHI (data-level)"
  - "FCRA-covered data (data-level)"
  - "DPPA-covered data (data-level)"
  - "FERPA-covered data (data-level)"
  - "Certain state agencies and tribal entities"
contract_signals:
  - "Oregon Consumer Privacy Act"
  - "OCPA"
  - "Oregon residents"
  - "ORS § 646A"
cross_refs:
  - "vcdpa.applicability.threshold"
  - "ctdpa.applicability.threshold"
  - "mcdpa_mn.applicability.threshold"
source_url: "https://www.oregonlegislature.gov/bills_laws/ors/ors646A.html"
git_hash: ""
""",

"""id: "ocpa.rights.specific_third_parties"
statute: "OCPA"
section: "ORS § 646A.574"
title: "Right to List of Specific Third Parties"
effective_date: "2024-07-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Consumer requests disclosure of third parties to whom controller has disclosed personal data"
requirement: >
  In addition to standard rights (access, correct, delete, portability, opt-out, appeal),
  Oregon consumers may request the SPECIFIC THIRD PARTIES (not just categories) to whom the
  controller has disclosed PD. This is a significant operational lift over most states' categorical
  disclosure requirement. Controller must build per-consumer disclosure logs to satisfy this right.
  Appeal deadline: 45 days.
exceptions:
  - "Disclosure would reveal a trade secret"
contract_signals:
  - "specific third parties"
  - "list of third parties"
  - "third-party disclosure"
  - "recipients of personal data"
  - "data disclosure log"
cross_refs:
  - "mcdpa_mn.rights.specific_third_parties"
  - "ridtppa.controller_duties.named_third_parties"
  - "dpdpa.rights.third_party_categories"
source_url: "https://www.oregonlegislature.gov/bills_laws/ors/ors646A.html"
git_hash: ""
""",

"""id: "ocpa.sensitive_data.expanded_categories"
statute: "OCPA"
section: "ORS § 646A.570(17)"
title: "Sensitive Data — Expanded Categories Including OR-Specific"
effective_date: "2024-07-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller intends to process sensitive data including Oregon-specific categories"
requirement: >
  Opt-in consent required before processing sensitive data.
  Standard categories plus two Oregon-specific additions:
  (1) status as a victim of a crime; (2) transgender or non-binary status.
  Controllers whose sensitive-data programs are built for other states must audit their definitions
  to ensure Oregon's expanded categories are covered.
exceptions: []
contract_signals:
  - "sensitive data"
  - "sensitive personal data"
  - "opt-in consent"
  - "victim status"
  - "transgender"
  - "non-binary"
  - "biometric"
  - "precise geolocation"
cross_refs:
  - "njdpa.sensitive_data.expanded_categories"
  - "vcdpa.sensitive_data.consent"
  - "cpa.sensitive_data.consent"
source_url: "https://www.oregonlegislature.gov/bills_laws/ors/ors646A.html"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# MCDPA (Montana)
# ─────────────────────────────────────────
"mcdpa": [

"""id: "mcdpa.applicability.threshold"
statute: "MCDPA"
section: "Mont. Code § 30-14-2802"
title: "Applicability Threshold — Lowest Primary Tier (50k)"
effective_date: "2024-10-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Montana or producing products/services targeted to Montana residents"
requirement: >
  Applies to persons conducting business in Montana or targeting MT residents AND:
  (a) controls/processes PD of at least 50,000 MT consumers (excluding solely-payment-transaction data); OR
  (b) controls/processes PD of at least 25,000 MT consumers AND derives over 25% of gross revenue from sale of PD.
  Note: 50,000 primary-tier threshold is the lowest 'standard' threshold of any state (reflecting
  Montana's smaller population). Mid-size businesses that escape 100k thresholds elsewhere may be
  in scope in Montana.
exceptions:
  - "Government entities"
  - "Non-profits"
  - "Higher education"
  - "HIPAA covered entities/BAs (entity-level)"
  - "GLBA-covered financial institutions (entity-level)"
  - "Certain insurers"
  - "Employment data and B2B contacts"
contract_signals:
  - "Montana Consumer Data Privacy Act"
  - "MCDPA"
  - "Montana residents"
  - "Mont. Code § 30-14-28"
cross_refs:
  - "vcdpa.applicability.threshold"
  - "dpdpa.applicability.threshold"
source_url: "https://leg.mt.gov/bills/2023/billpdf/SB0384.pdf"
git_hash: ""
""",

"""id: "mcdpa.uoom.gpc"
statute: "MCDPA"
section: "Mont. Code § 30-14-2812"
title: "Universal Opt-Out Mechanism Required"
effective_date: "2025-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller sells personal data or processes for targeted advertising"
requirement: >
  Effective January 1, 2025, controllers must recognize and honor universal opt-out mechanism
  signals (including GPC). Cure period sunset April 1, 2026.
exceptions: []
contract_signals:
  - "Global Privacy Control"
  - "GPC"
  - "universal opt-out"
  - "UOOM"
  - "opt-out signal"
cross_refs:
  - "cpa.rights.opt_out_sale"
  - "ctdpa.uoom.gpc"
  - "modpa.uoom.gpc"
source_url: "https://leg.mt.gov/bills/2023/billpdf/SB0384.pdf"
git_hash: ""
""",

"""id: "mcdpa.enforcement.parameters"
statute: "MCDPA"
section: "Mont. Code § 30-14-2822"
title: "Enforcement — AG Only; Cure Period Until April 2026"
effective_date: "2024-10-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates MCDPA"
requirement: >
  Enforced exclusively by the Montana AG. No private right of action.
  Civil penalty up to $7,500 per violation. Cure period sunset April 1, 2026.
exceptions: []
contract_signals:
  - "Montana Attorney General"
  - "civil penalty"
  - "MCDPA violation"
cross_refs:
  - "vcdpa.enforcement.parameters"
  - "tdpsa.enforcement.parameters"
source_url: "https://leg.mt.gov/bills/2023/billpdf/SB0384.pdf"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# ICDPA (Iowa)
# ─────────────────────────────────────────
"icdpa": [

"""id: "icdpa.applicability.threshold"
statute: "ICDPA"
section: "Iowa Code § 715D.2"
title: "Applicability Threshold"
effective_date: "2025-01-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Iowa or producing products/services targeted to Iowa consumers"
requirement: >
  Applies to persons conducting business in Iowa or targeting IA consumers AND in a calendar year:
  (a) controls/processes PD of at least 100,000 IA consumers; OR
  (b) controls/processes PD of at least 25,000 IA consumers AND derives over 50% of gross revenue from sale of PD.
exceptions:
  - "Government entities"
  - "Financial institutions (GLBA)"
  - "HIPAA covered entities/BAs"
  - "Non-profits"
  - "Higher education"
  - "Employment data and B2B contacts"
contract_signals:
  - "Iowa Consumer Data Protection Act"
  - "ICDPA"
  - "Iowa residents"
  - "Iowa Code § 715D"
cross_refs:
  - "ucpa.applicability.threshold"
  - "vcdpa.applicability.threshold"
source_url: "https://www.legis.iowa.gov/docs/acts/2023/ACT0006.pdf"
git_hash: ""
""",

"""id: "icdpa.rights.narrow_regime"
statute: "ICDPA"
section: "Iowa Code § 715D.3"
title: "Consumer Rights — Second-Narrowest Regime"
effective_date: "2025-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Consumer submits authenticated request under ICDPA"
requirement: >
  Iowa provides the second-narrowest consumer rights regime after UCPA:
  Right to access; right to delete; right to portability; right to opt out of SALE only.
  NO correction right; NO right to opt out of targeted advertising; NO profiling opt-out;
  NO right to appeal; NO UOOM recognition required.
  Sensitive data uses opt-out (not opt-in) — Iowa and Utah are the only two states in this posture.
  Response deadline: 90 days (longest of any state).
exceptions:
  - "Requests that are manifestly unfounded or excessive"
contract_signals:
  - "opt-out of sale"
  - "access request"
  - "deletion request"
  - "Iowa privacy rights"
cross_refs:
  - "ucpa.rights.narrow_regime"
  - "vcdpa.rights.opt_out_sale"
source_url: "https://www.legis.iowa.gov/docs/acts/2023/ACT0006.pdf"
git_hash: ""
""",

"""id: "icdpa.sensitive_data.opt_out"
statute: "ICDPA"
section: "Iowa Code § 715D.1"
title: "Sensitive Data — Opt-OUT Structure (Not Opt-In)"
effective_date: "2025-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller intends to process sensitive data"
requirement: >
  Controller must provide clear notice and opportunity to opt out before processing sensitive data.
  Iowa and Utah are the only states using opt-out (not opt-in) for sensitive data.
  Standard sensitive data categories apply.
  A program built to other states' opt-in consent standard satisfies Iowa, but a program built
  only to Iowa's opt-out structure will fail in 17 other states.
exceptions: []
contract_signals:
  - "sensitive data"
  - "sensitive personal data"
  - "opt-out of sensitive data"
cross_refs:
  - "ucpa.sensitive_data.opt_out"
  - "vcdpa.sensitive_data.consent"
source_url: "https://www.legis.iowa.gov/docs/acts/2023/ACT0006.pdf"
git_hash: ""
""",

"""id: "icdpa.enforcement.parameters"
statute: "ICDPA"
section: "Iowa Code § 715D.8"
title: "Enforcement — AG; 90-Day Cure Period"
effective_date: "2025-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates ICDPA"
requirement: >
  Enforced by the Iowa AG. No private right of action.
  Civil penalty up to $7,500 per violation.
  90-day cure period — the longest of any state.
exceptions: []
contract_signals:
  - "Iowa Attorney General"
  - "civil penalty"
  - "ICDPA violation"
  - "cure period"
cross_refs:
  - "ucpa.enforcement.parameters"
  - "vcdpa.enforcement.parameters"
source_url: "https://www.legis.iowa.gov/docs/acts/2023/ACT0006.pdf"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# INCDPA (Indiana)
# ─────────────────────────────────────────
"incdpa": [

"""id: "incdpa.applicability.threshold"
statute: "INCDPA"
section: "Ind. Code § 24-15"
title: "Applicability Threshold"
effective_date: "2026-01-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Indiana or producing products/services targeted to Indiana residents"
requirement: >
  Applies to persons conducting business in Indiana or targeting IN residents AND during a calendar year:
  (a) control/process PD of at least 100,000 IN consumers; OR
  (b) control/process PD of at least 25,000 IN consumers AND derive over 50% of gross revenue from sale of PD.
exceptions:
  - "Standard exemptions (GLBA, HIPAA, FCRA, DPPA, FERPA, COPPA)"
  - "Government entities"
  - "Non-profits"
  - "Higher education"
  - "Employment data and B2B contacts"
contract_signals:
  - "Indiana Consumer Data Protection Act"
  - "INCDPA"
  - "Indiana residents"
  - "Ind. Code § 24-15"
cross_refs:
  - "vcdpa.applicability.threshold"
  - "kcdpa.applicability.threshold"
source_url: "https://iga.in.gov/legislative/2023/bills/senate/5/details"
git_hash: ""
""",

"""id: "incdpa.uoom.required"
statute: "INCDPA"
section: "Ind. Code § 24-15"
title: "Universal Opt-Out Mechanism Required"
effective_date: "2026-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller sells personal data or processes for targeted advertising"
requirement: >
  Controllers must recognize and honor universal opt-out mechanism signals (including GPC)
  effective January 1, 2026. Note: no profiling opt-out right under INCDPA.
exceptions: []
contract_signals:
  - "Global Privacy Control"
  - "GPC"
  - "universal opt-out"
  - "UOOM"
cross_refs:
  - "cpa.rights.opt_out_sale"
  - "ctdpa.uoom.gpc"
source_url: "https://iga.in.gov/legislative/2023/bills/senate/5/details"
git_hash: ""
""",

"""id: "incdpa.enforcement.parameters"
statute: "INCDPA"
section: "Ind. Code § 24-15"
title: "Enforcement — AG; Civil Penalties"
effective_date: "2026-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates INCDPA"
requirement: >
  Enforced by the Indiana AG. No private right of action. Civil penalty up to $7,500 per violation.
  30-day cure period at enactment — verify current status against AG guidance.
exceptions: []
contract_signals:
  - "Indiana Attorney General"
  - "civil penalty"
  - "INCDPA violation"
cross_refs:
  - "vcdpa.enforcement.parameters"
  - "kcdpa.enforcement.parameters"
source_url: "https://iga.in.gov/legislative/2023/bills/senate/5/details"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# TIPA (Tennessee)
# ─────────────────────────────────────────
"tipa": [

"""id: "tipa.applicability.threshold"
statute: "TIPA"
section: "Tenn. Code § 47-18-3202"
title: "Applicability Threshold — Highest Primary Tier (175k) + $25M Revenue Floor"
effective_date: "2025-07-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Tennessee and producing products/services targeted to Tennessee residents"
requirement: >
  Applies to persons conducting business in Tennessee targeting TN residents AND exceeding
  $25 million revenue AND:
  (a) control/process PD of at least 175,000 TN consumers in a calendar year; OR
  (b) control/process PD of at least 25,000 TN consumers AND derive over 50% of gross revenue from sale of PD.
  175,000 primary-tier threshold is the highest of any state. Combined with the $25M revenue floor,
  TIPA's applicability is the narrowest among general comprehensive state laws.
exceptions:
  - "Standard exemptions (GLBA, HIPAA, non-profits, higher education)"
  - "Employment data and B2B contacts"
contract_signals:
  - "Tennessee Information Protection Act"
  - "TIPA"
  - "Tennessee residents"
  - "Tenn. Code § 47-18-32"
cross_refs:
  - "ucpa.applicability.threshold"
  - "vcdpa.applicability.threshold"
source_url: "https://www.sos.tn.gov/products/division-publications/public-chapter-0902"
git_hash: ""
""",

"""id: "tipa.affirmative_defense.nist_pf"
statute: "TIPA"
section: "Tenn. Code § 47-18-3213"
title: "Affirmative Defense — NIST Privacy Framework Alignment"
effective_date: "2025-07-01"
supersedes: []
amended_by: []
requirement_type: soft
obligation_bearer: controller
trigger: "Controller maintains a written privacy program reasonably conforming to the NIST Privacy Framework or comparable standard"
requirement: >
  TIPA provides an affirmative defense to enforcement for entities maintaining a written privacy
  program 'reasonably conforming' to the NIST Privacy Framework or other documented policies
  designed to protect consumer privacy at an appropriate scale and scope.
  This is the most explicit safe-harbor language in any US state privacy statute.
  Documenting NIST PF alignment before a potential enforcement action is high-leverage —
  it earns the affirmative defense at no marginal cost for a multi-state program.
  Factors considered: size and complexity of controller; nature and scope of activities;
  sensitivity of PD processed; cost and availability of tools; compliance with comparable laws.
exceptions: []
contract_signals:
  - "NIST Privacy Framework"
  - "NIST PF"
  - "written privacy program"
  - "affirmative defense"
  - "privacy framework"
  - "documented privacy policies"
cross_refs:
  - "ocpa.enforcement.parameters"
  - "vcdpa.enforcement.parameters"
source_url: "https://www.sos.tn.gov/products/division-publications/public-chapter-0902"
git_hash: ""
""",

"""id: "tipa.enforcement.parameters"
statute: "TIPA"
section: "Tenn. Code §§ 47-18-3210 to -3212"
title: "Enforcement — AG; 60-Day Cure; Treble Damages for Willful Violations"
effective_date: "2025-07-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates TIPA"
requirement: >
  Enforced by the Tennessee AG. No private right of action. Civil penalty up to $7,500 per violation.
  Willful violations may result in treble damages (3x penalty), elevating enforcement exposure
  significantly above the base penalty. 60-day cure period in effect.
exceptions: []
contract_signals:
  - "Tennessee Attorney General"
  - "civil penalty"
  - "TIPA violation"
  - "treble damages"
  - "willful violation"
cross_refs:
  - "fdbr.enforcement.parameters"
  - "vcdpa.enforcement.parameters"
source_url: "https://www.sos.tn.gov/products/division-publications/public-chapter-0902"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# DPDPA (Delaware)
# ─────────────────────────────────────────
"dpdpa": [

"""id: "dpdpa.applicability.threshold"
statute: "DPDPA"
section: "Del. Code tit. 6, § 12D-103"
title: "Applicability Threshold — Tied for Lowest (10k/35k)"
effective_date: "2025-01-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Delaware or producing products/services targeted to Delaware residents"
requirement: >
  Applies to persons conducting business in Delaware or targeting DE residents AND during the
  preceding calendar year:
  (a) controlled/processed PD of at least 35,000 DE consumers (excluding solely-payment-transaction data); OR
  (b) controlled/processed PD of at least 10,000 DE consumers AND derived over 20% of gross revenue from sale of PD.
  Tied with NH for lowest thresholds (10k/35k). Reaches significantly more businesses than
  100k-threshold states. Most non-profits NOT exempt — only narrowly-defined categories are.
exceptions:
  - "Financial institutions (GLBA, data-level)"
  - "HIPAA PHI (data-level)"
  - "FCRA-covered data (data-level)"
  - "Non-profits dedicated to insurance fraud / national securities associations (narrow)"
  - "Employment data and B2B contacts"
contract_signals:
  - "Delaware Personal Data Privacy Act"
  - "DPDPA"
  - "Delaware residents"
  - "Del. Code tit. 6, § 12D"
cross_refs:
  - "nhdpa.applicability.threshold"
  - "ridtppa.applicability.threshold"
  - "modpa.applicability.threshold"
source_url: "https://legis.delaware.gov/BillDetail?LegislationId=140388"
git_hash: ""
""",

"""id: "dpdpa.rights.third_party_categories"
statute: "DPDPA"
section: "Del. Code tit. 6, § 12D-105"
title: "Right to Categories of Third Parties"
effective_date: "2025-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Consumer requests disclosure of third parties to whom controller has disclosed personal data"
requirement: >
  Delaware consumers have the right to obtain a list of the categories of third parties to whom
  the controller has disclosed PD. (Categories, not specific named entities — contrast with
  Oregon and Minnesota which require specific named third parties.)
exceptions: []
contract_signals:
  - "categories of third parties"
  - "third-party disclosure"
  - "data recipients"
  - "third-party categories"
cross_refs:
  - "ocpa.rights.specific_third_parties"
  - "mcdpa_mn.rights.specific_third_parties"
source_url: "https://legis.delaware.gov/BillDetail?LegislationId=140388"
git_hash: ""
""",

"""id: "dpdpa.uoom.gpc"
statute: "DPDPA"
section: "Del. Code tit. 6, § 12D-106"
title: "Universal Opt-Out Mechanism Required"
effective_date: "2026-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller sells personal data or processes for targeted advertising"
requirement: >
  Effective January 1, 2026, controllers must recognize and honor universal opt-out mechanism
  signals including GPC.
exceptions: []
contract_signals:
  - "Global Privacy Control"
  - "GPC"
  - "universal opt-out"
  - "UOOM"
cross_refs:
  - "ctdpa.uoom.gpc"
  - "modpa.uoom.gpc"
  - "nhdpa.uoom.gpc"
source_url: "https://legis.delaware.gov/BillDetail?LegislationId=140388"
git_hash: ""
""",

"""id: "dpdpa.enforcement.parameters"
statute: "DPDPA"
section: "Del. Code tit. 6, § 12D-111"
title: "Enforcement — DOJ Consumer Protection; 60-Day Cure"
effective_date: "2025-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates DPDPA"
requirement: >
  Enforced by the Delaware Department of Justice Consumer Protection Unit.
  No private right of action. Civil penalties under the Delaware Consumer Fraud Act framework.
  60-day cure period at enactment — verify current guidance for any sunset.
exceptions: []
contract_signals:
  - "Delaware DOJ"
  - "Delaware Department of Justice"
  - "civil penalty"
  - "DPDPA violation"
  - "Consumer Fraud Act"
cross_refs:
  - "nhdpa.enforcement.parameters"
  - "vcdpa.enforcement.parameters"
source_url: "https://legis.delaware.gov/BillDetail?LegislationId=140388"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# NJDPA (New Jersey)
# ─────────────────────────────────────────
"njdpa": [

"""id: "njdpa.applicability.threshold"
statute: "NJDPA"
section: "N.J. Stat. § 56:8-166.5"
title: "Applicability Threshold — Activity-Based Second Tier (Any Sale Revenue)"
effective_date: "2025-01-15"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in New Jersey or producing products/services targeted to New Jersey residents"
requirement: >
  Applies to controllers conducting business in NJ or targeting NJ residents AND during a calendar year:
  (a) control/process PD of at least 100,000 NJ consumers (excluding solely-payment-transaction data); OR
  (b) control/process PD of at least 25,000 NJ consumers AND derive revenue or receive a discount
  from the sale of PD (ANY revenue — no percentage threshold).
  The activity-based second tier (any sale revenue with 25k consumers) is broader than states using
  a 25%-or-50% revenue percentage threshold.
  18-month grace period before AG enforcement actions except for willful violations, ending July 2026.
exceptions:
  - "Financial institutions (entity-level GLBA)"
  - "HIPAA covered entities/BAs (entity-level)"
  - "FCRA-covered entities"
  - "Insurance entities"
  - "Secured creditors"
  - "Government entities"
  - "Employment data and B2B contacts"
contract_signals:
  - "New Jersey Data Privacy Act"
  - "NJDPA"
  - "New Jersey residents"
  - "N.J. Stat. § 56:8-166"
cross_refs:
  - "ctdpa.applicability.threshold"
  - "dpdpa.applicability.threshold"
source_url: "https://www.njleg.state.nj.us/Bills/2022/PL23/266_.PDF"
git_hash: ""
""",

"""id: "njdpa.sensitive_data.expanded_categories"
statute: "NJDPA"
section: "N.J. Stat. § 56:8-166.4"
title: "Sensitive Data — Expanded Categories Including Financial Information and Trans/NB Status"
effective_date: "2025-01-15"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller intends to process sensitive data including NJ-specific categories"
requirement: >
  Opt-in consent required before processing sensitive data.
  NJ-specific additions to standard sensitive categories:
  (1) financial information: account number, credit/debit card number combined with security/access code
  or password; (2) status as transgender or non-binary.
  Controllers whose sensitive-data consent programs are built for other states must audit their
  definitions to ensure NJ's expanded categories are covered.
exceptions: []
contract_signals:
  - "sensitive data"
  - "financial account information"
  - "transgender"
  - "non-binary"
  - "opt-in consent"
  - "sensitive personal data"
cross_refs:
  - "ocpa.sensitive_data.expanded_categories"
  - "vcdpa.sensitive_data.consent"
source_url: "https://www.njleg.state.nj.us/Bills/2022/PL23/266_.PDF"
git_hash: ""
""",

"""id: "njdpa.minors.teen_protections"
statute: "NJDPA"
section: "N.J. Stat. § 56:8-166.9"
title: "Minor Protections — Opt-In for Ages 13 to 16"
effective_date: "2025-01-15"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller knows or has reason to believe consumer is at least 13 and less than 17 years old"
requirement: >
  For consumers known to be between 13 and under 17 years of age, opt-in consent is required
  before processing PD for targeted advertising, sale, or profiling with legal/significant effects.
  NJ's 'under 17' standard is one year broader than Connecticut's 'under 16' standard.
  Only Maryland (under 18 flat ban) is stricter.
exceptions: []
contract_signals:
  - "minor"
  - "known minor"
  - "teen"
  - "13 to 17"
  - "children's privacy"
  - "age verification"
  - "COPPA"
cross_refs:
  - "ctdpa.minors.teen_protections"
  - "modpa.minors.flat_ban"
  - "ccpa.sensitive_data.categories"
source_url: "https://www.njleg.state.nj.us/Bills/2022/PL23/266_.PDF"
git_hash: ""
""",

"""id: "njdpa.uoom.gpc"
statute: "NJDPA"
section: "N.J. Stat. § 56:8-166.8"
title: "Universal Opt-Out Mechanism Required"
effective_date: "2025-07-15"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller sells personal data or processes for targeted advertising"
requirement: >
  Effective July 15, 2025 (six months after effective date), controllers must recognize and honor
  universal opt-out preference signals including GPC.
exceptions: []
contract_signals:
  - "Global Privacy Control"
  - "GPC"
  - "universal opt-out"
  - "UOOM"
  - "opt-out preference signal"
cross_refs:
  - "ctdpa.uoom.gpc"
  - "modpa.uoom.gpc"
  - "cpa.rights.opt_out_sale"
source_url: "https://www.njleg.state.nj.us/Bills/2022/PL23/266_.PDF"
git_hash: ""
""",

"""id: "njdpa.enforcement.parameters"
statute: "NJDPA"
section: "N.J. Stat. § 56:8-166.15"
title: "Enforcement — AG; Higher Per-Violation Penalties Under NJ CFA"
effective_date: "2025-01-15"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates NJDPA"
requirement: >
  Enforced by the New Jersey AG (Division of Consumer Affairs). No private right of action.
  Civil penalties: up to $10,000 for first violation, $20,000 for subsequent violations under
  the New Jersey Consumer Fraud Act. Penalties are higher per-violation than most states.
  18-month cure period for non-willful violations through approximately July 2026; thereafter AG discretion.
exceptions: []
contract_signals:
  - "New Jersey Attorney General"
  - "civil penalty"
  - "NJDPA violation"
  - "Consumer Fraud Act"
  - "NJ CFA"
cross_refs:
  - "fdbr.enforcement.parameters"
  - "vcdpa.enforcement.parameters"
source_url: "https://www.njleg.state.nj.us/Bills/2022/PL23/266_.PDF"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# NHDPA (New Hampshire)
# ─────────────────────────────────────────
"nhdpa": [

"""id: "nhdpa.applicability.threshold"
statute: "NHDPA"
section: "N.H. Rev. Stat. § 507-H:2"
title: "Applicability Threshold — Tied for Lowest (10k/35k)"
effective_date: "2025-01-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in New Hampshire or producing products/services targeted to New Hampshire residents"
requirement: >
  Applies to persons conducting business in NH or targeting NH residents AND during a calendar year:
  (a) control/process PD of at least 35,000 NH consumers (excluding solely-payment-transaction data); OR
  (b) control/process PD of at least 10,000 NH consumers AND derive over 25% of gross revenue from sale of PD.
  Tied with Delaware for lowest thresholds (10k secondary / 35k primary).
exceptions:
  - "Standard exemptions"
contract_signals:
  - "New Hampshire Data Privacy Act"
  - "NHDPA"
  - "New Hampshire residents"
  - "N.H. Rev. Stat. ch. 507-H"
cross_refs:
  - "dpdpa.applicability.threshold"
  - "ridtppa.applicability.threshold"
source_url: "https://www.gencourt.state.nh.us/legislation/2024/HB0314.html"
git_hash: ""
""",

"""id: "nhdpa.uoom.gpc"
statute: "NHDPA"
section: "N.H. Rev. Stat. § 507-H"
title: "Universal Opt-Out Mechanism Required at Effective Date"
effective_date: "2025-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller sells personal data or processes for targeted advertising"
requirement: >
  Controllers must recognize and honor universal opt-out mechanism signals including GPC.
  Required at the law's effective date (January 1, 2025) — among the earliest UOOM mandates.
  60-day cure period at enactment.
exceptions: []
contract_signals:
  - "Global Privacy Control"
  - "GPC"
  - "universal opt-out"
  - "UOOM"
cross_refs:
  - "dpdpa.uoom.gpc"
  - "ctdpa.uoom.gpc"
  - "cpa.rights.opt_out_sale"
source_url: "https://www.gencourt.state.nh.us/legislation/2024/HB0314.html"
git_hash: ""
""",

"""id: "nhdpa.enforcement.parameters"
statute: "NHDPA"
section: "N.H. Rev. Stat. § 507-H"
title: "Enforcement — AG; 60-Day Cure"
effective_date: "2025-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates NHDPA"
requirement: >
  Enforced by the New Hampshire AG under NH consumer protection framework.
  No private right of action. Civil penalties under NH consumer protection framework.
  60-day cure period at enactment.
exceptions: []
contract_signals:
  - "New Hampshire Attorney General"
  - "civil penalty"
  - "NHDPA violation"
cross_refs:
  - "dpdpa.enforcement.parameters"
  - "vcdpa.enforcement.parameters"
source_url: "https://www.gencourt.state.nh.us/legislation/2024/HB0314.html"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# NDPA (Nebraska)
# ─────────────────────────────────────────
"ndpa": [

"""id: "ndpa.applicability.threshold"
statute: "NDPA"
section: "Neb. Rev. Stat. § 87-1103"
title: "Applicability — SBA Size-Based, Modeled on Texas"
effective_date: "2025-01-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Nebraska or producing products/services consumed by Nebraska residents"
requirement: >
  Modeled on TDPSA (Texas). Applies to persons conducting business in NE or targeting NE residents
  AND processing or engaging in the sale of PD AND NOT a small business as defined by the SBA
  (size standards vary by NAICS code).
  EXCEPTION: if entity sells sensitive PD without consent, small-business exemption is forfeit.
  No numerical consumer threshold.
  A multi-state program built to satisfy Texas largely satisfies Nebraska.
exceptions:
  - "Standard exemptions"
contract_signals:
  - "Nebraska Data Privacy Act"
  - "NDPA"
  - "Nebraska residents"
  - "Neb. Rev. Stat. § 87-11"
cross_refs:
  - "tdpsa.applicability.threshold"
  - "vcdpa.applicability.threshold"
source_url: "https://nebraskalegislature.gov/bills/view_bill.php?DocumentID=53455"
git_hash: ""
""",

"""id: "ndpa.enforcement.parameters"
statute: "NDPA"
section: "Neb. Rev. Stat. § 87-1114"
title: "Enforcement — AG; 30-Day Cure"
effective_date: "2025-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates NDPA"
requirement: >
  Enforced by the Nebraska AG. No private right of action.
  Civil penalty up to $7,500 per violation. 30-day cure period.
exceptions: []
contract_signals:
  - "Nebraska Attorney General"
  - "civil penalty"
  - "NDPA violation"
cross_refs:
  - "tdpsa.enforcement.parameters"
  - "vcdpa.enforcement.parameters"
source_url: "https://nebraskalegislature.gov/bills/view_bill.php?DocumentID=53455"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# KCDPA (Kentucky)
# ─────────────────────────────────────────
"kcdpa": [

"""id: "kcdpa.applicability.threshold"
statute: "KCDPA"
section: "Ky. Rev. Stat. § 367.3611"
title: "Applicability Threshold"
effective_date: "2026-01-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Kentucky or producing products/services targeted to Kentucky residents"
requirement: >
  Applies to persons conducting business in Kentucky or targeting KY residents AND during a calendar year:
  (a) control/process PD of at least 100,000 KY consumers; OR
  (b) control/process PD of at least 25,000 KY consumers AND derive over 50% of gross revenue from sale of PD.
  Modeled closely on VCDPA.
exceptions:
  - "Standard exemptions"
contract_signals:
  - "Kentucky Consumer Data Protection Act"
  - "KCDPA"
  - "Kentucky residents"
  - "Ky. Rev. Stat. § 367.36"
cross_refs:
  - "vcdpa.applicability.threshold"
  - "incdpa.applicability.threshold"
source_url: "https://apps.legislature.ky.gov/record/24rs/hb15.html"
git_hash: ""
""",

"""id: "kcdpa.rights.no_correction"
statute: "KCDPA"
section: "Ky. Rev. Stat. § 367.3614"
title: "Consumer Rights — No Correction Right"
effective_date: "2026-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Consumer submits rights request under KCDPA"
requirement: >
  Kentucky provides access, deletion, portability, opt-out of sale/targeted advertising/profiling,
  and right to appeal within 45 days.
  Notably, there is NO correction right — one of only three states (with UT and IA) lacking this right.
  No UOOM recognition required — modeled on VA.
exceptions:
  - "Requests that are manifestly unfounded or excessive"
contract_signals:
  - "access request"
  - "deletion request"
  - "opt-out of sale"
  - "Kentucky privacy rights"
cross_refs:
  - "vcdpa.rights.opt_out_sale"
  - "ucpa.rights.narrow_regime"
  - "icdpa.rights.narrow_regime"
source_url: "https://apps.legislature.ky.gov/record/24rs/hb15.html"
git_hash: ""
""",

"""id: "kcdpa.enforcement.parameters"
statute: "KCDPA"
section: "Ky. Rev. Stat. § 367.3623"
title: "Enforcement — AG; 30-Day Cure"
effective_date: "2026-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates KCDPA"
requirement: >
  Enforced by the Kentucky AG. No private right of action.
  Civil penalty up to $7,500 per violation. 30-day cure period.
exceptions: []
contract_signals:
  - "Kentucky Attorney General"
  - "civil penalty"
  - "KCDPA violation"
cross_refs:
  - "vcdpa.enforcement.parameters"
  - "incdpa.enforcement.parameters"
source_url: "https://apps.legislature.ky.gov/record/24rs/hb15.html"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# MODPA (Maryland)
# ─────────────────────────────────────────
"modpa": [

"""id: "modpa.applicability.threshold"
statute: "MODPA"
section: "Md. Code Com. Law § 14-4602"
title: "Applicability Threshold — Low Thresholds (10k/35k)"
effective_date: "2025-10-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Maryland or providing products/services targeted to Maryland residents"
requirement: >
  Applies to persons conducting business in Maryland or targeting MD residents AND during the
  preceding calendar year:
  (a) controlled/processed PD of at least 35,000 MD consumers (excluding solely-payment-transaction data); OR
  (b) controlled/processed PD of at least 10,000 MD consumers AND derived at least 20% of gross revenue from sale of PD.
  MODPA is the strictest comprehensive state privacy law in the US — a multi-state program
  built to MODPA + CA exceeds all other state requirements.
exceptions:
  - "Standard exemptions"
contract_signals:
  - "Maryland Online Data Privacy Act"
  - "MODPA"
  - "Maryland residents"
  - "Md. Code Com. Law § 14-46"
cross_refs:
  - "dpdpa.applicability.threshold"
  - "nhdpa.applicability.threshold"
  - "ridtppa.applicability.threshold"
source_url: "https://mgaleg.maryland.gov/2024RS/Chapters_noln/CH_182_sb0541e.pdf"
git_hash: ""
""",

"""id: "modpa.data_minimization.strict_standard"
statute: "MODPA"
section: "Md. Code Com. Law § 14-4607(a)(1)"
title: "Strict Data Minimization — Reasonably Necessary AND Proportionate"
effective_date: "2025-10-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller collects or processes personal data of Maryland consumers"
requirement: >
  Collection of PD must be limited to what is 'reasonably necessary AND proportionate' to provide
  or maintain a specific product or service REQUESTED BY THE CONSUMER.
  This is materially stricter than other states' 'necessary' or 'necessary and proportionate'
  formulations. A controller may not collect PD for generalized analytics, product improvement,
  third-party marketing, or other purposes the consumer has not specifically requested, without
  separate justification or specific consent.
  Operational impact: privacy-by-default settings; reduced default tracking; tightened purpose
  statements; per-purpose consent flows.
exceptions:
  - "Processing necessary to comply with a legal obligation"
  - "Processing necessary to protect vital interests of the consumer or another natural person"
contract_signals:
  - "data minimization"
  - "reasonably necessary"
  - "proportionate"
  - "purpose limitation"
  - "collect only what is necessary"
  - "minimal data collection"
cross_refs:
  - "cpa.controller_duties.data_protection_assessment"
  - "vcdpa.controller_duties.privacy_notice"
  - "ccpa.controller_duties.privacy_notice"
source_url: "https://mgaleg.maryland.gov/2024RS/Chapters_noln/CH_182_sb0541e.pdf"
git_hash: ""
""",

"""id: "modpa.sensitive_data.ban_on_sale"
statute: "MODPA"
section: "Md. Code Com. Law § 14-4607(a)(2)-(4)"
title: "Sensitive Data — Flat Ban on Sale; Consent Required to Process"
effective_date: "2025-10-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller possesses or intends to process sensitive personal data of Maryland consumers"
requirement: >
  Two distinct obligations:
  (1) FLAT BAN ON SALE of sensitive data. Consent does NOT cure the prohibition.
  Ad-tech architectures relying on consent for sensitive data sale (e.g., health-data adtech,
  financial-data sharing) cannot operate as designed for MD-resident consumers.
  (2) OPT-IN CONSENT required to process sensitive data (cannot rely on legitimate interest or
  other legal bases).
  Consumer health data receives additional heightened treatment.
  Standard sensitive categories plus MD-specific scrutiny on consumer health data.
exceptions:
  - "Processing necessary to provide a requested product or service where sensitive data is integral"
  - "Processing necessary to comply with applicable law"
contract_signals:
  - "sensitive personal data"
  - "sensitive data"
  - "health data"
  - "ban on sale of sensitive"
  - "consent to process sensitive"
  - "consumer health data"
cross_refs:
  - "ccpa.sensitive_data.categories"
  - "vcdpa.sensitive_data.consent"
  - "cpa.sensitive_data.consent"
source_url: "https://mgaleg.maryland.gov/2024RS/Chapters_noln/CH_182_sb0541e.pdf"
git_hash: ""
""",

"""id: "modpa.minors.flat_ban"
statute: "MODPA"
section: "Md. Code Com. Law § 14-4607(a)(5)"
title: "Minor Protections — Flat Ban on Sale and Targeted Advertising for Known Minors Under 18"
effective_date: "2025-10-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller knows or has reason to believe consumer is under 18 years of age"
requirement: >
  FLAT BAN (not opt-in/opt-out — a complete prohibition regardless of consent) on:
  (1) Sale of PD of consumers known to be under 18;
  (2) Processing of PD of consumers known to be under 18 for targeted advertising.
  Heightened data minimization for known minor data.
  These are the strictest minor protections in any US state privacy law.
  A controller serving a known minor audience may not engage in sale or targeted advertising
  involving those consumers under any circumstances.
  Requires age-detection or known-minor suppression infrastructure.
exceptions: []
contract_signals:
  - "minor"
  - "known minor"
  - "under 18"
  - "children's data"
  - "teen"
  - "age verification"
  - "age-appropriate"
  - "minor targeted advertising ban"
cross_refs:
  - "ctdpa.minors.teen_protections"
  - "njdpa.minors.teen_protections"
  - "fdbr.enforcement.parameters"
source_url: "https://mgaleg.maryland.gov/2024RS/Chapters_noln/CH_182_sb0541e.pdf"
git_hash: ""
""",

"""id: "modpa.uoom.gpc"
statute: "MODPA"
section: "Md. Code Com. Law § 14-4606"
title: "Universal Opt-Out Mechanism Required at Effective Date"
effective_date: "2025-10-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller sells personal data or processes for targeted advertising"
requirement: >
  Controllers must recognize and honor universal opt-out mechanism signals including GPC.
  Required at the effective date (October 1, 2025).
exceptions: []
contract_signals:
  - "Global Privacy Control"
  - "GPC"
  - "universal opt-out"
  - "UOOM"
cross_refs:
  - "cpa.rights.opt_out_sale"
  - "ctdpa.uoom.gpc"
  - "njdpa.uoom.gpc"
source_url: "https://mgaleg.maryland.gov/2024RS/Chapters_noln/CH_182_sb0541e.pdf"
git_hash: ""
""",

"""id: "modpa.enforcement.parameters"
statute: "MODPA"
section: "Md. Code Com. Law § 14-4611"
title: "Enforcement — AG; 60-Day Cure"
effective_date: "2025-10-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates MODPA"
requirement: >
  Enforced by the Maryland AG (Consumer Protection Division). No private right of action.
  Civil penalties under Maryland Consumer Protection Act / CFA framework.
  60-day cure period at enactment.
exceptions: []
contract_signals:
  - "Maryland Attorney General"
  - "civil penalty"
  - "MODPA violation"
  - "Maryland Consumer Protection"
cross_refs:
  - "dpdpa.enforcement.parameters"
  - "vcdpa.enforcement.parameters"
source_url: "https://mgaleg.maryland.gov/2024RS/Chapters_noln/CH_182_sb0541e.pdf"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# MCDPA-MN (Minnesota)
# ─────────────────────────────────────────
"mcdpa_mn": [

"""id: "mcdpa_mn.applicability.threshold"
statute: "MCDPA-MN"
section: "Minn. Stat. § 325O.04"
title: "Applicability Threshold"
effective_date: "2025-07-31"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Minnesota or producing products/services targeted to Minnesota residents"
requirement: >
  Applies to persons conducting business in Minnesota or targeting MN residents AND during a calendar year:
  (a) control/process PD of at least 100,000 MN consumers (excluding solely-payment-transaction data); OR
  (b) control/process PD of at least 25,000 MN consumers AND derive over 25% of gross revenue from sale of PD.
  Note: 25% revenue threshold (lower than the 50% used by VA/UT/IA/TN/KY/IN).
  Delayed effective date for postsecondary institutions through 2029.
exceptions:
  - "Standard exemptions"
contract_signals:
  - "Minnesota Consumer Data Privacy Act"
  - "MCDPA"
  - "Minnesota residents"
  - "Minn. Stat. ch. 325O"
cross_refs:
  - "cpa.applicability.threshold"
  - "ctdpa.applicability.threshold"
source_url: "https://www.revisor.mn.gov/laws/2024/0/Session+Law/Chapter/123/"
git_hash: ""
""",

"""id: "mcdpa_mn.rights.specific_third_parties"
statute: "MCDPA-MN"
section: "Minn. Stat. § 325O.05(1)(7)"
title: "Right to List of SPECIFIC Third Parties"
effective_date: "2025-07-31"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Consumer requests disclosure of third parties to whom controller has disclosed personal data"
requirement: >
  Minnesota consumers may request the specific third parties (not just categories) to whom the
  controller has disclosed PD — same as Oregon's requirement. Controllers must build per-consumer
  disclosure logs to satisfy this right. This is among the highest operational lifts in any state.
  Appeal deadline: 45 days.
exceptions:
  - "Disclosure would reveal a trade secret"
contract_signals:
  - "specific third parties"
  - "list of third parties"
  - "third-party disclosure log"
  - "recipients of personal data"
cross_refs:
  - "ocpa.rights.specific_third_parties"
  - "dpdpa.rights.third_party_categories"
  - "ridtppa.controller_duties.named_third_parties"
source_url: "https://www.revisor.mn.gov/laws/2024/0/Session+Law/Chapter/123/"
git_hash: ""
""",

"""id: "mcdpa_mn.rights.question_profiling"
statute: "MCDPA-MN"
section: "Minn. Stat. § 325O.05"
title: "Right to Question Profiling Decisions — Most Explicit in Any US State"
effective_date: "2025-07-31"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller uses profiling that produces a legal or similarly significant effect on a consumer"
requirement: >
  Minnesota provides the most explicit 'right to question' profiling of any US state law — GDPR
  Article 22-adjacent. When profiling produces a legal or significant effect, the consumer has the
  right to: (1) question the result of the profiling decision; (2) be informed of the reason the
  profiling resulted in the decision; (3) be informed of actions the consumer may take to secure
  a different decision in the future; (4) have the controller correct any inaccuracy and reevaluate
  the decision based on corrected data.
  Controllers using ADM for credit, employment, housing, insurance, healthcare, or access to
  services must be prepared to provide reasoned explanations and support correction-driven re-evaluation.
exceptions: []
contract_signals:
  - "automated decision-making"
  - "profiling"
  - "right to explanation"
  - "right to question"
  - "algorithmically determined"
  - "significant decision"
  - "credit decision"
  - "employment decision"
cross_refs:
  - "ccpa.controller_duties.data_protection_assessment"
  - "cpa.controller_duties.data_protection_assessment"
source_url: "https://www.revisor.mn.gov/laws/2024/0/Session+Law/Chapter/123/"
git_hash: ""
""",

"""id: "mcdpa_mn.uoom.gpc"
statute: "MCDPA-MN"
section: "Minn. Stat. § 325O"
title: "Universal Opt-Out Mechanism Required"
effective_date: "2026-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller sells personal data or processes for targeted advertising"
requirement: >
  Controllers must recognize and honor universal opt-out mechanism signals including GPC,
  effective January 1, 2026.
exceptions: []
contract_signals:
  - "Global Privacy Control"
  - "GPC"
  - "universal opt-out"
  - "UOOM"
cross_refs:
  - "cpa.rights.opt_out_sale"
  - "modpa.uoom.gpc"
  - "dpdpa.uoom.gpc"
source_url: "https://www.revisor.mn.gov/laws/2024/0/Session+Law/Chapter/123/"
git_hash: ""
""",

"""id: "mcdpa_mn.enforcement.parameters"
statute: "MCDPA-MN"
section: "Minn. Stat. § 325O"
title: "Enforcement — AG; 30-Day Cure for Entities with Documented Programs"
effective_date: "2025-07-31"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates MCDPA-MN"
requirement: >
  Enforced by the Minnesota AG. No private right of action. Civil penalty up to $7,500 per violation.
  30-day cure period for entities with documented written privacy programs (incentivizes documentation).
  The written privacy program must include reasonable administrative, technical, and physical safeguards.
exceptions: []
contract_signals:
  - "Minnesota Attorney General"
  - "civil penalty"
  - "MCDPA violation"
  - "written privacy program"
  - "documented privacy program"
cross_refs:
  - "tipa.affirmative_defense.nist_pf"
  - "vcdpa.enforcement.parameters"
source_url: "https://www.revisor.mn.gov/laws/2024/0/Session+Law/Chapter/123/"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# RIDTPPA (Rhode Island)
# ─────────────────────────────────────────
"ridtppa": [

"""id: "ridtppa.applicability.threshold"
statute: "RIDTPPA"
section: "R.I. Gen. Laws § 6-48.1-2"
title: "Applicability Threshold — Low Thresholds (10k/35k)"
effective_date: "2026-01-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "Person conducting business in Rhode Island or producing products/services targeted to Rhode Island residents"
requirement: >
  Applies to persons conducting business in Rhode Island or targeting RI residents AND during a calendar year:
  (a) control/process PD of at least 35,000 RI consumers (excluding solely-payment-transaction data); OR
  (b) control/process PD of at least 10,000 RI consumers AND derive over 20% of gross revenue from sale of PD.
  Lowest-tier thresholds match DE, MD, NH.
exceptions:
  - "Standard exemptions"
contract_signals:
  - "Rhode Island Data Transparency and Privacy Protection Act"
  - "RIDTPPA"
  - "Rhode Island residents"
  - "R.I. Gen. Laws § 6-48.1"
cross_refs:
  - "dpdpa.applicability.threshold"
  - "nhdpa.applicability.threshold"
  - "modpa.applicability.threshold"
source_url: "https://webserver.rilegislature.gov/BillText/BillText24/HouseText24/H7787A.pdf"
git_hash: ""
""",

"""id: "ridtppa.controller_duties.named_third_parties"
statute: "RIDTPPA"
section: "R.I. Gen. Laws § 6-48.1-5"
title: "Privacy Notice Must Identify Third Parties by Name"
effective_date: "2026-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller provides privacy notice to Rhode Island consumers"
requirement: >
  The privacy notice must identify, by name, all third parties with which the controller may share
  PD. This is more granular than categorical disclosure (which most states accept) and similar to
  Oregon's and Minnesota's per-consumer specific third party rights.
  Controllers must maintain an up-to-date named list of third-party recipients tied to the
  privacy notice — a significant transparency and operational obligation.
exceptions: []
contract_signals:
  - "named third parties"
  - "specific third parties"
  - "list of third parties"
  - "privacy notice third-party disclosure"
cross_refs:
  - "ocpa.rights.specific_third_parties"
  - "mcdpa_mn.rights.specific_third_parties"
  - "dpdpa.rights.third_party_categories"
source_url: "https://webserver.rilegislature.gov/BillText/BillText24/HouseText24/H7787A.pdf"
git_hash: ""
""",

"""id: "ridtppa.uoom.gpc"
statute: "RIDTPPA"
section: "R.I. Gen. Laws § 6-48.1"
title: "Universal Opt-Out Mechanism Required at Effective Date"
effective_date: "2026-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller sells personal data or processes for targeted advertising"
requirement: >
  Controllers must recognize and honor universal opt-out mechanism signals including GPC.
  Required at the law's effective date (January 1, 2026).
exceptions: []
contract_signals:
  - "Global Privacy Control"
  - "GPC"
  - "universal opt-out"
  - "UOOM"
cross_refs:
  - "dpdpa.uoom.gpc"
  - "mcdpa_mn.uoom.gpc"
  - "modpa.uoom.gpc"
source_url: "https://webserver.rilegislature.gov/BillText/BillText24/HouseText24/H7787A.pdf"
git_hash: ""
""",

"""id: "ridtppa.enforcement.parameters"
statute: "RIDTPPA"
section: "R.I. Gen. Laws § 6-48.1-9"
title: "Enforcement — AG; Cure Period at Enactment"
effective_date: "2026-01-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates RIDTPPA"
requirement: >
  Enforced by the Rhode Island AG under RI consumer protection framework.
  No private right of action. Civil penalties under RI consumer protection framework.
  Cure period at enactment — verify current status.
exceptions: []
contract_signals:
  - "Rhode Island Attorney General"
  - "civil penalty"
  - "RIDTPPA violation"
cross_refs:
  - "dpdpa.enforcement.parameters"
  - "nhdpa.enforcement.parameters"
source_url: "https://webserver.rilegislature.gov/BillText/BillText24/HouseText24/H7787A.pdf"
git_hash: ""
""",

],

# ─────────────────────────────────────────
# FDBR (Florida)
# ─────────────────────────────────────────
"fdbr": [

"""id: "fdbr.applicability.threshold"
statute: "FDBR"
section: "Fla. Stat. § 501.702"
title: "Applicability — Narrowest of Any State; $1B Revenue + Specific Activities"
effective_date: "2024-07-01"
supersedes: []
amended_by: []
requirement_type: threshold
obligation_bearer: controller
trigger: "For-profit entity conducting business in Florida that meets all four prongs"
requirement: >
  FDBR applies ONLY to a controller that: (a) is a for-profit entity conducting business in Florida;
  AND (b) processes or engages in the sale of PD; AND (c) makes at least $1 billion in global
  gross annual revenue; AND (d) satisfies ONE of:
  (i) derives ≥50% of global gross annual revenue from sale of online advertisements;
  (ii) operates a consumer smart-speaker/voice-command service with integrated cloud assistant; OR
  (iii) operates an app store/digital distribution platform offering ≥250,000 software applications.
  Most businesses have NO obligations under FDBR regardless of their FL customer base.
  Run the threshold test specifically before assuming FL coverage.
exceptions:
  - "Essentially all businesses except large-scale ad platforms, smart-speaker platforms, and major app stores"
contract_signals:
  - "Florida Digital Bill of Rights"
  - "FDBR"
  - "Florida residents"
  - "Fla. Stat. § 501.7"
  - "app store"
  - "digital distribution platform"
  - "online advertising revenue"
cross_refs:
  - "ccpa.applicability.threshold"
  - "tdpsa.applicability.threshold"
source_url: "https://www.flsenate.gov/Session/Bill/2023/262/BillText/er/PDF"
git_hash: ""
""",

"""id: "fdbr.enforcement.parameters"
statute: "FDBR"
section: "Fla. Stat. § 501.714"
title: "Enforcement — Highest Per-Violation Penalties; Trebled for Minor Violations"
effective_date: "2024-07-01"
supersedes: []
amended_by: []
requirement_type: hard
obligation_bearer: controller
trigger: "Controller or processor violates FDBR"
requirement: >
  Enforced by the Florida Department of Legal Affairs (AG). No private right of action.
  Civil penalty up to $50,000 per violation — the highest base penalty of any US state.
  Trebled to $150,000 per violation for: violations involving processing of a known minor's data;
  deletion of data without consent; or use of dark patterns to obtain consent.
  45-day cure period.
exceptions: []
contract_signals:
  - "Florida Attorney General"
  - "Department of Legal Affairs"
  - "civil penalty"
  - "FDBR violation"
  - "dark patterns"
  - "minor data processing"
cross_refs:
  - "njdpa.enforcement.parameters"
  - "tipa.enforcement.parameters"
  - "ccpa.enforcement.parameters"
source_url: "https://www.flsenate.gov/Session/Bill/2023/262/BillText/er/PDF"
git_hash: ""
""",

],

}  # end NODES dict


def write_nodes():
    total = 0
    for statute_dir, nodes in NODES.items():
        out_dir = OUTPUT_DIR / statute_dir
        out_dir.mkdir(parents=True, exist_ok=True)
        for node_yaml in nodes:
            node_yaml = node_yaml.strip()
            if not node_yaml:
                continue
            # Extract id for filename
            import re
            id_match = re.search(r'^id:\s*["\']?([^\s"\']+)["\']?', node_yaml, re.MULTILINE)
            if id_match:
                node_id = id_match.group(1)
                filename = node_id.replace(".", "_") + ".yaml"
            else:
                filename = f"node_{total:03d}.yaml"
            filepath = out_dir / filename
            with open(filepath, "w") as f:
                f.write(node_yaml + "\n")
            total += 1
    print(f"Written {total} nodes across {len(NODES)} statutes.")


if __name__ == "__main__":
    write_nodes()
