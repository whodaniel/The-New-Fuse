#!/usr/bin/env node
/**
 * Minimal MCP stdio server for TNF dynamic memory layer (retain/recall/pin/status).
 * Protocol: JSON-RPC 2.0 over newline-delimited stdout/stdin (MCP tools/list + tools/call).
 */
'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');
const readline = require('node:readline');

const ROOT = path.resolve(__dirname, '..', '..');
const MEMORY = path.join(ROOT, 'scripts/harness/memory-layer.cjs');

function memory(args) {
  const r = spawnSync(process.execPath, [MEMORY, ...args, '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  let parsed;
  try {
    parsed = JSON.parse(r.stdout || '{}');
  } catch {
    parsed = { ok: false, raw: r.stdout, stderr: r.stderr };
  }
  return { code: r.status ?? 1, parsed };
}

function send(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

function toolResult(id, obj) {
  send({
    jsonrpc: '2.0',
    id,
    result: {
      content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }],
      isError: obj.ok === false,
    },
  });
}

const TOOLS = [
  {
    name: 'tnf_memory_retain',
    description: 'Retain a durable fact in the TNF dynamic memory layer',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        tags: { type: 'string', description: 'comma-separated tags' },
        scope: { type: 'string', enum: ['global', 'project', 'session'] },
      },
      required: ['text'],
    },
  },
  {
    name: 'tnf_memory_recall',
    description: 'Recall facts from the TNF dynamic memory layer',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'tnf_memory_pin',
    description: 'Pin a memory entry by id',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'tnf_memory_status',
    description: 'Status of the TNF dynamic memory store',
    inputSchema: { type: 'object', properties: {} },
  },
];

function handle(msg) {
  if (!msg || typeof msg !== 'object') return;
  const { id, method, params } = msg;
  if (method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'tnf-memory-layer', version: '1.0.0' },
      },
    });
    return;
  }
  if (method === 'notifications/initialized' || method === 'initialized') return;
  if (method === 'tools/list') {
    send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
    return;
  }
  if (method === 'tools/call') {
    const name = params?.name;
    const args = params?.arguments || {};
    if (name === 'tnf_memory_retain') {
      const tags = args.tags ? ['--tags', String(args.tags)] : [];
      const scope = args.scope ? ['--scope', String(args.scope)] : [];
      const out = memory(['retain', '--text', String(args.text || ''), ...tags, ...scope]);
      toolResult(id, out.parsed);
      return;
    }
    if (name === 'tnf_memory_recall') {
      const out = memory([
        'recall',
        '--query',
        String(args.query || ''),
        '--limit',
        String(args.limit || 5),
      ]);
      toolResult(id, out.parsed);
      return;
    }
    if (name === 'tnf_memory_pin') {
      const out = memory(['pin', '--id', String(args.id || '')]);
      toolResult(id, out.parsed);
      return;
    }
    if (name === 'tnf_memory_status') {
      const out = memory(['status']);
      toolResult(id, out.parsed);
      return;
    }
    toolResult(id, { ok: false, error: `unknown tool ${name}` });
    return;
  }
  if (id != null) {
    send({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  }
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    handle(JSON.parse(trimmed));
  } catch (err) {
    // ignore malformed
  }
});
