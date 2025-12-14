import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface Skill {
  id: string;
  name: string;
  description: string;
  instructions: string;
  triggers?: string[]; // Auto-invocation triggers (keywords)
  version: string;
}

export class SkillsManager {
  private skills: Map<string, Skill> = new Map();
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadDefaultSkills();
  }

  private loadDefaultSkills() {
    // Default built-in skills
    const defaultSkills: Skill[] = [
      {
        id: 'code-expert',
        name: 'Code Expert',
        description: 'Expert software engineer for code analysis and refactoring',
        instructions:
          'You are an expert software engineer. Focus on clean code, best practices, and performance optimization.',
        version: '1.0.0',
      },
      {
        id: 'security-auditor',
        name: 'Security Auditor',
        description: 'Specialist in identifying security vulnerabilities',
        instructions:
          'You are a security auditor. Analyze code for OWASP Top 10 vulnerabilities, injection flaws, and unsafe patterns.',
        version: '1.0.0',
      },
      {
        id: 'technical-writer',
        name: 'Technical Writer',
        description: 'Expert in creating clear, concise documentation',
        instructions:
          'You are a technical writer. Create documentation that is easy to understand, comprehensive, and well-structured.',
        version: '1.0.0',
      },
    ];

    defaultSkills.forEach((skill) => this.skills.set(skill.id, skill));
  }

  public async loadUserSkills(workspaceRoot: string): Promise<void> {
    const skillsDir = path.join(workspaceRoot, '.tnf', 'skills');

    if (!fs.existsSync(skillsDir)) {
      return;
    }

    try {
      const files = await fs.promises.readdir(skillsDir);
      for (const file of files) {
        if (file.endsWith('.md') || file.endsWith('.json')) {
          const filePath = path.join(skillsDir, file);
          const content = await fs.promises.readFile(filePath, 'utf-8');

          // Simple parsing logic (can be enhanced)
          // If JSON, parse directly. If MD, treat as instructions using filename as ID.
          if (file.endsWith('.json')) {
            const skill = JSON.parse(content) as Skill;
            this.skills.set(skill.id, skill);
          } else {
            const id = path.basename(file, '.md').toLowerCase();
            this.skills.set(id, {
              id,
              name: id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
              description: 'User defined skill',
              instructions: content,
              version: '1.0.0',
            });
          }
        }
      }
      console.log(`✅ Loaded ${this.skills.size} skills`);
    } catch (error) {
      console.error('Failed to load user skills:', error);
    }
  }

  public getLimit(limit: number = 10): Skill[] {
    return Array.from(this.skills.values()).slice(0, limit);
  }

  public getSkill(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  public getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  // Auto-detection logic (simple keyword matching for now)
  public detectSkills(message: string): Skill[] {
    const detected: Skill[] = [];
    const lowerMsg = message.toLowerCase();

    this.skills.forEach((skill) => {
      if (skill.triggers) {
        const match = skill.triggers.some((t) => lowerMsg.includes(t.toLowerCase()));
        if (match) detected.push(skill);
      }
    });

    return detected;
  }
}
