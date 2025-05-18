import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}/mcp`;

// 初始化会话
async function initSession() {
  const initializeRequest = {
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      client: {
        name: '测试客户端',
        version: '1.0.0',
      },
      capabilities: {
        streaming: true,
      },
    },
    id: 1,
  };

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(initializeRequest),
  });

  const data = await response.json();
  const sessionId = response.headers.get('mcp-session-id');
  
  console.log('初始化响应:', data);
  console.log('会话 ID:', sessionId);
  
  return sessionId;
}

// 调用工具
async function callTool(sessionId, toolName, params) {
  const toolRequest = {
    jsonrpc: '2.0',
    method: `mcp.tool.${toolName}`,
    params,
    id: randomUUID(),
  };

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify(toolRequest),
  });

  return await response.json();
}

// 主函数
async function main() {
  try {
    // 初始化会话
    const sessionId = await initSession();
    
    if (!sessionId) {
      console.error('无法获取会话 ID');
      return;
    }

    // 测试获取当前时间
    console.log('\n测试 getCurrentTime:');
    const currentTimeResponse = await callTool(sessionId, 'getCurrentTime', {
      timezone: 'Asia/Shanghai',
    });
    console.log(currentTimeResponse);

    // 测试时区转换
    console.log('\n测试 convertTimezone:');
    const convertResponse = await callTool(sessionId, 'convertTimezone', {
      datetime: new Date().toISOString(),
      sourceTimezone: 'UTC',
      targetTimezone: 'America/New_York',
    });
    console.log(convertResponse);

  } catch (error) {
    console.error('错误:', error);
  }
}

main(); 