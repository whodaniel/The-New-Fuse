"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillLoader = exports.SkillLoadingInputSchema = void 0;
const zod_1 = require("zod");
exports.SkillLoadingInputSchema = zod_1.z.object({
    skillName: zod_1.z.string().describe('Name or ID of the skill to load'),
    agentId: zod_1.z.string().describe('Agent ID to load the skill for'),
});
class SkillLoader {
    constructor() {
        this.registry = new Map();
        this.loadedSkills = new Map();
    }
    register(skill) {
        this.registry.set(skill.id, skill);
        this.registry.set(skill.name.toLowerCase(), skill);
    }
    async loadSkill(input) {
        const skill = this.registry.get(input.skillName) || this.registry.get(input.skillName.toLowerCase());
        if (!skill) {
            return { loaded: false, error: `Skill "${input.skillName}" not found in registry` };
        }
        if (!this.loadedSkills.has(input.agentId)) {
            this.loadedSkills.set(input.agentId, new Set());
        }
        this.loadedSkills.get(input.agentId).add(skill.id);
        return { loaded: true, skill };
    }
    getLoadedSkills(agentId) {
        const ids = this.loadedSkills.get(agentId) || new Set();
        return Array.from(ids)
            .map((id) => this.registry.get(id))
            .filter((s) => s !== undefined);
    }
    isLoaded(agentId, skillName) {
        const skill = this.registry.get(skillName) || this.registry.get(skillName.toLowerCase());
        if (!skill)
            return false;
        return (this.loadedSkills.get(agentId) || new Set()).has(skill.id);
    }
    listAvailable() {
        const seen = new Set();
        const result = [];
        for (const [, skill] of this.registry) {
            if (!seen.has(skill.id)) {
                seen.add(skill.id);
                result.push({ id: skill.id, name: skill.name, description: skill.description });
            }
        }
        return result;
    }
}
exports.SkillLoader = SkillLoader;
//# sourceMappingURL=skillLoader.js.map