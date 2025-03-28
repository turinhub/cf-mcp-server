# CF-MCP服务器项目概述

## 项目目标
开发一组可扩展的Model Context Protocol (MCP)服务器，提供标准化的AI服务接口

## 核心组件
1. **mcp-image-generation**
   - 功能：图像生成API服务
   - 技术：Cloudflare Workers + AI模型集成

2. **mcp-jina-api** 
   - 功能：Jina搜索API封装
   - 技术：Jina AI集成

3. **mcp-tavily-api**
   - 功能：Tavily搜索API封装
   - 技术：Tavily搜索集成

## 共享架构
- 统一使用TypeScript开发
- 基于Cloudflare Workers部署
- 标准化测试框架(Vitest)
- 共享配置管理(wrangler.jsonc)
