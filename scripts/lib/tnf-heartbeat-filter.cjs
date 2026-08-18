#!/usr/bin/env node

/**
 * TNF Heartbeat Filter
 *
 * Shared guard for any Redis-driven agent wrapper (pi-redis-wrapper.cjs,
 * jules-redis-wrapper.cjs, gemini-redis-wrapper.cjs, ...): heartbeats and
 * stall pings should be ACK'd, not routed into a real LLM/agent task. Without
 * this, every cron heartbeat tick burns provider quota (or, worse, spins up
 * a full autonomous coding session) on a message that was never meant to be
 * actionable.
 *
 * Extracted 2026-07-23 from pi-redis-wrapper.cjs after finding
 * jules-redis-wrapper.cjs had no equivalent guard at all — a wake_ping event
 * there reached a (separately broken) task-processing call unfiltered.
 *
 * Usage:
 *   const { isHeartbeatOrNoise } = require('../lib/tnf-heartbeat-filter.cjs');
 *   if (isHeartbeatOrNoise(msg.content)) { ack-and-return; }
 */

'use strict';

function isHeartbeatOrNoise(text) {
  const raw = String(text || '').trim();
  if (!raw) return true;
  if (/^TNF heartbeat\b/i.test(raw)) return true;
  if (/\bcron-heartbeat-/i.test(raw)) return true;
  if (/please respond with a heartbeat or acknowledgment/i.test(raw)) return true;
  if (/\bagent_stalled\b/i.test(raw)) return true;
  if (/^\[SYSTEM\].*heartbeat/i.test(raw)) return true;
  return false;
}

module.exports = { isHeartbeatOrNoise };
