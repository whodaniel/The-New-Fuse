#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const PUBLIC_BASE_URL = process.env.AUTH_AUDIT_PUBLIC_BASE_URL || 'https://thenewfuse.com';
const API_BASE_URL = process.env.AUTH_AUDIT_API_BASE_URL || 'https://api.thenewfuse.com';
const FAIL_ON_AUTH_ISSUES = process.env.FAIL_ON_AUTH_ISSUES !== '0';

const checks = [
  {
    name: 'Public /api/auth/login compatibility route',
    method: 'POST',
    url: `${PUBLIC_BASE_URL}/api/auth/login`,
    expectedStatus: [400, 401],
    body: { email: 'invalid@example.com', password: 'bad-password' },
  },
  {
    name: 'Public /api/v1/auth/login compatibility route',
    method: 'POST',
    url: `${PUBLIC_BASE_URL}/api/v1/auth/login`,
    expectedStatus: [400, 401],
    body: { email: 'invalid@example.com', password: 'bad-password' },
  },
  {
    name: 'Gateway /v1/auth/login canonical route',
    method: 'POST',
    url: `${API_BASE_URL}/v1/auth/login`,
    expectedStatus: [400, 401],
    body: { email: 'invalid@example.com', password: 'bad-password' },
  },
  {
    name: 'Public /health route',
    method: 'GET',
    url: `${PUBLIC_BASE_URL}/health`,
    expectedStatus: [200],
  },
];

async function runCheck(check) {
  const init = {
    method: check.method,
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
  };
  if (check.body) {
    init.body = JSON.stringify(check.body);
  }

  const startedAt = Date.now();
  try {
    const res = await fetch(check.url, init);
    const elapsedMs = Date.now() - startedAt;
    const text = await res.text();
    const ok = check.expectedStatus.includes(res.status);
    return {
      ...check,
      status: res.status,
      ok,
      elapsedMs,
      responseSnippet: text.slice(0, 240),
    };
  } catch (error) {
    return {
      ...check,
      status: null,
      ok: false,
      elapsedMs: Date.now() - startedAt,
      responseSnippet: String(error),
    };
  }
}

function toMarkdown(summary, results) {
  const lines = [
    '# Auth Path Audit',
    '',
    `- Generated: ${new Date().toISOString()}`,
    `- Public base: ${PUBLIC_BASE_URL}`,
    `- API base: ${API_BASE_URL}`,
    `- Total checks: ${summary.total}`,
    `- Passed: ${summary.passed}`,
    `- Failed: ${summary.failed}`,
    '',
    '| Check | URL | Status | Expected | Result |',
    '| --- | --- | --- | --- | --- |',
  ];

  for (const result of results) {
    lines.push(
      `| ${result.name} | \`${result.url}\` | ${result.status ?? 'ERR'} | ${result.expectedStatus.join(
        ', '
      )} | ${result.ok ? 'PASS' : 'FAIL'} |`
    );
  }

  const failures = results.filter((r) => !r.ok);
  if (failures.length) {
    lines.push('', '## Failures', '');
    for (const failure of failures) {
      lines.push(
        `- **${failure.name}** (${failure.url}) -> status: ${failure.status ?? 'ERR'}; snippet: \`${failure.responseSnippet.replace(/\n/g, ' ')}\``
      );
    }
  }

  return `${lines.join('\n')}\n`;
}

async function main() {
  const results = [];
  for (const check of checks) {
    results.push(await runCheck(check));
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    publicBaseUrl: PUBLIC_BASE_URL,
    apiBaseUrl: API_BASE_URL,
  };

  const reportJsonPath = join(process.cwd(), 'docs', 'audits', 'auth-path-audit.json');
  const reportMdPath = join(process.cwd(), 'docs', 'audits', 'auth-path-audit.md');

  mkdirSync(dirname(reportJsonPath), { recursive: true });
  writeFileSync(reportJsonPath, JSON.stringify({ summary, results }, null, 2));
  writeFileSync(reportMdPath, toMarkdown(summary, results));

  console.log(
    JSON.stringify(
      {
        ok: summary.failed === 0,
        summary,
        reportJsonPath,
        reportMdPath,
      },
      null,
      2
    )
  );

  if (summary.failed > 0 && FAIL_ON_AUTH_ISSUES) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Auth path audit failed to run:', error);
  process.exit(1);
});
