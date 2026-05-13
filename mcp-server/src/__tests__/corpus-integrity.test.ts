import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORPUS_PATH = resolve(__dirname, "../../../references/enforcement_actions.json");

interface EnforcementAction {
  id: string;
  case_name: string;
  year: number;
  regulator: string;
  respondent: string;
  statutes: string[];
  violation_theories: string[];
  factual_pattern: string;
  monetary_amount_usd: number | null;
  [key: string]: unknown;
}

interface CorpusMeta {
  corpus_version: string;
  violation_theory_tags: string[];
  [key: string]: unknown;
}

interface EnforcementCorpus {
  _meta: CorpusMeta;
  actions: EnforcementAction[];
}

let corpus: EnforcementCorpus;

beforeAll(() => {
  const raw = readFileSync(CORPUS_PATH, "utf8");
  corpus = JSON.parse(raw) as EnforcementCorpus;
});

describe("corpus integrity", () => {
  it("corpus loads and has _meta with corpus_version and violation_theory_tags", () => {
    expect(corpus).toBeDefined();
    expect(corpus._meta).toBeDefined();
    expect(typeof corpus._meta.corpus_version).toBe("string");
    expect(corpus._meta.corpus_version.length).toBeGreaterThan(0);
    expect(Array.isArray(corpus._meta.violation_theory_tags)).toBe(true);
    expect(corpus._meta.violation_theory_tags.length).toBeGreaterThan(0);
  });

  it("all action IDs are unique", () => {
    const ids = corpus.actions.map((a) => a.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all action IDs match the slug pattern /^[a-z0-9][a-z0-9-]*[a-z0-9]$/", () => {
    const pattern = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    for (const action of corpus.actions) {
      expect(action.id, `id "${action.id}" failed slug pattern`).toMatch(pattern);
    }
  });

  it("every action has required fields: id, case_name, year, regulator, respondent, statutes, violation_theories, factual_pattern", () => {
    const required: (keyof EnforcementAction)[] = [
      "id",
      "case_name",
      "year",
      "regulator",
      "respondent",
      "statutes",
      "violation_theories",
      "factual_pattern",
    ];
    for (const action of corpus.actions) {
      for (const field of required) {
        expect(action[field], `action "${action.id}" missing field "${field}"`).toBeDefined();
      }
    }
  });

  it("every violation_theories entry is in the _meta.violation_theory_tags taxonomy", () => {
    const validTags = new Set(corpus._meta.violation_theory_tags);
    for (const action of corpus.actions) {
      for (const tag of action.violation_theories) {
        expect(
          validTags.has(tag),
          `action "${action.id}" has unknown violation theory "${tag}"`
        ).toBe(true);
      }
    }
  });

  it("no enforcement action has an empty violation_theories array", () => {
    // Advisory entries (id starts with "advisory-") are not real enforcement actions
    // and intentionally carry empty violation_theories arrays.
    const enforcementActions = corpus.actions.filter(
      (a) => !a.id.startsWith("advisory-")
    );
    for (const action of enforcementActions) {
      expect(
        action.violation_theories.length,
        `action "${action.id}" has empty violation_theories`
      ).toBeGreaterThan(0);
    }
  });

  it("monetary_amount_usd is either null or a non-negative number", () => {
    // null = no monetary penalty imposed; 0 = defense win ($0 in penalties);
    // positive = settlement or civil penalty amount.
    for (const action of corpus.actions) {
      const amount = action.monetary_amount_usd;
      if (amount !== null) {
        expect(typeof amount, `action "${action.id}" monetary_amount_usd is not a number`).toBe(
          "number"
        );
        expect(
          amount,
          `action "${action.id}" monetary_amount_usd is negative`
        ).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
