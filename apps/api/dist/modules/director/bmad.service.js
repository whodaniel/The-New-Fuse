"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BMADService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BMADService = void 0;
const common_1 = require("@nestjs/common");
let BMADService = BMADService_1 = class BMADService {
    constructor() {
        this.logger = new common_1.Logger(BMADService_1.name);
        this.skills = new Map();
        this.tools = new Map();
    }
    async onModuleInit() {
        this.logger.log('🧠 Initializing BMAD Orchestration Service...');
        await this.initializeDefaultSkills();
    }
    async initializeDefaultSkills() {
        this.registerSkill('code-review', {
            name: 'Code Review',
            description: 'Analyzes code for quality and issues',
            category: 'development',
        });
        this.registerSkill('security-audit', {
            name: 'Security Audit',
            description: 'Scans for security vulnerabilities',
            category: 'security',
        });
        this.registerSkill('documentation', {
            name: 'Documentation Generator',
            description: 'Generates documentation from code',
            category: 'documentation',
        });
        this.logger.log(`📚 Registered ${this.skills.size} default skills`);
    }
    registerSkill(id, skill) {
        this.skills.set(id, skill);
    }
    createToolFromSkill(skillId) {
        const skill = this.skills.get(skillId);
        if (!skill) {
            throw new Error(`Skill not found: ${skillId}`);
        }
        const toolId = `tool-${skillId}`;
        const tool = { id: toolId, skillId, skill };
        this.tools.set(toolId, tool);
        return tool;
    }
    async executeBMADCycle(config) {
        this.logger.log(`🔄 Executing BMAD cycle for: ${config.contextPurpose}`);
        const loadedSkills = config.skillIds.filter((id) => this.skills.has(id));
        const tools = loadedSkills.map((id) => this.createToolFromSkill(id));
        const contextTokens = 1000;
        const success = true;
        return {
            skills: loadedSkills.length,
            tools: tools.length,
            contextTokens,
            success,
        };
    }
    getStatistics() {
        return {
            skills: this.skills.size,
            tools: this.tools.size,
        };
    }
};
exports.BMADService = BMADService;
exports.BMADService = BMADService = BMADService_1 = __decorate([
    (0, common_1.Injectable)()
], BMADService);
//# sourceMappingURL=bmad.service.js.map