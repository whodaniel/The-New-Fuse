// @ts-nocheck
import AgentSkill from './AgentSkill';
import SlashCommand from './SlashCommand';
import UnknownItem from './Unknown';
const HubItemComponent = {
  'agent-skill': AgentSkill,
  'system-prompt': SystemPrompt,
  'slash-command': SlashCommand,
  unknown: UnknownItem,
};
export default HubItemComponent;
