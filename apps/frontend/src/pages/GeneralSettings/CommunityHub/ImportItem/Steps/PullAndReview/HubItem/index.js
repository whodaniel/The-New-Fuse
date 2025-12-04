import SlashCommand from './SlashCommand';
import UnknownItem from './Unknown';
import AgentSkill from './AgentSkill';
var HubItemComponent = {
    "agent-skill": AgentSkill,
    "system-prompt": SystemPrompt,
    "slash-command": SlashCommand,
    unknown: UnknownItem,
};
export default HubItemComponent;
