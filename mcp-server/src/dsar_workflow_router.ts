/**
 * dsar_workflow_router.ts
 *
 * Operational companion to the legal pq_dsar_router.
 * Converts a consumer rights request into a step-by-step workflow checklist,
 * with deadline calculations, verification guidance, sensitive-data escalation,
 * and processor/service-provider handoff steps.
 *
 * Deterministic. No LLM. No live API.
 */

import { routeDSAR } from "./dsar_router.js";
import type { RightType } from "./dsar_router.js";

export type ControllerStatus = "controller" | "processor" | "dual" | "unknown";
export type VerificationLevel = "none" | "basic" | "enhanced" | "strict";

export interface DSARWorkflowInput {
  consumer_state: string;
  right_invoked: RightType;
  controller_statutes?: string[];
  controller_status?: ControllerStatus;
  request_received_date?: string; // ISO date
  residency_verified?: boolean;
  verification_level?: VerificationLevel;
  authorized_agent?: boolean;
  sensitive_data_involved?: boolean;
  specific_pieces_requested?: boolean;
  deletion_scope?: "all" | "partial" | "unknown";
}

export interface WorkflowStep {
  step: number;
  action: string;
  deadline?: string;
  notes?: string[];
  node_refs?: string[];
}

export interface DSARWorkflowResult {
  consumer_state: string;
  right_invoked: string;
  right_label: string;
  statute: string | null;
  must_respond: boolean;
  initial_deadline_days: number | null;
  max_deadline_days: number | null;
  calculated_due_date: string | null;
  calculated_max_date: string | null;
  appeal_right: boolean;
  appeal_deadline_days: number | null;
  steps: WorkflowStep[];
  escalation_flags: string[];
  node_refs: string[];
  disclaimer: string;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isValidDate(s: string): boolean {
  return !isNaN(Date.parse(s));
}

export function buildDSARWorkflow(
  input: DSARWorkflowInput
): DSARWorkflowResult {
  const legalRoute = routeDSAR(input.consumer_state, input.right_invoked);
  const right = legalRoute.applicable_statute?.rights[input.right_invoked];

  const escalationFlags: string[] = [];
  const steps: WorkflowStep[] = [];
  let stepN = 1;

  const statute = legalRoute.applicable_statute?.statute ?? null;
  const initialDays = right?.initial_deadline_days ?? null;
  const maxDays = right?.max_deadline_days ?? null;
  const appealRight = right?.appeal_right ?? false;
  const appealDays = right?.appeal_deadline_days ?? null;

  const receivedDate = input.request_received_date;
  const validDate = receivedDate && isValidDate(receivedDate);
  const dueDate = validDate && initialDays ? addDays(receivedDate!, initialDays) : null;
  const maxDate = validDate && maxDays ? addDays(receivedDate!, maxDays) : null;

  // No obligation
  if (!legalRoute.must_respond) {
    return {
      consumer_state: input.consumer_state.toUpperCase(),
      right_invoked: input.right_invoked,
      right_label: legalRoute.right_label,
      statute,
      must_respond: false,
      initial_deadline_days: null,
      max_deadline_days: null,
      calculated_due_date: null,
      calculated_max_date: null,
      appeal_right: false,
      appeal_deadline_days: null,
      steps: [
        {
          step: 1,
          action: legalRoute.directive,
          notes: [
            "No statutory obligation to respond. Document the determination and reason.",
            "Check whether your privacy policy makes voluntary commitments beyond statutory requirements.",
          ],
        },
      ],
      escalation_flags: [],
      node_refs: right?.node_refs ?? [],
      disclaimer:
        "This workflow is a triage aid. Verify facts with qualified counsel before responding.",
    };
  }

  // Step 1: Log and timestamp
  steps.push({
    step: stepN++,
    action: "Log the request with a timestamp and assign a tracking reference number.",
    notes: [
      "Use consistent DSAR logging format across all consumer states.",
      validDate ? `Request received: ${receivedDate}` : "Record the actual receipt date immediately.",
    ],
  });

  // Step 2: Confirm residency
  if (!input.residency_verified) {
    steps.push({
      step: stepN++,
      action: "Verify consumer residency in " + input.consumer_state.toUpperCase() + ".",
      notes: [
        "You may ask for the state of residency but not require proof of residency as a condition of responding.",
        "If residency cannot be confirmed, treat the request under the most protective applicable statute.",
      ],
    });
  } else {
    escalationFlags.push("Residency verified — good. Proceed to verification step.");
  }

  // Step 3: Authorized agent check
  if (input.authorized_agent) {
    steps.push({
      step: stepN++,
      action: "Verify authorized agent authorization before proceeding.",
      notes: [
        "Require signed permission from the consumer authorizing the agent, OR a power of attorney.",
        "May request that the consumer directly confirm they authorized the agent.",
        "Do not use authorized-agent status to impose excessive verification on the consumer.",
      ],
    });
    escalationFlags.push("Authorized agent — confirm authorization documents before processing.");
  }

  // Step 4: Identity verification
  const verificationLevel = input.verification_level ?? "basic";
  const verificationNotes: string[] = [];
  if (input.specific_pieces_requested || input.sensitive_data_involved) {
    verificationNotes.push(
      "Specific pieces or sensitive data involved — enhanced verification required."
    );
    verificationNotes.push(
      "Match at least two data points the consumer previously provided (e.g., email + last-4 SSN)."
    );
    escalationFlags.push("Enhanced verification required due to sensitive data or specific pieces request.");
  } else {
    verificationNotes.push("Standard verification: match consumer identity to existing account or records.");
    verificationNotes.push("Do not require more information than reasonably necessary to verify identity.");
  }

  steps.push({
    step: stepN++,
    action: `Verify consumer identity (${verificationLevel} level).`,
    notes: verificationNotes,
    node_refs: right?.node_refs,
  });

  // Step 5: Right-specific workflow
  const rightSteps = buildRightSpecificSteps(
    input.right_invoked,
    statute ?? "",
    input,
    escalationFlags
  );
  for (const rs of rightSteps) {
    steps.push({ ...rs, step: stepN++ });
  }

  // Step 6: Processor/service-provider coordination
  const status = input.controller_status ?? "controller";
  if (status === "processor" || status === "dual") {
    steps.push({
      step: stepN++,
      action:
        "As a processor/service provider, forward the request to the relevant controller(s) within a commercially reasonable time.",
      notes: [
        "Review your DPA/service-provider contract for the contractual response timeline.",
        "Processors are not independently required to respond to consumers under most state laws.",
        "Document the forwarding date and the controller contacted.",
      ],
    });
  }
  if (status === "controller" || status === "dual") {
    steps.push({
      step: stepN++,
      action:
        "Direct relevant service providers and processors to honor the request within the statutory deadline.",
      notes: [
        "Your processor/service-provider contracts should require them to cooperate with consumer requests.",
        "For deletion: instruct processors to delete the consumer's data from their systems.",
        "Document instructions sent to processors with timestamps.",
      ],
    });
  }

  // Step 7: Send response
  const deadlineNote = dueDate
    ? `Initial response due: ${dueDate} (${initialDays} calendar days from receipt).`
    : `Respond within ${initialDays ?? "applicable"} calendar days of receipt.`;

  const extensionNote =
    maxDays && initialDays && maxDays > initialDays
      ? `Extension available: up to ${maxDays - initialDays} additional days with written notice to consumer before initial deadline.`
      : undefined;

  steps.push({
    step: stepN++,
    action: "Send a complete and accurate response to the consumer.",
    deadline: dueDate ?? undefined,
    notes: [
      deadlineNote,
      ...(extensionNote ? [extensionNote] : []),
      "Response must be free of charge (first request in 12-month period).",
      "Response must be in a portable and readily usable format where applicable.",
    ],
    node_refs: right?.node_refs,
  });

  // Step 8: Appeal instructions if denied
  if (appealRight) {
    steps.push({
      step: stepN++,
      action: "If denying the request, include appeal instructions in the denial.",
      notes: [
        `The consumer has the right to appeal. Appeal must be completed within ${appealDays ?? "applicable"} days.`,
        "Denial must include a method to contact the applicable state AG.",
        "Document all denials with a specific reason tied to an enumerated exception.",
      ],
      node_refs: right?.node_refs,
    });
  }

  // Step 9: Document retention
  steps.push({
    step: stepN++,
    action: "Retain records of the request, verification, response, and any processor instructions.",
    notes: [
      "Most state laws require records to be retained for at least 24 months.",
      "Records support compliance demonstration in enforcement proceedings.",
    ],
  });

  return {
    consumer_state: input.consumer_state.toUpperCase(),
    right_invoked: input.right_invoked,
    right_label: legalRoute.right_label,
    statute,
    must_respond: true,
    initial_deadline_days: initialDays,
    max_deadline_days: maxDays,
    calculated_due_date: dueDate,
    calculated_max_date: maxDate,
    appeal_right: appealRight,
    appeal_deadline_days: appealDays,
    steps,
    escalation_flags: escalationFlags,
    node_refs: right?.node_refs ?? [],
    disclaimer:
      "This workflow is a triage aid. Specific steps may need adjustment based on your " +
      "data systems, contracts, and jurisdiction-specific guidance from qualified counsel.",
  };
}

export function formatResult(result: DSARWorkflowResult): string {
  const lines = [
    `# DSAR Workflow: ${result.right_label}`,
    `**State**: ${result.consumer_state} | **Statute**: ${result.statute ?? "None"} | **Must respond**: ${result.must_respond ? "Yes" : "No"}`,
    result.calculated_due_date
      ? `**Initial deadline**: ${result.calculated_due_date} (${result.initial_deadline_days} days)`
      : result.initial_deadline_days
      ? `**Initial deadline**: ${result.initial_deadline_days} calendar days from receipt`
      : "",
    result.calculated_max_date && result.max_deadline_days !== result.initial_deadline_days
      ? `**Max with extension**: ${result.calculated_max_date}`
      : "",
    result.appeal_right ? `**Appeal right**: Yes — ${result.appeal_deadline_days} days` : "**Appeal right**: No",
    ``,
  ];
  if (result.escalation_flags.length) {
    lines.push(`## ⚠️ Escalation Flags`);
    result.escalation_flags.forEach((f) => lines.push(`- ${f}`));
    lines.push("");
  }
  lines.push(`## Workflow Steps`);
  for (const step of result.steps) {
    lines.push(`### Step ${step.step}: ${step.action}`);
    if (step.deadline) lines.push(`**Deadline**: ${step.deadline}`);
    if (step.notes?.length) step.notes.forEach((n) => lines.push(`- ${n}`));
    lines.push("");
  }
  lines.push(`_${result.disclaimer}_`);
  return lines.join("\n");
}

function buildRightSpecificSteps(
  right: RightType,
  statute: string,
  input: DSARWorkflowInput,
  flags: string[]
): Omit<WorkflowStep, "step">[] {
  switch (right) {
    case "access":
      return [
        {
          action: "Search all data systems for personal data associated with the consumer.",
          notes: [
            "Search CRM, analytics, marketing, support, and any third-party processors.",
            "Include data collected from devices, cookies, and inferences where applicable.",
          ],
        },
        {
          action: "Compile a response describing: categories of PI collected, sources, purposes, and third parties.",
          notes: [
            "If consumer requested specific pieces, provide the actual data in a portable format.",
            input.specific_pieces_requested
              ? "Specific pieces requested — enhanced verification required before disclosure."
              : "Category-level response is acceptable unless specific pieces are requested.",
          ],
        },
      ];

    case "deletion":
      return [
        {
          action: "Identify all data systems containing the consumer's personal data.",
          notes: ["Map against your data inventory/record of processing activities."],
        },
        {
          action:
            "Evaluate applicable exceptions before deleting.",
          notes: [
            "Common exceptions: completing a transaction, security/fraud prevention, legal obligation, legal claims.",
            "Document which exception applies if deletion is partial or denied.",
          ],
        },
        {
          action:
            "Execute deletion and direct all processors/service providers to delete.",
          notes: [
            input.deletion_scope === "partial"
              ? "Partial deletion — clearly communicate to consumer what is retained and why."
              : "Full deletion where no exception applies.",
            "Retain proof-of-deletion records (not the deleted data itself).",
          ],
        },
      ];

    case "correction":
      return [
        {
          action: "Identify the inaccurate personal data and locate it in all relevant systems.",
          notes: ["Consumer should specify the data they believe is inaccurate."],
        },
        {
          action: "Apply correction using commercially reasonable efforts.",
          notes: [
            "You are not required to correct data you have documented reason to believe is accurate.",
            "Document both the original data and the correction made.",
          ],
        },
      ];

    case "portability":
      return [
        {
          action: "Export the consumer's personal data in a machine-readable, portable format.",
          notes: [
            "CSV or JSON are acceptable formats in most states.",
            "Do not include trade secrets or third-party confidential information.",
          ],
        },
      ];

    case "opt_out_sale":
    case "opt_out_targeted_advertising":
      flags.push("Opt-out request — must process within deadline; update suppression lists.");
      return [
        {
          action: "Update the consumer's preference in your consent management platform.",
          notes: [
            "Honor GPC signal as a valid opt-out where required (CA, CO, CT, OR, NJ, MT, MN).",
            "Propagate opt-out to all processors and data-sharing partners.",
            "Opt-out must be account-wide, not device-by-device.",
          ],
        },
        {
          action: "Confirm opt-out to the consumer and document the change.",
          notes: [
            "Do not charge a fee or degrade service as a result of the opt-out.",
          ],
        },
      ];

    case "limit_sensitive_pi":
      flags.push("CA limit-sensitive-PI right — different structure from opt-in consent states.");
      return [
        {
          action: "Update processing limitations for the consumer's sensitive PI categories.",
          notes: [
            "CA uses limit-use structure (not opt-in) — use for service delivery only after limitation.",
            "Distinguish from opt-in consent states like VA/CO/TX/OR/MD where separate consent is required.",
          ],
        },
      ];

    case "appeal":
      return [
        {
          action: "Review the original denial for accuracy and completeness.",
          notes: [
            "Assign appeal review to a senior compliance officer or legal counsel.",
            "Do not reuse the original denial rationale without independent review.",
          ],
        },
        {
          action: "Send appeal determination with a mechanism to contact the applicable state AG.",
          notes: [`Appeal must be completed within applicable deadline.`],
        },
      ];

    default:
      return [
        {
          action: "Process the request per the applicable statute requirements.",
          notes: ["Consult pq_dsar_router for the specific legal requirements for this right."],
        },
      ];
  }
}
