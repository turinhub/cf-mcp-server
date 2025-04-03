import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export class JinaMCP extends McpAgent {
	server = new McpServer({
		name: "JinaMCP",
		version: "0.1.0",
	});

	async init() {
		this.server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
			content: [{ type: "text", text: String(a + b) }],
		}));
	}
}

// 直接导出MCP实例
export default JinaMCP.mount("/sse");
