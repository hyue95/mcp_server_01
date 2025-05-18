/**
 * MCP 时间服务器
 * 提供获取当前时间和时区转换的工具
 */

import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { getCurrentTime, convertTimezone } from './timeService.js';

// 创建 Express 应用
const app = express();
app.use(express.json());

// 定义服务器端口
const PORT = process.env.PORT || 3000;

// 存储 MCP 传输对象，基于会话 ID
const transports: Record<string, StreamableHTTPServerTransport> = {};

/**
 * 创建 MCP 服务器
 * 配置时间相关工具
 */
const createMcpServer = () => {
  // 初始化 MCP 服务器
  const server = new McpServer({
    name: '时间服务器',
    version: '1.0.0',
  });

  // 添加获取当前时间工具
  server.tool(
    'getCurrentTime',
    { 
      timezone: z.string().optional().describe('时区，例如 "Asia/Shanghai"') 
    },
    async ({ timezone }) => {
      console.log(`[${new Date().toISOString()}] 工具调用: getCurrentTime, 参数: ${JSON.stringify({ timezone })}`);
      return {
        content: [{ 
          type: 'text', 
          text: getCurrentTime(timezone) 
        }]
      };
    }
  );

  // 添加时区转换工具
  server.tool(
    'convertTimezone',
    {
      datetime: z.string().optional().describe('ISO 8601 格式的日期时间，如不提供则使用当前时间'),
      sourceTimezone: z.string().default('UTC').describe('源时区'),
      targetTimezone: z.string().default('UTC').describe('目标时区')
    },
    async ({ datetime, sourceTimezone, targetTimezone }) => {
      console.log(`[${new Date().toISOString()}] 工具调用: convertTimezone, 参数: ${JSON.stringify({ datetime, sourceTimezone, targetTimezone })}`);
      return {
        content: [{ 
          type: 'text', 
          text: convertTimezone(datetime, sourceTimezone, targetTimezone) 
        }]
      };
    }
  );

  return server;
};

// 处理 MCP 请求
app.post('/mcp', async (req, res) => {
  // 检查是否有会话 ID
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // 复用现有的传输
    transport = transports[sessionId];
    console.log(`[${new Date().toISOString()}] 收到来自会话 ${sessionId} 的请求`);
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // 新初始化请求
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (newSessionId) => {
        // 存储传输对象
        transports[newSessionId] = transport;
        console.log(`[${new Date().toISOString()}] 新客户端连接，会话 ID: ${newSessionId}`);
      }
    });

    // 关闭时清理
    transport.onclose = () => {
      if (transport.sessionId) {
        console.log(`[${new Date().toISOString()}] 客户端断开连接，会话 ID: ${transport.sessionId}`);
        delete transports[transport.sessionId];
      }
    };

    // 创建并连接服务器
    const server = createMcpServer();
    await server.connect(transport);
  } else {
    // 无效请求
    console.log(`[${new Date().toISOString()}] 收到无效请求: 未提供有效的会话 ID`);
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: '请求错误：未提供有效的会话 ID',
      },
      id: null,
    });
    return;
  }

  // 处理请求
  await transport.handleRequest(req, res, req.body);
});

// 处理 GET 和 DELETE 请求的通用函数
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    console.log(`[${new Date().toISOString()}] 会话请求错误: 无效或缺失会话 ID`);
    res.status(400).send('无效或缺失会话 ID');
    return;
  }
  
  const transport = transports[sessionId];
  console.log(`[${new Date().toISOString()}] 处理会话 ${sessionId} 的 ${req.method} 请求`);
  await transport.handleRequest(req, res);
};

// 通过 SSE 处理服务器到客户端的通知
app.get('/mcp', handleSessionRequest);

// 处理会话终止
app.delete('/mcp', handleSessionRequest);

// 首页路由
app.get('/', (req, res) => {
  console.log(`[${new Date().toISOString()}] 访问首页`);
  res.send(`
    <html>
      <head>
        <title>MCP 时间服务器</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>MCP 时间服务器</h1>
        <p>这是一个基于 Model Context Protocol (MCP) 的时间服务器。</p>
        <h2>可用工具:</h2>
        <h3>1. getCurrentTime</h3>
        <p>获取当前时间，可指定时区</p>
        <pre>
参数:
  timezone - 可选，时区标识（例如: 'Asia/Shanghai', 'America/New_York'）
        </pre>
        <h3>2. convertTimezone</h3>
        <p>在不同时区之间转换时间</p>
        <pre>
参数:
  datetime - 可选，ISO 8601 格式的日期时间字符串，不提供则使用当前时间
  sourceTimezone - 源时区，默认为 'UTC'
  targetTimezone - 目标时区，默认为 'UTC'
        </pre>
        <p>此服务器遵循 MCP 协议规范，可使用任何 MCP 客户端进行连接。</p>
      </body>
    </html>
  `);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] MCP 时间服务器已启动，运行在端口 ${PORT}`);
  console.log(`访问 http://localhost:${PORT} 了解更多信息`);
}); 