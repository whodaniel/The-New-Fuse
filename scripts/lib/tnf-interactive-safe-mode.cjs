#!/usr/bin/env node

// Shared operator-facing safety gate for any script that injects text into
// a live terminal session (osascript `do script` / System Events keystroke
// simulation). Extracted from scripts/relay-channel-monitor.cjs so every
// injector consumes the identical check instead of maintaining separate
// copies that can drift out of sync.
//
// Safe by default: with no env var and no flag file present,
// isInteractiveSafeModeEnabled() returns false (matches relay-channel-monitor's
// original behavior) — callers are expected to also gate on an explicit
// per-script "allow prompt injection" flag (see isPromptInjectionAllowed)
// so injection requires an affirmative opt-in on top of safe-mode being off.

const fs = require('fs');
const path = require('path');

function isInteractiveSafeModeEnabled(env = process.env) {
  const envValue = env.TNF_INTERACTIVE_SAFE_MODE || '';
  if (String(envValue).trim()) {
    return String(envValue).toLowerCase() !== 'false';
  }
  const flagFile =
    env.TNF_INTERACTIVE_SAFE_MODE_FILE || path.join(env.HOME || require('os').homedir(), '.tnf', 'flags', 'interactive-safe-mode');
  return fs.existsSync(flagFile);
}

function isPromptInjectionAllowed(envVarName, env = process.env) {
  return String(env[envVarName] || 'false').toLowerCase() === 'true';
}

module.exports = { isInteractiveSafeModeEnabled, isPromptInjectionAllowed };
