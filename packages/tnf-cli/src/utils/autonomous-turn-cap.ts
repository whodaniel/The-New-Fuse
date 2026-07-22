/**
 * Soft + hard autonomous turn budget for the interactive / TUI agent loop.
 *
 * Hard cap: stops self-continuation when turnsThisSession >= maxTurnsPerSession.
 * Soft cap: once turns reach softRatio of the hard cap, emit a one-shot warning
 *           so the agent can wrap up (or, in LONG_RUN, self-extend).
 * Override: in LONG_RUN only, the agent may emit `TNF_EXTEND_TURN_CAP[=n]` to
 *           raise maxTurnsPerSession, clamped to capCeiling.
 */

export type TuiModeForTurnCap = 'INTERACTIVE' | 'AUTONOMOUS' | 'LONG_RUN';

export type AutonomousTurnCapConfig = {
  maxTurns: number;
  softRatio: number;
  capCeiling: number;
  extendDefault: number;
};

export type AutonomousTurnCapState = {
  turnsThisSession: number;
  maxTurnsPerSession: number;
  softCapNotified: boolean;
  capCeiling: number;
};

export type SoftCapWarning = {
  remaining: number;
  systemMessage: string;
  consoleLine: string;
};

export type CapExtensionResult =
  | { kind: 'none' }
  | {
      kind: 'granted';
      granted: number;
      newCap: number;
      systemMessage: string;
      consoleLine: string;
    }
  | {
      kind: 'denied';
      systemMessage: string;
      consoleLine: string;
    };

const EXTEND_MARKER_RE = /TNF_EXTEND_TURN_CAP(?:\s*[=:]\s*(\d{1,4}))?/;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = parseInt(raw || '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function loadAutonomousTurnCapConfig(
  env: NodeJS.ProcessEnv = process.env
): AutonomousTurnCapConfig {
  const maxTurns = parsePositiveInt(env.TNF_AUTONOMOUS_MAX_TURNS, 50);
  const softParsed = Number.parseFloat(env.TNF_AUTONOMOUS_SOFT_TURN_RATIO || '0.8');
  const softRatio =
    Number.isFinite(softParsed) && softParsed > 0 && softParsed < 1 ? softParsed : 0.8;
  const capCeiling = Math.max(
    maxTurns,
    parsePositiveInt(env.TNF_AUTONOMOUS_TURN_CAP_CEILING, maxTurns * 4)
  );
  const extendDefault = parsePositiveInt(env.TNF_AUTONOMOUS_TURN_EXTEND_DEFAULT, 25);
  return { maxTurns, softRatio, capCeiling, extendDefault };
}

export function createAutonomousTurnCapState(
  config: AutonomousTurnCapConfig
): AutonomousTurnCapState {
  return {
    turnsThisSession: 0,
    maxTurnsPerSession: config.maxTurns,
    softCapNotified: false,
    capCeiling: config.capCeiling,
  };
}

export function softTurnThreshold(maxTurnsPerSession: number, softRatio: number): number {
  return Math.max(1, Math.ceil(maxTurnsPerSession * softRatio));
}

/** Returns requested extension size, or null if the marker is absent. */
export function parseExtendTurnCapMarker(
  response: string,
  extendDefault: number
): number | null {
  const match = String(response).match(EXTEND_MARKER_RE);
  if (!match) return null;
  if (match[1]) {
    const n = parseInt(match[1], 10);
    return Number.isFinite(n) && n > 0 ? n : extendDefault;
  }
  return Math.max(1, extendDefault);
}

export function canSelfExtendTurnCap(tuiMode: TuiModeForTurnCap): boolean {
  return tuiMode === 'LONG_RUN';
}

export function applyTurnCapExtension(
  state: AutonomousTurnCapState,
  requested: number,
  turnsThisSession: number,
  softRatio: number,
  tuiMode: TuiModeForTurnCap
): CapExtensionResult {
  if (!canSelfExtendTurnCap(tuiMode)) return { kind: 'none' };
  const threshold = softTurnThreshold(state.maxTurnsPerSession, softRatio);
  if (turnsThisSession < threshold) return { kind: 'none' };

  const newCap = Math.min(state.capCeiling, state.maxTurnsPerSession + Math.max(1, requested));
  const granted = newCap - state.maxTurnsPerSession;
  if (granted > 0) {
    state.maxTurnsPerSession = newCap;
    state.softCapNotified = false;
    return {
      kind: 'granted',
      granted,
      newCap,
      consoleLine: `⏱ Autonomous turn cap extended by ${granted} → ${newCap} (ceiling ${state.capCeiling})`,
      systemMessage: `[Autonomous turn budget] Cap extension granted: +${granted} turns. New cap: ${newCap} (absolute ceiling ${state.capCeiling}).`,
    };
  }
  return {
    kind: 'denied',
    consoleLine: `⏱ Turn cap extension denied: ceiling ${state.capCeiling} reached`,
    systemMessage: `[Autonomous turn budget] Cap extension DENIED: absolute ceiling of ${state.capCeiling} turns reached. Wrap up and hand off; operator input is required to continue beyond it.`,
  };
}

export function buildSoftCapWarning(
  state: AutonomousTurnCapState,
  softRatio: number,
  tuiMode: TuiModeForTurnCap,
  extendDefault: number
): SoftCapWarning | null {
  if (state.softCapNotified) return null;
  if (state.turnsThisSession >= state.maxTurnsPerSession) return null;
  const threshold = softTurnThreshold(state.maxTurnsPerSession, softRatio);
  if (state.turnsThisSession < threshold) return null;

  const remaining = state.maxTurnsPerSession - state.turnsThisSession;
  const overrideHint = canSelfExtendTurnCap(tuiMode)
    ? `You are in fully autonomous (LONG_RUN) mode: to extend the cap, include the token TNF_EXTEND_TURN_CAP=<n> (e.g. TNF_EXTEND_TURN_CAP=${extendDefault}) in a response before the cap is reached. Extensions are clamped to an absolute ceiling of ${state.capCeiling} turns.`
    : `This session is not in LONG_RUN mode, so the cap cannot be self-extended; use the remaining turns to reach a clean handoff state (update handoff notes, finish or checkpoint in-flight work).`;

  return {
    remaining,
    consoleLine: `⏱ Soft turn cap: ${state.turnsThisSession}/${state.maxTurnsPerSession} autonomous turns used (${remaining} remaining)`,
    systemMessage: `[Autonomous turn budget] WARNING: ${state.turnsThisSession} of ${state.maxTurnsPerSession} autonomous turns used — ${remaining} remaining before the hard cap halts self-continuation. ${overrideHint}`,
  };
}

export function isHardTurnCapReached(state: AutonomousTurnCapState): boolean {
  return state.turnsThisSession >= state.maxTurnsPerSession;
}
