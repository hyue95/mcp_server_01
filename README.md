# MCP 时间服务器

基于 Model Context Protocol (MCP) 的时间服务工具。

## 功能

- 提供获取当前时间的工具
- 支持时区转换功能
- 使用 TypeScript 编写
- 基于 MCP 协议，可与 LLM 应用集成

## 安装

```bash
# 克隆项目
git clone <repository-url>
cd mcp-time-server

# 安装依赖
npm install

# 构建项目
npm run build
```

## 使用方法

启动服务器：

```bash
npm start
```

服务器默认运行在 3000 端口，可通过环境变量 `PORT` 修改。

## API 端点

- `GET /` - 服务器主页和文档
- `POST /mcp` - MCP 消息处理端点
- `GET /mcp` - SSE 服务器事件
- `DELETE /mcp` - 会话终止

## MCP 工具说明

### 1. getCurrentTime

获取当前时间，可指定时区。

参数：
- `timezone` (可选): 时区标识（例如: 'Asia/Shanghai', 'America/New_York'）

### 2. convertTimezone

在不同时区之间转换时间。

参数：
- `datetime` (可选): ISO 8601 格式的日期时间字符串，不提供则使用当前时间
- `sourceTimezone`: 源时区，默认为 'UTC'
- `targetTimezone`: 目标时区，默认为 'UTC'

## 配置为 MCP 服务

可以通过以下方式配置为 MCP 服务：

```json
"mcpServers": {
  {
    "type": "sse",
    "url": "https://your-server-url/mcp"
  }
}
```

## 开发

```bash
# 启动开发模式
npm run dev
```

## 许可证

MIT 