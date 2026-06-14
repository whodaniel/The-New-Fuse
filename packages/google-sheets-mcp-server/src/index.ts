import { MCPServer } from '@the-new-fuse/mcp-core/server';

import {
  appendToSheet,
  clearRange,
  createSpreadsheet,
  readSheet,
  shareSpreadsheet,
  writeSheet,
} from './tools.js';

const server = new MCPServer();

server.registerTool({
  name: 'read_sheet',
  description: 'Read a range of values from a spreadsheet',
  inputSchema: {
    type: 'object',
    properties: {
      spreadsheetId: { type: 'string' },
      range: { type: 'string' },
    },
    required: ['spreadsheetId', 'range'],
  },
  handler: {
    execute: async (args: any) => {
      const { spreadsheetId, range } = args;
      try {
        const values = await readSheet(spreadsheetId, range);
        return {
          success: true,
          result: { content: [{ type: 'text', text: JSON.stringify(values, null, 2) }] },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
  },
});

server.registerTool({
  name: 'write_sheet',
  description: 'Write values to a spreadsheet range',
  inputSchema: {
    type: 'object',
    properties: {
      spreadsheetId: { type: 'string' },
      range: { type: 'string' },
      values: {
        type: 'array',
        items: {
          type: 'array',
          items: {},
        },
      },
    },
    required: ['spreadsheetId', 'range', 'values'],
  },
  handler: {
    execute: async (args: any) => {
      const { spreadsheetId, range, values } = args;
      try {
        const res = await writeSheet(spreadsheetId, range, values);
        return {
          success: true,
          result: { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
  },
});

server.registerTool({
  name: 'append_to_sheet',
  description: 'Append values to a spreadsheet',
  inputSchema: {
    type: 'object',
    properties: {
      spreadsheetId: { type: 'string' },
      range: { type: 'string' },
      values: {
        type: 'array',
        items: {
          type: 'array',
          items: {},
        },
      },
    },
    required: ['spreadsheetId', 'range', 'values'],
  },
  handler: {
    execute: async (args: any) => {
      const { spreadsheetId, range, values } = args;
      try {
        const res = await appendToSheet(spreadsheetId, range, values);
        return {
          success: true,
          result: { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
  },
});

server.registerTool({
  name: 'clear_range',
  description: 'Clear a range of values',
  inputSchema: {
    type: 'object',
    properties: {
      spreadsheetId: { type: 'string' },
      range: { type: 'string' },
    },
    required: ['spreadsheetId', 'range'],
  },
  handler: {
    execute: async (args: any) => {
      const { spreadsheetId, range } = args;
      try {
        const res = await clearRange(spreadsheetId, range);
        return {
          success: true,
          result: { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
  },
});

server.registerTool({
  name: 'create_spreadsheet',
  description: 'Create a new spreadsheet',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
    },
    required: ['title'],
  },
  handler: {
    execute: async (args: any) => {
      const { title } = args;
      try {
        const res = await createSpreadsheet(title);
        return {
          success: true,
          result: { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
  },
});

server.registerTool({
  name: 'share_spreadsheet',
  description: 'Share a spreadsheet with an email address',
  inputSchema: {
    type: 'object',
    properties: {
      spreadsheetId: { type: 'string' },
      emailAddress: { type: 'string' },
      role: { type: 'string', enum: ['writer', 'reader', 'commenter'], default: 'writer' },
    },
    required: ['spreadsheetId', 'emailAddress'],
  },
  handler: {
    execute: async (args: any) => {
      const { spreadsheetId, emailAddress, role } = args;
      try {
        const res = await shareSpreadsheet(spreadsheetId, emailAddress, role);
        return {
          success: true,
          result: { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
  },
});

const config = {
  name: 'google-sheets-mcp-server',
  version: '1.0.0',
  host: 'localhost',
  port: parseInt(process.env.GOOGLE_SHEETS_MCP_PORT || '3006'),
};

// Start the server
server.start(config).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
