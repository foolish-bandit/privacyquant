/**
 * memo_generator.ts — Produces the formal client-ready DOCX deliverable.
 *
 * Ported from the standalone generate_docx_memo.js CLI tool.
 *
 * Conforms to docx skill conventions:
 *   - US Letter 12240×15840 DXA; 1-inch margins (1440 DXA); content width 9360 DXA
 *   - Dual-width tables (columnWidths on Table AND width on each TableCell)
 *   - LevelFormat.BULLET (not unicode bullets)
 *   - ShadingType.CLEAR (never SOLID)
 *   - Arial 12pt default
 *   - Cell margins: top/bottom 80, left/right 120
 *   - Borders: BorderStyle.SINGLE, size 4, color 999999
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  LevelFormat,
  TableOfContents,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  PageBreak,
} from "docx";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MemoEntityProfileRow {
  label: string;
  value: string;
  source: string;
}

export interface MemoApplicabilityRow {
  state: string;
  statute: string;
  verdict: string;
  reasoning: string;
}

export interface MemoStatusDeterminationRow {
  data_flow: string;
  ca_status: string;
  other_states_status: string;
  notes: string;
}

export interface MemoGapRow {
  id: string;
  states: string;
  section: string;
  gap: string;
  current: string;
  required: string;
  severity: number;
  likelihood: number;
  score: number;
  lane: string;
  dependencies: string;
}

export interface MemoRemediation {
  immediate: string[];
  thirty_day: string[];
  ninety_day: string[];
  strategic: string[];
}

export interface MemoInput {
  client_name: string;
  memo_date?: string;
  prepared_by?: string;
  executive_summary?: string;
  scope_and_methodology?: string;
  entity_profile?: MemoEntityProfileRow[];
  applicability?: MemoApplicabilityRow[];
  status_determination?: MemoStatusDeterminationRow[];
  gaps?: MemoGapRow[];
  remediation?: MemoRemediation;
  cross_cutting?: string[];
  limitations?: string[];
  next_steps?: string[];
}

// ─── Style helpers ──────────────────────────────────────────────────────────

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
const ALL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const CELL_MARGINS = { top: 80, bottom: 80, left: 120, right: 120 };

interface POptions {
  bold?: boolean;
  italics?: boolean;
  paragraphProps?: Record<string, unknown>;
}

function p(text: string | null | undefined, options: POptions = {}): Paragraph {
  if (text === null || text === undefined || text === "") {
    return new Paragraph({ children: [new TextRun("")] });
  }
  return new Paragraph({
    children: [
      new TextRun({
        text: String(text),
        bold: !!options.bold,
        italics: !!options.italics,
      }),
    ],
    spacing: { after: 120 },
    ...(options.paragraphProps ?? {}),
  });
}

function bullet(text: string, ref: string = "bullets"): Paragraph {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    children: [new TextRun(String(text ?? ""))],
  });
}

function heading(text: string, level: 1 | 2 | 3): Paragraph {
  const map: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
  };
  return new Paragraph({
    heading: map[level] ?? HeadingLevel.HEADING_2,
    children: [new TextRun(String(text))],
  });
}

interface CellOptions {
  width?: number;
  shading?: string;
  headerCell?: boolean;
}

function cell(text: string | string[], opts: CellOptions = {}): TableCell {
  const widthDXA = opts.width ?? 1872;
  const shading = opts.shading
    ? { fill: opts.shading, type: ShadingType.CLEAR }
    : undefined;
  const children = Array.isArray(text)
    ? text.map((t) => p(t))
    : [p(text ?? "", { bold: opts.headerCell })];
  return new TableCell({
    borders: ALL_BORDERS,
    width: { size: widthDXA, type: WidthType.DXA },
    shading,
    margins: CELL_MARGINS,
    children,
  });
}

function makeTable(rows: TableRow[], columnWidths: number[]): Table {
  const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths,
    rows,
  });
}

// ─── Table builders ─────────────────────────────────────────────────────────

function buildEntityProfileTable(
  profile: MemoEntityProfileRow[] | undefined
): Table | null {
  if (!profile || !profile.length) return null;
  const cw = [3120, 3120, 3120]; // sums to 9360
  const headerRow = new TableRow({
    children: [
      cell("Input", { headerCell: true, shading: "D5E8F0", width: cw[0] }),
      cell("Value", { headerCell: true, shading: "D5E8F0", width: cw[1] }),
      cell("Source / Assumption", {
        headerCell: true,
        shading: "D5E8F0",
        width: cw[2],
      }),
    ],
  });
  const rows = [headerRow].concat(
    profile.map(
      (item) =>
        new TableRow({
          children: [
            cell(item.label || "", { width: cw[0] }),
            cell(item.value || "", { width: cw[1] }),
            cell(item.source || "", { width: cw[2] }),
          ],
        })
    )
  );
  return makeTable(rows, cw);
}

function verdictColor(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const s = v.toLowerCase();
  if (s.includes("applies") && !s.includes("not") && !s.includes("insufficient"))
    return "F8D7DA";
  if (s.includes("likely")) return "FFF3CD";
  if (s.includes("does not")) return "D4EDDA";
  return undefined;
}

function buildApplicabilityTable(
  rows: MemoApplicabilityRow[] | undefined
): Table | null {
  if (!rows || !rows.length) return null;
  const cw = [780, 2580, 1500, 4500]; // sums to 9360
  const headerRow = new TableRow({
    children: [
      cell("State", { headerCell: true, shading: "D5E8F0", width: cw[0] }),
      cell("Statute", { headerCell: true, shading: "D5E8F0", width: cw[1] }),
      cell("Verdict", { headerCell: true, shading: "D5E8F0", width: cw[2] }),
      cell("Reasoning", { headerCell: true, shading: "D5E8F0", width: cw[3] }),
    ],
  });
  const data = rows.map(
    (r) =>
      new TableRow({
        children: [
          cell(r.state || "", { width: cw[0] }),
          cell(r.statute || "", { width: cw[1] }),
          cell(r.verdict || "", {
            width: cw[2],
            shading: verdictColor(r.verdict),
          }),
          cell(r.reasoning || "", { width: cw[3] }),
        ],
      })
  );
  return makeTable([headerRow].concat(data), cw);
}

function buildStatusTable(
  rows: MemoStatusDeterminationRow[] | undefined
): Table | null {
  if (!rows || !rows.length) return null;
  const cw = [2340, 2340, 2340, 2340]; // sums to 9360
  const headerRow = new TableRow({
    children: [
      cell("Data flow", { headerCell: true, shading: "D5E8F0", width: cw[0] }),
      cell("CA status", { headerCell: true, shading: "D5E8F0", width: cw[1] }),
      cell("Other states' status", {
        headerCell: true,
        shading: "D5E8F0",
        width: cw[2],
      }),
      cell("Notes", { headerCell: true, shading: "D5E8F0", width: cw[3] }),
    ],
  });
  const data = rows.map(
    (r) =>
      new TableRow({
        children: [
          cell(r.data_flow || "", { width: cw[0] }),
          cell(r.ca_status || "", { width: cw[1] }),
          cell(r.other_states_status || "", { width: cw[2] }),
          cell(r.notes || "", { width: cw[3] }),
        ],
      })
  );
  return makeTable([headerRow].concat(data), cw);
}

function laneColor(lane: string | undefined): string | undefined {
  if (!lane) return undefined;
  const s = lane.toLowerCase();
  if (s.includes("immediate") || s.includes("critical")) return "F8D7DA";
  if (s.includes("0-30") || s.includes("30 day") || s.includes("high"))
    return "FFE5D0";
  if (s.includes("31") || s.includes("90 day") || s.includes("medium"))
    return "FFF3CD";
  if (s.includes("strategic") || s.includes("low")) return "D4EDDA";
  return undefined;
}

function buildGapTable(rows: MemoGapRow[] | undefined): Table | null {
  if (!rows || !rows.length) return null;
  const cw = [600, 1200, 2880, 720, 720, 600, 1080, 1560]; // sums to 9360
  const headerRow = new TableRow({
    children: [
      cell("ID", { headerCell: true, shading: "D5E8F0", width: cw[0] }),
      cell("State(s)", { headerCell: true, shading: "D5E8F0", width: cw[1] }),
      cell("Gap", { headerCell: true, shading: "D5E8F0", width: cw[2] }),
      cell("Sev", { headerCell: true, shading: "D5E8F0", width: cw[3] }),
      cell("Lik", { headerCell: true, shading: "D5E8F0", width: cw[4] }),
      cell("Score", { headerCell: true, shading: "D5E8F0", width: cw[5] }),
      cell("Lane", { headerCell: true, shading: "D5E8F0", width: cw[6] }),
      cell("Dependencies", {
        headerCell: true,
        shading: "D5E8F0",
        width: cw[7],
      }),
    ],
  });
  const data = rows.map(
    (r) =>
      new TableRow({
        children: [
          cell(r.id || "", { width: cw[0] }),
          cell(r.states || "", { width: cw[1] }),
          cell(
            [r.gap || "", r.section ? `(${r.section})` : ""].filter(
              Boolean
            ) as string[],
            { width: cw[2] }
          ),
          cell(String(r.severity ?? ""), { width: cw[3] }),
          cell(String(r.likelihood ?? ""), { width: cw[4] }),
          cell(String(r.score ?? ""), { width: cw[5] }),
          cell(r.lane || "", { width: cw[6], shading: laneColor(r.lane) }),
          cell(r.dependencies || "", { width: cw[7] }),
        ],
      })
  );
  return makeTable([headerRow].concat(data), cw);
}

// ─── Document construction ──────────────────────────────────────────────────

const DEFAULT_LIMITATIONS: string[] = [
  "The revenue, consumer count, and processing activity figures provided by the client are accurate and complete for the relevant calendar year.",
  "The data categories, vendors, and channels described constitute the entirety of the client’s PD processing relevant to US state consumer privacy laws. Undisclosed processing has not been analyzed.",
  "The state statutes, regulations, and AG/agency guidance cited reflect the law in effect as of the date above. Material changes may post-date this memorandum.",
  "This memorandum does not address: federal sectoral laws standalone (HIPAA, GLBA, FCRA, COPPA, FERPA); non-US laws; state biometric laws standalone; state AI-specific laws; consumer-health-data laws; state social media laws; state wiretap statutes; UCL claims; VPPA / TCPA / CAN-SPAM / breach notification.",
  "Current AG enforcement priorities and active litigation may shift the practical risk profile.",
];

function buildDoc(memo: MemoInput): Document {
  const children: (Paragraph | Table)[] = [];

  // Cover
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: memo.client_name || "[Client Name]",
          bold: true,
          size: 48,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 240 },
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "US State Privacy Compliance Memorandum",
          bold: true,
          size: 36,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: memo.memo_date || "", size: 24 })],
      alignment: AlignmentType.CENTER,
    })
  );
  if (memo.prepared_by) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Prepared by: ${memo.prepared_by}`,
            size: 24,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
      })
    );
  }
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Disclaimer
  children.push(heading("Disclaimer", 1));
  children.push(
    p(
      "This memorandum provides legal analysis and drafts based on information supplied by the client and on the state of US state consumer privacy law as of the date above. It does not constitute legal advice. Reliance on this memorandum should occur only after review by qualified counsel admitted in the relevant jurisdiction(s) and verification that controlling law has not changed since the date above. The analysis is constrained by the assumptions and facts identified in the Limitations and Assumptions section. Material changes to the underlying facts may render conclusions inapplicable."
    )
  );
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // TOC
  children.push(heading("Contents", 1));
  children.push(
    new TableOfContents("Contents", {
      hyperlink: true,
      headingStyleRange: "1-3",
    })
  );
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 1 Executive summary
  children.push(heading("1. Executive Summary", 1));
  const exec = memo.executive_summary || "";
  exec.split(/\n\s*\n/).forEach((para) => {
    if (para.trim()) children.push(p(para.trim()));
  });
  if (!exec.trim()) children.push(p("[Executive summary to be drafted.]"));

  // 2 Scope and methodology
  children.push(heading("2. Scope and Methodology", 1));
  children.push(
    p(
      memo.scope_and_methodology ||
        `This memorandum covers the indicated US state consumer privacy laws as applied to ${
          memo.client_name || "[client]"
        }. The analysis is based on inputs provided by the client and on the cited state statutes, implementing regulations, and Attorney General / agency guidance.`
    )
  );

  // 3 Entity profile
  children.push(heading("3. Entity Profile and Threshold Inputs", 1));
  const profileTable = buildEntityProfileTable(memo.entity_profile);
  if (profileTable) {
    children.push(profileTable);
  } else {
    children.push(p("[Entity profile inputs to be supplied.]"));
  }

  // 4 Applicability
  children.push(heading("4. Applicability Analysis", 1));
  const appTable = buildApplicabilityTable(memo.applicability);
  if (appTable) {
    children.push(appTable);
  } else {
    children.push(
      p("[Applicability table to be populated from the threshold analysis.]")
    );
  }

  // 5 Status determination
  children.push(heading("5. Status Determination", 1));
  const statusTable = buildStatusTable(memo.status_determination);
  if (statusTable) {
    children.push(statusTable);
  } else {
    children.push(p("[Status determination by data flow to be supplied.]"));
  }

  // 6 Gap analysis
  children.push(heading("6. Gap Analysis", 1));
  children.push(
    p(
      "The gap analysis below applies the standard methodology. Severity (1–5) reflects regulatory and litigation exposure; Likelihood (1–5) reflects probability of surfacing; Score = Severity × Likelihood. Lanes: Critical (20–25); High (13–19); Medium (7–12); Low (1–6)."
    )
  );
  const gapTable = buildGapTable(memo.gaps);
  if (gapTable) {
    children.push(gapTable);
  } else {
    children.push(p("[Gap log to be supplied.]"));
  }

  // 7 Remediation roadmap
  children.push(heading("7. Remediation Roadmap", 1));
  const lanes: { title: string; items?: string[] }[] = [
    {
      title: "7.1 Immediate (within 7 days, where feasible)",
      items: memo.remediation?.immediate,
    },
    { title: "7.2 0–30 days", items: memo.remediation?.thirty_day },
    { title: "7.3 31–90 days", items: memo.remediation?.ninety_day },
    {
      title: "7.4 >90 days / strategic",
      items: memo.remediation?.strategic,
    },
  ];
  for (const lane of lanes) {
    children.push(heading(lane.title, 2));
    if (lane.items && lane.items.length) {
      lane.items.forEach((item) => children.push(bullet(item)));
    } else {
      children.push(p("[None identified at this lane, or to be supplied.]"));
    }
  }

  // 8 Cross-cutting
  children.push(heading("8. Cross-Cutting Recommendations", 1));
  if (memo.cross_cutting && memo.cross_cutting.length) {
    memo.cross_cutting.forEach((item) => children.push(bullet(item)));
  } else {
    children.push(p("[Cross-cutting fixes to be identified.]"));
  }

  // 9 Limitations
  children.push(heading("9. Limitations and Assumptions", 1));
  const limitations =
    memo.limitations && memo.limitations.length
      ? memo.limitations
      : DEFAULT_LIMITATIONS;
  limitations.forEach((item) => children.push(bullet(item, "numbers")));

  // 10 Next steps
  children.push(heading("10. Recommended Next Steps", 1));
  if (memo.next_steps && memo.next_steps.length) {
    memo.next_steps.forEach((item) => children.push(bullet(item, "numbers")));
  } else {
    children.push(p("[Next steps to be drafted.]"));
  }

  // Appendix stubs
  children.push(heading("Appendix A — State Consumer Counts", 1));
  children.push(p("[Detailed per-state breakdown, where supplied.]"));

  children.push(heading("Appendix B — Vendor / Processor Inventory", 1));
  children.push(
    p("[List of processors with status determination per data flow.]")
  );

  children.push(heading("Appendix C — Pixel / SDK Inventory", 1));
  children.push(
    p(
      "[List of analytics, advertising, and tracking technologies deployed across properties.]"
    )
  );

  children.push(heading("Appendix D — Detailed Gap-by-Gap Analysis", 1));
  children.push(
    p(
      "[Per-gap discussion of the specific statutory language, current practice, required practice, and recommended remediation steps with citations.]"
    )
  );

  return new Document({
    creator: "privacyquant",
    title: `${memo.client_name || "Privacy Memo"} — US State Privacy Compliance`,
    styles: {
      default: { document: { run: { font: "Arial", size: 24 } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 320, after: 200 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 28, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 26, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
          ],
        },
        {
          reference: "numbers",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${
                      memo.client_name || ""
                    } — US State Privacy Compliance Memorandum`,
                    size: 18,
                    color: "666666",
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Page ", size: 18, color: "666666" }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: "666666",
                  }),
                  new TextRun({ text: " of ", size: 18, color: "666666" }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: "666666",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function generateMemo(input: MemoInput): Promise<Buffer> {
  const doc = buildDoc(input);
  return Packer.toBuffer(doc);
}

/**
 * Returns a "Month Day, AD YYYY" formatted date string. Defaults to today.
 * Example: "May 13, AD 2026".
 */
export function formatMemoDate(date: Date = new Date()): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, AD ${date.getFullYear()}`;
}
