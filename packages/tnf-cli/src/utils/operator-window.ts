/**
 * Operator-priority window for `tnf tui` LONG_RUN / AUTONOMOUS modes.
 *
 * Resolution order:
 *   1. TNF_OPERATOR_WINDOW_MS / TNF_AUTONOMOUS_TURN_DELAY_MS (one-shot env)
 *   2. ~/.tnf/tui-mode.json → operatorWindowMs
 *   3. DEFAULT_OPERATOR_WINDOW_MS (30s — long enough to finish a typed line)
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { writeFileAtomic } from './safe-fs.js';

export const DEFAULT_OPERATOR_WINDOW_MS = 30_000;
export const MIN_OPERATOR_WINDOW_MS = 0;
export const MAX_OPERATOR_WINDOW_MS = 600_000;

export type TuiModePersisted = {
  mode?: string;
  operatorWindowMs?: number;
  updatedAt?: string;
};

export function getTuiModeConfigPath(home = process.env.HOME || os.homedir()): string {
  return path.join(home, '.tnf', 'tui-mode.json');
}

export function readTuiModeConfig(home?: string): TuiModePersisted {
  try {
    const configPath = getTuiModeConfigPath(home);
    if (!fs.existsSync(configPath)) return {};
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return parsed && typeof parsed === 'object' ? (parsed as TuiModePersisted) : {};
  } catch {
    return {};
  }
}

export function clampOperatorWindowMs(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_OPERATOR_WINDOW_MS;
  return Math.min(MAX_OPERATOR_WINDOW_MS, Math.max(MIN_OPERATOR_WINDOW_MS, Math.round(value)));
}

/** Parse "/window 30", "30s", "30000ms", or bare seconds. Values ≥1000 are treated as ms. */
export function parseOperatorWindowArg(raw: string): number | null {
  const text = String(raw || '')
    .trim()
    .toLowerCase();
  if (!text) return null;

  const msMatch = text.match(/^(\d+(?:\.\d+)?)\s*ms$/);
  if (msMatch) {
    return clampOperatorWindowMs(Number(msMatch[1]));
  }

  const secMatch = text.match(/^(\d+(?:\.\d+)?)\s*s(?:ec(?:onds?)?)?$/);
  if (secMatch) {
    return clampOperatorWindowMs(Number(secMatch[1]) * 1000);
  }

  if (/^\d+(?:\.\d+)?$/.test(text)) {
    const n = Number(text);
    // Bare numbers: <1000 → seconds; ≥1000 → milliseconds (env-style).
    return clampOperatorWindowMs(n >= 1000 ? n : n * 1000);
  }

  return null;
}

/**
 * Detect natural-language window directives typed into the TUI prompt
 * (e.g. "operator window needs to be increased to 30").
 */
export function detectOperatorWindowDirective(text: string): number | null {
  const normalized = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return null;

  const patterns = [
    /(?:operator\s+)?window\s+(?:needs\s+to\s+be\s+)?(?:increased\s+to|set\s+to|to|=|:)\s*(\d+)\s*s?(?:ec(?:onds?)?)?\b/i,
    /increase\s+(?:the\s+)?(?:operator\s+)?window(?:\s+time)?(?:\s+to)?\s*(\d+)\s*s?(?:ec(?:onds?)?)?\b/i,
    /(?:set|make)\s+(?:the\s+)?(?:operator\s+)?window\s+(?:to\s+)?(\d+)\s*s?(?:ec(?:onds?)?)?\b/i,
    /(\d+)\s*s(?:ec(?:onds?)?)?\s+(?:operator\s+)?window\b/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return clampOperatorWindowMs(Number(match[1]) * 1000);
    }
  }
  return null;
}

export function resolveOperatorWindowMs(
  env: NodeJS.ProcessEnv = process.env,
  home?: string
): number {
  const envRaw = env.TNF_OPERATOR_WINDOW_MS || env.TNF_AUTONOMOUS_TURN_DELAY_MS;
  if (envRaw != null && String(envRaw).trim() !== '') {
    const parsed = parseInt(String(envRaw), 10);
    if (Number.isFinite(parsed) && parsed >= 0) return clampOperatorWindowMs(parsed);
  }

  const persisted = readTuiModeConfig(home).operatorWindowMs;
  if (typeof persisted === 'number' && Number.isFinite(persisted) && persisted >= 0) {
    return clampOperatorWindowMs(persisted);
  }

  return DEFAULT_OPERATOR_WINDOW_MS;
}

export function persistOperatorWindowMs(windowMs: number, home?: string): number {
  const clamped = clampOperatorWindowMs(windowMs);
  const configPath = getTuiModeConfigPath(home);
  const existing = readTuiModeConfig(home);
  const next: TuiModePersisted = {
    ...existing,
    operatorWindowMs: clamped,
    updatedAt: new Date().toISOString(),
  };
  if (!next.mode) next.mode = 'LONG_RUN';
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  // Atomic: a torn /window config would lapse into the default on next boot,
  // surprising operators mid-debug.
  writeFileAtomic(configPath, `${JSON.stringify(next, null, 2)}\n`);
  return clamped;
}

/** After repeated no-bash stalls, give the operator a longer quiet window. */
export function effectiveOperatorWindowMs(
  configuredMs: number,
  consecutiveNoBashTurns: number,
  stallBoostAfter = 2,
  stallFloorMs = 60_000
): number {
  if (consecutiveNoBashTurns < stallBoostAfter) return configuredMs;
  return Math.max(configuredMs, stallFloorMs);
}
