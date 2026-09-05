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
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SlackService } from './SlackService.js';

describe('SlackService: env + lifecycle contract', () => {
  let svc: SlackService;
  const envSnap: Record<string, string | undefined> = {};

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

  beforeEach(() => {
    // Save and clear env
    Object.assign(envSnap, snapshotEnv());
    delete process.env.TNF_SLACK_BOT_TOKEN;
    delete process.env.TNF_SLACK_SIGNING_SECRET;
    delete process.env.TNF_SLACK_APP_TOKEN;

    svc = new SlackService(process.cwd());
  });

  afterEach(() => {
    restoreEnv(envSnap);
    vi.restoreAllMocks();
  });

  // --- 1. Constructor is tolerant of missing env file --------------------
  it('constructor does not throw without env file', () => {
    expect(svc).toBeDefined();
    expect(svc).not.toBeNull();
  });

  // --- 2. start() refuses when credentials are missing -------------------
  it('start() throws when no credentials are set', async () => {
    await expect(svc.start()).rejects.toThrow();
    try {
      await svc.start();
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      expect(msg).toContain('TNF_SLACK_BOT_TOKEN');
      expect(msg).toContain('TNF_SLACK_SIGNING_SECRET');
      expect(msg).toContain('TNF_SLACK_APP_TOKEN');
    }
  });

  // --- 3. start() with partial credentials still fails loudly -------------
  it('start() throws on partial credentials and names the still-missing secret', async () => {
    process.env.TNF_SLACK_BOT_TOKEN = 'xoxb-test';
    // signingSecret + appToken still missing
    await expect(svc.start()).rejects.toThrow();
    try {
      await svc.start();
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      expect(
        msg.includes('TNF_SLACK_SIGNING_SECRET') || msg.includes('TNF_SLACK_APP_TOKEN')
      ).toBe(true);
    }
  });

  // --- 4. getStatus() is honest before start -----------------------------
  it('getStatus() reports not running before start', async () => {
    const statusBefore = await svc.getStatus();
    expect(statusBefore.isRunning).toBe(false);
    expect(statusBefore.uptime).toBeUndefined();
  });

  // --- 5. sendMessage() refuses when not running -------------------------
  it('sendMessage() throws when bot is not running and names the cause', async () => {
    await expect(svc.sendMessage('C12345', 'hello')).rejects.toThrow();
    try {
      await svc.sendMessage('C12345', 'hello');
    } catch (err: any) {
      expect(/not running/i.test(String(err?.message ?? err))).toBe(true);
    }
  });

  // --- 6. stop() is a safe no-op when never started ---------------------
  it('stop() is a safe no-op when never started', async () => {
    await expect(svc.stop()).resolves.not.toThrow();
  });

  // --- 7. Double-start is rejected ---------------------------------------
  it('start() refuses when already running and names the cause', async () => {
    process.env.TNF_SLACK_SIGNING_SECRET = 'sig-secret';
    process.env.TNF_SLACK_APP_TOKEN = 'xapp-test';
    // Fake a "running" service to test the double-start guard
    (svc as any).isRunning = true;

    await expect(svc.start()).rejects.toThrow();
    try {
      await svc.start();
    } catch (err: any) {
      expect(/already running/i.test(String(err?.message ?? err))).toBe(true);
    }
  });
});