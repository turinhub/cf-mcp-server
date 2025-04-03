# mcp-tavily-api

该 worker 部署了 Tavily API 的封装服务，提供网页内容提取和智能搜索功能。

## 功能

### 内容提取（extract）

`extract` 方法调用 Tavily Extract API 从指定 URL 提取结构化内容：

参数：
- `urls`: 字符串或字符串数组，需要提取内容的网页 URL（必填）
- `token`: 字符串，用于认证的 API key（必填）
- `options`: 可选配置对象：
  - `includeImages`: 布尔值，是否包含图片（默认 false）
  - `extractDepth`: 字符串，提取深度：'basic' 或 'advanced'（默认 'basic'）

返回：
- 包含提取结果的 JSON 对象，结构为：
```typescript
{
  results: Array<{
    url: string;
    raw_content: string;
    images: string[];
  }>;
  failed_results: Array<{
    url: string;
    error: string;
  }>;
  response_time: number;
}
```

### 智能搜索（search）

`search` 方法调用 Tavily Search API 进行智能搜索：

参数：
- `query`: 字符串，搜索查询语句（必填）
- `token`: 字符串，用于认证的 API key（必填）
- `options`: 可选配置对象：
  - `topic`: 搜索类别：'general' 或 'news'（默认 'general'）
  - `searchDepth`: 搜索深度：'basic' 或 'advanced'（默认 'basic'）
  - `maxResults`: 数字，最大结果数（0-20，默认 5）
  - `includeAnswer`: 布尔值或字符串，是否包含AI回答（false/'basic'/'advanced'）
  - `includeRawContent`: 布尔值，是否包含原始内容（默认 false）
  - `includeImages`: 布尔值，是否包含图片结果（默认 false）
  - 更多选项详见源代码

返回：
- 包含搜索结果的 JSON 对象，结构为：
```typescript
{
  query: string;
  answer?: string;
  images: Array<{
    url: string;
    description?: string;
  }>;
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
    raw_content?: string;
  }>;
  response_time: string | number;
}
```

## 客户端配置

### MCP 客户端配置

#### 方法一：使用 workers-mcp CLI（推荐）

```json
{
  "mcpServers": {
    "tavily": {
      "command": "/Users/zhangxudong/Gits/turinhub/cf-mcp-server/mcp-tavily-api/node_modules/.bin/workers-mcp",
      "args": [
        "run",
        "tavily",
        "https://mcp-tavily-api.turinhub.com",
        "/Users/zhangxudong/Gits/turinhub/cf-mcp-server/mcp-tavily-api"
      ],
      "env": {}
    }
  }
}
```

#### 方法二：直接使用 URL（适用于 Claude 等客户端）

```json
{
  "mcpServers": {
    "tavily": {
      "command": "https://mcp-tavily-api.turinhub.com",
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

1. **认证失败**：确保提供了有效的 Tavily API key
2. **速率限制**：Tavily API 有速率限制，请合理控制调用频率
3. **URL格式错误**：确保提供的URL包含协议（http/https）
4. **网络问题**：检查是否能正常访问 api.tavily.com
5. **参数错误**：检查参数是否符合要求（类型、范围等）

## 使用示例

```typescript
// 客户端调用示例
import { MCPClient } from 'workers-mcp'

const client = new MCPClient('https://mcp-tavily-api.turinhub.com')

// 内容提取示例
async function extractContent(urls: string | string[], token: string) {
  try {
    const response = await client.call('extract', {
      urls,
      token,
      options: {
        includeImages: true,
        extractDepth: 'advanced'
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('提取成功:', data.results.length, '条结果')
      return data.results.map(result => ({
        url: result.url,
        content: result.raw_content.substring(0, 100) + '...',
        images: result.images
      }))
    }
  } catch (error) {
    console.error('内容提取失败:', error)
  }
}

// 搜索示例
async function searchWeb(query: string, token: string) {
  try {
    const response = await client.call('search', {
      query,
      token,
      options: {
        topic: 'news',
        maxResults: 3,
        includeAnswer: 'basic',
        includeImages: true
      }
    })

    if (response.ok) {
      const results = await response.json()
      console.log(`找到 ${results.results.length} 条相关结果`)
      console.log('AI回答:', results.answer)
      return results
    }
  } catch (error) {
    console.error('搜索失败:', error)
  }
}

// 调用示例
extractContent('https://example.com', 'your_tavily_token')
searchWeb('人工智能最新进展', 'your_tavily_token')
```

## 高级配置

环境变量（通过 MCP 配置添加）：
- `TAVILY_API_TOKEN`: 默认 API token（可覆盖）
- `REQUEST_TIMEOUT`: 请求超时时间（毫秒，默认 10000）
- `MAX_CONCURRENT_REQUESTS`: 最大并发请求数（默认 5）
