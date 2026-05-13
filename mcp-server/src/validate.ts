/**
 * validate.ts — startup integrity checks for the PrivacyQuant knowledge graph.
 *
 * Called from index.ts after loadIndex(). Returns an array of strings prefixed
 * with either "ERROR:" (blocks startup) or "WARN:" (logged, startup continues).
 *
 * Checks:
 *   a) Node ID uniqueness — detects silent Map overwrites from duplicate YAML IDs
 *   b) Cross-ref integrity — every cross_refs entry resolves to a real node
 *   c) conflict_resolver.ts node_refs — detects stale refs after node renames
 *   d) dsar_router.ts node_refs — same for the DSAR router
 *   e) Required field presence — id, statute, requirement must be non-empty;
 *      section and source_url warn if empty (degrade citation quality)
 */

import { z } from "zod";
import type { StatuteIndex } from "./types.js";
import { getAllConflictNodeRefs } from "./conflict_resolver.js";
import { getAllDsarNodeRefs } from "./dsar_router.js";

// Required fields schema. id/statute/requirement are hard errors if empty;
// section/source_url are present on every StatuteNode (loader defaults them to "")
// so zod just validates the types — emptiness is surfaced as WARNs below.
const RequiredFieldsSchema = z.object({
  id: z.string().min(1, "must not be empty"),
  statute: z.string().min(1, "must not be empty"),
  requirement: z.string().min(1, "must not be empty"),
  section: z.string(),
  source_url: z.string(),
});

export function validateIndex(index: StatuteIndex): string[] {
  const messages: string[] = [];

  // ── a. Node ID uniqueness ─────────────────────────────────────────────────
  // Map.set() silently overwrites duplicates; all[] always grows.
  // A difference means at least one YAML ID collision occurred during loading.
  if (index.all.length !== index.byId.size) {
    messages.push(
      `WARN: ID collision — ${index.all.length} nodes loaded into all[] but only ` +
      `${index.byId.size} unique IDs in byId. At least one YAML file was silently ` +
      `overwritten. Check statutes/ for duplicate node IDs.`
    );
  }

  // ── b. Cross-ref integrity ────────────────────────────────────────────────
  for (const node of index.all) {
    for (const ref of node.cross_refs) {
      if (!index.byId.has(ref)) {
        messages.push(
          `WARN: Broken cross-ref — node "${node.id}" references "${ref}" which is not in the index`
        );
      }
    }
  }

  // ── c. conflict_resolver.ts node_refs ────────────────────────────────────
  for (const ref of getAllConflictNodeRefs()) {
    if (!index.byId.has(ref)) {
      messages.push(
        `WARN: Stale conflict_resolver.ts node_ref — "${ref}" not found in index (node renamed?)`
      );
    }
  }

  // ── d. dsar_router.ts node_refs ──────────────────────────────────────────
  for (const ref of getAllDsarNodeRefs()) {
    if (!index.byId.has(ref)) {
      messages.push(
        `WARN: Stale dsar_router.ts node_ref — "${ref}" not found in index (node renamed?)`
      );
    }
  }

  // ── e. Required field check ───────────────────────────────────────────────
  for (const node of index.all) {
    const result = RequiredFieldsSchema.safeParse(node);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") || "(unknown field)";
        messages.push(
          `ERROR: Node "${node.id || "(no id)"}" — required field "${field}" invalid: ${issue.message}`
        );
      }
    }
    // Warn on empty section / source_url even if the type check passed.
    // These are schema-required but allowed to be "" — empty values degrade citation quality.
    if (!node.section) {
      messages.push(
        `WARN: Node "${node.id}" — empty section; citations referencing this node will be incomplete`
      );
    }
    if (!node.source_url) {
      messages.push(
        `WARN: Node "${node.id}" — empty source_url; source citations will be unavailable`
      );
    }
  }

  return messages;
}
