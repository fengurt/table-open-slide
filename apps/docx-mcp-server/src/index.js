#!/usr/bin/env node
/**
 * docx-master MCP server — stdio transport (local skill, Cursor/Claude Desktop).
 *
 * Tools: list_brands, docx_format_text, docx_format_and_build, docx_build, …
 * Resource: docx://workflow
 *
 * For remote/networked agents use the streamable-HTTP entry: src/http.js
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { createDocxMcpServer } from './server-factory.js';

async function main() {
  const server = createDocxMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
