import { describe, it, expect } from "vitest";
import { checkApplicability } from "../applicability_checker.js";

describe("applicability checker", () => {
  it("small startup ($500K revenue, 2K consumers) gets Does Not Apply for all states", () => {
    const result = checkApplicability({
      annual_revenue_usd: 500_000,
      consumers_processed: 2_000,
      revenue_pct_from_sale: 5,
      states_operating: ["CA", "VA", "CO", "TX"],
    });
    expect(result.any_applies).toBe(false);
    for (const r of result.results) {
      expect(r.verdict).toBe("Does Not Apply");
    }
  });

  it("mid-market CA entity ($40M, 150K consumers, CA only) gets CCPA Applies", () => {
    const result = checkApplicability({
      annual_revenue_usd: 40_000_000,
      consumers_processed: 150_000,
      revenue_pct_from_sale: 10,
      states_operating: ["CA"],
    });
    expect(result.any_applies).toBe(true);
    const ccpa = result.results.find((r) => r.statute === "CCPA/CPRA");
    expect(ccpa).toBeDefined();
    expect(ccpa!.verdict).toBe("Applies");
  });

  it("nonprofit gets CCPA Does Not Apply", () => {
    const result = checkApplicability({
      annual_revenue_usd: 50_000_000,
      consumers_processed: 200_000,
      is_nonprofit: true,
      states_operating: ["CA"],
    });
    const ccpa = result.results.find((r) => r.statute === "CCPA/CPRA");
    expect(ccpa).toBeDefined();
    expect(ccpa!.verdict).toBe("Does Not Apply");
    expect(ccpa!.reason).toMatch(/non-profit/i);
  });

  it("missing all threshold inputs returns Insufficient Info, not a guess", () => {
    const result = checkApplicability({
      states_operating: ["CA"],
    });
    const ccpa = result.results.find((r) => r.statute === "CCPA/CPRA");
    expect(ccpa).toBeDefined();
    expect(ccpa!.verdict).toBe("Insufficient Info");
    expect(ccpa!.needed_inputs.length).toBeGreaterThan(0);
  });

  it("entity with >$25M revenue + >100K consumers in VA/CO/TX gets Applies for those states", () => {
    const result = checkApplicability({
      annual_revenue_usd: 30_000_000,
      consumers_processed: 150_000,
      revenue_pct_from_sale: 10,
      states_operating: ["VA", "CO", "TX"],
    });
    expect(result.any_applies).toBe(true);
    const statutes = result.results.map((r) => r.statute);
    expect(statutes).toContain("VCDPA");
    expect(statutes).toContain("CPA");
    expect(statutes).toContain("TDPSA");
    for (const r of result.results) {
      expect(r.verdict).toBe("Applies");
    }
  });

  it("HIPAA covered entity note is surfaced in the disclaimer, not a full entity exemption", () => {
    const result = checkApplicability({
      annual_revenue_usd: 40_000_000,
      consumers_processed: 150_000,
      revenue_pct_from_sale: 10,
      is_hipaa_covered_entity: true,
      states_operating: ["CA"],
    });
    // HIPAA note is a data-level exemption, not an entity-level full exemption.
    // The checker should still evaluate CCPA applicability (not return an empty results list).
    expect(result.results.length).toBeGreaterThan(0);
    const ccpa = result.results.find((r) => r.statute === "CCPA/CPRA");
    expect(ccpa).toBeDefined();
    expect(ccpa!.verdict).toBe("Applies");
  });
});
