#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync } = require('node:child_process');

function parseArgs(argv) {
  const out = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const body = raw.slice(2);
    const eq = body.indexOf('=');
    if (eq === -1) {
      out[body] = true;
      continue;
    }
    out[body.slice(0, eq)] = body.slice(eq + 1);
  }
  return out;
}

function runGit(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 128,
  }).trim();
}

function fail(message) {
  console.error(`[release-train-gate] BLOCKED: ${message}`);
  process.exit(1);
}

function info(message) {
  console.log(`[release-train-gate] ${message}`);
}

function parseAllowedPrefixes(raw) {
  return String(raw || 'integration/')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const eventName = String(args['event-name'] || process.env.GITHUB_EVENT_NAME || 'local');
  const baseRef = String(args['base-ref'] || process.env.GITHUB_BASE_REF || '');
  const headRef = String(args['head-ref'] || process.env.GITHUB_HEAD_REF || '');
  const refName = String(args['ref-name'] || process.env.GITHUB_REF_NAME || '');
  const currentSha = String(args.sha || process.env.GITHUB_SHA || runGit(['rev-parse', 'HEAD']));
  const allowedPrefixes = parseAllowedPrefixes(args['allowed-head-prefixes']);
  const trainRef = String(args['train-ref'] || 'origin/integration/main');
  const allowMissingTrain = args['allow-missing-train'] !== 'false';

  if (eventName === 'pull_request' && baseRef === 'main') {
    const valid = allowedPrefixes.some((prefix) => headRef.startsWith(prefix));
    if (!valid) {
      fail(
        `PRs into main must come from an integration train branch (${allowedPrefixes.join(', ')}). Received head ref "${headRef}".`,
      );
    }
    info(`OK: PR head "${headRef}" satisfies integration train policy.`);
    return;
  }

  if (eventName === 'push' && refName === 'main') {
    const parentLine = runGit(['rev-list', '--parents', '-n', '1', currentSha]).split(/\s+/);
    const parentCount = Math.max(0, parentLine.length - 1);
    if (parentCount > 1) {
      fail(`main push ${currentSha} is a merge commit (${parentCount} parents). Require linear fast-forward history.`);
    }
    info(`OK: main push ${currentSha} is linear (${parentCount} parent).`);

    try {
      runGit(['fetch', '--no-tags', '--prune', 'origin', '+refs/heads/*:refs/remotes/origin/*']);
      const refsContaining = runGit(['branch', '-r', '--contains', currentSha])
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const normalizedTrainRef = trainRef.replace(/^refs\/remotes\//, '');
      const found = refsContaining.some((ref) => ref === normalizedTrainRef);
      if (!found) {
        if (allowMissingTrain) {
          info(
            `WARN: commit ${currentSha} is not currently reachable from ${normalizedTrainRef}. Continue because allow-missing-train=true.`,
          );
        } else {
          fail(`commit ${currentSha} must be reachable from ${normalizedTrainRef} before main promotion.`);
        }
      } else {
        info(`OK: commit ${currentSha} is reachable from ${normalizedTrainRef}.`);
      }
    } catch (error) {
      if (allowMissingTrain) {
        info(`WARN: unable to verify train ref reachability (${error.message}).`);
      } else {
        fail(`unable to verify train ref reachability: ${error.message}`);
      }
    }
    return;
  }

  info(`SKIP: no main release-train checks required for event=${eventName} base=${baseRef} ref=${refName}.`);
}

main();
