import { TriggerRule } from "../types/events";

export const defaultRules: TriggerRule[] = [
  {
    ruleId: "rule_med_intent",
    name: "Medication intent",
    enabled: true,
    priority: 10,
    minRuleConf: 0.82,
    windowMs: 5000,
    cooldownMs: 8000,
    all: [
      { kind: "hit", groupId: "drug", minConf: 0.78, count: 1, windowMs: 5000 },
      { kind: "hit", groupId: "dose", minConf: 0.72, count: 1, windowMs: 5000 }
    ],
    action: { type: "enqueue_llm", templateId: "med_safety_v1" }
  },
  {
    ruleId: "rule_escalation",
    name: "Escalation sequence",
    enabled: true,
    priority: 1,
    minRuleConf: 0.82,
    windowMs: 7000,
    cooldownMs: 20000,
    all: [
      {
        kind: "sequence",
        groupIds: ["distress", "self_harm"],
        maxGapMs: 7000,
        ordered: true
      }
    ],
    none: [{ kind: "hit", groupId: "joke_context", minConf: 0.8, count: 1, windowMs: 7000 }],
    action: { type: "enqueue_llm", templateId: "crisis_triage_v1" }
  }
];

