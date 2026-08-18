#!/usr/bin/env node
/* Smoke-check VS Code contributes.configuration — fails if settings are
 * misplaced as contributes siblings (ignored by VS Code) or if
 * defaultProvider enum/enumDescriptions lengths drift. */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const contributes = pkg.contributes || {};
const errors = [];

const misplaced = Object.keys(contributes).filter((k) => k.startsWith('theNewFuse.'));
if (misplaced.length) {
  errors.push(
    `Settings must live under contributes.configuration.properties, not contributes: ${misplaced.join(', ')}`
  );
}

const props = contributes.configuration && contributes.configuration.properties;
if (!props || typeof props !== 'object') {
  errors.push('Missing contributes.configuration.properties');
} else {
  const required = [
    'theNewFuse.relayUrl',
    'theNewFuse.a2aUrl',
    'theNewFuse.aguiUrl',
    'theNewFuse.redisHost',
    'theNewFuse.redisPort',
    'theNewFuse.cloudSandboxUrl',
    'theNewFuse.loadTnfProjectConfig',
    'theNewFuse.defaultProvider',
  ];
  for (const key of required) {
    if (!props[key]) errors.push(`Missing configuration property: ${key}`);
  }

  const provider = props['theNewFuse.defaultProvider'];
  if (provider) {
    const enums = provider.enum || [];
    const descs = provider.enumDescriptions || [];
    if (enums.length !== descs.length) {
      errors.push(
        `defaultProvider enum length ${enums.length} != enumDescriptions ${descs.length}`
      );
    }
  }
}

if (errors.length) {
  console.error('[vscode-extension] contributes validation FAIL');
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

console.log(
  `[vscode-extension] contributes OK (${Object.keys(props).length} settings)`
);
