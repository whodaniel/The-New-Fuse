// tnf-fleet-mode.cjs
//
// Shared fleet-mode state machine for fleet-wide pause/resume.
//
// A single file at ${HOME}/.tnf/fleet/mode.json stores fleet mode:
//   { mode: 'running' | 'paused' | 'injection-paused',
//     updatedAt: ISO8601,
//     updatedBy: 'operator' | 'tnf-cli' | string,
//     reason: string }
// - file missing OR mode === 'running'  -> not paused
// - mode === 'paused'                  -> all scheduled/autonomous work skips
// - mode === 'injection-paused'        -> only keystroke/prompt injection skips
//
// Atomic writes via write-then-rename. Reads are best-effort and never
// throw. A MISSING file means "no operator has ever paused anything" and
// correctly resolves to running. A file that EXISTS but fails to read/parse
// means something is wrong with an operator's expressed intent — that
// resolves to 'paused', not 'running': for an operator kill-switch,
// uncertainty must fail toward the safer state, not the more available one.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const FLEET_MODE_DIR = path.join(os.homedir(), '.tnf', 'fleet');
const FLEET_MODE_FILE = path.join(FLEET_MODE_DIR, 'mode.json');

const VALID_MODES = new Set(['running', 'paused', 'injection-paused']);
const DEFAULT_MODE = 'running';

/**
 * Best-effort read of the fleet mode file.
 * @returns {{ paused: boolean, mode: string, reason: string, updatedAt: string|null, updatedBy: string|null, raw: object|null, error: string|null }}
 */
function readFleetMode() {
  const empty = {
    paused: false,
    mode: DEFAULT_MODE,
    reason: '',
    updatedAt: null,
    updatedBy: null,
    raw: null,
    error: null,
  };
  if (!fs.existsSync(FLEET_MODE_FILE)) return empty;
  try {
    const rawText = fs.readFileSync(FLEET_MODE_FILE, 'utf8');
    const raw = JSON.parse(rawText);
    const mode = typeof raw.mode === 'string' && VALID_MODES.has(raw.mode) ? raw.mode : DEFAULT_MODE;
    const paused = mode === 'paused' || mode === 'injection-paused';
    return {
      paused,
      mode,
      reason: typeof raw.reason === 'string' ? raw.reason : '',
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
      updatedBy: typeof raw.updatedBy === 'string' ? raw.updatedBy : null,
      raw,
      error: null,
    };
  } catch (err) {
    // File exists but couldn't be read/parsed — fail safe to paused.
    return {
      ...empty,
      paused: true,
      mode: 'paused',
      reason: 'fleet-mode-file-unreadable',
      error: err && err.message ? `read-error: ${err.message}` : 'read-error',
    };
  }
}

/**
 * Priority admission through a LOAD-INDUCED pause.
 *
 * The problem this solves, observed 2026-09-05: the resource watchdog paused
 * the fleet under load, which stopped the local sub-director from starting,
 * which meant an operator directive could not reach the one agent whose job is
 * to delegate the work — including the work of reducing the load. A pause that
 * silences the delegation path along with everything else has no way back in.
 *
 * The admission is deliberately narrow. High priority passes ONLY when all of
 * these hold; each `false` below is a boundary, not a knob to widen casually:
 *   - the pause was set by the resource watchdog (load-induced). An operator
 *     pause is a kill switch and stays absolute at every priority — the same
 *     asymmetry maybeAutoResume() already enforces.
 *   - the mode is 'paused', not 'injection-paused'. Keystroke/prompt injection
 *     is the class that once corrupted an operator's live typing; priority
 *     bandwidth must never reopen it.
 *   - the mode file parsed cleanly. Unreadable means an operator's expressed
 *     intent is unknown, which still fails safe to paused for everyone.
 *   - a FRESH snapshot is under the priority ceiling (see
 *     tnf-resource-guard.defaultThresholds). Above it nothing is admitted at
 *     any priority.
 *
 * @param {{ priority?: 'normal'|'high' }} [opts]
 * @returns {{ admit: boolean, reason: string, mode: string, priority: string, snapshot?: object }}
 */
function fleetAdmission({ priority } = {}) {
  // Required lazily: tnf-resource-guard does not require this module, and
  // keeping the edge one-directional and lazy means a bash caller paying for
  // a plain mode read never loads the snapshot machinery.
  const guard = require('./tnf-resource-guard.cjs');
  const level = guard.normalizePriority(priority);
  const state = readFleetMode();
  const base = { mode: state.mode, priority: level };

  if (state.mode !== 'paused') {
    return { ...base, admit: true, reason: state.mode === 'injection-paused' ? 'injection-paused-only' : 'running' };
  }
  if (level !== 'high') return { ...base, admit: false, reason: 'fleet-paused' };
  if (state.error) return { ...base, admit: false, reason: 'fleet-mode-unreadable' };
  if (state.updatedBy !== 'resource-watchdog') {
    return { ...base, admit: false, reason: 'operator-pause-is-absolute' };
  }

  const snapshot = guard.systemSnapshot({ fresh: true });
  const ceiling = guard.isOverloaded(snapshot, guard.defaultThresholds(snapshot, 'high'));
  if (ceiling.overloaded) {
    return { ...base, admit: false, reason: 'above-priority-ceiling', snapshot };
  }
  return { ...base, admit: true, reason: 'priority-admitted', snapshot };
}

/**
 * Returns true if the fleet is fully paused (mode === 'paused').
 * Use this from cron-gated scripts as an early-exit guard.
 *
 * Called with no argument this is byte-for-byte the original blunt gate, so
 * every existing caller keeps its current behaviour. Pass
 * `{ priority: 'high' }` to route through fleetAdmission() instead.
 */
function isFleetPaused(opts) {
  if (!opts || opts.priority === undefined) {
    const state = readFleetMode();
    return state.mode === 'paused';
  }
  return !fleetAdmission(opts).admit;
}

/**
 * Returns true if injection-class operations are paused
 * (mode === 'paused' OR 'injection-paused').
 * Use this from any script that types keystrokes / injects prompts.
 */
function isInjectionPaused() {
  const state = readFleetMode();
  return state.mode === 'paused' || state.mode === 'injection-paused';
}

/**
 * Sets the fleet mode atomically. Validates input; throws on invalid mode.
 * @param {'running'|'paused'|'injection-paused'} mode
 * @param {string} reason
 * @param {string} actor  e.g. 'operator', 'tnf-cli'
 */
function setFleetMode(mode, reason, actor) {
  if (!VALID_MODES.has(mode)) {
    throw new Error(
      `Invalid fleet mode '${mode}'. Valid: ${Array.from(VALID_MODES).join(', ')}`
    );
  }
  fs.mkdirSync(FLEET_MODE_DIR, { recursive: true });
  const payload = {
    mode,
    reason: typeof reason === 'string' ? reason : '',
    updatedBy: typeof actor === 'string' && actor ? actor : 'unknown',
    updatedAt: new Date().toISOString(),
  };
  const tmp = path.join(FLEET_MODE_DIR, `mode.json.tmp.${process.pid}.${Date.now()}`);
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, FLEET_MODE_FILE);
  return payload;
}

/**
 * Clears the fleet mode (resumes to running) by removing the file entirely.
 * Idempotent: missing file is fine.
 */
function clearFleetMode() {
  try {
    if (fs.existsSync(FLEET_MODE_FILE)) {
      fs.unlinkSync(FLEET_MODE_FILE);
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : 'unknown' };
  }
}

module.exports = {
  FLEET_MODE_FILE,
  FLEET_MODE_DIR,
  VALID_MODES,
  readFleetMode,
  isFleetPaused,
  fleetAdmission,
  isInjectionPaused,
  setFleetMode,
  clearFleetMode,
};
