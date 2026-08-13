import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  applyTurnCapExtension,
  buildSoftCapWarning,
  canSelfExtendTurnCap,
  createAutonomousTurnCapState,
  isHardTurnCapReached,
  loadAutonomousTurnCapConfig,
  parseExtendTurnCapMarker,
  softTurnThreshold,
} from './autonomous-turn-cap.js';

describe('autonomous turn cap', () => {
  it('loads config with defaults and clamps soft ratio', () => {
    const defaults = loadAutonomousTurnCapConfig({});
    assert.equal(defaults.maxTurns, 50);
    assert.equal(defaults.softRatio, 0.8);
    assert.equal(defaults.capCeiling, 200);
    assert.equal(defaults.extendDefault, 25);

    const custom = loadAutonomousTurnCapConfig({
      TNF_AUTONOMOUS_MAX_TURNS: '20',
      TNF_AUTONOMOUS_SOFT_TURN_RATIO: '0.9',
      TNF_AUTONOMOUS_TURN_CAP_CEILING: '40',
      TNF_AUTONOMOUS_TURN_EXTEND_DEFAULT: '10',
    });
    assert.equal(custom.maxTurns, 20);
    assert.equal(custom.softRatio, 0.9);
    assert.equal(custom.capCeiling, 40);
    assert.equal(custom.extendDefault, 10);

    const badRatio = loadAutonomousTurnCapConfig({
      TNF_AUTONOMOUS_SOFT_TURN_RATIO: '1.5',
    });
    assert.equal(badRatio.softRatio, 0.8);
  });

  it('computes soft threshold at the configured ratio', () => {
    assert.equal(softTurnThreshold(50, 0.8), 40);
    assert.equal(softTurnThreshold(1, 0.8), 1);
  });

  it('parses TNF_EXTEND_TURN_CAP markers', () => {
    assert.equal(parseExtendTurnCapMarker('no marker here', 25), null);
    assert.equal(parseExtendTurnCapMarker('TNF_EXTEND_TURN_CAP=30', 25), 30);
    assert.equal(parseExtendTurnCapMarker('TNF_EXTEND_TURN_CAP: 12', 25), 12);
    assert.equal(parseExtendTurnCapMarker('please TNF_EXTEND_TURN_CAP continue', 25), 25);
  });

  it('allows self-extend only in LONG_RUN', () => {
    assert.equal(canSelfExtendTurnCap('LONG_RUN'), true);
    assert.equal(canSelfExtendTurnCap('AUTONOMOUS'), false);
    assert.equal(canSelfExtendTurnCap('INTERACTIVE'), false);
  });

  it('notifies once when soft threshold is reached', () => {
    const config = loadAutonomousTurnCapConfig({ TNF_AUTONOMOUS_MAX_TURNS: '10' });
    const state = createAutonomousTurnCapState(config);
    state.turnsThisSession = 8; // 80% of 10

    const first = buildSoftCapWarning(state, config.softRatio, 'AUTONOMOUS', config.extendDefault);
    assert.ok(first);
    assert.equal(first.remaining, 2);
    assert.match(first.systemMessage, /WARNING/);
    assert.match(first.systemMessage, /cannot be self-extended/);

    state.softCapNotified = true;
    assert.equal(
      buildSoftCapWarning(state, config.softRatio, 'AUTONOMOUS', config.extendDefault),
      null
    );
  });

  it('includes override instructions in LONG_RUN soft warning', () => {
    const config = loadAutonomousTurnCapConfig({ TNF_AUTONOMOUS_MAX_TURNS: '10' });
    const state = createAutonomousTurnCapState(config);
    state.turnsThisSession = 8;
    const warning = buildSoftCapWarning(state, config.softRatio, 'LONG_RUN', config.extendDefault);
    assert.ok(warning);
    assert.match(warning.systemMessage, /TNF_EXTEND_TURN_CAP=/);
    assert.match(warning.systemMessage, /LONG_RUN/);
  });

  it('grants capped extension in LONG_RUN after soft threshold', () => {
    const config = loadAutonomousTurnCapConfig({
      TNF_AUTONOMOUS_MAX_TURNS: '10',
      TNF_AUTONOMOUS_TURN_CAP_CEILING: '25',
    });
    const state = createAutonomousTurnCapState(config);
    state.turnsThisSession = 8;
    state.softCapNotified = true;

    const deniedMode = applyTurnCapExtension(
      state,
      10,
      state.turnsThisSession,
      config.softRatio,
      'AUTONOMOUS'
    );
    assert.equal(deniedMode.kind, 'none');

    const granted = applyTurnCapExtension(
      state,
      10,
      state.turnsThisSession,
      config.softRatio,
      'LONG_RUN'
    );
    assert.equal(granted.kind, 'granted');
    if (granted.kind === 'granted') {
      assert.equal(granted.granted, 10);
      assert.equal(granted.newCap, 20);
      assert.equal(state.maxTurnsPerSession, 20);
      assert.equal(state.softCapNotified, false);
    }

    // Push to ceiling
    state.turnsThisSession = softTurnThreshold(state.maxTurnsPerSession, config.softRatio);
    const toCeiling = applyTurnCapExtension(
      state,
      100,
      state.turnsThisSession,
      config.softRatio,
      'LONG_RUN'
    );
    assert.equal(toCeiling.kind, 'granted');
    if (toCeiling.kind === 'granted') {
      assert.equal(toCeiling.newCap, 25);
    }

    state.turnsThisSession = softTurnThreshold(state.maxTurnsPerSession, config.softRatio);
    const blocked = applyTurnCapExtension(
      state,
      5,
      state.turnsThisSession,
      config.softRatio,
      'LONG_RUN'
    );
    assert.equal(blocked.kind, 'denied');
  });

  it('halts at hard cap', () => {
    const state = createAutonomousTurnCapState(
      loadAutonomousTurnCapConfig({ TNF_AUTONOMOUS_MAX_TURNS: '3' })
    );
    state.turnsThisSession = 2;
    assert.equal(isHardTurnCapReached(state), false);
    state.turnsThisSession = 3;
    assert.equal(isHardTurnCapReached(state), true);
  });
});
