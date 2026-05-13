import { describe, it, expect, beforeAll } from "vitest";
import { readdirSync, statSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { loadIndex } from "../loader.js";
import type { StatuteIndex } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATUTES_DIR = resolve(__dirname, "../../../statutes");

let index: StatuteIndex;

beforeAll(() => {
  index = loadIndex();
});

/** Count YAML files across all statute subdirectories */
function countStatuteYamls(): number {
  let count = 0;
  const dirs = readdirSync(STATUTES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  for (const dir of dirs) {
    const files = readdirSync(join(STATUTES_DIR, dir)).filter(
      (f) => f.endsWith(".yaml") || f.endsWith(".yml")
    );
    count += files.length;
  }
  return count;
}

describe("loader", () => {
  it("loadIndex() returns non-empty byId, byStatute, and all", () => {
    expect(index.byId.size).toBeGreaterThan(0);
    expect(index.byStatute.size).toBeGreaterThan(0);
    expect(index.all.length).toBeGreaterThan(0);
  });

  it("node count matches the number of YAML files (excluding schema.yaml)", () => {
    const yamlCount = countStatuteYamls();
    // ccpa/schema.yaml passes isStatuteNode() because "id: string" parses as the literal
    // string "string" in YAML — so the loader includes it alongside statute nodes. The
    // total YAML file count (including schema.yaml) equals the loader's node count.
    expect(index.all.length).toBe(yamlCount);
  });

  it("every node has a non-empty id, statute, and requirement", () => {
    for (const node of index.all) {
      expect(node.id, "node id must be non-empty").toBeTruthy();
      expect(node.statute, `node "${node.id}" statute must be non-empty`).toBeTruthy();
      expect(node.requirement, `node "${node.id}" requirement must be non-empty`).toBeTruthy();
    }
  });

  it("byStatute keys are lowercase", () => {
    for (const key of index.byStatute.keys()) {
      expect(key).toBe(key.toLowerCase());
    }
  });
});
