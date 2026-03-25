import { EventEmitter } from "node:events";
import crypto from "node:crypto";
import {
  HitEvent,
  RuleFireEvent,
  TriggerCondition,
  TriggerConditionHit,
  TriggerConditionSequence,
  TriggerRule
} from "../types/events";

interface StreamRuleState {
  hits: HitEvent[];
  lastFiredAtMsByRule: Map<string, number>;
}

export class RuleEngine extends EventEmitter {
  private readonly stateByStream = new Map<string, StreamRuleState>();

  constructor(private readonly rules: TriggerRule[]) {
    super();
  }

  push(hit: HitEvent): void {
    const streamState = this.stateByStream.get(hit.streamId) ?? {
      hits: [],
      lastFiredAtMsByRule: new Map<string, number>()
    };

    streamState.hits.push(hit);
    const oldestAllowedTs = hit.tsEndMs - 60_000;
    streamState.hits = streamState.hits.filter((event) => event.tsEndMs >= oldestAllowedTs);
    this.stateByStream.set(hit.streamId, streamState);

    const orderedRules = [...this.rules]
      .filter((rule) => rule.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of orderedRules) {
      const lastFired = streamState.lastFiredAtMsByRule.get(rule.ruleId) ?? 0;
      if (hit.tsEndMs - lastFired < rule.cooldownMs) {
        continue;
      }

      const inWindow = streamState.hits.filter(
        (event) => event.tsEndMs >= hit.tsEndMs - rule.windowMs && event.tsEndMs <= hit.tsEndMs
      );

      const evaluation = this.evaluateRule(rule, inWindow);
      if (!evaluation.matched || evaluation.confidence < rule.minRuleConf) {
        continue;
      }

      streamState.lastFiredAtMsByRule.set(rule.ruleId, hit.tsEndMs);
      const ruleFire: RuleFireEvent = {
        fireId: crypto.randomUUID(),
        ruleId: rule.ruleId,
        streamId: hit.streamId,
        tsMs: hit.tsEndMs,
        confidence: evaluation.confidence,
        matchedEventIds: [...new Set(evaluation.matchedEvents.map((event) => event.eventId))],
        matchedGroups: [...new Set(evaluation.matchedEvents.map((event) => event.groupId))],
        action: rule.action
      };
      this.emit("rule_fired", ruleFire);
    }
  }

  private evaluateRule(rule: TriggerRule, events: HitEvent[]): {
    matched: boolean;
    confidence: number;
    matchedEvents: HitEvent[];
  } {
    const allResults = (rule.all ?? []).map((condition) => this.evaluateCondition(condition, events));
    const anyResults = (rule.any ?? []).map((condition) => this.evaluateCondition(condition, events));
    const noneResults = (rule.none ?? []).map((condition) => this.evaluateCondition(condition, events));

    const allMatched = allResults.every((result) => result.matched);
    const anyMatched = anyResults.length === 0 ? true : anyResults.some((result) => result.matched);
    const noneMatched = noneResults.every((result) => !result.matched);

    const matched = allMatched && anyMatched && noneMatched;
    if (!matched) {
      return { matched: false, confidence: 0, matchedEvents: [] };
    }

    const positiveResults = [...allResults, ...anyResults].filter((result) => result.matched);
    const confidence =
      positiveResults.length === 0
        ? 0
        : positiveResults.reduce((sum, result) => sum + result.confidence, 0) / positiveResults.length;

    return {
      matched: true,
      confidence,
      matchedEvents: positiveResults.flatMap((result) => result.events)
    };
  }

  private evaluateCondition(
    condition: TriggerCondition,
    events: HitEvent[]
  ): { matched: boolean; confidence: number; events: HitEvent[] } {
    if (condition.kind === "hit") {
      return this.evaluateHitCondition(condition, events);
    }
    return this.evaluateSequenceCondition(condition, events);
  }

  private evaluateHitCondition(
    condition: TriggerConditionHit,
    events: HitEvent[]
  ): { matched: boolean; confidence: number; events: HitEvent[] } {
    if (events.length === 0) {
      return { matched: false, confidence: 0, events: [] };
    }

    const nowMs = Math.max(...events.map((event) => event.tsEndMs));
    const matches = events.filter(
      (event) =>
        event.groupId === condition.groupId &&
        event.confidence >= condition.minConf &&
        event.tsEndMs >= nowMs - condition.windowMs
    );

    if (matches.length < condition.count) {
      return { matched: false, confidence: 0, events: matches };
    }

    const selected = matches.slice(-condition.count);
    const confidence = selected.reduce((sum, event) => sum + event.confidence, 0) / selected.length;
    return { matched: true, confidence, events: selected };
  }

  private evaluateSequenceCondition(
    condition: TriggerConditionSequence,
    events: HitEvent[]
  ): { matched: boolean; confidence: number; events: HitEvent[] } {
    const candidateEvents = events
      .filter((event) => condition.groupIds.includes(event.groupId))
      .sort((a, b) => a.tsStartMs - b.tsStartMs);

    if (candidateEvents.length === 0) {
      return { matched: false, confidence: 0, events: [] };
    }

    const matched: HitEvent[] = [];
    let sequenceIndex = 0;
    let previousTs = 0;

    for (const event of candidateEvents) {
      const expectedGroup = condition.groupIds[sequenceIndex];
      if (event.groupId !== expectedGroup) {
        if (!condition.ordered) {
          continue;
        }
        if (sequenceIndex > 0 && event.groupId === condition.groupIds[0]) {
          matched.length = 0;
          sequenceIndex = 0;
          previousTs = 0;
        }
        continue;
      }

      if (previousTs > 0 && event.tsStartMs - previousTs > condition.maxGapMs) {
        matched.length = 0;
        sequenceIndex = 0;
        previousTs = 0;
      }

      matched.push(event);
      previousTs = event.tsStartMs;
      sequenceIndex += 1;

      if (sequenceIndex >= condition.groupIds.length) {
        const confidence = matched.reduce((sum, item) => sum + item.confidence, 0) / matched.length;
        return { matched: true, confidence, events: [...matched] };
      }
    }

    return { matched: false, confidence: 0, events: matched };
  }
}

