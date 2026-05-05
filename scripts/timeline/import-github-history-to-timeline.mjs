#!/usr/bin/env node

import os from 'node:os';
import path from 'node:path';

function readArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx < 0) return null;
  return process.argv[idx + 1] && !process.argv[idx + 1].startsWith('--')
    ? process.argv[idx + 1]
    : '';
}

function hasFlag(name) {
  return process.argv.includes(name);
}

async function main() {
  const endpoint =
    process.env.TNF_TIMELINE_IMPORT_URL || 'http://127.0.0.1:4000/api/timeline/github/import';
  const authToken = process.env.TNF_AUTH_TOKEN || process.env.AUTH_TOKEN || '';
  const reportPathArg = readArg('--report-path');
  const reportPathEnv = process.env.GITHUB_HISTORY_NARRATIVE_PATH || '';
  const useHomeDefault = hasFlag('--use-home-default');
  const reportPath = (reportPathArg && reportPathArg.trim()) || (reportPathEnv && reportPathEnv.trim());
  const fallbackHomePath = path.join(
    os.homedir(),
    'github-history',
    'whodaniel-github-history-narrative.json'
  );

  if (!authToken.trim()) {
    console.error('Missing auth token. Set TNF_AUTH_TOKEN (or AUTH_TOKEN).');
    process.exit(1);
  }

  const replaceExisting = hasFlag('--replace-existing');
  const body = {
    reportPath: reportPath || (useHomeDefault ? fallbackHomePath : undefined),
    replaceExisting,
    actor: 'github-sync-agent',
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`Import request failed (${response.status}): ${text}`);
    process.exit(1);
  }

  try {
    const payload = JSON.parse(text);
    console.log(JSON.stringify(payload, null, 2));
  } catch {
    console.log(text);
  }
}

main().catch((error) => {
  console.error(`Failed to sync GitHub history timeline: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
