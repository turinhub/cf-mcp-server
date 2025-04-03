# mcp-jina-sse

该 worker 部署了基于 Server-Sent Events (SSE) 的 MCP 服务，集成了 Jina AI 的多项功能，包括内容提取和语义搜索功能。

## 功能

### 内容提取（reader）

`reader` 工具调用 Jina Reader API 进行内容提取，支持以下参数：

参数：
- `url`: 字符串，需要提取内容的网页 URL（必填）
- `token`: 字符串，用于认证的 Bearer token（可选，用于提升速率限制）
- `noCache`: 布尔值，是否绕过缓存（默认 false 使用缓存）

返回：
- 提取的文本内容，格式为 `{ content: [{ type: "text", text: "提取的内容" }] }`

### 语义搜索（search）

`search` 工具调用 Jina Search API 进行语义搜索，支持以下参数：

参数：
- `query`: 字符串，搜索查询语句（必填）
- `token`: 字符串，用于认证的 Bearer token（必填）
- `noContent`: 布尔值，是否排除内容仅返回元数据（默认 true 仅返回元数据）

返回：
- 搜索结果文本，格式为 `{ content: [{ type: "text", text: "搜索结果" }] }`

## 客户端配置

### MCP 客户端配置

```json
{
  "mcpServers": {
    "jinaSSE": {
      "type": "sse",
      "url": "https://mcp-jina-sse.turinhub.com/sse"
    }
  }
}
```

### 故障排除

常见问题处理：

1. **连接超时**：确保 worker 服务正在运行，并且 SSE 端点可访问
2. **认证失败**：如需使用 token 认证，请到 [Jina AI](https://jina.ai/) 申请 API key
3. **内容提取异常**：检查目标网页是否包含 robots.txt 限制
4. **缓存问题**：设置 noCache: true 强制刷新内容
5. **SSE 连接断开**：检查网络连接和防火墙设置，SSE 需要保持长连接

## 高级配置

环境变量（通过 MCP 配置添加）：
- `JINA_API_KEY`: 用于认证的 API token（必填）。可以在调用 API 时通过参数传递，或在 MCP 配置的 env 中设置。如果在 env 中设置了此变量，则调用 API 时可以省略 token 参数。

环境变量的优先级：
1. 方法调用时提供的 token 参数（优先级最高）
2. 环境变量 JINA_API_KEY（当方法调用未提供 token 时使用）

### 获取 Jina API 密钥

1. 注册/登录 [Jina AI](https://jina.ai/) 账户
2. 进入开发者设置页面
3. 创建新的 API 密钥
4. 将密钥添加到 MCP 配置的 env 部分

## 与 mcp-jina-api 的区别

- **mcp-jina-sse**: 使用 SSE 协议实现 MCP，适用于需要实时推送数据的场景，如流式输出
- **mcp-jina-api**: 使用标准 HTTP 请求实现 MCP，适用于简单的请求/响应模式

两者功能相同，但传输机制和使用场景有所不同。根据您的需求选择适合的服务。 