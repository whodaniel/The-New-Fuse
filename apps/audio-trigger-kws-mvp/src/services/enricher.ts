import crypto from "node:crypto";
import { ContextPackage, HitEvent, RuleFireEvent } from "../types/events";

export class Enricher {
  constructor(private readonly hitStore: Map<string, HitEvent>) {}

  async buildContextPackage(ruleFire: RuleFireEvent): Promise<ContextPackage> {
    const evidence = ruleFire.matchedEventIds
      .map((eventId) => this.hitStore.get(eventId))
      .filter((event): event is HitEvent => Boolean(event))
      .map((event) => ({
        event_id: event.eventId,
        term_id: event.termId,
        group_id: event.groupId,
        confidence: event.confidence,
        ts_ms: event.tsEndMs
      }));

    return {
      pkg_id: crypto.randomUUID(),
      stream_id: ruleFire.streamId,
      rule_id: ruleFire.ruleId,
      normalized_facts: {
        matched_groups: ruleFire.matchedGroups,
        trigger_confidence: ruleFire.confidence
      },
      evidence,
      vector_refs: [
        `vec://stream/${ruleFire.streamId}/rule/${ruleFire.ruleId}/latest`
      ],
      graph_refs: [
        `kg://stream/${ruleFire.streamId}/rule/${ruleFire.ruleId}`
      ],
      provenance: {
        template_id: ruleFire.action.templateId,
        builder_version: "0.1.0"
      },
      created_at: new Date().toISOString()
    };
  }
}

