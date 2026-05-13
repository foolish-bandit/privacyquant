import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerApplicabilityCheckerTool } from "./applicability_checker.js";
import { registerCitationAuditorTool } from "./citation_auditor.js";
import { registerDraftDpaClauseTool } from "./draft_dpa_clause.js";
import { registerDSARWorkflowRouterTool } from "./dsar_workflow_router.js";
import { registerFindPrecedentTool } from "./precedent_finder.js";
import { registerNodeAwareConflictResolverTool } from "./node_aware_conflict_resolver.js";
import { registerNoticeClauseDrafterTool } from "./notice_clause_drafter.js";
import { registerPrivacyExposureScorerTool } from "./privacy_exposure_scorer.js";
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
    registerDSARWorkflowRouterTool(server as Parameters<typeof registerDSARWorkflowRouterTool>[0]);
    registerCitationAuditorTool(server as Parameters<typeof registerCitationAuditorTool>[0]);
    registerNoticeClauseDrafterTool(server as Parameters<typeof registerNoticeClauseDrafterTool>[0]);
    registerPrivacyExposureScorerTool(server as Parameters<typeof registerPrivacyExposureScorerTool>[0]);
    registeredServers.add(this);
  }

  return originalConnect.call(this, transport);
};

await import("./index.js");
