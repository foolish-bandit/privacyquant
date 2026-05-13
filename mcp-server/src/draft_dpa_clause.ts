import { z } from "zod";
import { loadIndex } from "./loader.js";
import type { StatuteIndex, StatuteNode } from "./types.js";

type DraftStyle = "standard" | "customer_friendly" | "provider_friendly";
type RoleModel = "controller_processor" | "business_service_provider";

type DraftArgs = {
  id: string;
  role?: RoleModel;
  party_names?: {
    controller?: string;
    processor?: string;
    business?: string;
    service_provider?: string;
  };
  style?: DraftStyle;
  include_notes?: boolean;
};

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
};

type ToolServer = {
  registerTool: (
    name: string,
    config: Record<string, unknown>,
    handler: (args: DraftArgs) => Promise<ToolResult>
  ) => unknown;
};

type TemplateKey =
  | "processor_contract"
  | "deletion"
  | "correction"
  | "access_portability"
  | "sensitive_data"
  | "opt_out"
  | "security"
  | "default";

let cachedIndex: StatuteIndex | null = null;

function getIndex(): StatuteIndex {
  if (!cachedIndex) cachedIndex = loadIndex();
  return cachedIndex;
}

function findNode(id: string): StatuteNode | undefined {
  const index = getIndex();
  const exact = index.byId.get(id);
  if (exact) return exact;

  const lower = id.toLowerCase();
  return [...index.byId.entries()].find(([key]) => key.toLowerCase() === lower)?.[1];
}

function clean(value: string): string {
  return value.toLowerCase().replace(/[\s_\-]+/g, " ");
}

function nodeText(node: StatuteNode): string {
  return clean([
    node.id,
    node.title,
    node.trigger,
    node.requirement,
    node.obligation_bearer,
    node.contract_signals.join(" "),
  ].join(" "));
}

function hasAny(node: StatuteNode, terms: string[]): boolean {
  const text = nodeText(node);
  return terms.some((term) => text.includes(clean(term)));
}

function classifyNode(node: StatuteNode): TemplateKey {
  if (hasAny(node, [
    "processor contract",
    "service provider",
    "contract requirement",
    "contractual",
    "subprocessor",
    "subcontractor",
    "retain use or disclose",
    "business purpose",
  ])) return "processor_contract";

  if (hasAny(node, ["delete", "deletion", "erasure"])) return "deletion";
  if (hasAny(node, ["correct", "correction", "inaccurate"])) return "correction";
  if (hasAny(node, ["access", "portability", "portable", "confirm processing", "copy"])) return "access_portability";
  if (hasAny(node, ["sensitive", "biometric", "precise geolocation", "minor", "child", "under 16"])) return "sensitive_data";
  if (hasAny(node, ["opt out", "opt-out", "sale", "share", "sharing", "targeted advertising", "profiling", "universal opt out", "gpc"])) return "opt_out";
  if (hasAny(node, ["security", "safeguard", "confidentiality", "protect", "unauthorized"])) return "security";

  return "default";
}

function partyLabels(args: DraftArgs): {
  customer: string;
  provider: string;
  customerRole: string;
  providerRole: string;
} {
  const names = args.party_names ?? {};
  const businessServiceProvider = args.role === "business_service_provider";

  return {
    customer: names.controller ?? names.business ?? "Customer",
    provider: names.processor ?? names.service_provider ?? "Provider",
    customerRole: businessServiceProvider ? "Business" : "Controller",
    providerRole: businessServiceProvider ? "Service Provider" : "Processor",
  };
}

function styleLead(style: DraftStyle | undefined): string {
  if (style === "customer_friendly") return "At Customer's direction and for Customer's benefit, ";
  if (style === "provider_friendly") return "To the extent required by applicable Data Protection Laws, ";
  return "";
}

function clauseTitle(template: TemplateKey, node: StatuteNode): string {
  switch (template) {
    case "processor_contract": return "Processor / Service Provider Obligations";
    case "deletion": return "Deletion Assistance";
    case "correction": return "Correction Assistance";
    case "access_portability": return "Access and Portability Assistance";
    case "sensitive_data": return "Sensitive Personal Data";
    case "opt_out": return "Opt-Out Assistance";
    case "security": return "Security Safeguards";
    default: return node.title || "Statutory Requirement Assistance";
  }
}

function draftClause(template: TemplateKey, node: StatuteNode, args: DraftArgs): string {
  const { customer, provider, customerRole, providerRole } = partyLabels(args);
  const lead = styleLead(args.style);
  const cite = `${node.statute}${node.section ? ` ${node.section}` : ""}`;

  switch (template) {
    case "processor_contract":
      return `${lead}${provider} will process Personal Data only as a ${providerRole} on behalf of ${customer}, acting as the ${customerRole}, and only for the limited purposes described in the Agreement, this DPA, and ${customer}'s documented instructions. ${provider} will not sell or share Personal Data, retain, use, or disclose Personal Data outside the direct business relationship between the parties, combine Personal Data with personal data received from another source except as permitted by applicable Data Protection Laws, or process Personal Data for any purpose other than providing the Services. ${provider} will bind any authorized subcontractor or subprocessor to written obligations at least as protective as this clause, make information reasonably necessary to demonstrate compliance available to ${customer}, and promptly notify ${customer} if ${provider} determines it can no longer meet its obligations under ${cite}.`;

    case "deletion":
      return `${provider} will reasonably assist ${customer} in responding to verified requests to delete Personal Data. Upon ${customer}'s documented instruction, ${provider} will delete the applicable Personal Data from systems under its control and direct applicable subprocessors to do the same, unless retention is required or permitted by applicable Data Protection Laws. ${provider} will complete deletion within a timeframe designed to allow ${customer} to meet its obligations under ${cite} and will confirm completion upon reasonable request.`;

    case "correction":
      return `${provider} will reasonably assist ${customer} in responding to verified requests to correct inaccurate Personal Data. Upon ${customer}'s documented instruction, ${provider} will correct or enable correction of the applicable Personal Data in systems under ${provider}'s control, taking into account the nature of the Personal Data and the purposes of processing. ${provider} will notify applicable subprocessors when their assistance is reasonably necessary for ${customer} to satisfy ${cite}.`;

    case "access_portability":
      return `${provider} will reasonably assist ${customer} in responding to verified requests to access, confirm, or obtain a portable copy of Personal Data. Upon ${customer}'s documented instruction, ${provider} will make available Personal Data in a reasonably usable format to the extent the data is processed by ${provider} on behalf of ${customer} and is reasonably accessible to ${provider}. ${provider}'s assistance will be provided in a manner designed to allow ${customer} to meet its obligations under ${cite}.`;

    case "sensitive_data":
      return `${provider} will not process Sensitive Personal Data except as expressly instructed by ${customer}, as necessary to provide the Services, and as permitted by applicable Data Protection Laws. ${provider} will apply reasonable administrative, technical, and organizational safeguards appropriate to the nature of the Sensitive Personal Data and will not use Sensitive Personal Data for secondary purposes, sale, sharing, targeted advertising, profiling, or training artificial-intelligence models unless expressly authorized by ${customer} and permitted by applicable Data Protection Laws, including ${cite}.`;

    case "opt_out":
      return `${provider} will reasonably assist ${customer} in honoring consumer opt-out requests, including opt-outs from sale, sharing, targeted advertising, profiling, or universal opt-out mechanisms where applicable. ${provider} will not process Personal Data in a manner that prevents ${customer} from honoring a valid opt-out request communicated to ${provider}. Upon ${customer}'s documented instruction, ${provider} will cease the applicable processing activity and flow the restriction to relevant subprocessors as necessary to support compliance with ${cite}.`;

    case "security":
      return `${provider} will implement and maintain reasonable administrative, technical, and physical safeguards designed to protect Personal Data against unauthorized access, destruction, use, modification, or disclosure. The safeguards will be appropriate to the volume and sensitivity of the Personal Data, the nature of the processing, and the risks presented by the Services. ${provider} will periodically review and update those safeguards as reasonably necessary to support ${customer}'s compliance with ${cite}.`;

    default:
      return `${provider} will reasonably assist ${customer} in satisfying the statutory requirement identified by PrivacyQuant node ${node.id}. To the extent ${provider} processes Personal Data subject to ${cite}, ${provider} will process that Personal Data only as necessary to provide the Services, follow ${customer}'s documented instructions, maintain reasonable safeguards, flow down materially equivalent obligations to applicable subprocessors, and make available information reasonably necessary for ${customer} to verify compliance with this requirement.`;
  }
}

function formatDraft(node: StatuteNode, args: DraftArgs): string {
  const template = classifyNode(node);
  const includeNotes = args.include_notes ?? true;
  const lines = [
    "# Draft DPA Clause",
    "",
    `**Node**: \`${node.id}\``,
    `**Statute**: ${node.statute}`,
    `**Section**: ${node.section}`,
    `**Requirement type**: ${node.requirement_type}`,
    `**Template used**: ${template}`,
    "",
    `## ${clauseTitle(template, node)}`,
    draftClause(template, node, args),
  ];

  if (includeNotes) {
    lines.push(
      "",
      "## Drafting Notes",
      "- This is a deterministic first-draft clause generated from a PrivacyQuant node; it is not legal advice.",
      "- Review against the full agreement, party roles, data processing exhibit, and jurisdiction-specific definitions.",
      "- Run `pq_check_clause` against the final edited language before relying on it.",
      `- Source node requirement: ${node.requirement.trim()}`,
    );

    if (node.exceptions.length > 0) {
      lines.push(`- Node exceptions to consider: ${node.exceptions.join("; ")}`);
    }
    if (node.source_url) {
      lines.push(`- Source URL: ${node.source_url}`);
    }
  }

  return lines.join("\n");
}

export function registerDraftDpaClauseTool(server: ToolServer): void {
  server.registerTool(
    "pq_draft_dpa_clause",
    {
      title: "Draft DPA Clause from Requirement",
      description: `Draft a ready-to-review DPA clause from a PrivacyQuant statutory node ID.

Use this as the inverse of pq_check_clause: pq_check_clause reviews a clause against
statutory nodes, while pq_draft_dpa_clause starts with a statutory node and returns
first-draft contract language. The tool is deterministic and does not call an LLM.
Run pq_check_clause against the final edited language before relying on it.`,
      inputSchema: {
        id: z.string().min(1).describe('Node ID in dot notation, e.g. "ccpa.rights.deletion"'),
        role: z.enum(["controller_processor", "business_service_provider"]).optional(),
        party_names: z.object({
          controller: z.string().min(1).optional(),
          processor: z.string().min(1).optional(),
          business: z.string().min(1).optional(),
          service_provider: z.string().min(1).optional(),
        }).optional(),
        style: z.enum(["standard", "customer_friendly", "provider_friendly"]).default("standard"),
        include_notes: z.boolean().default(true),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const node = findNode(args.id);
      if (!node) {
        return {
          content: [{
            type: "text",
            text: `Node not found: "${args.id}". Use pq_list_statutes or pq_search_requirements to find a valid requirement node ID.`,
          }],
        };
      }

      return { content: [{ type: "text", text: formatDraft(node, args) }] };
    }
  );
}
