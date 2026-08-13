/**
 * SlackService contract guard.
 *
 * Until 2026-08-05 the SlackService had no tests at all — every regression
 * (env mis-naming, missing `process.exit` on failure, double-start) shipped
 * silently. These tests pin the contracts that *don't* need a live Slack
 * workspace to verify:
 *
 *   1. Constructor does not throw on a missing .env.tnf-slack — the file is
 *      optional, the service must boot regardless.
 *   2. start() refuses to launch without the three required Slack credentials
 *      and names the missing variables so the operator knows what to set.
 *   3. start() refuses to double-start (no zombie instances).
 *   4. getStatus() is honest about not running when nothing was started.
 *   5. sendMessage() refuses when the bot is not running (no silent queueing).
 *
 * Live integration with the Bolt framework is not in scope here — that
 * requires real Slack tokens and a Socket Mode app, which lives in the
 * operator's own Slack workspace.
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli exec tsx src/slack/slack.test.ts
 */
import { SlackService } from './SlackService.js';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    fail += 1;
  }
}

function snapshotEnv(): Record<string, string | undefined> {
  return {
    TNF_SLACK_BOT_TOKEN: process.env.TNF_SLACK_BOT_TOKEN,
    TNF_SLACK_SIGNING_SECRET: process.env.TNF_SLACK_SIGNING_SECRET,
    TNF_SLACK_APP_TOKEN: process.env.TNF_SLACK_APP_TOKEN,
  };
}

function restoreEnv(snap: Record<string, string | undefined>): void {
  for (const [k, v] of Object.entries(snap)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

async function main(): Promise<void> {
  console.log('\nslack: env + lifecycle contract\n');

  const snap = snapshotEnv();

  // --- 1. Constructor is tolerant of missing env file --------------------
  delete process.env.TNF_SLACK_BOT_TOKEN;
  delete process.env.TNF_SLACK_SIGNING_SECRET;
  delete process.env.TNF_SLACK_APP_TOKEN;
  const svc = new SlackService(process.cwd());
  check('constructor does not throw without env file', svc !== null);

  // --- 2. start() refuses when credentials are missing -------------------
  // We never get past credential validation, so @slack/bolt is never
  // imported — these tests must work even if the package isn't installed.
  try {
    await svc.start();
    check('start() throws when no credentials are set', false, '(resolved)');
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    check(
      'start() names the missing variables',
      msg.includes('TNF_SLACK_BOT_TOKEN') &&
        msg.includes('TNF_SLACK_SIGNING_SECRET') &&
        msg.includes('TNF_SLACK_APP_TOKEN'),
      msg
    );
  }

  // --- 3. start() with partial credentials still fails loudly -------------
  process.env.TNF_SLACK_BOT_TOKEN = 'xoxb-test';
  // signingSecret + appToken still missing
  try {
    await svc.start();
    check('start() throws on partial credentials', false, '(resolved)');
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    check(
      'start() names the still-missing secret',
      msg.includes('TNF_SLACK_SIGNING_SECRET') || msg.includes('TNF_SLACK_APP_TOKEN'),
      msg
    );
  }

  // --- 4. getStatus() is honest before start -----------------------------
  const statusBefore = await svc.getStatus();
  check('getStatus() reports not running before start', statusBefore.isRunning === false);
  check('getStatus() omits uptime when not running', statusBefore.uptime === undefined);

  // --- 5. sendMessage() refuses when not running -------------------------
  try {
    await svc.sendMessage('C12345', 'hello');
    check('sendMessage() throws when bot is not running', false, '(resolved)');
  } catch (err: any) {
    check(
      'sendMessage() names the cause',
      /not running/i.test(String(err?.message ?? err)),
      String(err)
    );
  }

  // --- 6. stop() is a safe no-op when never started ---------------------
  // stop() must NOT throw if the service was never started; otherwise a
  // post-boot crash leaves the operator with no way to clean up state.
  try {
    await svc.stop();
    check('stop() is a safe no-op when never started', true);
  } catch (err: any) {
    check('stop() is a safe no-op when never started', false, String(err));
  }

  // --- 7. Double-start is rejected ---------------------------------------
  // We have to fake a "running" service to test the double-start guard
  // without actually booting Bolt. Use the private field via a cast.
  process.env.TNF_SLACK_SIGNING_SECRET = 'sig-secret';
  process.env.TNF_SLACK_APP_TOKEN = 'xapp-test';
  (svc as any).isRunning = true;
  try {
    await svc.start();
    check('start() refuses when already running', false, '(resolved)');
  } catch (err: any) {
    check(
      'start() refusal names the cause',
      /already running/i.test(String(err?.message ?? err)),
      String(err)
    );
  }

  restoreEnv(snap);

  console.log(`\n  ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
