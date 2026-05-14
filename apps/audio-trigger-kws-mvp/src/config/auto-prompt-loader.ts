import fs from 'node:fs';
import path from 'node:path';
import { defaultAutoPromptSequences } from './default-auto-prompt-sequences';
import { AutoPromptSequenceDefinition } from '../types/events';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

type TriggerSourceValue = NonNullable<AutoPromptSequenceDefinition['trigger']['source']>[number];

const normalizeSourceList = (value: unknown): AutoPromptSequenceDefinition['trigger']['source'] => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const allowed = new Set<TriggerSourceValue>(['keyword_hit', 'rule_fire', 'visual_object', 'manual', 'claude_hook']);
  const normalized = value
    .filter(
      (entry): entry is TriggerSourceValue =>
        typeof entry === 'string' && allowed.has(entry as TriggerSourceValue)
    )
    .map((entry) => entry as TriggerSourceValue);

  return normalized.length > 0 ? normalized : undefined;
};

const normalizeStringList = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const normalized = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
};

const normalizeNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const normalizeBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const toAbsolute = (value: string): string =>
  path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);

const sequenceConfigCandidates = (explicitFile: string): string[] => {
  const candidates: string[] = [];

  if (explicitFile.trim()) {
    candidates.push(toAbsolute(explicitFile.trim()));
  }

  candidates.push(path.resolve(process.cwd(), 'configs', 'autoprompt', 'sequences.json'));
  candidates.push(
    path.resolve(process.cwd(), 'apps', 'audio-trigger-kws-mvp', 'configs', 'autoprompt', 'sequences.json')
  );

  return [...new Set(candidates)];
};

const parseSequence = (value: unknown): AutoPromptSequenceDefinition | null => {
  if (!isRecord(value)) {
    return null;
  }

  const sequenceId = typeof value.sequenceId === 'string' ? value.sequenceId.trim() : '';
  const name = typeof value.name === 'string' ? value.name.trim() : sequenceId;
  const useCase = typeof value.useCase === 'string' ? value.useCase.trim() : 'general';
  const agentId = typeof value.agentId === 'string' ? value.agentId.trim() : '';

  if (!sequenceId || !agentId) {
    return null;
  }

  const triggerRaw = isRecord(value.trigger) ? value.trigger : {};
  const stepsRaw = Array.isArray(value.steps) ? value.steps : [];

  const steps = stepsRaw
    .map((step) => {
      if (!isRecord(step)) {
        return null;
      }
      const stepId = typeof step.stepId === 'string' ? step.stepId.trim() : '';
      const title = typeof step.title === 'string' ? step.title.trim() : stepId;
      const promptTemplate = typeof step.promptTemplate === 'string' ? step.promptTemplate : '';

      if (!stepId || !promptTemplate.trim()) {
        return null;
      }

      return {
        stepId,
        title: title || stepId,
        promptTemplate,
      };
    })
    .filter((step): step is AutoPromptSequenceDefinition['steps'][number] => step !== null);

  if (steps.length === 0) {
    return null;
  }

  const assessmentRaw = isRecord(value.assessment) ? value.assessment : {};
  const adaptationRaw = isRecord(value.adaptation) ? value.adaptation : {};

  return {
    sequenceId,
    name: name || sequenceId,
    enabled: normalizeBoolean(value.enabled, true),
    useCase,
    agentId,
    trigger: {
      source: normalizeSourceList(triggerRaw.source),
      ruleIds: normalizeStringList(triggerRaw.ruleIds),
      groupIds: normalizeStringList(triggerRaw.groupIds),
      termIds: normalizeStringList(triggerRaw.termIds),
      keywords: normalizeStringList(triggerRaw.keywords),
      visualLabels: normalizeStringList(triggerRaw.visualLabels),
      minConfidence: normalizeNumber(triggerRaw.minConfidence, 0.7),
      cooldownMs: normalizeNumber(triggerRaw.cooldownMs, 20000),
    },
    steps,
    assessment: {
      minOverallScore: normalizeNumber(assessmentRaw.minOverallScore, 70),
    },
    adaptation: {
      enabled: normalizeBoolean(adaptationRaw.enabled, true),
      thresholdKey:
        typeof adaptationRaw.thresholdKey === 'string' && adaptationRaw.thresholdKey.trim()
          ? adaptationRaw.thresholdKey.trim()
          : undefined,
      minThreshold: normalizeNumber(adaptationRaw.minThreshold, 0.6),
      maxThreshold: normalizeNumber(adaptationRaw.maxThreshold, 0.95),
      increaseStep: normalizeNumber(adaptationRaw.increaseStep, 0.02),
      decreaseStep: normalizeNumber(adaptationRaw.decreaseStep, 0.01),
      defaultThreshold: normalizeNumber(adaptationRaw.defaultThreshold, 0.7),
    },
  };
};

export const loadAutoPromptSequences = (explicitFile = ''): AutoPromptSequenceDefinition[] => {
  const candidates = sequenceConfigCandidates(explicitFile);

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        console.warn(`[AutoPromptLoader] Expected array in ${filePath}; using fallback defaults.`);
        continue;
      }

      const sequences = parsed
        .map((entry) => parseSequence(entry))
        .filter((entry): entry is AutoPromptSequenceDefinition => entry !== null);

      if (sequences.length === 0) {
        console.warn(`[AutoPromptLoader] No valid sequences found in ${filePath}; using fallback defaults.`);
        continue;
      }

      console.log(`[AutoPromptLoader] Loaded ${sequences.length} sequence(s) from ${filePath}`);
      return sequences;
    } catch (error) {
      console.error(`[AutoPromptLoader] Failed to parse ${filePath}; using fallback defaults.`, error);
    }
  }

  console.log(
    `[AutoPromptLoader] Using embedded default sequence set (${defaultAutoPromptSequences.length} sequence(s)).`
  );
  return defaultAutoPromptSequences;
};
