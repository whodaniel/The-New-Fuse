/**
 * Skill Registry
 *
 * Manages Claude skills and integrates with The New Fuse resource registry
 */

import { ClaudeSkill, ISkillRegistry, SkillFilter } from '../types';

/**
 * In-memory skill registry implementation
 */
export class SkillRegistry implements ISkillRegistry {
  private skills: Map<string, ClaudeSkill>;
  private skillsByCategory: Map<string, Set<string>>;
  private skillsByTag: Map<string, Set<string>>;

  constructor() {
    this.skills = new Map();
    this.skillsByCategory = new Map();
    this.skillsByTag = new Map();
  }

  /**
   * Register a skill
   */
  async register(skill: ClaudeSkill): Promise<void> {
    // Store the skill
    this.skills.set(skill.id, skill);

    // Index by category
    if (!this.skillsByCategory.has(skill.category)) {
      this.skillsByCategory.set(skill.category, new Set());
    }
    this.skillsByCategory.get(skill.category)!.add(skill.id);

    // Index by tags
    for (const tag of skill.tags) {
      if (!this.skillsByTag.has(tag)) {
        this.skillsByTag.set(tag, new Set());
      }
      this.skillsByTag.get(tag)!.add(skill.id);
    }
  }

  /**
   * Unregister a skill
   */
  async unregister(skillId: string): Promise<void> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return;
    }

    // Remove from main storage
    this.skills.delete(skillId);

    // Remove from category index
    const categorySkills = this.skillsByCategory.get(skill.category);
    if (categorySkills) {
      categorySkills.delete(skillId);
      if (categorySkills.size === 0) {
        this.skillsByCategory.delete(skill.category);
      }
    }

    // Remove from tag indexes
    for (const tag of skill.tags) {
      const tagSkills = this.skillsByTag.get(tag);
      if (tagSkills) {
        tagSkills.delete(skillId);
        if (tagSkills.size === 0) {
          this.skillsByTag.delete(tag);
        }
      }
    }
  }

  /**
   * Get a skill by ID
   */
  async get(skillId: string): Promise<ClaudeSkill | undefined> {
    return this.skills.get(skillId);
  }

  /**
   * List skills with optional filtering
   */
  async list(filter?: SkillFilter): Promise<ClaudeSkill[]> {
    let skills = Array.from(this.skills.values());

    if (!filter) {
      return skills;
    }

    // Filter by categories
    if (filter.categories && filter.categories.length > 0) {
      skills = skills.filter(skill => filter.categories!.includes(skill.category as any));
    }

    // Filter by tags
    if (filter.tags && filter.tags.length > 0) {
      skills = skills.filter(skill =>
        skill.tags.some(tag => filter.tags!.includes(tag))
      );
    }

    // Filter by name pattern
    if (filter.namePattern) {
      const pattern = new RegExp(filter.namePattern, 'i');
      skills = skills.filter(skill => pattern.test(skill.name));
    }

    // Filter by description pattern
    if (filter.descriptionPattern) {
      const pattern = new RegExp(filter.descriptionPattern, 'i');
      skills = skills.filter(skill => pattern.test(skill.description));
    }

    return skills;
  }

  /**
   * Search skills by query
   */
  async search(query: string): Promise<ClaudeSkill[]> {
    const queryLower = query.toLowerCase();
    const results: ClaudeSkill[] = [];

    for (const skill of this.skills.values()) {
      // Search in name
      if (skill.name.toLowerCase().includes(queryLower)) {
        results.push(skill);
        continue;
      }

      // Search in description
      if (skill.description.toLowerCase().includes(queryLower)) {
        results.push(skill);
        continue;
      }

      // Search in tags
      if (skill.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
        results.push(skill);
        continue;
      }

      // Search in category
      if (skill.category.toLowerCase().includes(queryLower)) {
        results.push(skill);
        continue;
      }
    }

    return results;
  }

  /**
   * Update a skill
   */
  async update(skillId: string, updates: Partial<ClaudeSkill>): Promise<void> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill with ID ${skillId} not found`);
    }

    // If category or tags are being updated, we need to reindex
    const categoryChanged = updates.category && updates.category !== skill.category;
    const tagsChanged = updates.tags && JSON.stringify(updates.tags) !== JSON.stringify(skill.tags);

    // Unregister old indexes if needed
    if (categoryChanged || tagsChanged) {
      await this.unregister(skillId);
    }

    // Apply updates
    const updatedSkill = { ...skill, ...updates };
    this.skills.set(skillId, updatedSkill);

    // Re-register with new indexes if needed
    if (categoryChanged || tagsChanged) {
      await this.register(updatedSkill);
    }
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.skillsByCategory.keys());
  }

  /**
   * Get all tags
   */
  getTags(): string[] {
    return Array.from(this.skillsByTag.keys());
  }

  /**
   * Get skills by category
   */
  async getByCategory(category: string): Promise<ClaudeSkill[]> {
    const skillIds = this.skillsByCategory.get(category);
    if (!skillIds) {
      return [];
    }

    const skills: ClaudeSkill[] = [];
    for (const skillId of skillIds) {
      const skill = this.skills.get(skillId);
      if (skill) {
        skills.push(skill);
      }
    }

    return skills;
  }

  /**
   * Get skills by tag
   */
  async getByTag(tag: string): Promise<ClaudeSkill[]> {
    const skillIds = this.skillsByTag.get(tag);
    if (!skillIds) {
      return [];
    }

    const skills: ClaudeSkill[] = [];
    for (const skillId of skillIds) {
      const skill = this.skills.get(skillId);
      if (skill) {
        skills.push(skill);
      }
    }

    return skills;
  }

  /**
   * Get registry statistics
   */
  getStatistics(): {
    totalSkills: number;
    categoriesCount: number;
    tagsCount: number;
    skillsByCategory: Record<string, number>;
  } {
    const stats = {
      totalSkills: this.skills.size,
      categoriesCount: this.skillsByCategory.size,
      tagsCount: this.skillsByTag.size,
      skillsByCategory: {} as Record<string, number>,
    };

    for (const [category, skillIds] of this.skillsByCategory.entries()) {
      stats.skillsByCategory[category] = skillIds.size;
    }

    return stats;
  }

  /**
   * Clear all skills
   */
  clear(): void {
    this.skills.clear();
    this.skillsByCategory.clear();
    this.skillsByTag.clear();
  }

  /**
   * Get total count
   */
  count(): number {
    return this.skills.size;
  }

  /**
   * Check if skill exists
   */
  has(skillId: string): boolean {
    return this.skills.has(skillId);
  }
}
