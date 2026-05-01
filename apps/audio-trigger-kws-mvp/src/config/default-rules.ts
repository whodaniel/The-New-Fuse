import { TriggerRule } from '../types/events';

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
  },
  // Digital Art Assist Rules
  {
    ruleId: "digital_art_session_start",
    name: "Digital Art Session Start",
    enabled: true,
    priority: 15,
    minRuleConf: 0.80,
    windowMs: 10000,
    cooldownMs: 300000,
    all: [
      { kind: "hit", groupId: "digital_art", minConf: 0.80, count: 1, windowMs: 10000 },
      { kind: "hit", groupId: "start_session", minConf: 0.75, count: 1, windowMs: 10000 }
    ],
    action: { type: "enqueue_llm", templateId: "digital_art_session_setup_v1" }
  },
  {
    ruleId: "reference_image_request",
    name: "Reference Image Request",
    enabled: true,
    priority: 12,
    minRuleConf: 0.70,
    windowMs: 8000,
    cooldownMs: 60000,
    all: [
      { kind: "hit", groupId: "reference", minConf: 0.70, count: 1, windowMs: 8000 },
      { kind: "hit", groupId: "image", minConf: 0.70, count: 1, windowMs: 8000 },
      { kind: "hit", groupId: "search_action", minConf: 0.65, count: 1, windowMs: 8000 }
    ],
    action: { type: "enqueue_llm", templateId: "image_search_assist_v1" }
  },
  {
    ruleId: "color_palette_help",
    name: "Color Palette Help",
    enabled: true,
    priority: 10,
    minRuleConf: 0.68,
    windowMs: 6000,
    cooldownMs: 45000,
    all: [
      { kind: "hit", groupId: "color", minConf: 0.68, count: 1, windowMs: 6000 },
      { kind: "hit", groupId: "color_scheme", minConf: 0.68, count: 1, windowMs: 6000 },
      { kind: "hit", groupId: "assist_action", minConf: 0.65, count: 1, windowMs: 6000 }
    ],
    action: { type: "enqueue_llm", templateId: "color_palette_v1" }
  },
  {
    ruleId: "technique_tutorial",
    name: "Technique Tutorial",
    enabled: true,
    priority: 11,
    minRuleConf: 0.70,
    windowMs: 10000,
    cooldownMs: 90000,
    all: [
      { kind: "hit", groupId: "tutorial", minConf: 0.70, count: 1, windowMs: 10000 },
      { kind: "hit", groupId: "art_tool", minConf: 0.65, count: 1, windowMs: 10000 }
    ],
    action: { type: "enqueue_llm", templateId: "art_technique_v1" }
  },
  {
    ruleId: "feedback_request",
    name: "Feedback Request",
    enabled: true,
    priority: 13,
    minRuleConf: 0.72,
    windowMs: 8000,
    cooldownMs: 120000,
    all: [
      { kind: "hit", groupId: "feedback", minConf: 0.72, count: 1, windowMs: 8000 },
      { kind: "hit", groupId: "artwork_context", minConf: 0.70, count: 1, windowMs: 8000 }
    ],
    action: { type: "enqueue_llm", templateId: "art_feedback_v1" }
  },
  {
    ruleId: "export_save_prompt",
    name: "Export/Save Prompt",
    enabled: true,
    priority: 9,
    minRuleConf: 0.68,
    windowMs: 6000,
    cooldownMs: 30000,
    all: [
      { kind: "hit", groupId: "file_op", minConf: 0.68, count: 1, windowMs: 6000 },
      { kind: "hit", groupId: "file_settings", minConf: 0.65, count: 1, windowMs: 6000 },
      { kind: "hit", groupId: "image_format", minConf: 0.60, count: 1, windowMs: 6000 }
    ],
    action: { type: "enqueue_llm", templateId: "export_settings_v1" }
  },
  {
    ruleId: "creative_block_help",
    name: "Creative Block Help",
    enabled: true,
    priority: 14,
    minRuleConf: 0.70,
    windowMs: 10000,
    cooldownMs: 180000,
    all: [
      { kind: "hit", groupId: "creative_block", minConf: 0.70, count: 1, windowMs: 10000 },
      { kind: "hit", groupId: "creative_concept", minConf: 0.68, count: 1, windowMs: 10000 },
      { kind: "hit", groupId: "assist_action", minConf: 0.65, count: 1, windowMs: 10000 }
    ],
    action: { type: "enqueue_llm", templateId: "creative_prompt_v1" }
  },
  {
    ruleId: "layer_management",
    name: "Layer Management",
    enabled: true,
    priority: 8,
    minRuleConf: 0.65,
    windowMs: 8000,
    cooldownMs: 40000,
    all: [
      { kind: "hit", groupId: "layer_management", minConf: 0.65, count: 2, windowMs: 8000 },
      { kind: "hit", groupId: "layer_action", minConf: 0.65, count: 1, windowMs: 8000 }
    ],
    action: { type: "enqueue_llm", templateId: "layer_management_v1" }
  },
  {
    ruleId: "digital_art_interest_profile",
    name: "Digital Art Interest Profile Update",
    enabled: true,
    priority: 18,
    minRuleConf: 0.75,
    windowMs: 30000,
    cooldownMs: 600000,
    all: [
      { kind: "hit", groupId: "digital_art_interest", minConf: 0.75, count: 2, windowMs: 30000 },
      { kind: "hit", groupId: "art_software", minConf: 0.70, count: 1, windowMs: 30000 }
    ],
    action: { type: "enqueue_llm", templateId: "digital_art_profile_update_v1" }
  },
  {
    ruleId: "quick_reference_lookup",
    name: "Quick Reference Lookup",
    enabled: true,
    priority: 11,
    minRuleConf: 0.70,
    windowMs: 5000,
    cooldownMs: 30000,
    all: [
      { kind: "hit", groupId: "quick_reference", minConf: 0.70, count: 1, windowMs: 5000 },
      { kind: "hit", groupId: "art_theory", minConf: 0.68, count: 1, windowMs: 5000 }
    ],
    action: { type: "enqueue_llm", templateId: "quick_reference_v1" }
  },
  {
    ruleId: "time_management_prompt",
    name: "Time Management Prompt",
    enabled: true,
    priority: 9,
    minRuleConf: 0.68,
    windowMs: 10000,
    cooldownMs: 120000,
    all: [
      { kind: "hit", groupId: "time_management", minConf: 0.68, count: 1, windowMs: 10000 },
      { kind: "hit", groupId: "time_setting", minConf: 0.65, count: 1, windowMs: 10000 }
    ],
    action: { type: "enqueue_llm", templateId: "break_reminder_v1" }
  }
];

