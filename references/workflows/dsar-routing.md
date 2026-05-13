# DSAR Routing Guide
## Decision Tree and Workflow for Data Subject Access Requests

**Use alongside**: `pq_dsar_router`, `pq_route_dsar_workflow`

---

> **Limitations**: This guide is based on the PrivacyQuant statutory knowledge graph as of the node version dates. Laws change; statutory graph nodes may not reflect the most recent amendments or regulatory guidance. This output is a draft for review by qualified counsel admitted in the relevant jurisdiction — it is not legal advice and does not constitute the practice of law.

---

## 1. Intake Checklist

Collect all of the following when a consumer submits a request. Do not begin the response clock until identity verification is complete (see Section 5), but do record the submission date for deadline purposes.

| Field | Required | Notes |
|-------|----------|-------|
| Consumer full name | Yes | As provided; do not require legal documentation at intake |
| State of residence | Yes | Self-reported; may be verified against account records if available |
| Email address | Yes | Primary contact for response |
| Mailing address | Optional | Required if consumer requests physical delivery |
| Right invoked | Yes | Access / Deletion / Correction / Portability / Opt-Out of Sale / Opt-Out of Targeted Advertising / Profiling Opt-Out / Appeal |
| Date request received | Yes | Starts the response clock |
| Channel of submission | Yes | Web form / email / phone / postal mail / in-person |
| Account identifier (if any) | Recommended | Accelerates identity verification; do not require if consumer lacks account |
| Agent authorization (if applicable) | Conditional | Required if request submitted by authorized agent; need written permission or POA |
| Prior request ID (for appeals) | Conditional | Required for appeal submissions |

**Intake log entry**: Record each request in your DSAR log at the moment of receipt. See Section 10 for retention guidance.

---

## 2. State Determination Flowchart

Use this flowchart to identify the applicable statute and confirm whether the invoked right exists before routing to `pq_dsar_router`.

```
Consumer submits DSAR
        │
        ▼
Is the consumer's state of residence known?
        │
   NO ──┼──► Ask consumer to confirm state. If refused,
        │      apply the most protective law among states
        │      where you do business. Document the basis.
        │
   YES  ▼
Does your organization conduct business in that state
AND meet that state's applicability threshold?
        │
   NO ──┼──► Respond: "We are not subject to [state] privacy
        │      law based on our current operations. Your request
        │      has been noted. See Section 9."
        │
   YES  ▼
Identify applicable statute:
  ├─ CA resident → CCPA/CPRA (Cal. Civ. Code § 1798.100 et seq.)
  ├─ CO resident → CPA (Colo. Rev. Stat. § 6-1-1301 et seq.)
  ├─ CT resident → CTDPA (Conn. Gen. Stat. § 42-515 et seq.)
  ├─ DE resident → DPDPA (Del. Code Ann. tit. 6, § 12D-101 et seq.)
  ├─ FL resident → FDBR (Fla. Stat. § 501.701 et seq.)
  ├─ IA resident → ICDPA (Iowa Code § 715D.1 et seq.)
  ├─ IN resident → INCDPA (Ind. Code § 24-15-1 et seq.)
  ├─ KY resident → KCDPA (Ky. Rev. Stat. Ann. § 367.900 et seq.)
  ├─ MD resident → MODPA (Md. Code Ann., Com. Law § 14-4601 et seq.)
  ├─ MN resident → MCDPA (Minn. Stat. § 325O.01 et seq.)
  ├─ MT resident → MCDPA-MT (Mont. Code Ann. § 30-14-3201 et seq.)
  ├─ NE resident → NDPA (Neb. Rev. Stat. § 87-97 et seq.)
  ├─ NH resident → NHDPA (N.H. Rev. Stat. Ann. § 507-H:1 et seq.)
  ├─ NJ resident → NJDPA (N.J. Stat. Ann. § 56:8-166.1 et seq.)
  ├─ OR resident → OCPA (Or. Rev. Stat. § 646A.570 et seq.)
  ├─ TN resident → TIPA (Tenn. Code Ann. § 47-18-3201 et seq.)
  ├─ TX resident → TDPSA (Tex. Bus. & Com. Code § 541.001 et seq.)
  ├─ UT resident → UCPA (Utah Code Ann. § 13-61-101 et seq.)
  ├─ VA resident → VCDPA (Va. Code Ann. § 59.1-575 et seq.)
  └─ WA resident → MHMDA (Wash. Rev. Code § 19.373.010 et seq.)
               [Note: MHMDA is health-data specific — confirm applicability]
        │
        ▼
Confirm the invoked right exists under that statute (see Section 3)
        │
   NO  ──► See Section 9 (No-Right Scenarios)
        │
   YES  ▼
Run pq_dsar_router → pq_route_dsar_workflow
Proceed to response (Sections 4–8)
```

---

## 3. Rights Existence Quick Reference

Y = Right exists | N = Right does not exist | L = Limited form | * = See note

| Right | CA | CO | CT | DE | FL | IA | IN | KY | MD | MN | MT | NE | NH | NJ | OR | TN | TX | UT | VA | WA |
|-------|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
| Access / Know | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y* |
| Deletion | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y* |
| Correction | Y | Y | Y | Y | Y | Y | Y | **N** | Y | Y | Y | Y | Y | Y | Y | Y | Y | **N** | Y | Y* |
| Portability | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y* |
| Opt-Out of Sale | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y* |
| Opt-Out Targeted Ads | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y* |
| Profiling Opt-Out | Y | Y | Y | Y | N | Y | Y | N | Y | Y | Y | Y | Y | Y | Y | N | Y | N | Y | N |
| Appeal Right | Y | Y | Y | Y | Y | **N** | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | **N** | Y | N |
| Limit Sensitive Data Use | Y† | N | N | N | N | N | N | N | N | N | N | N | N | N | N | N | N | N | N | N |
| Sensitive Data Opt-In | N | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y* |

**Critical gaps — confirm before advising:**

- **Correction right absent**: Utah (UCPA), Iowa (ICDPA), Kentucky (KCDPA). Do not advise a correction right for residents of these states.
- **Appeal right absent**: Utah (UCPA), Iowa (ICDPA). Do not advise an internal appeal mechanism is required for these states.
- **No profiling opt-out**: FL, KY, TN, UT. Confirm applicability before advising.
- **CA sensitive data structure**: CCPA/CPRA uses a "right to limit" (opt-out of secondary use), not opt-in consent. This is a structural distinction from all other states listed above. Surface this explicitly in multi-state responses. †

*WA MHMDA note: Washington's My Health Data Act applies specifically to consumer health data. Confirm that the data at issue falls within its scope before applying MHMDA rights.

---

## 4. Deadline Calculation

### Initial Response Window

| State | Deadline | Statute |
|-------|----------|---------|
| Iowa (ICDPA) | **90 days** from receipt | Iowa Code § 715D |
| All other applicable states | **45 days** from receipt | Respective statutes |

**The response clock starts on the date the request is received**, not the date identity verification is completed. However, if identity cannot be verified within the standard window, document the verification attempt and apply the extension if needed.

### Extension Process

A single extension is available in most states.

1. **Maximum extension**: 45 additional days (total: 90 days from receipt for most states; Iowa does not require separate extension notice given the 90-day window).
2. **Notice requirement**: Notify the consumer **before the initial deadline expires**. Do not wait until after the deadline to claim an extension.
3. **Required content of extension notice**:
   - Acknowledgment that the request was received
   - Statement that additional time is needed
   - Reason for the extension (complexity or volume is typically sufficient)
   - New expected completion date
4. **Document the extension** in your DSAR log with the original deadline date and new deadline date.

### Deadline Calculation Worksheet

```
Date received:                    _______________
Initial deadline (+ 45 days):     _______________
  [Iowa only — + 90 days]:        _______________
Extension notice sent by:         _______________ (must be before initial deadline)
Extended deadline (+ 45 more):    _______________
Actual response date:             _______________
On time? (Y/N):                   _______________
```

---

## 5. Identity Verification Requirements

### General Standard

Controllers may verify identity using reasonable measures that are **proportionate to the sensitivity of the data** and the **nature of the right invoked**. The following principles apply across all applicable states:

- **Cannot require more than necessary.** Do not demand government-issued ID unless the data requested is of a type that meaningfully warrants it.
- **Knowledge-based verification** (matching against account data on file, such as email address, last four of account number, or billing zip) is appropriate for most access and portability requests.
- **Biometric verification** should not be required as a condition of honoring a DSAR unless the controller has an independent basis for using biometrics and the consumer has consented.
- **Unverified requests**: If identity cannot be reasonably verified, inform the consumer, explain what verification is needed, and document the attempt. Do not simply ignore the request.
- **Agent requests**: If submitted by an authorized agent, require (a) signed written authorization from the consumer, or (b) a valid power of attorney. Verify the consumer's identity independently.

### Verification Checklist

- [ ] Consumer provided identification information (email, account number, or equivalent)
- [ ] Information matches records on file
- [ ] If agent request: written authorization or POA on file
- [ ] If agent request: consumer identity separately verified
- [ ] Verification method documented in DSAR log
- [ ] No excessive verification demanded (e.g., notarized documents for routine access request)

---

## 6. Processor / Service Provider Notification

Upon receiving a **verified deletion request**, the controller must:

1. **Delete or direct deletion** of the consumer's personal data within its own systems.
2. **Notify all processors and service providers** that the deletion request has been received and verified.
3. **Require processors** to delete the consumer's personal data from their systems, subject to limited exceptions (legal hold, security incident investigation, transactional completion, etc.).
4. **Document** processor notification in the DSAR log, including the date notification was sent and the processors notified.

Processors are **not required to honor DSARs directly** submitted to them; they should redirect consumers to the controller. However, once notified by the controller, processors must comply.

**Exception carve-outs** applicable to deletion requests (vary by state; confirm with `pq_fetch_requirement`):

- Completing a transaction the consumer requested
- Detecting/protecting against security incidents
- Exercising free speech or another legal right
- Complying with a legal obligation
- Research in the public interest
- Internal uses consistent with the consumer's reasonable expectations

---

## 7. Response Letter Templates

### 7A. Acknowledgment Letter (send within 5–10 business days of receipt)

**Subject**: We Received Your Privacy Rights Request — [Request ID]

Dear [Consumer Name],

We have received your request to exercise your [right invoked] under [applicable state privacy law], submitted on [date received] via [channel].

Your request ID is: **[Request ID]**

We will respond to your request by **[deadline date]**. We may contact you if additional information is needed to verify your identity or process your request.

If you have questions, contact us at [privacy contact email / phone].

[Controller Name] Privacy Team

---

### 7B. Fulfillment Letter

**Subject**: Your Privacy Rights Request Has Been Fulfilled — [Request ID]

Dear [Consumer Name],

We have completed your request to [right invoked] under [applicable state privacy law].

**What we did**:
- [For Access/Portability]: Enclosed or linked is the information you requested in [format].
- [For Deletion]: We have deleted the personal information you requested from our active systems. Note: certain data may be retained as required by law or for legitimate business purposes as described in our privacy notice.
- [For Correction]: We have updated your [data element] to reflect [corrected information].
- [For Opt-Out]: We have processed your opt-out of [sale / sharing / targeted advertising / profiling].

If you believe we have not fully responded to your request, you have the right to appeal (see below).

**Appeal Right** [omit for UT, IA]: You may submit an appeal of this decision within 45 days by contacting [appeal contact / form URL].

[Controller Name] Privacy Team

---

### 7C. Denial Letter (with appeal notice)

**Subject**: Your Privacy Rights Request — Response — [Request ID]

Dear [Consumer Name],

We received your request to [right invoked] on [date received].

After review, we are unable to fulfill your request for the following reason(s):

- [ ] We could not verify your identity with the information provided. [Explain what additional information is needed.]
- [ ] The right you invoked ([right]) does not apply to the data you requested. [Explain why.]
- [ ] An exception applies: [specify exception].
- [ ] We are not subject to [state] privacy law with respect to your data. [Explain basis.]
- [ ] Other: [explain]

**Your Appeal Right** [omit for UT, IA]: You may appeal this decision within **45 days** of receiving this notice. To submit an appeal:
- [Web form URL]
- [Email address]
- [Postal address]

If your appeal is denied, you may submit a complaint to the [state] Attorney General at [AG contact information].

[Controller Name] Privacy Team

---

## 8. Appeal Process

### States Requiring an Internal Appeal Mechanism

All applicable states **except Utah (UCPA) and Iowa (ICDPA)** require an internal appeal mechanism. Confirm the applicable statute before advising.

| Element | Requirement |
|---------|-------------|
| Appeal window available to consumer | 45 days from denial notice (most states) |
| Controller response to appeal | Within 60 days of receiving appeal (most states; verify per statute) |
| Appeal denial notice content | Must inform consumer of denial and provide AG referral information |
| AG referral option | Required in most states if appeal is denied |
| Documentation | Retain appeal request, decision, and AG notice information |

### Appeal Response Letter Outline

1. Acknowledgment of appeal and date received
2. Summary of original request and denial reason
3. Result of appeal review (granted or denied)
4. If granted: describe corrective action taken
5. If denied: specific reasons; statement directing consumer to the [state] AG for further recourse
6. AG contact information (include current address/URL — do not rely on memory; verify at time of response)

### AG Referral Language (include in denial of appeal):

> If you are not satisfied with the outcome of this appeal, you may submit a complaint to the [State] Attorney General's Office. Contact information: [URL / address / phone]. We do not retaliate against consumers who exercise their privacy rights or submit complaints.

---

## 9. No-Right Scenarios

Use the following when the invoked right does not exist under the applicable statute or when the organization is not subject to the applicable law.

### When the Right Does Not Exist Under the Applicable Statute

Dear [Consumer Name],

Thank you for contacting us regarding your privacy rights. You have requested to exercise your [right invoked] as a resident of [state].

After reviewing your request, we must inform you that the [right invoked] is not available under [state privacy statute] as it applies to our processing of your personal information. [Brief explanation, e.g., "The right to correction is not established under the Utah Consumer Privacy Act."]

We remain committed to protecting your privacy. You may have other rights under [applicable law], including [list available rights].

If you have questions, contact our privacy team at [contact information].

[Controller Name] Privacy Team

### When the Organization Is Not Subject to the Applicable Law

Dear [Consumer Name],

Thank you for contacting us. After reviewing your request, we have determined that [Controller Name] does not currently meet the applicability threshold for [state privacy statute] based on [brief non-identifying basis, e.g., "our annual revenue and consumer processing volume"].

We are committed to data privacy and handle personal information responsibly. For questions about the personal data we hold about you, please contact [privacy contact].

[Controller Name] Privacy Team

---

## 10. DSAR Log and Record Retention

### Recommended DSAR Log Fields

| Field | Description |
|-------|-------------|
| Request ID | Unique identifier assigned at intake |
| Consumer name (or pseudonym) | Identifiable reference; consider pseudonymization if log is shared |
| State of residence | Determines applicable statute |
| Right invoked | From the intake checklist |
| Date received | Starts response clock |
| Channel | Web / email / phone / mail |
| Identity verified? | Y / N / Pending |
| Verification method | Knowledge-based / Agent authorization / Other |
| Date verified | Date identity confirmation completed |
| Initial deadline | Calculated from receipt date |
| Extension notice sent? | Y / N |
| Extended deadline (if applicable) | Recalculated deadline |
| Date response sent | Actual response date |
| Outcome | Fulfilled / Denied / Partially fulfilled |
| Denial reason (if applicable) | Free text |
| Processor notification sent? | Y / N / N/A (deletion only) |
| Processors notified | List of processors notified |
| Appeal submitted? | Y / N |
| Appeal outcome | Granted / Denied / Pending |
| Notes | Any unusual circumstances |

### Retention Period

- **Recommended minimum**: 24 months from request resolution date
- **Rationale**: Most state enforcement limitation periods are 4 years from violation; retaining DSAR records for at least 2 years allows demonstration of compliance during a regulatory inquiry
- **California note**: Retain records of consumer requests and responses for at least 24 months (Cal. Civ. Code § 1798.185 regulatory guidance)
- **Storage**: DSAR logs should be stored in access-controlled systems; limit access to privacy and legal team members

---

*Last updated: 2026-05-13 | Use pq_dsar_router and pq_route_dsar_workflow to generate state-specific operational checklists with calculated deadlines.*
