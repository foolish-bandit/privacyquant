import { describe, it, expect } from "vitest";
import { routeDSAR } from "../dsar_router.js";

describe("DSAR router", () => {
  it("Iowa deletion returns 90-day initial deadline (not 45)", () => {
    const result = routeDSAR("IA", "deletion");
    expect(result.must_respond).toBe(true);
    expect(result.applicable_statute).not.toBeNull();
    const deletion = result.applicable_statute!.rights.deletion;
    expect(deletion).toBeDefined();
    expect(deletion!.exists).toBe(true);
    expect(deletion!.initial_deadline_days).toBe(90);
    expect(result.directive).toContain("90 calendar days");
  });

  it("Utah correction returns right does not exist", () => {
    const result = routeDSAR("UT", "correction");
    expect(result.must_respond).toBe(false);
    expect(result.applicable_statute).not.toBeNull();
    const correction = result.applicable_statute!.rights.correction;
    expect(correction).toBeDefined();
    expect(correction!.exists).toBe(false);
    expect(result.directive).toMatch(/does NOT exist/i);
  });

  it("California deletion returns 45-day initial deadline with 45-day extension to 90 days", () => {
    const result = routeDSAR("CA", "deletion");
    expect(result.must_respond).toBe(true);
    expect(result.applicable_statute).not.toBeNull();
    const deletion = result.applicable_statute!.rights.deletion;
    expect(deletion).toBeDefined();
    expect(deletion!.exists).toBe(true);
    expect(deletion!.initial_deadline_days).toBe(45);
    expect(deletion!.max_deadline_days).toBe(90);
    expect(result.directive).toContain("45 calendar days");
    expect(result.directive).toContain("extendable once by 45 days");
  });

  it("California appeal returns no appeal right", () => {
    const result = routeDSAR("CA", "appeal");
    expect(result.must_respond).toBe(false);
    expect(result.applicable_statute).not.toBeNull();
    const appeal = result.applicable_statute!.rights.appeal;
    expect(appeal).toBeDefined();
    expect(appeal!.exists).toBe(false);
    expect(result.directive).toMatch(/does NOT exist/i);
  });

  it("State with no privacy law (AL) returns null applicable_statute", () => {
    const result = routeDSAR("AL", "deletion");
    expect(result.applicable_statute).toBeNull();
    expect(result.must_respond).toBe(false);
    expect(result.directive).toMatch(/no comprehensive state privacy law/i);
  });

  it("Kentucky correction returns right does not exist", () => {
    const result = routeDSAR("KY", "correction");
    expect(result.must_respond).toBe(false);
    expect(result.applicable_statute).not.toBeNull();
    const correction = result.applicable_statute!.rights.correction;
    expect(correction).toBeDefined();
    expect(correction!.exists).toBe(false);
    expect(result.directive).toMatch(/does NOT exist/i);
  });
});
