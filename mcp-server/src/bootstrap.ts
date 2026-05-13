import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDraftDpaClauseTool } from "./draft_dpa_clause.js";

const registeredServers = new WeakSet<object>();
const proto = McpServer.prototype as unknown as {
  connect: (transport: unknown) => Promise<void>;
};
const originalConnect = proto.connect;

proto.connect = async function patchedConnect(this: object, transport: unknown): Promise<void> {
  if (!registeredServers.has(this)) {
    registerDraftDpaClauseTool(this as Parameters<typeof registerDraftDpaClauseTool>[0]);
    registeredServers.add(this);
  }

  return originalConnect.call(this, transport);
};

await import("./index.js");
