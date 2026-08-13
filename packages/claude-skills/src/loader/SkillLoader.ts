/**
 * Skill Loader
 *
 * Loads skills from Anthropic's skills repository
 */

import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import { SkillParser } from '../parser.js';
import type {
  ClaudeSkill,
  SkillCategory,
  SkillImportResult,
  SkillLoaderConfig,
} from '../types/index.js';

const execAsync = promisify(exec);

/**
 * Default configuration for skill loader
 */
const DEFAULT_CONFIG: SkillLoaderConfig = {
  sourceRepositoryUrl: 'https://github.com/anthropics/skills.git',
  localCachePath: path.join(process.cwd(), '.cache', 'anthropic-skills'),
  autoUpdate: false,
  updateInterval: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Skill loader class
 */
export class SkillLoader {
  private config: SkillLoaderConfig;
  private parser: SkillParser;
  private updateTimer?: NodeJS.Timeout;

  constructor(config?: Partial<SkillLoaderConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.parser = new SkillParser();
  }

  /**
   * Initialize the loader by cloning/updating the repository
   */
  async initialize(): Promise<void> {
    try {
      // Ensure cache directory exists
      await fs.mkdir(path.dirname(this.config.localCachePath), { recursive: true });

      // Check if repository already exists
      const repoExists = await this.repositoryExists();

      if (repoExists) {
        console.log('Anthropic skills repository already exists, updating...');
        await this.updateRepository();
      } else {
        console.log('Cloning Anthropic skills repository...');
        await this.cloneRepository();
      }

      // Set up auto-update if enabled
      if (this.config.autoUpdate && this.config.updateInterval) {
        this.setupAutoUpdate();
      }

      console.log('Skill loader initialized successfully');
    } catch (error) {
      throw new Error(
        `Failed to initialize skill loader: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load all skills from the repository
   */
  async loadAllSkills(): Promise<SkillImportResult> {
    const result: SkillImportResult = {
      imported: 0,
      failed: 0,
      skipped: 0,
      skills: [],
      errors: [],
    };

    try {
      // Load skills from main directory
      const mainSkills = await this.loadSkillsFromDirectory(this.config.localCachePath);
      result.skills.push(...mainSkills.skills);
      result.imported += mainSkills.imported;
      result.failed += mainSkills.failed;
      result.skipped += mainSkills.skipped;
      result.errors.push(...mainSkills.errors);

      // Load skills from document-skills subdirectory
      const documentSkillsPath = path.join(this.config.localCachePath, 'document-skills');
      try {
        await fs.access(documentSkillsPath);
        const documentSkills = await this.loadSkillsFromDirectory(documentSkillsPath);
        result.skills.push(...documentSkills.skills);
        result.imported += documentSkills.imported;
        result.failed += documentSkills.failed;
        result.skipped += documentSkills.skipped;
        result.errors.push(...documentSkills.errors);
      } catch (_error) {
        // document-skills directory might not exist
      }

      // Apply filters if configured
      if (this.config.categoriesFilter || this.config.tagsFilter) {
        result.skills = this.filterSkills(result.skills);
      }

      console.log(
        `Loaded ${result.imported} skills (${result.failed} failed, ${result.skipped} skipped)`
      );
      return result;
    } catch (error) {
      throw new Error(
        `Failed to load skills: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load specific skills by name
   */
  async loadSkillsByName(skillNames: string[]): Promise<SkillImportResult> {
    const result: SkillImportResult = {
      imported: 0,
      failed: 0,
      skipped: 0,
      skills: [],
      errors: [],
    };

    for (const skillName of skillNames) {
      try {
        const skill = await this.loadSkill(skillName);
        if (skill) {
          result.skills.push(skill);
          result.imported++;
        } else {
          result.skipped++;
        }
      } catch (_error) {
        result.failed++;
        result.errors.push({
          skillName,
          error: _error instanceof Error ? _error.message : String(_error),
        });
      }
    }

    return result;
  }

  /**
   * Load a single skill by name
   */
  async loadSkill(skillName: string): Promise<ClaudeSkill | null> {
    try {
      // Try main directory first
      let skillPath = path.join(this.config.localCachePath, skillName, 'SKILL.md');

      try {
        await fs.access(skillPath);
        return await this.parser.parseSkillFile(skillPath);
      } catch (_error) {
        // Try document-skills directory
        skillPath = path.join(this.config.localCachePath, 'document-skills', skillName, 'SKILL.md');
        try {
          await fs.access(skillPath);
          return await this.parser.parseSkillFile(skillPath);
        } catch (_error2) {
          return null;
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to load skill ${skillName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get list of available skill names
   */
  async listAvailableSkills(): Promise<string[]> {
    const skills: string[] = [];

    try {
      // List from main directory
      const mainEntries = await fs.readdir(this.config.localCachePath, { withFileTypes: true });
      for (const entry of mainEntries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const skillFilePath = path.join(this.config.localCachePath, entry.name, 'SKILL.md');
          try {
            await fs.access(skillFilePath);
            skills.push(entry.name);
          } catch (_error) {
            // No SKILL.md in this directory
          }
        }
      }

      // List from document-skills directory
      const documentSkillsPath = path.join(this.config.localCachePath, 'document-skills');
      try {
        const docEntries = await fs.readdir(documentSkillsPath, { withFileTypes: true });
        for (const entry of docEntries) {
          if (entry.isDirectory()) {
            const skillFilePath = path.join(documentSkillsPath, entry.name, 'SKILL.md');
            try {
              await fs.access(skillFilePath);
              skills.push(`document-skills/${entry.name}`);
            } catch (_error) {
              // No SKILL.md in this directory
            }
          }
        }
      } catch (_error) {
        // document-skills directory might not exist
      }

      return skills.sort();
    } catch (error) {
      throw new Error(
        `Failed to list available skills: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }
  }

  // Private methods

  private async repositoryExists(): Promise<boolean> {
    try {
      await fs.access(path.join(this.config.localCachePath, '.git'));
      return true;
    } catch (_error) {
      return false;
    }
  }

  private async cloneRepository(): Promise<void> {
    const { stderr } = await execAsync(
      `git clone --depth 1 "${this.config.sourceRepositoryUrl}" "${this.config.localCachePath}"`
    );
    if (stderr && !stderr.includes('Cloning into')) {
      console.warn('Git clone warning:', stderr);
    }
  }

  private async updateRepository(): Promise<void> {
    try {
      const { stderr } = await execAsync(
        `cd "${this.config.localCachePath}" && git pull origin main`
      );
      if (stderr && !stderr.includes('Already up to date')) {
        console.warn('Git pull warning:', stderr);
      }
    } catch (error) {
      console.warn('Failed to update repository, continuing with cached version:', error);
    }
  }

  private async loadSkillsFromDirectory(directoryPath: string): Promise<SkillImportResult> {
    const result: SkillImportResult = {
      imported: 0,
      failed: 0,
      skipped: 0,
      skills: [],
      errors: [],
    };

    try {
      const entries = await fs.readdir(directoryPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const skillFilePath = path.join(directoryPath, entry.name, 'SKILL.md');
          try {
            await fs.access(skillFilePath);
            const skill = await this.parser.parseSkillFile(skillFilePath);

            // Validate skill
            const validation = this.parser.validateSkill(skill);
            if (validation.valid) {
              result.skills.push(skill);
              result.imported++;
            } else {
              result.failed++;
              result.errors.push({
                skillName: entry.name,
                error: `Validation failed: ${validation.errors.join(', ')}`,
              });
            }
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
              result.skipped++;
            } else {
              result.failed++;
              result.errors.push({
                skillName: entry.name,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to load skills from ${directoryPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return result;
  }

  private filterSkills(skills: ClaudeSkill[]): ClaudeSkill[] {
    return skills.filter((skill) => {
      // Filter by category
      if (this.config.categoriesFilter && this.config.categoriesFilter.length > 0) {
        if (!this.config.categoriesFilter.includes(skill.category as SkillCategory)) {
          return false;
        }
      }

      // Filter by tags
      if (this.config.tagsFilter && this.config.tagsFilter.length > 0) {
        const hasMatchingTag = skill.tags.some((tag) => this.config.tagsFilter!.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }

  private setupAutoUpdate(): void {
    this.updateTimer = setInterval(() => {
      console.log('Auto-updating Anthropic skills repository...');
      void this.updateRepository().catch((error) => {
        console.error('Failed to auto-update repository:', error);
      });
    }, this.config.updateInterval);
  }
}
