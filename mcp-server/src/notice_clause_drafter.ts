/**
 * notice_clause_drafter.ts
 *
 * Deterministic privacy notice drafting. Generates first-draft privacy notice
 * clause language from processing facts without an LLM.
 *
 * Supports: notice_at_collection, privacy_notice, opt_out_disclosure,
 *           sensitive_data_notice, financial_incentive, ai_training_disclosure.
 *
 * Original template language. Not a copy of any existing template.
 * Deterministic. No LLM. No live API.
 */

export type NoticeType =
  | "notice_at_collection"
  | "privacy_notice"
  | "opt_out_disclosure"
  | "sensitive_data_notice"
  | "financial_incentive"
  | "ai_training_disclosure";

export type NoticeStyle = "plain" | "formal" | "layered";

export interface NoticeDraftInput {
  notice_type: NoticeType;
  states: string[];
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
  style?: NoticeStyle;
  include_notes?: boolean;
}

export interface NoticeDraftResult {
  notice_type: NoticeType;
  clause_text: string;
  missing_facts: string[];
  drafting_notes: string[];
  supporting_nodes: string[];
}

const BIZ = (name?: string) => name ?? "[BUSINESS NAME]";

function noticeAtCollection(input: NoticeDraftInput): NoticeDraftResult {
  const biz = BIZ(input.business_name);
  const cats = input.data_categories?.join(", ") ?? "[list data categories]";
  const purposes = input.purposes?.join("; ") ?? "[describe purposes]";
  const missing: string[] = [];
  const notes: string[] = [];
  const nodes: string[] = ["ccpa.controller_duties.notice_at_collection"];

  if (!input.business_name) missing.push("business_name");
  if (!input.data_categories?.length) missing.push("data_categories");
  if (!input.purposes?.length) missing.push("purposes");
  if (!input.contact_method) missing.push("contact_method");

  const selling =
    input.sale_or_sharing
      ? `${biz} may sell or share your personal information with third parties for targeted advertising. ` +
        `You have the right to opt out of this sale or sharing.`
      : `${biz} does not sell or share your personal information for cross-context behavioral advertising.`;

  const sensitive = input.sensitive_data
    ? `\n\nIf you have provided sensitive personal information (including, as applicable, precise geolocation, ` +
      `health data, biometric data, racial or ethnic origin, or other sensitive categories), ` +
      `you have the right to limit our use of that information to purposes that are reasonably necessary ` +
      `and proportionate to the services you have requested.`
    : "";

  const admt = input.profiling_or_admt
    ? `\n\nWe use automated decision-making technology that may affect decisions about you. ` +
      `You have the right to opt out of such automated processing and to request information about the ` +
      `logic and likely outcomes of automated decisions that significantly affect you.`
    : "";

  const llm = input.uses_llm_training
    ? `\n\nWe may use your personal information to train large language model (AI) systems. ` +
      `You have the right to opt out of this use. [Describe opt-out mechanism].`
    : "";

  const uoom = input.universal_opt_out
    ? `We recognize the Global Privacy Control (GPC) signal as a valid opt-out request.`
    : "";

  const contact = input.contact_method
    ? `To exercise your rights, contact us at ${input.contact_method}.`
    : `To exercise your rights, contact us at [contact method].`;

  const text = [
    `NOTICE AT COLLECTION — ${biz.toUpperCase()}`,
    ``,
    `We collect the following categories of personal information: ${cats}.`,
    ``,
    `We collect and use your personal information for the following purposes: ${purposes}.`,
    ``,
    selling,
    sensitive,
    admt,
    llm,
    uoom ? `\n${uoom}` : "",
    ``,
    contact,
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (input.sale_or_sharing) {
    notes.push(
      "CA requires a 'Do Not Sell or Share My Personal Information' link on the homepage. Draft this separately."
    );
    nodes.push("ccpa.rights.opt_out_sale_sharing");
  }
  if (input.uses_llm_training) {
    notes.push(
      "CT CTDPA requires explicit LLM training disclosure effective August 1, 2026. Ensure notice is live by that date."
    );
    nodes.push("ctdpa.controller_duties.admt_llm_disclosure");
  }
  if (input.sensitive_data && input.states.some((s) => ["CA"].includes(s.toUpperCase()))) {
    notes.push(
      "CA uses a 'limit use' structure for sensitive PI — not opt-in consent. Draft 'Limit the Use of My Sensitive Personal Information' link separately."
    );
    nodes.push("ccpa.rights.limit_sensitive_pi");
  }

  return {
    notice_type: "notice_at_collection",
    clause_text: text,
    missing_facts: missing,
    drafting_notes: notes,
    supporting_nodes: nodes,
  };
}

function optOutDisclosure(input: NoticeDraftInput): NoticeDraftResult {
  const biz = BIZ(input.business_name);
  const missing: string[] = [];
  const notes: string[] = [];
  const nodes: string[] = [];

  if (!input.business_name) missing.push("business_name");
  if (!input.contact_method) missing.push("contact_method");

  const gpcLine =
    input.universal_opt_out
      ? `We honor the Global Privacy Control (GPC) browser signal as a valid opt-out request for sale and sharing of personal information.`
      : `[If applicable: describe UOOM/GPC recognition policy]`;

  const contact = input.contact_method ?? "[opt-out contact method or URL]";

  const text = [
    `OPT-OUT OF SALE, SHARING, AND TARGETED ADVERTISING`,
    ``,
    `You have the right to opt out of:`,
    `  (a) the sale of your personal information to third parties;`,
    `  (b) the sharing of your personal information for cross-context behavioral advertising; and`,
    input.targeted_advertising
      ? `  (c) the use of your personal information for targeted advertising.`
      : null,
    input.profiling_or_admt
      ? `  (d) profiling and automated decision-making that produces legal or similarly significant effects.`
      : null,
    ``,
    `To submit an opt-out request, visit ${contact} or complete the opt-out form on our website.`,
    ``,
    gpcLine,
    ``,
    `We will process your opt-out request within 15 calendar days (California) or 45 calendar days ` +
      `(all other applicable states). We will not discriminate against you for exercising this right.`,
  ]
    .filter((l) => l !== null)
    .join("\n")
    .trim();

  if (input.universal_opt_out) {
    notes.push("GPC recognition is required in CA, CO, CT, OR, NJ, MT, MN. Verify technical implementation.");
    nodes.push("ccpa.rights.opt_out_sale_sharing", "cpa.rights.opt_out_sale");
  }
  if (input.targeted_advertising) {
    notes.push("Targeted advertising opt-out required under most comprehensive state laws.");
  }

  return {
    notice_type: "opt_out_disclosure",
    clause_text: text,
    missing_facts: missing,
    drafting_notes: notes,
    supporting_nodes: nodes,
  };
}

function sensitiveDataNotice(input: NoticeDraftInput): NoticeDraftResult {
  const biz = BIZ(input.business_name);
  const cats = input.data_categories?.join(", ") ?? "[list sensitive data categories]";
  const missing: string[] = [];
  const notes: string[] = [];
  const nodes = ["ccpa.sensitive_data.categories"];

  if (!input.business_name) missing.push("business_name");
  if (!input.data_categories?.length) missing.push("data_categories — sensitive categories specifically");
  if (!input.purposes?.length) missing.push("purposes");

  const purposes = input.purposes?.join("; ") ?? "[sensitive data processing purposes]";

  const caLimitUse = input.states.some((s) => s.toUpperCase() === "CA")
    ? `\n\nIf you are a California resident, you have the right to limit our use and disclosure of ` +
      `sensitive personal information to uses necessary to provide the services you requested. ` +
      `To limit this use, visit [Limit Use link] or contact us at [contact].`
    : "";

  const optInStates = input.states
    .filter((s) =>
      ["VA", "CO", "TX", "OR", "MD", "CT", "MT", "MN", "NJ", "NH", "DE", "KY", "IN", "RI"].includes(
        s.toUpperCase()
      )
    )
    .map((s) => s.toUpperCase());

  const optInNote =
    optInStates.length > 0
      ? `\n\nFor residents of ${optInStates.join(", ")}: we will obtain your consent before processing ` +
        `sensitive personal information unless a statutory exception applies.`
      : "";

  const text = [
    `SENSITIVE PERSONAL INFORMATION NOTICE`,
    ``,
    `${biz} collects and processes the following categories of sensitive personal information:`,
    cats,
    ``,
    `We process this information for the following purposes: ${purposes}.`,
    caLimitUse,
    optInNote,
  ]
    .join("\n")
    .trim();

  if (optInStates.length > 0) {
    notes.push(
      `Opt-in consent is required for sensitive data under ${optInStates.join(", ")}. ` +
        "Ensure consent management collects affirmative consent before processing."
    );
  }
  if (input.states.some((s) => s.toUpperCase() === "MD")) {
    notes.push(
      "Maryland MODPA flat bans sale of sensitive data — no opt-in or opt-out mechanism. Simply do not sell."
    );
    nodes.push("modpa.sensitive_data.ban_on_sale");
  }

  return {
    notice_type: "sensitive_data_notice",
    clause_text: text,
    missing_facts: missing,
    drafting_notes: notes,
    supporting_nodes: nodes,
  };
}

function aiTrainingDisclosure(input: NoticeDraftInput): NoticeDraftResult {
  const biz = BIZ(input.business_name);
  const missing: string[] = [];
  const notes: string[] = [];

  if (!input.business_name) missing.push("business_name");
  if (!input.contact_method) missing.push("contact_method");

  const text = [
    `AI / LLM TRAINING DATA DISCLOSURE`,
    ``,
    `${biz} may use personal information we collect from you to train, fine-tune, or improve ` +
      `large language model (AI) systems.`,
    ``,
    `Categories of personal information that may be used for this purpose: ` +
      (input.data_categories?.join(", ") ?? "[list categories]"),
    ``,
    `You have the right to opt out of the use of your personal information for AI training. ` +
      `To exercise this right, contact us at ${input.contact_method ?? "[contact method]"} ` +
      `or submit an opt-out request at [opt-out URL].`,
    ``,
    `We will not use sensitive personal information for AI training without your prior affirmative consent.`,
  ]
    .join("\n")
    .trim();

  notes.push(
    "Connecticut CTDPA requires this disclosure effective August 1, 2026 for controllers collecting PI for LLM training."
  );
  notes.push(
    "Other states may add similar requirements — monitor legislative changes via pq_watch_legislation."
  );

  return {
    notice_type: "ai_training_disclosure",
    clause_text: text,
    missing_facts: missing,
    drafting_notes: notes,
    supporting_nodes: ["ctdpa.controller_duties.admt_llm_disclosure"],
  };
}

function financialIncentiveNotice(input: NoticeDraftInput): NoticeDraftResult {
  const biz = BIZ(input.business_name);
  const missing: string[] = [];
  const notes: string[] = [];

  if (!input.business_name) missing.push("business_name");

  const text = [
    `FINANCIAL INCENTIVE NOTICE`,
    ``,
    `${biz} offers a financial incentive program in exchange for the collection, sale, or retention ` +
      `of personal information. Participation is voluntary.`,
    ``,
    `Program description: [describe program, e.g., loyalty points, discounts, free tier]`,
    ``,
    `The categories of personal information collected in connection with this program are: ` +
      (input.data_categories?.join(", ") ?? "[list categories]"),
    ``,
    `We have calculated that the value of your personal information in connection with this program ` +
      `is reasonably related to the value of the benefit offered. This calculation was based on: ` +
      `[describe methodology, e.g., cost of providing the benefit, revenue attributable to PI].`,
    ``,
    `You may opt in to the program by: [describe opt-in mechanism]. ` +
      `You may opt out of or withdraw from the program at any time by: [describe opt-out/withdrawal mechanism]. ` +
      `Withdrawal will not affect benefits already received.`,
  ]
    .join("\n")
    .trim();

  notes.push(
    "CA CCPA requires financial incentive notices to include a good-faith estimate of PI value and methodology."
  );
  notes.push(
    "The 'reasonably related' standard means you must document the value calculation — this notice is a placeholder for that calculation."
  );

  return {
    notice_type: "financial_incentive",
    clause_text: text,
    missing_facts: missing,
    drafting_notes: notes,
    supporting_nodes: ["ccpa.controller_duties.notice_at_collection"],
  };
}

function privacyNotice(input: NoticeDraftInput): NoticeDraftResult {
  const biz = BIZ(input.business_name);
  const cats = input.data_categories?.join(", ") ?? "[list categories]";
  const purposes = input.purposes?.join("; ") ?? "[describe purposes]";
  const missing: string[] = [];
  const notes: string[] = [];
  const nodes = [
    "ccpa.controller_duties.notice_at_collection",
    "vcdpa.rights.access",
    "cpa.rights.access",
  ];

  if (!input.business_name) missing.push("business_name");
  if (!input.data_categories?.length) missing.push("data_categories");
  if (!input.purposes?.length) missing.push("purposes");
  if (!input.contact_method) missing.push("contact_method");

  const stateSuffix =
    input.states.length > 0
      ? `\n\nThis policy applies to residents of: ${input.states.map((s) => s.toUpperCase()).join(", ")}.`
      : "";

  const rights = [
    "- Right to know / access the personal information we hold about you",
    "- Right to delete personal information we have collected from you",
    input.states.some((s) =>
      !["UT", "IA"].includes(s.toUpperCase())
    )
      ? "- Right to correct inaccurate personal information"
      : null,
    "- Right to obtain a portable copy of your personal information",
    input.sale_or_sharing || input.targeted_advertising
      ? "- Right to opt out of the sale or sharing of your personal information and use for targeted advertising"
      : null,
    input.states.some((s) => s.toUpperCase() === "CA")
      ? "- Right to limit the use of sensitive personal information (California residents)"
      : null,
    input.profiling_or_admt
      ? "- Right to opt out of automated decision-making and profiling"
      : null,
    "- Right to non-discrimination for exercising these rights",
  ]
    .filter(Boolean)
    .join("\n");

  const contact = input.contact_method ?? "[contact method]";

  const text = [
    `PRIVACY NOTICE — ${biz.toUpperCase()}`,
    `Effective date: [DATE] | Last updated: [DATE]`,
    stateSuffix,
    ``,
    `INFORMATION WE COLLECT`,
    `We collect the following categories of personal information: ${cats}.`,
    ``,
    `HOW WE USE YOUR INFORMATION`,
    `We use your personal information for the following purposes: ${purposes}.`,
    ``,
    input.sale_or_sharing
      ? "SALE AND SHARING\nWe may sell or share your personal information with third parties. You have the right to opt out."
      : "SALE AND SHARING\nWe do not sell or share your personal information for cross-context behavioral advertising.",
    ``,
    `YOUR RIGHTS`,
    `Depending on your state of residence, you may have the following rights:`,
    rights,
    ``,
    `HOW TO EXERCISE YOUR RIGHTS`,
    `To submit a request, contact us at ${contact}. We will verify your identity and respond ` +
      `within the timeframe required by applicable law.`,
    ``,
    `CONTACT US`,
    `${biz} | ${contact}`,
  ]
    .join("\n")
    .trim();

  notes.push(
    "This is a skeletal privacy notice. Customize with your actual data inventory, retention schedules, processor list, and third-party disclosures."
  );
  notes.push(
    "Run pq_audit_citations on the final notice text before publishing to check citation discipline."
  );

  return {
    notice_type: "privacy_notice",
    clause_text: text,
    missing_facts: missing,
    drafting_notes: notes,
    supporting_nodes: nodes,
  };
}

export function draftNoticeClause(input: NoticeDraftInput): NoticeDraftResult {
  switch (input.notice_type) {
    case "notice_at_collection":
      return noticeAtCollection(input);
    case "opt_out_disclosure":
      return optOutDisclosure(input);
    case "sensitive_data_notice":
      return sensitiveDataNotice(input);
    case "ai_training_disclosure":
      return aiTrainingDisclosure(input);
    case "financial_incentive":
      return financialIncentiveNotice(input);
    case "privacy_notice":
    default:
      return privacyNotice(input);
  }
}

export function formatResult(result: NoticeDraftResult): string {
  const lines = [
    `# ${result.notice_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Draft`,
    result.missing_facts.length
      ? `**Missing facts** (add before publishing): ${result.missing_facts.join(", ")}`
      : "",
    ``,
    `## Draft Text`,
    `\`\`\``,
    result.clause_text,
    `\`\`\``,
    ``,
  ];
  if (result.drafting_notes.length) {
    lines.push(`## Drafting Notes`);
    result.drafting_notes.forEach((n) => lines.push(`- ${n}`));
    lines.push("");
  }
  if (result.supporting_nodes.length) {
    lines.push(`**Supporting nodes**: ${result.supporting_nodes.map((n) => `\`${n}\``).join(", ")}`);
  }
  lines.push(`_Run pq_audit_citations on the final text before publishing._`);
  return lines.join("\n");
}
