import crypto from 'node:crypto';
import { AutomationTriggerEvent } from '../types/events';

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;

const asString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'unknown';

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const toEpochMs = (value: unknown): number | undefined => {
  const direct = asNumber(value);
  if (direct !== undefined) {
    if (direct > 1e12) {
      return Math.round(direct);
    }
    if (direct > 1e9) {
      return Math.round(direct * 1000);
    }
  }

  const asText = asString(value);
  if (!asText) {
    return undefined;
  }

  const asInt = Number.parseInt(asText, 10);
  if (Number.isFinite(asInt)) {
    if (asInt > 1e12) {
      return asInt;
    }
    if (asInt > 1e9) {
      return asInt * 1000;
    }
  }

  const parsed = Date.parse(asText);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed;
};

const summarizeToolInput = (toolInput: Record<string, unknown>): string => {
  const command = asString(toolInput.command);
  const description = asString(toolInput.description);
  const filePath = asString(toolInput.file_path) ?? asString(toolInput.path);
  const pattern = asString(toolInput.pattern);
  const url = asString(toolInput.url);
  const prompt = asString(toolInput.prompt);

  const parts = [command, description, filePath, pattern, url, prompt].filter(
    (item): item is string => typeof item === 'string' && item.length > 0
  );

  return parts.join(' | ');
};

const summarizeBatchToolCalls = (value: unknown): string => {
  if (!Array.isArray(value) || value.length === 0) {
    return '';
  }

  const snippets = value
    .slice(0, 3)
    .map((entry) => {
      const row = asRecord(entry);
      if (!row) {
        return '';
      }

      const toolName = asString(row.tool_name) ?? 'unknown_tool';
      const toolInput = asRecord(row.tool_input);
      const inputText = toolInput ? summarizeToolInput(toolInput) : '';
      return inputText ? `${toolName}: ${inputText}` : toolName;
    })
    .filter(Boolean);

  return snippets.join(' || ');
};

const deriveUtterance = (payload: Record<string, unknown>, hookEventName: string, toolName?: string): string => {
  const toolInput = asRecord(payload.tool_input);

  const candidates = [
    asString(payload.prompt),
    asString(payload.user_prompt),
    asString(payload.expanded_prompt),
    asString(payload.message),
    asString(payload.last_assistant_message),
    asString(payload.reason),
    asString(payload.task_subject),
    asString(payload.task_description),
    toolInput ? summarizeToolInput(toolInput) : '',
    summarizeBatchToolCalls(payload.tool_calls),
  ].filter((item): item is string => typeof item === 'string' && item.trim().length > 0);

  if (candidates.length > 0) {
    return candidates[0];
  }

  return [hookEventName, toolName].filter(Boolean).join(' | ') || 'claude hook event';
};

const deriveConfidence = (
  payload: Record<string, unknown>,
  hookEventName: string,
  defaultConfidence: number
): number => {
  const explicitConfidence = asNumber(payload.confidence);
  if (explicitConfidence !== undefined) {
    return clamp(explicitConfidence, 0.01, 1);
  }

  const baselineByEvent: Record<string, number> = {
    PreToolUse: 0.84,
    PermissionRequest: 0.84,
    PermissionDenied: 0.86,
    PostToolUseFailure: 0.82,
    PostToolUse: 0.74,
    PostToolBatch: 0.76,
    UserPromptSubmit: 0.8,
    UserPromptExpansion: 0.78,
    Notification: 0.7,
    Stop: 0.68,
    SessionStart: 0.66,
    SessionEnd: 0.64,
    TaskCreated: 0.82,
    TaskCompleted: 0.82,
  };

  let confidence = baselineByEvent[hookEventName] ?? defaultConfidence;

  const toolName = asString(payload.tool_name);
  if (toolName === 'Bash') {
    confidence += 0.03;
  }

  const notificationType = asString(payload.notification_type);
  if (notificationType === 'permission_prompt') {
    confidence += 0.04;
  }

  return clamp(confidence, 0.01, 1);
};

export interface ClaudeHookNormalizerOptions {
  defaultStreamPrefix?: string;
  defaultConfidence?: number;
}

export const normalizeClaudeHookTrigger = (
  payload: Record<string, unknown>,
  options: ClaudeHookNormalizerOptions = {}
): AutomationTriggerEvent | null => {
  const hookEventName = asString(payload.hook_event_name);
  if (!hookEventName) {
    return null;
  }

  const sessionId = asString(payload.session_id);
  const agentId = asString(payload.agent_id);
  const toolName = asString(payload.tool_name);
  const notificationType = asString(payload.notification_type);
  const permissionMode = asString(payload.permission_mode);

  const explicitStreamId = asString(payload.streamId) ?? asString(payload.stream_id);
  const streamPrefix = options.defaultStreamPrefix ?? 'claude-session';
  const streamToken = explicitStreamId ?? sessionId ?? agentId ?? 'unknown';
  const streamId = explicitStreamId ?? `${streamPrefix}:${streamToken}`;

  const tsMs =
    toEpochMs(payload.tsMs) ??
    toEpochMs(payload.ts_ms) ??
    toEpochMs(payload.timestamp_ms) ??
    toEpochMs(payload.timestamp) ??
    Date.now();

  const confidence = deriveConfidence(payload, hookEventName, options.defaultConfidence ?? 0.72);
  const utterance = deriveUtterance(payload, hookEventName, toolName);

  const toolUseId = asString(payload.tool_use_id);
  const taskId = asString(payload.task_id);
  const triggerId = toolUseId ?? taskId ?? crypto.randomUUID();

  const ruleId = `claude_hook_${slugify(hookEventName)}`;
  const groupId = toolName ? `claude_tool_${slugify(toolName)}` : undefined;
  const termId = notificationType ? `claude_notification_${slugify(notificationType)}` : undefined;

  const transcriptPath = asString(payload.transcript_path);
  const cwd = asString(payload.cwd);

  return {
    triggerId,
    source: 'claude_hook',
    hookEventName,
    streamId,
    tsMs,
    confidence,
    ruleId,
    termId,
    groupId,
    utterance,
    metadata: {
      hookEventName,
      toolName,
      toolUseId,
      notificationType,
      permissionMode,
      sessionId,
      agentId,
      taskId,
      transcriptPath,
      cwd,
    },
  };
};
