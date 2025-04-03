# mcp-jina-api

该 worker 部署了一个调用 Jina Reader API 的服务，用于从指定 URL 提取结构化内容。

## 功能

### 内容提取（reader）

`reader` 方法调用 Jina Reader API 进行内容提取，支持以下参数：

参数：
- `url`: 字符串，需要提取内容的网页 URL（必填）
- `token`: 字符串，用于认证的 Bearer token（可选，用于提升速率限制）
- `noCache`: 布尔值，是否绕过缓存（默认 false 使用缓存）

返回：
- 包含结构化内容的 JSON 对象，包含标题、正文、关键信息等

### 语义搜索（search）

`search` 方法调用 Jina Search API 进行语义搜索，支持以下参数：

参数：
- `query`: 字符串，搜索查询语句（必填）
- `token`: 字符串，用于认证的 Bearer token（必填）
- `noContent`: 布尔值，是否排除内容仅返回元数据（默认 false 返回完整内容）

返回：
- 包含搜索结果的 JSON 对象，包含以下字段：
  - `results`: 匹配文档数组
  - `scores`: 相关性评分（0-1）
  - `engine`: 使用的搜索引擎类型

## 客户端配置

### MCP 客户端配置

```json
{
  "mcpServers": {
    "jinaReader": {
      "command": "/Users/zhangxudong/Gits/turinhub/cf-mcp-server/mcp-jina-api/node_modules/.bin/workers-mcp",
      "args": [
        "run",
        "jinaReader", 
        "https://mcp-jina-api.turinhub.com",
        "/Users/zhangxudong/Gits/turinhub/cf-mcp-server/mcp-jina-api"
      ],
      "env": {
        "JINA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 故障排除

常见问题处理：

1. **连接超时**：确保 worker 服务正在运行（端口 8787 可用）
2. **认证失败**：如需使用 token 认证，请到 [Jina AI](https://jina.ai/) 申请 API key
3. **内容提取异常**：检查目标网页是否包含 robots.txt 限制
4. **缓存问题**：设置 noCache: true 强制刷新内容
5. **编码问题**：部分网页需指定 charset，可在返回头中查看 Content-Type

## 高级配置

环境变量（通过 MCP 配置添加）：
- `JINA_API_KEY`: 用于认证的 API token（必填）。可以在调用 API 时通过参数传递，或在 MCP 配置的 env 中设置。如果在 env 中设置了此变量，则调用 API 时可以省略 token 参数。
- `CACHE_TTL`: 缓存时间（秒），默认 3600
- `MAX_CONTENT_LENGTH`: 最大处理内容长度（字符），默认 100000

环境变量的优先级：
1. 方法调用时提供的 token 参数（优先级最高）
2. 环境变量 JINA_API_KEY（当方法调用未提供 token 时使用）

### 获取 Jina API 密钥

1. 注册/登录 [Jina AI](https://jina.ai/) 账户
2. 进入开发者设置页面
3. 创建新的 API 密钥
4. 将密钥添加到 MCP 配置的 env 部分
