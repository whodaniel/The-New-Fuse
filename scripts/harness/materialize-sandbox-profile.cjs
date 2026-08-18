#!/usr/bin/env node
/**
 * Materialize scripts/forge_sandbox.sb with concrete TNF_ROOT and HOME paths.
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TEMPLATE = path.join(ROOT, 'scripts/forge_sandbox.sb');

function parseArgs(argv) {
  const args = { out: path.join(ROOT, 'data/harness/receipts/tnf-sandbox.materialized.sb') };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--out') args.out = path.resolve(argv[++i] || args.out);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(TEMPLATE)) throw new Error(`missing template: ${TEMPLATE}`);
  const home = os.homedir();
  let body = fs.readFileSync(TEMPLATE, 'utf8');
  body = body.replaceAll('__TNF_ROOT__', ROOT).replaceAll('__HOME__', home);
  // Permit repo reads/writes for agent work inside the profile.
  if (!body.includes('(subpath "' + ROOT + '")')) {
    body += `

; Materialized TNF extensions
(allow file-read* (subpath "${ROOT}"))
(allow file-write* (subpath "${ROOT}/data/harness"))
(allow file-write* (subpath "${ROOT}/.agent/runtime-logs"))
(allow file-write* (subpath "/tmp"))
`;
  }
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, body, 'utf8');
  console.log(
    JSON.stringify(
      {
        ok: true,
        template: path.relative(ROOT, TEMPLATE),
        out: args.out,
        note: 'Use with sandbox-exec -f <out> on macOS for D11 untrusted paths.',
      },
      null,
      2
    )
  );
}

try {
  main();
} catch (err) {
  console.error(`materialize-sandbox-profile: ${err.message}`);
  process.exit(1);
}
