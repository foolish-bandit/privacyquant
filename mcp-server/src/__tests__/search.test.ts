import { describe, it, expect, beforeAll } from "vitest";
import { loadIndex } from "../loader.js";
import { searchNodes } from "../search.js";
import { BM25Index } from "../semantic_search.js";
import type { StatuteIndex } from "../types.js";

let index: StatuteIndex;
let bm25: BM25Index;

beforeAll(() => {
  index = loadIndex();
  bm25 = new BM25Index(index);
});

describe("keyword search (searchNodes)", () => {
  it("query 'deletion' returns ccpa.rights.deletion in the top 5", () => {
    const results = searchNodes(index, { query: "deletion", limit: 5 });
    const ids = results.map((r) => r.node.id);
    expect(ids).toContain("ccpa.rights.deletion");
  });

  it("query 'sensitive data consent' returns results from multiple statutes", () => {
    const results = searchNodes(index, { query: "sensitive data consent", limit: 10 });
    expect(results.length).toBeGreaterThan(0);
    const statutes = new Set(results.map((r) => r.node.statute));
    expect(statutes.size).toBeGreaterThan(1);
  });

  it("statute filter restricts results to that statute only", () => {
    const results = searchNodes(index, {
      query: "deletion right to delete",
      statute: "CCPA/CPRA",
      limit: 10,
    });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.node.statute.toLowerCase()).toContain("ccpa");
    }
  });

  it("empty query returns no results (not an error)", () => {
    const results = searchNodes(index, { query: "" });
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});

describe("BM25 search (semantic_search)", () => {
  it("search for 'erasure' matches deletion nodes (morphological variant via contract_signals)", () => {
    const results = bm25.search("erasure", undefined, 10);
    expect(results.length).toBeGreaterThan(0);
    const ids = results.map((r) => r.node.id);
    // Deletion nodes across statutes contain "right to erasure" in contract_signals —
    // the BM25 index picks up "erasure" as a term and matches the query directly.
    const hasDeletionNode = ids.some((id) => id.includes("deletion"));
    expect(hasDeletionNode).toBe(true);
  });
});
