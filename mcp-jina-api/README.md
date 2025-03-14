# mcp-jina-api

该 worker 部署了一个调用 Jina Reader API 的服务，用于从指定 URL 提取结构化内容。

## 功能

`reader` 方法调用 Jina Reader API 进行内容提取，支持以下参数：

参数：
- `url`: 字符串，需要提取内容的网页 URL（必填）
- `token`: 字符串，用于认证的 Bearer token（可选，用于提升速率限制）
- `noCache`: 布尔值，是否绕过缓存（默认 false 使用缓存）

返回：
- 包含结构化内容的 JSON 对象，包含标题、正文、关键信息等

## 客户端配置

### MCP 客户端配置

#### 方法一：使用 workers-mcp CLI（推荐）

```json
{
  "mcpServers": {
    "jinaReader": {
      "command": "/Users/zhangxudong/Gits/turinhub/cf-mcp-server/mcp-jina-api/node_modules/.bin/workers-mcp",
      "args": [
        "run",
        "jinaReader", 
        "http://localhost:8787",
        "/Users/zhangxudong/Gits/turinhub/cf-mcp-server/mcp-jina-api"
      ],
      "env": {}
    }
  }
}
```

#### 方法二：直接使用 URL（适用于 Claude 等客户端）

```json{
  "mcpServers": {
    "jinaReader": {
      "command": "https://mcp-jina-api.turinhub.com",
      "args": [],
      "env": {},
      "disabled": false,
      "autoApprove": []
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

### 使用示例

```typescript
// 客户端调用示例
import { MCPClient } from 'workers-mcp'

const client = new MCPClient('https://mcp-jina-api.turinhub.com')

async function fetchArticle(url: string) {
  try {
    const response = await client.call('reader', {
      url,
      noCache: true
    })

    if (response.ok) {
      const article = await response.json()
      console.log('提取成功:', article.title)
      return {
        content: article.content,
        highlights: article.keyPoints
      }
    }
  } catch (error) {
    console.error('内容提取失败:', error)
  }
}

// 调用示例
fetchArticle('https://example.com/news/2024-tech-trends')
```

## 高级配置

环境变量（通过 MCP 配置添加）：
- `JINA_API_TOKEN`: 用于认证的 API token
- `CACHE_TTL`: 缓存时间（秒），默认 3600
- `MAX_CONTENT_LENGTH`: 最大处理内容长度（字符），默认 100000
