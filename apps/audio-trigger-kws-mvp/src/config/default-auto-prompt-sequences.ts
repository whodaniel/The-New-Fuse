import { AutoPromptSequenceDefinition } from '../types/events';

export const defaultAutoPromptSequences: AutoPromptSequenceDefinition[] = [
  {
    sequenceId: 'seq_safety_escalation_loop',
    name: 'Safety Escalation Loop',
    enabled: true,
    useCase: 'safety-escalation',
    agentId: 'router',
    trigger: {
      source: ['rule_fire'],
      ruleIds: ['rule_escalation'],
      minConfidence: 0.82,
      cooldownMs: 60000,
    },
    steps: [
      {
        stepId: 'step_triage',
        title: 'Triage',
        promptTemplate:
          'Safety signal detected for stream {{streamId}} from rule {{ruleId}} at confidence {{confidence}}. Perform immediate triage and verify severity.',
      },
      {
        stepId: 'step_response_plan',
        title: 'Response Plan',
        promptTemplate:
          'Generate a concise action plan for stream {{streamId}}. Include who to notify, immediate next action, and follow-up checkpoint.',
      },
    ],
    assessment: {
      minOverallScore: 78,
    },
    adaptation: {
      enabled: true,
      thresholdKey: 'rule_rule_escalation',
      minThreshold: 0.7,
      maxThreshold: 0.96,
      increaseStep: 0.03,
      decreaseStep: 0.01,
      defaultThreshold: 0.82,
    },
  },
  {
    sequenceId: 'seq_keyword_focus_recovery',
    name: 'Keyword Focus Recovery',
    enabled: true,
    useCase: 'focus-recovery',
    agentId: 'echo',
    trigger: {
      source: ['keyword_hit', 'rule_fire'],
      groupIds: ['creative_block', 'time_management'],
      ruleIds: ['time_management_prompt'],
      minConfidence: 0.68,
      cooldownMs: 45000,
    },
    steps: [
      {
        stepId: 'step_detect_blocker',
        title: 'Detect Blocker',
        promptTemplate:
          'A focus-related trigger fired on stream {{streamId}} (group {{groupId}}, confidence {{confidence}}). Ask one targeted diagnostic question.',
      },
      {
        stepId: 'step_micro_plan',
        title: 'Micro Plan',
        promptTemplate:
          'Create a 10-minute micro-plan with one clear deliverable for stream {{streamId}}. Keep it short and executable.',
      },
    ],
    assessment: {
      minOverallScore: 70,
    },
    adaptation: {
      enabled: true,
      minThreshold: 0.6,
      maxThreshold: 0.9,
      increaseStep: 0.02,
      decreaseStep: 0.01,
      defaultThreshold: 0.7,
    },
  },
  {
    sequenceId: 'seq_visual_blocker_recovery',
    name: 'Visual Blocker Recovery',
    enabled: true,
    useCase: 'visual-blocker',
    agentId: 'pulse',
    trigger: {
      source: ['visual_object'],
      visualLabels: ['error_dialog', 'captcha', 'payment_failed', 'blocked_banner'],
      minConfidence: 0.72,
      cooldownMs: 30000,
    },
    steps: [
      {
        stepId: 'step_visual_interpret',
        title: 'Interpret Visual Blocker',
        promptTemplate:
          'Visual trigger {{visualLabel}} detected on stream {{streamId}} with confidence {{confidence}}. Identify probable blocker class and likely root cause.',
      },
      {
        stepId: 'step_visual_next_action',
        title: 'Suggest Next Action',
        promptTemplate:
          'For visual blocker {{visualLabel}}, generate the next best action plus one fallback action for stream {{streamId}}.',
      },
    ],
    assessment: {
      minOverallScore: 72,
    },
    adaptation: {
      enabled: true,
      minThreshold: 0.65,
      maxThreshold: 0.95,
      increaseStep: 0.02,
      decreaseStep: 0.01,
      defaultThreshold: 0.75,
    },
  },
  {
    sequenceId: 'seq_claude_hook_continuity',
    name: 'Claude Hook Continuity',
    enabled: true,
    useCase: 'claude-hook-continuity',
    agentId: 'router',
    trigger: {
      source: ['claude_hook'],
      ruleIds: ['claude_hook_pretooluse', 'claude_hook_posttoolusefailure', 'claude_hook_userpromptsubmit'],
      minConfidence: 0.72,
      cooldownMs: 30000,
    },
    steps: [
      {
        stepId: 'step_hook_state_capture',
        title: 'Capture Hook State',
        promptTemplate:
          'Claude hook {{hookEventName}} fired on {{streamId}} (session {{sessionId}}) via tool {{toolName}} with confidence {{confidence}}. Capture immediate state and potential risk of stall.',
      },
      {
        stepId: 'step_hook_next_action',
        title: 'Recommend Next Action',
        promptTemplate:
          "Given hook event {{hookEventName}} and utterance '{{utterance}}', recommend the smallest next action to keep momentum while avoiding unsafe loops.",
      },
    ],
    assessment: {
      minOverallScore: 72,
    },
    adaptation: {
      enabled: true,
      thresholdKey: 'claude_hook_continuity',
      minThreshold: 0.62,
      maxThreshold: 0.95,
      increaseStep: 0.02,
      decreaseStep: 0.01,
      defaultThreshold: 0.72,
    },
  },
];
