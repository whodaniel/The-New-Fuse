"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptTemplates = void 0;
exports.structurePromptWithAgentsMd = structurePromptWithAgentsMd;
exports.wrapSystemPrompt = wrapSystemPrompt;
const DEFAULT_CONFIG = {
    includeAgentsMd: true,
    strictMode: true,
    contextWindow: 'summary',
};
const AGENTS_MD_PREAMBLE = `Read the AGENTS.md file at the project root and follow it strictly. It contains the project stack, folder structure, styling rules, AI role definition, and engineering principles that must govern all your decisions.`;
const AGENTS_MD_PREAMBLE_MINIMAL = `Reference AGENTS.md for project conventions and engineering principles.`;
function structurePromptWithAgentsMd(userPrompt, config = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    if (!cfg.includeAgentsMd)
        return userPrompt;
    const preamble = cfg.contextWindow === 'minimal' ? AGENTS_MD_PREAMBLE_MINIMAL : AGENTS_MD_PREAMBLE;
    const strictDirective = cfg.strictMode ? ' These instructions are non-negotiable.' : '';
    return `${preamble}${strictDirective}\n\n${userPrompt}`;
}
function wrapSystemPrompt(baseSystemPrompt, config = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    if (!cfg.includeAgentsMd)
        return baseSystemPrompt;
    const injection = cfg.contextWindow === 'minimal'
        ? 'Always consult AGENTS.md for project-specific conventions.'
        : 'Begin by reading AGENTS.md. Follow its AI Role, Project Stack, Folder Structure, Styling Rules, and Engineering Principles strictly. These define the operational contract for this codebase.';
    if (cfg.strictMode) {
        return `${injection} Violations of AGENTS.md conventions are errors.\n\n${baseSystemPrompt}`;
    }
    return `${injection}\n\n${baseSystemPrompt}`;
}
exports.promptTemplates = {
    codeGeneration: (task, config) => structurePromptWithAgentsMd(`Generate code for the following task:\n${task}\n\nFollow the folder structure and styling rules from AGENTS.md. Write clean, simple code. Prioritize clarity over abstraction.`, config),
    codeReview: (code, config) => structurePromptWithAgentsMd(`Review this code against AGENTS.md engineering principles:\n\`\`\`\n${code}\n\`\`\`\n\nCheck for: PII leaks, security issues, convention violations, unnecessary abstraction.`, config),
    debugging: (error, config) => structurePromptWithAgentsMd(`Debug this issue:\n${error}\n\nApply the Inspect → Act → Verify loop. Read state before acting. Confirm results after.`, config),
    architecture: (description, config) => structurePromptWithAgentsMd(`Design the architecture for:\n${description}\n\nDefine module boundaries first, then implement. Follow Architecture Before Syntax principle from AGENTS.md.`, config),
};
//# sourceMappingURL=promptTemplates.js.map