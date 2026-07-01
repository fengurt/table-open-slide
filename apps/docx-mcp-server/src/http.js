#!/usr/bin/env node
/**
 * docx-master MCP server — streamable-HTTP transport for remote agents.
 *
 * Stateless: a fresh server + transport is created per request (no session
 * store), which is simple and robust behind a reverse proxy / load balancer.
 *
 * Auth: shares DOCX_STUDIO_TOKEN with the web studio. When set, every /mcp
 * request must send `Authorization: Bearer <token>`. When unset, auth is off
 * (local dev) and a warning is logged.
 *
 * Env:
 *   DOCX_MCP_HTTP_PORT   listen port (default 3334)
 *   DOCX_MCP_HTTP_HOST   bind host (default 0.0.0.0)
 *   DOCX_STUDIO_TOKEN    shared bearer token
 */
import { timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { createDocxMcpServer } from './server-factory.js';

const PORT = Number(process.env.DOCX_MCP_HTTP_PORT ?? 3334) || 3334;
const HOST = process.env.DOCX_MCP_HTTP_HOST ?? '0.0.0.0';
const TOKEN = process.env.DOCX_STUDIO_TOKEN?.trim() ?? '';
const MAX_BODY_BYTES =
  Number(process.env.DOCX_STUDIO_MAX_BODY ?? 30 * 1024 * 1024) || 30 * 1024 * 1024;

if (!TOKEN) {
  console.warn(
    '[docx-mcp-http] DOCX_STUDIO_TOKEN not set — HTTP MCP auth is DISABLED. Set it before exposing.',
  );
}

function tokenOk(req) {
  if (!TOKEN) return true;
  const auth = (req.headers.authorization ?? '').toString();
  if (!auth.startsWith('Bearer ')) return false;
  const provided = Buffer.from(auth.slice(7).trim());
  const expected = Buffer.from(TOKEN);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

const httpServer = createServer(async (req, res) => {
  const url = (req.url ?? '').split('?')[0];

  if (req.method === 'GET' && url === '/healthz') {
    sendJson(res, 200, { ok: true, transport: 'streamable-http' });
    return;
  }

  if (url !== '/mcp') {
    sendJson(res, 404, { jsonrpc: '2.0', error: { code: -32601, message: 'not found' }, id: null });
    return;
  }

  if (!tokenOk(req)) {
    sendJson(res, 401, {
      jsonrpc: '2.0',
      error: { code: -32001, message: 'missing or invalid token' },
      id: null,
    });
    return;
  }

  // Stateless: GET (server-initiated SSE) and DELETE (session end) are not
  // supported without a session store.
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, {
      jsonrpc: '2.0',
      error: { code: -32000, message: 'method not allowed (stateless server)' },
      id: null,
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    sendJson(res, 400, {
      jsonrpc: '2.0',
      error: { code: -32700, message: String(e instanceof Error ? e.message : e) },
      id: null,
    });
    return;
  }

  const server = createDocxMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  } catch (e) {
    if (!res.headersSent) {
      sendJson(res, 500, {
        jsonrpc: '2.0',
        error: { code: -32603, message: String(e instanceof Error ? e.message : e) },
        id: null,
      });
    }
  }
});

httpServer.listen(PORT, HOST, () => {
  console.error(`docx-master MCP (streamable-http) listening on http://${HOST}:${PORT}/mcp`);
});
