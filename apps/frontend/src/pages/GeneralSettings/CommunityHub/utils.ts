export function readableType(type): any {
    switch (type) {
        case "agentSkills":
        case "agentSkill":
            return "Agent Skills";
        case "systemPrompt":
        case "systemPrompts":
            return "System Prompts";
        case "slashCommand":
        case "slashCommands":
            return "Slash Commands";
    }
}
export function typeToPath(type): any {
    switch (type) {
        case "agentSkill":
        case "agentSkills":
            return "agent-skills";
        case "systemPrompt":
        case "systemPrompts":
            return "system-prompts";
        case "slashCommand":
        case "slashCommands":
            return "slash-commands";
    }
}
//# sourceMappingURL=utils.js.map