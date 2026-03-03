#!/usr/bin/env node

const apiBase = process.env.AGENT_REGISTRY_API_BASE || 'http://localhost:3004';
const snapshotPath = process.env.AGENT_REGISTRY_SNAPSHOT_PATH || 'data/agent-registry/agents.json';
const onlyType = process.env.AGENT_REGISTRY_ONLY_TYPE || '';
const adminToken = process.env.AGENT_REGISTRY_IMPORT_TOKEN || '';

async function main() {
  const endpoint = `${apiBase.replace(/\/+$/, '')}/api/agent-registry/import/snapshot`;
  const payload = {
    snapshotPath,
    ...(onlyType ? { onlyType } : {}),
  };

  const headers = {
    'content-type': 'application/json',
  };
  if (adminToken) headers['x-admin-token'] = adminToken;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    console.error(JSON.stringify({ ok: false, status: res.status, endpoint, body }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true, status: res.status, endpoint, body }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
