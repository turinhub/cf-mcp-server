import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export class JinaMCP extends McpAgent {
	server = new McpServer({
		name: "JinaMCP",
		version: "0.1.0",
	});

	async init() {
		// Jina Reader 工具
		this.server.tool(
			"reader", 
			"从URL提取内容", 
			{ 
				url: z.string().describe("需要提取内容的 URL"), 
				token: z.string().optional().describe("可选的 Jina API 令牌"), 
				noCache: z.boolean().optional().default(false).describe("是否跳过缓存，默认为 false") 
			}, 
			async ({ url, token, noCache }) => {
				if (!url) {
					throw new Error('URL is required');
				}

				const jinaReaderUrl = `https://r.jina.ai/${url}`;
				
				const headers: HeadersInit = {};
				
				if (token) {
					headers['Authorization'] = `Bearer ${token}`;
				}
				
				if (noCache) {
					headers['X-No-Cache'] = 'true';
				}
				
				try {
					const response = await fetch(jinaReaderUrl, {
						method: 'GET',
						headers
					});
					
					if (!response.ok) {
						throw new Error(`Jina Reader API error: ${response.status} ${response.statusText}`);
					}
					
					const text = await response.text();
					return {
						content: [{ type: "text", text }],
					};
				} catch (error) {
					console.error('Error calling Jina Reader API:', error);
					throw error;
				}
			}
		);

		// Jina Search 工具
		this.server.tool(
			"search", 
			"使用Jina搜索信息", 
			{ 
				query: z.string().describe("要搜索的查询内容"), 
				token: z.string().describe("必需的 Jina Search API 令牌"), 
				noContent: z.boolean().optional().default(true).describe("是否只返回元数据而不返回内容，默认为 true") 
			}, 
			async ({ query, token, noContent }) => {
				if (!query) {
					throw new Error('Search query is required');
				}
				
				if (!token) {
					throw new Error('Bearer token is required for Jina Search API');
				}

				const jinaSearchUrl = `https://s.jina.ai/?q=${encodeURIComponent(query)}`;
				
				const headers: HeadersInit = {
					'Authorization': `Bearer ${token}`
				};
				
				if (noContent) {
					headers['X-Respond-With'] = 'no-content';
				}
				
				try {
					const response = await fetch(jinaSearchUrl, {
						method: 'GET',
						headers
					});
					
					if (!response.ok) {
						throw new Error(`Jina Search API error: ${response.status} ${response.statusText}`);
					}
					
					const text = await response.text();
					return {
						content: [{ type: "text", text }],
					};
				} catch (error) {
					console.error('Error calling Jina Search API:', error);
					throw error;
				}
			}
		);
	}
}

// 直接导出MCP实例
export default JinaMCP.mount("/sse");
