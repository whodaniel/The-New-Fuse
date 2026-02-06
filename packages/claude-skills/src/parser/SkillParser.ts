/**
 * Skill Parser
 *
 * Parses SKILL.md files with YAML frontmatter and markdown content
 */

import * as fs from 'fs/promises';
import matter from 'gray-matter';
import * as path from 'path';
import { z } from 'zod';
import { ClaudeSkill, SkillCategory, SkillMetadata } from '../types';

/**
 * Zod schema for skill frontmatter validation
 */
const SkillFrontmatterSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Name must be in hyphen-case with lowercase alphanumeric characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  license: z.string().optional(),
  'allowed-tools': z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

/**
 * Skill parser class
 */
export class SkillParser {
  /**
   * Parse a SKILL.md file and return a ClaudeSkill object
   */
  async parseSkillFile(filePath: string): Promise<ClaudeSkill> {
    try {
      // Read the file
      const content = await fs.readFile(filePath, 'utf-8');

      // Parse frontmatter and content
      const { data, content: markdownContent } = matter(content);

      // Validate frontmatter
      const validationResult = SkillFrontmatterSchema.safeParse(data);
      if (!validationResult.success) {
        throw new Error(
          `Invalid skill frontmatter in ${filePath}: ${validationResult.error.message}`
        );
      }

      const frontmatter = validationResult.data;

      // Extract metadata
      const metadata: SkillMetadata = {
        name: frontmatter.name,
        description: frontmatter.description,
        license: frontmatter.license,
        allowedTools: frontmatter['allowed-tools'],
        metadata: frontmatter.metadata,
      };

      // Determine category and tags from file path and content
      const category = this.inferCategory(filePath, markdownContent);
      const tags = this.extractTags(filePath, markdownContent, frontmatter.name);

      // Create skill object
      const skill: ClaudeSkill = {
        id: this.generateSkillId(frontmatter.name),
        name: frontmatter.name,
        description: frontmatter.description,
        category,
        tags,
        metadata,
        content: markdownContent,
        instructions: this.extractInstructions(markdownContent),
        parameters: this.extractParameters(markdownContent),
        localPath: filePath,
      };

      return skill;
    } catch (error) {
      throw new Error(
        `Failed to parse skill file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Parse multiple SKILL.md files from a directory
   */
  async parseSkillDirectory(directoryPath: string): Promise<ClaudeSkill[]> {
    const skills: ClaudeSkill[] = [];
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillFilePath = path.join(directoryPath, entry.name, 'SKILL.md');
        try {
          const stat = await fs.stat(skillFilePath);
          if (stat.isFile()) {
            const skill = await this.parseSkillFile(skillFilePath);
            skills.push(skill);
          }
        } catch (error) {
          // Skip if SKILL.md doesn't exist in this directory
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.warn(`Warning: Could not parse skill in ${entry.name}:`, error);
          }
        }
      }
    }

    return skills;
  }

  /**
   * Generate a unique skill ID from the skill name
   */
  private generateSkillId(name: string): string {
    return `anthropic.skill.${name}`;
  }

  /**
   * Infer skill category from file path and content
   */
  private inferCategory(filePath: string, content: string): string {
    const pathLower = filePath.toLowerCase();
    const contentLower = content.toLowerCase();

    // Check document-skills subdirectory
    if (pathLower.includes('document-skills')) {
      return SkillCategory.DOCUMENT_PROCESSING;
    }

    // Check for specific skill names and patterns
    if (
      pathLower.includes('algorithmic-art') ||
      pathLower.includes('canvas-design') ||
      pathLower.includes('theme-factory') ||
      pathLower.includes('brand-guidelines')
    ) {
      return SkillCategory.CREATIVE_DESIGN;
    }

    if (
      pathLower.includes('mcp-builder') ||
      pathLower.includes('webapp-testing') ||
      pathLower.includes('artifacts-builder')
    ) {
      return SkillCategory.DEVELOPMENT_TECHNICAL;
    }

    if (pathLower.includes('internal-comms')) {
      return SkillCategory.ENTERPRISE_COMMUNICATION;
    }

    if (pathLower.includes('skill-creator') || pathLower.includes('template-skill')) {
      return SkillCategory.META_SKILLS;
    }

    // Check content for keywords
    if (contentLower.includes('test') || contentLower.includes('testing')) {
      return SkillCategory.TESTING;
    }

    if (contentLower.includes('refactor') || contentLower.includes('refactoring')) {
      return SkillCategory.REFACTORING;
    }

    if (contentLower.includes('documentation') || contentLower.includes('docs')) {
      return SkillCategory.DOCUMENTATION;
    }

    return SkillCategory.OTHER;
  }

  /**
   * Extract tags from file path and content
   */
  private extractTags(filePath: string, content: string, skillName: string): string[] {
    const tags = new Set<string>();

    // Add skill name as a tag
    tags.add(skillName);

    // Extract from path
    const pathParts = filePath.split(path.sep);
    if (pathParts.includes('document-skills')) {
      tags.add('document');
      tags.add('file-processing');
    }

    // Common technology keywords
    const techKeywords = [
      'pdf',
      'xlsx',
      'docx',
      'pptx',
      'python',
      'typescript',
      'javascript',
      'react',
      'playwright',
      'mcp',
      'api',
      'testing',
      'design',
      'art',
      'creative',
      'communication',
      'enterprise',
    ];

    const contentLower = content.toLowerCase();
    for (const keyword of techKeywords) {
      if (contentLower.includes(keyword)) {
        tags.add(keyword);
      }
    }

    return Array.from(tags);
  }

  /**
   * Extract instructions from markdown content
   * Returns the main instructional content, excluding frontmatter
   */
  private extractInstructions(content: string): string {
    // Remove any remaining frontmatter markers
    let instructions = content.replace(/^---[\s\S]*?---/, '').trim();

    // Extract main content before examples/references sections if they exist
    const sections = instructions.split(/^#+\s+(Examples?|References?|Guidelines?)/im);
    if (sections.length > 1) {
      // Return everything before the first major section
      return sections[0].trim();
    }

    return instructions;
  }

  /**
   * Extract parameters from skill content
   * This is a basic implementation - can be enhanced based on skill conventions
   */
  private extractParameters(content: string): any[] {
    // For now, we return empty array
    // In a real implementation, we might parse parameter definitions from the markdown
    // or from specific sections in the skill documentation
    return [];
  }

  /**
   * Validate a skill object
   */
  validateSkill(skill: ClaudeSkill): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!skill.id) {
      errors.push('Skill ID is required');
    }

    if (!skill.name || !/^[a-z0-9-]+$/.test(skill.name)) {
      errors.push('Skill name must be in hyphen-case with lowercase alphanumeric characters');
    }

    if (!skill.description || skill.description.length < 10) {
      errors.push('Skill description must be at least 10 characters');
    }

    if (!skill.content || skill.content.trim().length === 0) {
      errors.push('Skill content cannot be empty');
    }

    if (!skill.category) {
      errors.push('Skill category is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
