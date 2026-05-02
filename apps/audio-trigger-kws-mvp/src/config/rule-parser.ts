import { TriggerRule, TriggerCondition, TriggerConditionHit, TriggerConditionSequence } from '../types/events';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface ParsedRulePart {
  type: 'all' | 'any' | 'none';
  conditions: TriggerCondition[];
}

export async function loadRulesFromFile(filePath: string): Promise<TriggerRule[]> {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n').map((line) => line.trim()).filter((line) => line.length > 0 && !line.startsWith('#'));

  const rules: TriggerRule[] = [];
  let currentRule: Partial<TriggerRule> | null = null;
  let parsingConditions = false;
  let currentConditionsType: 'all' | 'any' | 'none' = 'all';

  for (const line of lines) {
    if (line.startsWith('RULE ') && line.endsWith(':')) {
      if (currentRule) {
        rules.push(currentRule as TriggerRule);
      }
      const ruleId = line.substring(5, line.length - 1);
      currentRule = {
        ruleId: ruleId.toLowerCase(),
        name: ruleId.replace(/_/g, ' '),
        enabled: true,
        priority: 10, // Default priority
        minRuleConf: 0.7,
        windowMs: 5000,
        cooldownMs: 60000,
        all: [],
        any: [],
        none: [],
        action: { type: 'enqueue_llm', templateId: 'default_llm_action' }
      };
      parsingConditions = true;
      currentConditionsType = 'all';
      continue;
    }

    if (!currentRule || !parsingConditions) {
      console.warn(`[RuleParser] Skipping line outside of rule definition: ${line}`);
      continue;
    }

    // Handle rule properties
    if (line.startsWith('WITHIN ') && line.endsWith(' COOLDOWN ') && line.includes(' PRIORITY ')) {
      const parts = line.split(' ');
      const within = parseInt(parts[1].replace('s', ''), 10);
      const cooldown = parseInt(parts[4].replace('s', ''), 10);
      const priority = parseInt(parts[6], 10);

      if (Number.isFinite(within)) currentRule.windowMs = within * 1000;
      if (Number.isFinite(cooldown)) currentRule.cooldownMs = cooldown * 1000;
      if (Number.isFinite(priority)) currentRule.priority = priority;
    } else if (line.startsWith('THEN enqueue_llm(')) {
      const templateId = line.substring('THEN enqueue_llm('.length, line.length - 1);
      currentRule.action = { type: 'enqueue_llm', templateId };
      parsingConditions = false; // End of rule definition
    } else if (line.startsWith('HIT(')) {
      // This is a condition line
      const match = line.match(/HIT\(term:([^,]+), min_conf=([0-9.]+), count>=([0-9]+), window=([0-9]+)s\)/);
      if (match) {
        const [, term, minConf, count, window] = match;
        const condition: TriggerConditionHit = {
          kind: 'hit',
          groupId: term,
          minConf: parseFloat(minConf),
          count: parseInt(count, 10),
          windowMs: parseInt(window, 10) * 1000,
        };
        (currentRule[currentConditionsType] as TriggerCondition[]).push(condition);
      } else {
        console.warn(`[RuleParser] Unrecognized HIT condition format: ${line}`);
      }
    } else if (line === 'AND') {
      // No change needed for 'AND' - conditions are implicitly 'all'
    } else {
      console.warn(`[RuleParser] Unrecognized line in rule definition: ${line}`);
    }
  }

  if (currentRule) {
    rules.push(currentRule as TriggerRule);
  }
  return rules;
}

export async function loadRulesFromDirectory(directoryPath: string): Promise<TriggerRule[]> {
  const rules: TriggerRule[] = [];
  try {
    const files = await fs.readdir(directoryPath);
    for (const file of files) {
      if (file.endsWith('.rules')) {
        const filePath = path.join(directoryPath, file);
        try {
          const parsedRules = await loadRulesFromFile(filePath);
          rules.push(...parsedRules);
        } catch (error) {
          console.error(`[RuleParser] Failed to load rules from ${filePath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`[RuleParser] Failed to read rules directory ${directoryPath}:`, error);
  }
  return rules;
}