import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Clawdbot Skill Interface
 * Represents an assimilated skill from the Clawdbot ecosystem.
 */
export interface ClawdSkill {
  name: string;
  description: string;
  triggers: string[]; // e.g. ["cron:0 8 * * *", "event:deployment_success"]
  implementation: string; // The executable code/script
  path: string;
  source: 'local' | 'assimilated';
  signature?: string;
  publisher?: string;
  verified?: boolean;
}

/**
 * Clawdbot Assimilation Service
 *
 * "We are the Borg. Your biological and technological distinctiveness will be added to our own."
 *
 * This service assimilates Clawdbot's capabilities into the TNF Agent:
 * 1. Discovers and parses Clawdbot skills from the local filesystem.
 * 2. Manages persistent personal memory.
 * 3. Provides proactive task scheduling.
 */
export class ClawdAssimilationService {
  private localSkillsPath: string;
  private assimilatedSkills: Map<string, ClawdSkill> = new Map();
  private personalMemoryPath: string;

  constructor(rootPath?: string) {
    const root = rootPath || os.homedir();
    this.localSkillsPath = path.join(root, '.clawd', 'skills');
    this.personalMemoryPath = path.join(root, '.clawd', 'memory');
  }

  /**
   * Assimilate all available skills.
   */
  public async assimilateSkills(): Promise<ClawdSkill[]> {
    this.assimilatedSkills.clear();

    if (fs.existsSync(this.localSkillsPath)) {
      await this.scanDirectory(this.localSkillsPath);
    }

    // Also scan TNF's internal assimilated skills
    const internalPath = path.resolve(
      __dirname,
      '../../../../.agent/skills/clawd-bot-integration/skills'
    );
    if (fs.existsSync(internalPath)) {
      await this.scanDirectory(internalPath);
    }

    return Array.from(this.assimilatedSkills.values());
  }

  private async scanDirectory(dir: string) {
    const files = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (file.name.endsWith('.md')) {
        await this.assimilateSkillFile(fullPath);
      }
    }
  }

  private async assimilateSkillFile(filePath: string) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const skill = this.parseSkillContent(content, filePath);
      if (skill) {
        if (this.verifySkillSignature(skill, content)) {
          this.assimilatedSkills.set(skill.name, { ...skill, verified: true });
        } else if (process.env.OPENCLAW_SKILL_SIGNATURE_REQUIRED === 'true') {
          console.warn(`Skill signature verification failed: ${skill.name}`);
        } else {
          this.assimilatedSkills.set(skill.name, { ...skill, verified: false });
        }
      }
    } catch (error) {
      console.warn(`Failed to assimilate skill at ${filePath}:`, error);
    }
  }

  /**
   * Parses a Clawdbot Markdown skill file.
   * Format:
   * ---
   * name: my-skill
   * description: does things
   * ---
   * # Implementation
   * ```js
   * code
   * ```
   */
  private parseSkillContent(content: string, filePath: string): ClawdSkill | null {
    // Simple parser for Frontmatter and Code blocks
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return null;
    }

    const yaml = match[1];
    const nameMatch = yaml.match(/name:\s*(.*)/);
    const descMatch = yaml.match(/description:\s*(.*)/);
    const signatureMatch = yaml.match(/signature:\s*(.*)/);
    const publisherMatch = yaml.match(/publisher:\s*(.*)/);

    if (!nameMatch) {
      return null;
    }

    const name = nameMatch[1].trim();
    const description = descMatch ? descMatch[1].trim() : '';

    // Extract Triggers (very basic heuristic for now)
    const triggerMatch = yaml.match(/triggers:\s*\[(.*?)\]/);
    const triggers = triggerMatch ? triggerMatch[1].split(',').map((t) => t.trim()) : [];

    // Extract Implementation Code
    // Look for a code block after "## Implementation" or similar
    const implRegex =
      /##\s*Implementation[\s\S]*?```(?:js|javascript|ts|typescript|bash|sh)\n([\s\S]*?)```/i;
    const implMatch = content.match(implRegex);

    // Fallback: Just take the first code block if specific header missing
    const anyCodeRegex = /```(?:js|javascript|ts|typescript|bash|sh)\n([\s\S]*?)```/i;
    const codeMatch = implMatch || content.match(anyCodeRegex);

    if (!codeMatch) {
      return null;
    }

    return {
      name,
      description,
      triggers,
      implementation: codeMatch[1],
      path: filePath,
      source: filePath.startsWith(this.localSkillsPath) ? 'local' : 'assimilated',
      signature: signatureMatch ? signatureMatch[1].trim() : undefined,
      publisher: publisherMatch ? publisherMatch[1].trim() : undefined,
    };
  }

  public getSkill(name: string): ClawdSkill | undefined {
    return this.assimilatedSkills.get(name);
  }

  public listSkills(): ClawdSkill[] {
    return Array.from(this.assimilatedSkills.values());
  }

  private verifySkillSignature(skill: ClawdSkill, content: string): boolean {
    const requireSignature = process.env.OPENCLAW_SKILL_SIGNATURE_REQUIRED === 'true';
    if (!requireSignature) return true;

    const secret = process.env.OPENCLAW_SKILL_SIGNING_KEY || '';
    if (!secret) {
      console.warn('OPENCLAW_SKILL_SIGNING_KEY is not set; cannot verify skills');
      return false;
    }

    if (!skill.signature) {
      return false;
    }

    // Remove signature line to avoid circular hashing.
    const normalized = content.replace(/^signature:\s*.*$/m, '').trim();
    const computed = crypto.createHmac('sha256', secret).update(normalized).digest('hex');

    return computed === skill.signature;
  }
}
