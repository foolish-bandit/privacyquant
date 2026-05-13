import { z } from "zod";
import { loadIndex } from "./loader.js";
import { routeDSAR, RIGHT_LABELS } from "./dsar_router.js";
import type { DSARRouteResult, RightType } from "./dsar_router.js";
import type { StatuteIndex } from "./types.js";

type ToolResult = { content: Array<{ type: "text"; text: string }> };

type ToolServer = {
  registerTool: (
    name: string,
    config: Record<string, unknown>,
    handler: (args: DSARWorkflowArgs) => Promise<ToolResult>
  ) => unknown;
};

type ControllerStatus = "controller" | "processor" | "dual_status" | "unknown";
type ApplicabilityStatus = "applies" | "likely_applies" | "does_not_apply" | "unknown";
type VerificationLevel = "unverified" | "basic" | "strong" | "account_login";

type DSARWorkflowArgs = {
  consumer_state: string;
  right_invoked: RightType;
  controller_statutes?: string[];
  controller_status?: ControllerStatus;
  applicability_status?: ApplicabilityStatus;
  request_received_date?: string;
  residency_verified?: boolean;
  verification_level?: VerificationLevel;
  authorized_agent?: boolean;
  data_context?: "consumer_account" | "customer_end_user" | "employee" | "b2b_contact" | "unknown";
  data_categories?: string[];
  sensitive_data_involved?: boolean;
  specific_pieces_requested?: boolean;
  deletion_scope?: "account" | "specific_data" | "all_personal_data" | "unknown";
};

type NodeEvidence = {
  node_id: string;
  found: boolean;
  title?: string;
  section?: string;
  excerpt?: string;
  source_url?: string;
};

let cachedIndex: StatuteIndex | null = null;

function getIndex(): StatuteIndex {
  if (!cachedIndex) cachedIndex = loadIndex();
  return cachedIndex;
}

function addDays(dateString: string | undefined, days: number | undefined): string | null {
  if (!dateString || days === undefined) return null;
  const date = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function excerpt(value: string, max = 300): string {
  const clean = value.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function nodeEvidence(nodeId: string, index: StatuteIndex): NodeEvidence {
  const node = index.byId.get(nodeId) ?? [...index.byId.entries()].find(([id]) => id.toLowerCase() === nodeId.toLowerCase())?.[1];
  if (!node) return { node_id: nodeId, found: false };
  return {
    node_id: node.id,
    found: true,
    title: node.title,
    section: node.section,
    excerpt: excerpt(node.requirement),
    source_url: node.source_url,
  };
}

function callRouteDSAR(args: DSARWorkflowArgs): DSARRouteResult {
  const router = routeDSAR as unknown as (consumerState: string, rightInvoked: RightType, controllerStatutes?: string[]) => DSARRouteResult;
  return router(args.consumer_state, args.right_invoked, args.controller_statutes);
}

function verificationRecommendation(args: DSARWorkflowArgs): string[] {
  const lines: string[] = [];
  const right = args.right_invoked;
  const level = args.verification_level ?? "unverified";

  if (args.residency_verified === false || args.residency_verified === undefined) {
    lines.push("Verify state residency before final routing. Use account address, billing address, reliable account records, or a requester declaration. IP address alone is weak evidence.");
  }

  if (args.authorized_agent) {
    lines.push("Authorized agent request: verify the agent's authorization and, where appropriate, confirm directly with the consumer that the agent may act for this request.");
  }

  if (right === "access" && args.specific_pieces_requested) {
    lines.push("Specific-pieces access requires stronger verification than categories-only access. Prefer account login plus secondary confirmation or equivalent identity assurance.");
  } else if (right === "access") {
    lines.push("Categories-only access can usually use basic account/email matching, but do not disclose sensitive specific pieces without stronger verification.");
  }

  if (right === "deletion") {
    lines.push("Deletion should include a confirmation step, especially for account-level or all-personal-data deletion. Preserve records needed to prove request handling and legal exceptions.");
  }

  if (args.sensitive_data_involved || args.data_categories?.some((cat) => /health|biometric|precise|geolocation|child|minor|financial|government|genetic/i.test(cat))) {
    lines.push("Sensitive data is involved. Use heightened verification and avoid collecting new sensitive data solely to verify identity unless necessary and proportionate.");
  }

  if (level === "unverified") {
    lines.push("Current verification level is unverified. Do not disclose, delete, correct, or port data until verification is complete or a lawful exception applies.");
  }

  return lines;
}

function statusDirective(args: DSARWorkflowArgs, route: DSARRouteResult): string[] {
  const lines: string[] = [];
  const status = args.controller_status ?? "unknown";
  const applicability = args.applicability_status ?? "unknown";

  if (applicability === "does_not_apply") {
    lines.push("Applicability status says the comprehensive state law does not apply. Do not treat this as the end of analysis: check sectoral laws, data-broker duties, marketing opt-out laws, contractual commitments, and voluntary privacy-policy promises.");
  } else if (applicability === "unknown") {
    lines.push("Applicability is unknown. Run `pq_check_applicability` before closing the request or denying statutory coverage.");
  }

  if (status === "processor") {
    lines.push("Processor/service-provider posture: do not fulfill the consumer request directly unless contractually authorized. Forward or escalate to the controller/customer and preserve evidence of the handoff.");
  } else if (status === "dual_status") {
    lines.push("Dual-status posture: split the request by data flow. Handle account/marketing data as controller data; forward customer end-user data to the business customer/controller.");
  } else if (status === "unknown") {
    lines.push("Controller/processor status is unknown. Determine role by data flow before acting. Same company may be controller for account data and processor for customer end-user data.");
  } else {
    lines.push("Controller posture: handle the request directly under the routed state law unless an exception or verification failure applies.");
  }

  if (!route.must_respond) {
    lines.push("The routed right does not appear to require fulfillment under the identified comprehensive statute. If denying, provide a clear explanation and preserve the basis for denial.");
  }

  return lines;
}

function workflowSteps(args: DSARWorkflowArgs, route: DSARRouteResult): string[] {
  const right = args.right_invoked;
  const steps: string[] = [
    "Log the request, received date, request channel, consumer state, right invoked, and assigned owner.",
    "Verify residency and controller/processor status for the data flow at issue.",
    "Authenticate the requester using a level proportionate to the right and data sensitivity.",
  ];

  if (route.must_respond) {
    steps.push("Locate responsive systems and subprocessors/service providers that hold relevant personal data.");
  }

  if (right === "deletion") {
    steps.push("Identify deletion exceptions before deleting: transaction completion, security, legal obligations, legal claims, fraud prevention, debugging, and other state-specific exceptions.");
    steps.push("If deletion proceeds, send deletion instructions to service providers/processors where required and track completion.");
  } else if (right === "access") {
    steps.push("Separate categories-of-data access from specific-pieces access; redact or withhold information that would disclose another person, trade secrets, security-sensitive data, or unverified sensitive data.");
  } else if (right === "correction") {
    steps.push("Validate the asserted inaccuracy, update systems where appropriate, and document any refusal where the consumer cannot substantiate the correction.");
  } else if (right === "portability") {
    steps.push("Prepare a portable and reasonably usable export where technically feasible; avoid disclosing trade secrets or data that cannot be tied to the verified consumer.");
  } else if (right.startsWith("opt_out")) {
    steps.push("Apply the opt-out to the relevant processing activity and flow the restriction to advertising, analytics, data sale, profiling, or third-party systems as applicable.");
    steps.push("Check whether a universal opt-out mechanism such as GPC must be honored for this state.");
  } else if (right === "limit_sensitive_pi") {
    steps.push("Limit sensitive personal information use to purposes necessary to provide requested goods/services or another permitted purpose; suppress secondary uses.");
  } else if (right === "appeal") {
    steps.push("Route the appeal to a reviewer not solely responsible for the initial denial where feasible and produce a written appeal decision within the applicable window.");
  }

  steps.push("Send the response by the statutory deadline or issue a timely extension notice if allowed.");
  steps.push("Retain request handling records, verification basis, response, denial rationale, exceptions, and service-provider instructions.");
  return steps;
}

function formatRoute(route: DSARRouteResult, args: DSARWorkflowArgs): string {
  const index = getIndex();
  const right = route.applicable_statute?.rights?.[args.right_invoked];
  const evidence = (right?.node_refs ?? []).map((id) => nodeEvidence(id, index));
  const initialDue = addDays(args.request_received_date, right?.initial_deadline_days);
  const maxDue = addDays(args.request_received_date, right?.max_deadline_days);

  const lines: string[] = [
    "# DSAR Workflow Route",
    "",
    `**Consumer state**: ${route.consumer_state}`,
    `**Right invoked**: ${RIGHT_LABELS[args.right_invoked]}`,
    `**Directive**: ${route.directive}`,
    `**Must respond under routed statute**: ${route.must_respond ? "yes" : "no"}`,
  ];

  if (route.applicable_statute) {
    lines.push(`**Applicable statute**: ${route.applicable_statute.statute}`);
    lines.push(`**Effective date**: ${route.applicable_statute.effective_date}`);
    if (route.applicable_statute.cure_period) lines.push(`**Cure period**: ${route.applicable_statute.cure_period}`);
  } else {
    lines.push("**Applicable statute**: none identified in PrivacyQuant's comprehensive-law router");
  }

  if (args.request_received_date) {
    lines.push(`**Received date**: ${args.request_received_date}`);
    if (initialDue) lines.push(`**Initial response target**: ${initialDue}`);
    if (maxDue && maxDue !== initialDue) lines.push(`**Maximum response target with extension**: ${maxDue}`);
  }

  lines.push("", "## Operational Directive");
  for (const item of statusDirective(args, route)) lines.push(`- ${item}`);

  lines.push("", "## Verification and Intake");
  for (const item of verificationRecommendation(args)) lines.push(`- ${item}`);

  lines.push("", "## Workflow Checklist");
  workflowSteps(args, route).forEach((step, index) => lines.push(`${index + 1}. ${step}`));

  if (right) {
    lines.push("", "## Right Mechanics");
    lines.push(`- **Exists**: ${right.exists ? "yes" : "no"}`);
    if (right.initial_deadline_days !== undefined) lines.push(`- **Initial deadline**: ${right.initial_deadline_days} days`);
    if (right.max_deadline_days !== undefined) lines.push(`- **Maximum with extension**: ${right.max_deadline_days} days`);
    if (right.appeal_right !== undefined) lines.push(`- **Appeal right on denial**: ${right.appeal_right ? "yes" : "no"}`);
    if (right.appeal_deadline_days !== undefined) lines.push(`- **Appeal deadline**: ${right.appeal_deadline_days} days`);
    if (right.limitations.length) {
      lines.push("- **Limitations**:");
      for (const limitation of right.limitations) lines.push(`  - ${limitation}`);
    }
    if (right.notes.length) {
      lines.push("- **Notes**:");
      for (const note of right.notes) lines.push(`  - ${note}`);
    }
  }

  if (route.multi_state_notes.length) {
    lines.push("", "## Multi-State Notes");
    for (const note of route.multi_state_notes) lines.push(`- ${note}`);
  }

  lines.push("", "## Node Evidence");
  if (!evidence.length) {
    lines.push("No node refs available for this route.");
  } else {
    for (const item of evidence) {
      if (!item.found) {
        lines.push(`- \`${item.node_id}\` — MISSING NODE REF`);
        continue;
      }
      lines.push(`- \`${item.node_id}\` — ${item.title} (${item.section})`);
      if (item.excerpt) lines.push(`  - ${item.excerpt}`);
      if (item.source_url) lines.push(`  - Source: ${item.source_url}`);
    }
  }

  lines.push("", "## Notes");
  lines.push("- This workflow is deterministic and does not call an LLM.");
  lines.push("- Use `pq_check_applicability` first if statutory coverage is uncertain.");
  lines.push("- Use `pq_fetch_requirement` on any node ID above to inspect the full statutory node.");

  return lines.join("\n");
}

export function registerDSARWorkflowRouterTool(server: ToolServer): void {
  server.registerTool(
    "pq_route_dsar_workflow",
    {
      title: "Route DSAR Workflow",
      description: `Route an incoming consumer rights request into an operational DSAR workflow.

This is the workflow companion to pq_dsar_router. It adds controller/processor status,
verification, authorized-agent handling, request timing, data sensitivity, and node evidence.
Use it when a user asks: "We got a request from a consumer in X state — what do we do?"`,
      inputSchema: {
        consumer_state: z.string().min(2).max(2).describe("Two-letter state abbreviation for the consumer's residence."),
        right_invoked: z.enum(["access", "deletion", "correction", "portability", "opt_out_sale", "opt_out_targeted_advertising", "opt_out_profiling", "limit_sensitive_pi", "appeal"]),
        controller_statutes: z.array(z.string()).optional().describe("Other statutes the controller is subject to, for multi-state notes."),
        controller_status: z.enum(["controller", "processor", "dual_status", "unknown"]).default("unknown"),
        applicability_status: z.enum(["applies", "likely_applies", "does_not_apply", "unknown"]).default("unknown"),
        request_received_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("YYYY-MM-DD received date for deadline calculation."),
        residency_verified: z.boolean().optional(),
        verification_level: z.enum(["unverified", "basic", "strong", "account_login"]).default("unverified"),
        authorized_agent: z.boolean().default(false),
        data_context: z.enum(["consumer_account", "customer_end_user", "employee", "b2b_contact", "unknown"]).default("unknown"),
        data_categories: z.array(z.string()).optional(),
        sensitive_data_involved: z.boolean().optional(),
        specific_pieces_requested: z.boolean().default(false),
        deletion_scope: z.enum(["account", "specific_data", "all_personal_data", "unknown"]).default("unknown"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const route = callRouteDSAR(args);
      return { content: [{ type: "text", text: formatRoute(route, args) }] };
    }
  );
}
