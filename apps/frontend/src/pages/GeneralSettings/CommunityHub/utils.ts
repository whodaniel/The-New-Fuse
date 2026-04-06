export type HubItemType =
  | 'agentSkill'
  | 'agentSkills'
  | 'systemPrompt'
  | 'systemPrompts'
  | 'slashCommand'
  | 'slashCommands';

export function readableType(type: HubItemType): string | undefined {
  switch (type) {
    case 'agentSkills':
    case 'agentSkill':
      return 'Agent Skills';
    case 'systemPrompt':
    case 'systemPrompts':
      return 'System Prompts';
    case 'slashCommand':
    case 'slashCommands':
      return 'Slash Commands';
    default:
      return undefined;
  }
}

export function typeToPath(type: HubItemType): string | undefined {
  switch (type) {
    case 'agentSkill':
    case 'agentSkills':
      return 'agent-skills';
    case 'systemPrompt':
    case 'systemPrompts':
      return 'system-prompts';
    case 'slashCommand':
    case 'slashCommands':
      return 'slash-commands';
    default:
      return undefined;
  }
}
