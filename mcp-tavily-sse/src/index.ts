/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// 确保 TavilyMCP 类是一个 Durable Object
export class TavilyMCP extends McpAgent {
	server = new McpServer({
		name: "TavilyMCP",
		version: "0.1.0",
	});

	async init() {
		// Tavily Search 工具
		this.server.tool(
			"search",
			"使用Tavily搜索信息",
			{
				query: z.string().describe("要搜索的查询内容"),
				token: z.string().describe("必需的 Tavily API 令牌"),
				searchDepth: z.enum(["basic", "advanced"]).optional().default("basic").describe("搜索深度，可选值为 basic 或 advanced，默认为 basic"),
				includeRawContent: z.boolean().optional().default(false).describe("是否包含原始内容，默认为 false"),
				includeImages: z.boolean().optional().default(false).describe("是否包含图片，默认为 false"),
				maxResults: z.number().optional().default(5).describe("返回结果的最大数量，默认为 5")
			},
			async ({ query, token, searchDepth, includeRawContent, includeImages, maxResults }) => {
				if (!query) {
					throw new Error('Search query is required');
				}
				
				if (!token) {
					throw new Error('API token is required for Tavily Search API');
				}

				const tavilySearchUrl = "https://api.tavily.com/search";
				
				try {
					const response = await fetch(tavilySearchUrl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`
						},
						body: JSON.stringify({
							query,
							search_depth: searchDepth,
							include_raw_content: includeRawContent,
							include_images: includeImages,
							max_results: maxResults
						})
					});
					
					if (!response.ok) {
						throw new Error(`Tavily Search API error: ${response.status} ${response.statusText}`);
					}
					
					const data = await response.json();
					return {
						content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
					};
				} catch (error) {
					console.error('Error calling Tavily Search API:', error);
					throw error;
				}
			}
		);

		// Tavily Extract 工具
		this.server.tool(
			"extract",
			"从URL提取内容",
			{
				urls: z.string().describe("需要提取内容的URL或URLs"),
				token: z.string().describe("必需的 Tavily API 令牌"),
				includeImages: z.boolean().optional().default(false).describe("是否包含图片，默认为 false"),
				extractDepth: z.enum(["basic", "advanced"]).optional().default("basic").describe("提取深度，可选值为 basic 或 advanced，默认为 basic"),
				includeRawContent: z.boolean().optional().default(false).describe("是否包含原始内容，默认为 false")
			},
			async ({ urls, token, includeImages, extractDepth, includeRawContent }) => {
				if (!urls) {
					throw new Error('URLs is required');
				}
				
				if (!token) {
					throw new Error('API token is required for Tavily Extract API');
				}

				const tavilyExtractUrl = "https://api.tavily.com/extract";
				
				try {
					const response = await fetch(tavilyExtractUrl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`
						},
						body: JSON.stringify({
							urls,
							include_images: includeImages,
							extract_depth: extractDepth,
							include_raw_content: includeRawContent
						})
					});
					
					if (!response.ok) {
						throw new Error(`Tavily Extract API error: ${response.status} ${response.statusText}`);
					}
					
					const data = await response.json();
					return {
						content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
					};
				} catch (error) {
					console.error('Error calling Tavily Extract API:', error);
					throw error;
				}
			}
		);
	}
}

// 直接导出MCP实例
export default TavilyMCP.mount("/sse");
