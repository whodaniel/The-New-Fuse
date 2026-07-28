#!/usr/bin/env node
/**
 * Post-deploy production verification.
 *
 * Written after two failures that both hid in the gap between "merged" and "live":
 *
 *   1. AI Assist posted to /orchestration/chat while the API serves
 *      /api/orchestration/chat. Every request 404'd, on a feature present on
 *      every page, for an unknown length of time. Nothing was watching.
 *
 *   2. A fix was merged to main and reported as shipped. It never deployed,
 *      because the Cloudflare Pages project is Direct Upload with no Git
 *      integration. "Merged" and "live" are different facts.
 *
 * This asserts the deployed artifact actually changed and that the app's API
 * contract holds. Run it after every deploy; treat a non-zero exit as a failed
 * deploy, not a flaky test.
 *
 * Usage:
 *   node scripts/deployment/verify-production.mjs
 *   node scripts/deployment/verify-production.mjs --expect-bundle-change <previous-hash>
 *   node scripts/deployment/verify-production.mjs --site https://app.thenewfuse.com
 */

const args = process.argv.slice(2);
function arg(name, fallback = null) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const SITE = (arg('--site', 'https://app.thenewfuse.com') || '').replace(/\/+$/, '');
const API = (arg('--api', 'https://api.thenewfuse.com') || '').replace(/\/+$/, '');
const EXPECT_BUNDLE_CHANGE = arg('--expect-bundle-change');
const TIMEOUT_MS = 20000;

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  return { status: res.status, body: await res.text() };
}

async function main() {
  console.log(`Verifying ${SITE}\n`);

  // --- The page itself loads -------------------------------------------------
  let html;
  try {
    const res = await fetchText(`${SITE}/`);
    html = res.body;
    check('site responds 200', res.status === 200, `status=${res.status}`);
  } catch (err) {
    check('site responds 200', false, err.message);
    return finish();
  }

  // --- The deployed bundle is the one we just built ---------------------------
  // A deploy that silently did nothing leaves this hash unchanged. This is the
  // check that catches "merged but never shipped".
  const bundle = html.match(/\/assets\/js\/app\.[A-Za-z0-9_-]+\.js/)?.[0] || null;
  check('entry bundle referenced', Boolean(bundle), bundle || 'no /assets/js/app.*.js found');

  if (EXPECT_BUNDLE_CHANGE && bundle) {
    check(
      'entry bundle changed since last deploy',
      bundle !== EXPECT_BUNDLE_CHANGE,
      bundle === EXPECT_BUNDLE_CHANGE
        ? `still serving ${bundle} — deploy did not take effect`
        : `${EXPECT_BUNDLE_CHANGE} -> ${bundle}`
    );
  }

  // --- API contract: the exact bug that broke AI Assist -----------------------
  // The frontend must call the prefixed path. Assert the prefixed one exists
  // (401 unauthenticated is correct) and the unprefixed one does not.
  try {
    const prefixed = await fetch(`${API}/api/orchestration/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'verify' }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    check(
      'POST /api/orchestration/chat is routed (not 404)',
      prefixed.status !== 404,
      `status=${prefixed.status}${prefixed.status === 401 ? ' (auth required — expected)' : ''}`
    );
  } catch (err) {
    check('POST /api/orchestration/chat is routed (not 404)', false, err.message);
  }

  // --- The bundle calls the prefixed path -------------------------------------
  if (bundle) {
    try {
      const chunkList = html.match(/\/assets\/js\/[A-Za-z0-9._-]+\.js/g) || [];
      let found = false;
      let scanned = 0;
      for (const path of [bundle, ...chunkList].slice(0, 40)) {
        const { body } = await fetchText(`${SITE}${path}`);
        scanned += 1;
        if (body.includes('/api/orchestration/chat')) {
          found = true;
          break;
        }
        if (/["'`]\/orchestration\/chat/.test(body)) {
          check(
            'no unprefixed /orchestration/chat in shipped JS',
            false,
            `found in ${path} — this is the 404 regression`
          );
          return finish();
        }
      }
      check(
        'shipped JS calls /api/orchestration/chat',
        found,
        found ? `scanned ${scanned} chunk(s)` : `not found in ${scanned} chunk(s)`
      );
    } catch (err) {
      check('shipped JS calls /api/orchestration/chat', false, err.message);
    }
  }

  finish();
}

function finish() {
  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n${results.length - failed.length}/${results.length} checks passed` +
      (failed.length ? ` — ${failed.length} FAILED` : '')
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error('verify-production crashed:', err);
  process.exit(1);
});
