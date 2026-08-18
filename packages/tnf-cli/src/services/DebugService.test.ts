import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { DebugService, redactSensitiveConfig } from './DebugService.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-debug-service-'));
const configDir = path.join(tmp, 'config');
const dataDir = path.join(tmp, 'data');
const projectRoot = path.join(tmp, 'project');
fs.mkdirSync(configDir, { recursive: true });
fs.mkdirSync(projectRoot, { recursive: true });

fs.writeFileSync(
  path.join(configDir, 'tnf.jsonc'),
  JSON.stringify(
    {
      provider: 'global-provider',
      model: 'global-model',
      custom: {
        apiKey: 'global-secret',
        braveApiKeyEnv: 'BRAVE_API_KEY',
      },
      mcp: {
        global: {
          command: 'node',
          env: {
            OPENAI_API_KEY: 'openai-secret',
          },
        },
      },
    },
    null,
    2
  )
);

fs.writeFileSync(
  path.join(projectRoot, 'tnf.json'),
  JSON.stringify(
    {
      model: 'project-model',
      custom: {
        password: 'project-secret',
      },
      mcp: {
        project: {
          command: 'node',
        },
      },
    },
    null,
    2
  )
);

const previousProvider = process.env.TNF_LLM_PROVIDER;
const previousModel = process.env.TNF_LLM_MODEL;
process.env.TNF_LLM_PROVIDER = 'env-provider';
process.env.TNF_LLM_MODEL = 'env-model';

const service = new DebugService(configDir, dataDir);
const effective = service.getEffectiveConfig(projectRoot);
assert.equal(effective.provider, 'env-provider');
assert.equal(effective.model, 'env-model');
assert.ok(effective.mcp?.global);
assert.ok(effective.mcp?.project);

const redacted = redactSensitiveConfig(effective);
assert.equal(redacted.custom?.apiKey, '[REDACTED]');
assert.equal(redacted.custom?.braveApiKeyEnv, 'BRAVE_API_KEY');
assert.equal(redacted.custom?.password, '[REDACTED]');
assert.equal(redacted.mcp?.global.env?.OPENAI_API_KEY, '[REDACTED]');
assert.equal(redactSensitiveConfig('sk-testsecretsecretsecretsecretsecret'), '[REDACTED]');

if (previousProvider === undefined) delete process.env.TNF_LLM_PROVIDER;
else process.env.TNF_LLM_PROVIDER = previousProvider;
if (previousModel === undefined) delete process.env.TNF_LLM_MODEL;
else process.env.TNF_LLM_MODEL = previousModel;

console.log('DebugService.test.ts OK');
