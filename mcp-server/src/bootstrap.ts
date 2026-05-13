import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerApplicabilityCheckerTool } from "./applicability_checker.js";
import { registerDraftDpaClauseTool } from "./draft_dpa_clause.js";
import { registerFindPrecedentTool } from "./precedent_finder.js";
import { registerNodeAwareConflictResolverTool } from "./node_aware_conflict_resolver.js";
import { registerWatchLegislationTool } from "./legislation_watcher.js";

const registeredServers = new WeakSet<object>();
const proto = McpServer.prototype as unknown as {
  connect: (transport: unknown) => Promise<void>;
};
const originalConnect = proto.connect;

proto.connect = async function patchedConnect(this: object, transport: unknown): Promise<void> {
  if (!registeredServers.has(this)) {
    const server = this as Parameters<typeof registerDraftDpaClauseTool>[0];
    registerDraftDpaClauseTool(server);
    registerWatchLegislationTool(server as Parameters<typeof registerWatchLegislationTool>[0]);
    registerApplicabilityCheckerTool(server as Parameters<typeof registerApplicabilityCheckerTool>[0]);
    registerFindPrecedentTool(server as Parameters<typeof registerFindPrecedentTool>[0]);
    registerNodeAwareConflictResolverTool(server as Parameters<typeof registerNodeAwareConflictResolverTool>[0]);
    registeredServers.add(this);
  }

  return originalConnect.call(this, transport);
};

await import("./index.js");
