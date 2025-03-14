# mcp-image-generation

该 worker 部署了一个 generateImage 方法，使用 cloudflare 的 worker AI 生成图片。

## 功能

`generateImageWithFLux1Schnell` 方法使用 Cloudflare 的 `@cf/black-forest-labs/flux-1-schnell` 模型生成图像。

参数：
- `prompt`: 字符串，描述你想要生成的图像（英文效果更好）
- `steps`: 数字，扩散步数，值越高质量越好但耗时更长，必须在 4 到 8 之间

返回：
- 一个包含 JPEG 格式图像的 Response 对象

## 客户端配置

### MCP 客户端配置

对于 [Windsurf](https://github.com/cloudflare/windsurf) 和其他 MCP 客户端，请更新你的配置文件，按照以下格式添加你的 worker：

#### 方法一：使用 workers-mcp CLI（推荐）

```json
{
  "mcpServers": {
    "generateImage": {
      "command": "/Users/zhangxudong/Gits/turinhub/cf-mcp-server/mcp-image-generation/node_modules/.bin/workers-mcp",
      "args": [
        "run",
        "generateImage",
        "https://mcp-image-generation.turinhub.com",
        "/Users/zhangxudong/Gits/turinhub/cf-mcp-server/mcp-image-generation"
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
    "mcp-image-generation": {
      "command": "https://mcp-image-generation.turinhub.com",
      "args": [],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### 故障排除

如果连接失败，请检查以下几点：

1. **URL 是否正确**：确保 worker 的 URL 是正确的，并且 worker 已经成功部署
2. **SHARED_SECRET 是否匹配**：确保客户端和服务端使用相同的 SHARED_SECRET
3. **网络连接**：确保你的网络可以访问 worker URL
4. **CORS 设置**：如果从浏览器调用，确保 worker 允许跨域请求
5. **命令路径**：如果使用方法一，确保 workers-mcp 命令路径正确

### 使用示例

```typescript
// 客户端代码示例
import { MCPClient } from 'workers-mcp'

// 创建 MCP 客户端
const client = new MCPClient('https://mcp-image-generation.turinhub.com')

// 调用 generateImage 方法
async function generateAndSaveImage(prompt: string, steps: number = 8) {
  try {
    const imageResponse = await client.call('generateImage', prompt, steps)
    
    // 处理返回的图像
    if (imageResponse.ok) {
      const imageBlob = await imageResponse.blob()
      // 这里可以保存图像或在页面上显示
      console.log('图像生成成功！')
      return imageBlob
    } else {
      console.error('生成图像失败:', await imageResponse.text())
    }
  } catch (error) {
    console.error('调用 MCP 服务出错:', error)
  }
}

// 使用示例
generateAndSaveImage('A cute cat playing under the sunshine.', 8)
```