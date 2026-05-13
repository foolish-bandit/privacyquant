import { z } from "zod";
import { loadIndex } from "./loader.js";
import type { StatuteIndex, StatuteNode } from "./types.js";

type NoticeType =
  | "notice_at_collection"
  | "privacy_notice"
  | "opt_out_disclosure"
  | "sensitive_data_notice"
  | "financial_incentive"
  | "ai_training_disclosure";

type DraftStyle = "standard" | "consumer_friendly" | "lawyerly";

type NoticeArgs = {
  notice_type: NoticeType;
  states?: string[];
  business_name?: string;
  data_categories?: string[];
  purposes?: string[];
  sale_or_sharing?: boolean;
  targeted_advertising?: boolean;
  profiling_or_admt?: boolean;
  sensitive_data?: boolean;
  minors_data?: boolean;
  financial_incentive?: boolean;
  uses_llm_training?: boolean;
  universal_opt_out?: boolean;
  contact_method?: string;
  style?: DraftStyle;
  include_notes?: boolean;
};

type ToolResult = { content: Array<{ type: "text"; text: string }> };

type ToolServer = {
  registerTool: (
    name: string,
    config: Record<string, unknown>,
    handler: (args: NoticeArgs) => Promise<ToolResult>
  ) => unknown;
};

type NodeEvidence = {
  id: string;
  title: string;
  statute: string;
  section: string;
  excerpt: string;
  source_url: string;
};

let cachedIndex: StatuteIndex | null = null;

function getIndex(): StatuteIndex {
  if (!cachedIndex) cachedIndex = loadIndex();
  return cachedIndex;
}

const STATE_TO_STATUTE: Record<string, string[]> = {
  CA: ["CCPA", "CPRA", "CCPA/CPRA"],
  VA: ["VCDPA"],
  CO: ["CPA"],
  CT: ["CTDPA"],
  UT: ["UCPA"],
  TX: ["TDPSA"],
  OR: ["OCPA"],
  MT: ["MCDPA"],
  IA: ["ICDPA"],
  IN: ["INCDPA"],
  TN: ["TIPA"],
  DE: ["DPDPA"],
  NJ: ["NJDPA"],
  NH: ["NHDPA"],
  NE: ["NDPA"],
  KY: ["KCDPA"],
  MD: ["MODPA"],
  MN: ["MCDPA-MN"],
  RI: ["RIDTPPA"],
  FL: ["FDBR"],
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function excerpt(value: string, max = 280): string {
  const clean = value.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function sentenceList(values: string[] | undefined, fallback: string): string {
  const items = (values ?? []).map((value) => value.trim()).filter(Boolean);
  if (items.length === 0) return fallback;
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function business(args: NoticeArgs): string {
  return args.business_name?.trim() || "We";
}

function possessiveBusiness(args: NoticeArgs): string {
  const name = args.business_name?.trim();
  if (!name) return "our";
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

function targetStatutes(args: NoticeArgs): string[] {
  const states = args.states?.map((state) => state.trim().toUpperCase()).filter(Boolean) ?? [];
  if (!states.length) return [];
  return [...new Set(states.flatMap((state) => STATE_TO_STATUTE[state] ?? [state]))];
}

function nodeMatchesNoticeType(node: StatuteNode, args: NoticeArgs): boolean {
  const text = normalize([node.id, node.title, node.trigger, node.requirement, node.contract_signals.join(" ")].join(" "));
  switch (args.notice_type) {
    case "notice_at_collection":
      return text.includes("notice") || text.includes("collection") || text.includes("privacy notice");
    case "privacy_notice":
      return text.includes("privacy notice") || text.includes("notice") || text.includes("disclosure");
    case "opt_out_disclosure":
      return text.includes("opt out") || text.includes("opt-out") || text.includes("sale") || text.includes("sharing") || text.includes("targeted advertising") || text.includes("gpc") || text.includes("universal opt");
    case "sensitive_data_notice":
      return text.includes("sensitive") || text.includes("biometric") || text.includes("precise geolocation") || text.includes("minor") || text.includes("child");
    case "financial_incentive":
      return text.includes("financial incentive") || text.includes("loyalty") || text.includes("price") || text.includes("service difference");
    case "ai_training_disclosure":
      return text.includes("large language model") || text.includes("llm") || text.includes("automated") || text.includes("profiling") || text.includes("admt") || text.includes("training");
  }
}

function statuteMatch(node: StatuteNode, statutes: string[]): boolean {
  if (!statutes.length) return true;
  const nodeText = normalize(`${node.id} ${node.statute}`);
  return statutes.some((statute) => nodeText.includes(normalize(statute)) || normalize(statute).includes(nodeText));
}

function findEvidence(args: NoticeArgs, limit = 8): NodeEvidence[] {
  const index = getIndex();
  const statutes = targetStatutes(args);
  return index.all
    .filter((node) => statuteMatch(node, statutes))
    .filter((node) => nodeMatchesNoticeType(node, args))
    .slice(0, limit)
    .map((node) => ({
      id: node.id,
      title: node.title,
      statute: node.statute,
      section: node.section,
      excerpt: excerpt(node.requirement),
      source_url: node.source_url,
    }));
}

function intro(args: NoticeArgs): string {
  const name = business(args);
  if (args.style === "lawyerly") {
    return `${name} provides this notice to describe its collection, use, disclosure, and retention of personal information as required by applicable privacy laws.`;
  }
  return `${name} explains below what personal information we collect, why we use it, and what choices you have.`;
}

function draftNoticeAtCollection(args: NoticeArgs): string {
  const cats = sentenceList(args.data_categories, "the categories of personal information described in our privacy notice");
  const purposes = sentenceList(args.purposes, "the business and commercial purposes described in our privacy notice");
  return `${intro(args)} We collect ${cats}. We use this information for ${purposes}. We retain personal information only for as long as reasonably necessary for the purposes described in this notice, to comply with legal obligations, resolve disputes, enforce agreements, prevent fraud or abuse, and maintain security. We do not collect additional categories of personal information or use collected personal information for materially different purposes without providing any notice required by applicable law.`;
}

function draftPrivacyNotice(args: NoticeArgs): string {
  const cats = sentenceList(args.data_categories, "identifiers, commercial information, internet or device activity, and other information you provide or generate when using our services");
  const purposes = sentenceList(args.purposes, "providing and improving our services, communicating with you, security and fraud prevention, legal compliance, analytics, and other disclosed business purposes");
  const disclosure = args.sale_or_sharing || args.targeted_advertising
    ? "We may disclose certain personal information to advertising, analytics, or business partners in ways that may be considered a sale, sharing, or targeted advertising under some state privacy laws."
    : "We do not sell personal information or share it for cross-context behavioral advertising unless disclosed elsewhere in this notice.";
  return `${intro(args)} We collect ${cats}. We use personal information for ${purposes}. ${disclosure} We describe consumer privacy rights, request methods, verification steps, appeal rights where available, and our contact method below. ${business(args)} will not discriminate against you for exercising privacy rights, although some choices may affect features that rely on the data at issue.`;
}

function draftOptOut(args: NoticeArgs): string {
  const mechanisms = args.universal_opt_out
    ? "You may also use a browser or device-based universal opt-out signal, such as Global Privacy Control, where we are required to recognize it."
    : "Where required, we will provide a method to opt out of sale, sharing, targeted advertising, or profiling.";
  const scope = args.sale_or_sharing && args.targeted_advertising
    ? "sale or sharing of personal information and targeted advertising"
    : args.targeted_advertising
      ? "targeted advertising"
      : "sale or sharing of personal information";
  return `You may opt out of ${scope}. To exercise this choice, use the opt-out link or request method provided in this notice. ${mechanisms} After we process your opt-out, we will stop the covered activity for the browser, device, account, or consumer profile that we can reasonably associate with the request, subject to legal exceptions and technical limitations.`;
}

function draftSensitive(args: NoticeArgs): string {
  const cats = sentenceList(args.data_categories, "sensitive personal information or sensitive personal data");
  const minors = args.minors_data ? " We do not sell personal information of consumers we know are under the age threshold set by applicable law, and we apply heightened protections for known children or teens where required." : "";
  return `We may collect or process ${cats} only for disclosed and permitted purposes, such as providing requested services, account security, fraud prevention, legal compliance, or other purposes allowed by applicable law. Where required, we will obtain consent before processing sensitive data or provide a right to limit or opt out of certain sensitive-data uses.${minors} We do not use sensitive data for secondary purposes, sale, sharing, targeted advertising, profiling, or artificial-intelligence model training unless disclosed and permitted by applicable law.`;
}

function draftFinancialIncentive(args: NoticeArgs): string {
  return `We may offer programs, benefits, discounts, rewards, or other financial incentives that involve the collection or use of personal information. Participation is voluntary. We will describe the material terms of the program before you enroll, including the categories of personal information involved, the value of the incentive, how the value is reasonably related to the data, how to opt in, and how to withdraw. We will not use financial-incentive programs in a way that is unjust, unreasonable, coercive, or usurious under applicable law.`;
}

function draftAITraining(args: NoticeArgs): string {
  const cats = sentenceList(args.data_categories, "personal information described in this notice");
  const purposes = args.uses_llm_training
    ? `We may use ${cats} to train, fine-tune, evaluate, improve, or monitor artificial-intelligence systems, including large language models, where disclosed and permitted by applicable law.`
    : `We do not use ${cats} to train large language models unless we provide notice and obtain any consent required by applicable law.`;
  return `${purposes} Where automated decision-making, profiling, or AI-assisted processing creates legal or similarly significant effects, we will provide disclosures, assessments, opt-out rights, or appeal processes required by applicable law.`;
}

function draftClause(args: NoticeArgs): string {
  switch (args.notice_type) {
    case "notice_at_collection": return draftNoticeAtCollection(args);
    case "privacy_notice": return draftPrivacyNotice(args);
    case "opt_out_disclosure": return draftOptOut(args);
    case "sensitive_data_notice": return draftSensitive(args);
    case "financial_incentive": return draftFinancialIncentive(args);
    case "ai_training_disclosure": return draftAITraining(args);
  }
}

function missingFacts(args: NoticeArgs): string[] {
  const missing: string[] = [];
  if (!args.states?.length) missing.push("states");
  if (!args.data_categories?.length) missing.push("data_categories");
  if (["notice_at_collection", "privacy_notice"].includes(args.notice_type) && !args.purposes?.length) missing.push("purposes");
  if (args.notice_type === "opt_out_disclosure" && args.sale_or_sharing === undefined && args.targeted_advertising === undefined) missing.push("sale_or_sharing or targeted_advertising");
  if (args.notice_type === "financial_incentive" && args.financial_incentive !== true) missing.push("financial_incentive=true confirmation");
  if (args.notice_type === "ai_training_disclosure" && args.uses_llm_training === undefined && args.profiling_or_admt === undefined) missing.push("uses_llm_training or profiling_or_admt");
  return missing;
}

function render(args: NoticeArgs): string {
  const evidence = findEvidence(args);
  const missing = missingFacts(args);
  const lines: string[] = [
    "# Draft Privacy Notice Clause",
    "",
    `**Notice type**: ${args.notice_type}`,
    `**States**: ${args.states?.join(", ") || "not specified"}`,
    `**Style**: ${args.style ?? "standard"}`,
    "",
    "## Clause",
    draftClause(args),
  ];

  if (missing.length > 0) {
    lines.push("", "## Missing Business Facts", ...missing.map((item) => `- ${item}`));
  }

  if (args.include_notes ?? true) {
    lines.push("", "## Drafting Notes");
    lines.push("- This is deterministic first-draft notice language, not legal advice.");
    lines.push("- Review against the full privacy notice, data map, retention schedule, consumer-rights workflow, and current regulations.");
    lines.push("- Run `pq_audit_citations` on explanatory legal analysis before publication.");
    lines.push("- For multi-state programs, pair this with `pq_check_applicability` and `pq_resolve_conflict_nodes`.");
    if (args.universal_opt_out) lines.push("- Because universal opt-out support is enabled, verify GPC/UOOM obligations state by state.");
    if (args.minors_data) lines.push("- Because minors' data is involved, verify COPPA and state teen/minor restrictions separately.");
    if (args.uses_llm_training) lines.push("- Because LLM training is involved, verify emerging state AI/ADMT disclosure and assessment duties.");
  }

  lines.push("", "## Supporting PrivacyQuant Nodes");
  if (evidence.length === 0) {
    lines.push("No directly matching nodes were found. Try adding states, data categories, or processing flags.");
  } else {
    for (const node of evidence) {
      lines.push(`- \`${node.id}\` — ${node.title} (${node.statute}; ${node.section})`);
      lines.push(`  - ${node.excerpt}`);
      if (node.source_url) lines.push(`  - Source: ${node.source_url}`);
    }
  }

  return lines.join("\n");
}

export function registerNoticeClauseDrafterTool(server: ToolServer): void {
  server.registerTool(
    "pq_draft_notice_clause",
    {
      title: "Draft Privacy Notice Clause",
      description: `Draft first-pass privacy notice language from processing facts and PrivacyQuant nodes.

Use this for notice-at-collection, privacy notice, opt-out disclosure, sensitive-data notice,
financial-incentive notice, and AI/LLM training disclosure language. The tool is deterministic,
does not call an LLM, and returns supporting PrivacyQuant nodes for review.`,
      inputSchema: {
        notice_type: z.enum(["notice_at_collection", "privacy_notice", "opt_out_disclosure", "sensitive_data_notice", "financial_incentive", "ai_training_disclosure"]),
        states: z.array(z.string().min(2)).optional().describe("State abbreviations or statute names relevant to the notice."),
        business_name: z.string().optional(),
        data_categories: z.array(z.string()).optional(),
        purposes: z.array(z.string()).optional(),
        sale_or_sharing: z.boolean().optional(),
        targeted_advertising: z.boolean().optional(),
        profiling_or_admt: z.boolean().optional(),
        sensitive_data: z.boolean().optional(),
        minors_data: z.boolean().optional(),
        financial_incentive: z.boolean().optional(),
        uses_llm_training: z.boolean().optional(),
        universal_opt_out: z.boolean().optional(),
        contact_method: z.string().optional(),
        style: z.enum(["standard", "consumer_friendly", "lawyerly"]).default("standard"),
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
      return { content: [{ type: "text", text: render(args) }] };
    }
  );
}
