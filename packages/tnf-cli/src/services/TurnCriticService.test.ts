/** Real HTTP/WebSocket protocol fixtures; live model inference is a separate smoke. */
import assert from 'node:assert/strict';
import { once } from 'node:events';
import * as fs from 'node:fs';
import { createServer } from 'node:http';
import * as os from 'node:os';
import * as path from 'node:path';
import { WebSocketServer } from 'ws';
import { LLMClient } from '../utils/llm-client.js';
import { loadCriticConfig, resolveCriticConfig } from './critic-config.js';
import { DebugService } from './DebugService.js';
import { boundTurn, criticPrompt, reviewAgentTurn, type CriticTurn } from './TurnCriticService.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-turn-critic-test-'));
const envNames = [
  'TNF_CRITIC_CONFIG_PATH',
  'TNF_CRITIC_STATE_DIR',
  'TNF_PROVIDER_CONFIG_PATH',
  'TNF_CRITIC_DISABLED',
  'TNF_AGENT_ROLE',
  'TNF_LLM_MODEL',
  'TNF_LLM_BASE_URL',
  'TNF_LLM_API_KEY',
] as const;
const prev = Object.fromEntries(envNames.map((k) => [k, process.env[k]]));
process.env.TNF_CRITIC_CONFIG_PATH = path.join(tmp, 'tnf.jsonc');
process.env.TNF_CRITIC_STATE_DIR = path.join(tmp, 'state');
process.env.TNF_PROVIDER_CONFIG_PATH = path.join(tmp, 'providers.json');
delete process.env.TNF_CRITIC_DISABLED;
delete process.env.TNF_AGENT_ROLE;
let modelRequests: any[] = [];
let webhooks: any[] = [];
let mode = 'ok';
const server = createServer(async (req, res) => {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  const data = JSON.parse(raw || '{}');
  if (req.url === '/hook') {
    webhooks.push({ data, id: req.headers['idempotency-key'] });
    res.end('ok');
    return;
  }
  modelRequests.push(data);
  if (mode === 'fail') {
    res.writeHead(401);
    res.end('credential error');
    return;
  }
  if (mode === 'timeout') return;
  if (mode === 'reasoning') {
    res.end(
      JSON.stringify({
        choices: [
          {
            message: { content: null, reasoning_content: 'unfinished internal reasoning' },
            finish_reason: 'length',
          },
        ],
      })
    );
    return;
  }
  if (data.stream) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.end(
      'data: {"choices":[{"delta":{"content":"Streamed working answer"}}]}\n\ndata: [DONE]\n\n'
    );
    return;
  }
  if (
    data.model === 'working-flash' &&
    data.tools?.length &&
    !data.messages.some((m: any) => m.role === 'tool')
  ) {
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: 'tool-1',
                  type: 'function',
                  function: { name: 'read_file', arguments: '{"path":"receipt.txt"}' },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
      })
    );
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      choices: [
        {
          message: {
            content:
              data.model === 'review-flash'
                ? 'needs_revision: arithmetic evidence shows 2 + 2 = 4, not 5. Correct the answer.'
                : 'Working answer',
          },
          finish_reason: 'stop',
        },
      ],
    })
  );
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${(server.address() as any).port}`;
fs.writeFileSync(
  process.env.TNF_PROVIDER_CONFIG_PATH!,
  JSON.stringify({
    providers: [
      {
        id: 'critic-test',
        name: 'Protocol fixture',
        type: 'local',
        baseUrl: base,
        envKey: null,
        altEnvKeys: [],
        enabled: true,
        models: [],
        authStyle: 'none',
        tier: 1,
      },
    ],
  })
);
const set = (overrides: Record<string, unknown> = {}) =>
  fs.writeFileSync(
    process.env.TNF_CRITIC_CONFIG_PATH!,
    JSON.stringify({
      critic: { provider: 'critic-test', model: 'review-flash', timeoutMs: 1000, ...overrides },
    })
  );
const turn = (id: string): CriticTurn => ({
  agentId: 'worker-1',
  sessionId: 'session-1',
  turnId: id,
  input: 'What is 2 + 2?',
  output: '5',
  evidence: 'Arithmetic result: 4',
});
let passes = 0;
function pass(name: string) {
  console.log(`PASS ${name}`);
  passes++;
}
try {
  assert.equal(resolveCriticConfig().enabled, true);
  assert.equal(resolveCriticConfig().destination.type, 'prompt');
  assert.throws(() => resolveCriticConfig({ destination: { type: 'unknown' } }));
  assert.throws(() => resolveCriticConfig({ timeoutMs: 0 }));
  assert.throws(() =>
    resolveCriticConfig({ destination: { type: 'webhook', url: 'ftp://example.com' } })
  );
  assert.throws(() => resolveCriticConfig({ destination: { type: 'file', path: 'relative.log' } }));
  pass('enabled defaults and strict route/budget validation');
  set();
  assert.equal(loadCriticConfig().model, 'review-flash');
  assert.equal(new DebugService(tmp).getConfig().critic?.model, 'review-flash');
  fs.writeFileSync(
    path.join(tmp, 'tnf.json'),
    JSON.stringify({
      critic: { destination: { type: 'webhook', url: 'https://untrusted.invalid' } },
    })
  );
  assert.equal(new DebugService(tmp).getEffectiveConfig(tmp).critic?.model, 'review-flash');
  pass('existing user config is visible; project cannot redirect critic');
  const bounded = boundTurn(
    { ...turn('large'), input: '"\\\n'.repeat(30000), output: 'x'.repeat(50000) },
    1000
  );
  assert(bounded.truncated);
  assert(bounded.content.length <= 1000);
  JSON.parse(bounded.content);
  assert(criticPrompt().includes('Critic Agent'));
  pass('bounded input and canonical prompt asset');
  let feedback = '';
  const r = await reviewAgentTurn(turn('one'), {
    onPrompt: (t) => {
      feedback = t;
    },
  });
  assert.equal(r.status, 'reviewed');
  assert.equal(r.delivery?.status, 'delivered');
  assert(feedback.includes('advisory review data'));
  assert.equal(modelRequests.length, 1);
  assert.equal(modelRequests[0].model, 'review-flash');
  assert.equal(modelRequests[0].tools, undefined);
  assert.equal(modelRequests[0].max_tokens, 800);
  const duplicate = await reviewAgentTurn(turn('one'));
  assert.equal(duplicate.id, r.id);
  assert.equal(modelRequests.length, 1);
  pass('single pinned critic request, no tools, token cap, idempotent receipt');
  set({ enabled: false });
  assert.equal((await reviewAgentTurn(turn('off'))).status, 'disabled');
  assert.equal(modelRequests.length, 1);
  set();
  assert.equal((await reviewAgentTurn({ ...turn('critic'), source: 'critic' })).status, 'skipped');
  assert.equal(modelRequests.length, 1);
  pass('disabled and critic-origin turns never recurse or call provider');
  const worker = await LLMClient.createForModel('critic-test', 'working-flash');
  // Exercise the real public worker completion path, with the fixture only replacing the remote server.
  (worker as any).role = 'worker';
  (worker as any).apiKey = 'local-test';
  const history: any[] = [{ role: 'user', content: 'First turn' }];
  assert.equal(
    await worker.chatComplete(history, { stream: false, builtinTools: 'none' }),
    'Working answer'
  );
  const afterFirst = modelRequests.length;
  history.push(
    { role: 'assistant', content: 'Working answer' },
    { role: 'user', content: 'Second turn' }
  );
  await worker.chatComplete(history, { stream: false, builtinTools: 'none' });
  assert.equal(modelRequests.length, afterFirst + 2);
  assert(
    modelRequests[afterFirst].messages.some(
      (m: any) => m.role === 'user' && m.content.includes('[TNF critic feedback')
    )
  );
  assert(
    !modelRequests[afterFirst].messages.some(
      (m: any) => m.role === 'system' && m.content.includes('[TNF critic feedback')
    )
  );
  pass('native turn gets one critic; next prompt receives advisory feedback');
  const beforeTools = modelRequests.filter((m) => m.model === 'review-flash').length;
  const toolResult = await worker.chatCompleteWithTools(
    [{ role: 'user', content: 'Read receipt' }],
    async () => ({ ok: true, content: 'Actual fixture receipt: 4' }),
    {
      maxIterations: 3,
      stream: false,
      tools: [
        {
          type: 'function',
          function: {
            name: 'read_file',
            parameters: { type: 'object', properties: { path: { type: 'string' } } },
          },
        },
      ],
    }
  );
  assert.equal(toolResult.toolCallsMade, 1);
  assert.equal(modelRequests.filter((m) => m.model === 'review-flash').length, beforeTools + 1);
  assert(JSON.stringify(modelRequests.at(-1)).includes('Actual fixture receipt'));
  pass('tool loop reviewed once with tool evidence, not once per tool');
  const beforeStream = modelRequests.filter((m) => m.model === 'review-flash').length;
  let output = '';
  for await (const c of worker.chatStream([{ role: 'user', content: 'Stream' }], {
    builtinTools: 'none',
  }))
    output += c;
  assert.equal(output, 'Streamed working answer');
  assert.equal(modelRequests.filter((m) => m.model === 'review-flash').length, beforeStream + 1);
  pass('stream completion reviewed exactly once');
  set({ destination: { type: 'file', path: path.join(tmp, 'reviews.jsonl') } });
  const fileReceipt = await reviewAgentTurn(turn('file'));
  assert.equal(fileReceipt.delivery?.status, 'delivered');
  assert.equal(JSON.parse(fs.readFileSync(path.join(tmp, 'reviews.jsonl'), 'utf8')).turnId, 'file');
  set({ destination: { type: 'webhook', url: base + '/hook' } });
  const hookReceipt = await reviewAgentTurn(turn('webhook'));
  assert.equal(hookReceipt.delivery?.status, 'delivered');
  assert.equal(webhooks[0].id, hookReceipt.id);
  pass('file append and real webhook POST with idempotency key');
  const wss = new WebSocketServer({ port: 0, host: '127.0.0.1' });
  await once(wss, 'listening');
  wss.on('connection', (ws) =>
    ws.on('message', (raw) => {
      const m = JSON.parse(String(raw));
      if (m.type === 'AGENT_REGISTER')
        ws.send(JSON.stringify({ type: 'REGISTRATION_CONFIRMED', payload: {} }));
      if (m.type === 'CHANNEL_JOIN')
        ws.send(
          JSON.stringify({ type: 'CHANNEL_JOINED', payload: { channel: { id: 'review-room' } } })
        );
      if (m.type === 'MESSAGE_SEND')
        ws.send(
          JSON.stringify({ type: 'CHANNEL_MESSAGE', payload: { ...m.payload, channel: m.channel } })
        );
    })
  );
  set({
    destination: {
      type: 'federated',
      channel: 'review-room',
      relayUrl: `ws://127.0.0.1:${(wss.address() as any).port}`,
    },
  });
  const federation = await reviewAgentTurn(turn('federation'));
  assert.equal(federation.delivery?.status, 'delivered', JSON.stringify(federation));
  wss.close();
  await once(wss, 'close');
  pass('federation waits for registration, join, and matching message echo');
  set();
  mode = 'fail';
  const failed = await reviewAgentTurn(turn('failed'));
  assert.equal(failed.status, 'failed');
  assert(failed.error?.includes('401'));
  const primary = await worker
    .chatCompletePinned([{ role: 'user', content: 'x' }])
    .catch(() => null);
  assert.equal(primary, null);
  pass('provider failures recorded without expensive fallback');
  mode = 'reasoning';
  const incomplete = await reviewAgentTurn(turn('reasoning'));
  assert.equal(incomplete.status, 'failed');
  assert.equal(incomplete.critique, undefined);
  pass('partial reasoning cannot masquerade as a completed critique');
  mode = 'timeout';
  const start = Date.now();
  const timeout = await reviewAgentTurn(turn('timeout'));
  assert.equal(timeout.status, 'failed');
  assert(Date.now() - start < 3000);
  mode = 'ok';
  set({ maxReports: 2 });
  await reviewAgentTurn(turn('retention'));
  assert(
    fs.readdirSync(process.env.TNF_CRITIC_STATE_DIR!).filter((n) => n.endsWith('.json')).length <= 2
  );
  pass('timeout bounded and owned receipt retention enforced');
  fs.writeFileSync(process.env.TNF_CRITIC_CONFIG_PATH!, '{invalid');
  const count = modelRequests.length;
  assert.equal((await reviewAgentTurn(turn('bad-config'))).status, 'failed');
  assert.equal(modelRequests.length, count);
  pass('malformed settings do not silently enable paid inference');
  console.log(`${passes} checks passed`);
} finally {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  for (const k of envNames) {
    if (prev[k] === undefined) delete process.env[k];
    else process.env[k] = prev[k];
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}
