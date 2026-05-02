import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class BMADService implements OnModuleInit {
  private readonly logger = new Logger(BMADService.name);
  private skills: Map<string, any> = new Map();
  private tools: Map<string, any> = new Map();

  async onModuleInit() {
    this.logger.log('🧠 Initializing BMAD Orchestration Service...');
    await this.initializeDefaultSkills();
  }

  private async initializeDefaultSkills(): Promise<void> {
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

  registerSkill(id: string, skill: any): void {
    this.skills.set(id, skill);
  }

  createToolFromSkill(skillId: string): any {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    const toolId = `tool-${skillId}`;
    const tool = { id: toolId, skillId, skill };
    this.tools.set(toolId, tool);

    return tool;
  }

  async executeBMADCycle(config: {
    skillIds: string[];
    contextPurpose: string;
    templateId: string;
    variables: Record<string, any>;
  }): Promise<{
    skills: number;
    tools: number;
    contextTokens: number;
    success: boolean;
  }> {
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
}
