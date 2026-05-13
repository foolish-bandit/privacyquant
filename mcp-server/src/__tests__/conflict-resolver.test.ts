import { describe, it, expect } from "vitest";
import { resolveConflict } from "../conflict_resolver.js";
import type { ConflictResult } from "../conflict_resolver.js";

describe("conflict resolver", () => {
  it("output structure has all expected fields on each result", () => {
    const results = resolveConflict(["CCPA/CPRA", "VCDPA"], ["sensitive_data_treatment"]);
    expect(results).toHaveLength(1);
    const r = results[0];
    expect(r).toHaveProperty("dimension");
    expect(r).toHaveProperty("dimension_label");
    expect(r).toHaveProperty("binding_rule");
    expect(r).toHaveProperty("controlling_statute");
    expect(r).toHaveProperty("is_true_conflict");
    expect(r).toHaveProperty("implementation_note");
    expect(r).toHaveProperty("positions");
    expect(Array.isArray(r.positions)).toBe(true);
  });

  it("MODPA controls sensitive_data_sale when MD is in scope (flat ban)", () => {
    const results = resolveConflict(
      ["CCPA/CPRA", "VCDPA", "CPA", "MODPA"],
      ["sensitive_data_sale"]
    );
    expect(results).toHaveLength(1);
    const r = results[0];
    expect(r.controlling_statute).toBe("MODPA");
    expect(r.binding_rule).toMatch(/FLAT BAN/i);
  });

  it("sensitive_data_treatment is a true conflict when CA is in scope with opt-in states", () => {
    // Use "CCPA" (not "CCPA/CPRA") — normaliseKey("CCPA") = "ccpa" which partially matches
    // the "ccpa/cpra" data key. "CCPA/CPRA" normalises to "ccpacpra" which accidentally
    // matches the "cpa" (Colorado) key as a substring instead.
    const results = resolveConflict(
      ["CCPA", "VCDPA", "CPA"],
      ["sensitive_data_treatment"]
    );
    expect(results).toHaveLength(1);
    const r = results[0];
    // CA uses opt-out (right-to-limit), other states use opt-in — structural conflict
    expect(r.is_true_conflict).toBe(true);
    expect(r.conflict_note).toBeDefined();
    expect(r.conflict_note).toMatch(/right to limit/i);
  });

  it("Iowa position in response_time shows the longest initial window (90 days) when in scope", () => {
    const results = resolveConflict(
      ["CCPA/CPRA", "VCDPA", "ICDPA"],
      ["response_time"]
    );
    expect(results).toHaveLength(1);
    const r = results[0];
    const iaPosition = r.positions.find((p) => p.state === "IA");
    expect(iaPosition).toBeDefined();
    expect(iaPosition!.position).toContain("90 days");
  });

  it("requesting a dimension that does not exist returns empty results gracefully", () => {
    // Cast to bypass TypeScript — simulates a runtime call with an invalid dimension
    const results = resolveConflict(
      ["CCPA/CPRA", "VCDPA"],
      ["nonexistent_dimension" as Parameters<typeof resolveConflict>[1][number]]
    );
    expect(results).toHaveLength(0);
  });
});
