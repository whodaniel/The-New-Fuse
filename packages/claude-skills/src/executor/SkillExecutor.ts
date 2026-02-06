/**
 * Skill Executor
 *
 * Executes Claude skills with parameter validation and error handling
 */

import { z } from 'zod';
import {
  ClaudeSkill,
  ISkillExecutor,
  SkillExecutionContext,
  SkillExecutionResult,
  SkillParameter,
  ValidationResult,
} from '../types';

/**
 * Skill executor class
 */
export class SkillExecutor implements ISkillExecutor {
  private skills: Map<string, ClaudeSkill>;

  constructor() {
    this.skills = new Map();
  }

  /**
   * Register a skill for execution
   */
  registerSkill(skill: ClaudeSkill): void {
    this.skills.set(skill.id, skill);
  }

  /**
   * Unregister a skill
   */
  unregisterSkill(skillId: string): void {
    this.skills.delete(skillId);
  }

  /**
   * Get a registered skill
   */
  getSkill(skillId: string): ClaudeSkill | undefined {
    return this.skills.get(skillId);
  }

  /**
   * Execute a skill with the given context
   */
  async execute(context: SkillExecutionContext): Promise<SkillExecutionResult> {
    const startTime = Date.now();

    try {
      // Get the skill
      const skill = this.skills.get(context.skillId);
      if (!skill) {
        return {
          success: false,
          error: {
            code: 'SKILL_NOT_FOUND',
            message: `Skill with ID ${context.skillId} not found`,
          },
        };
      }

      // Validate parameters
      const validation = await this.validate(context.skillId, context.parameters);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parameter validation failed',
            details: validation.errors,
          },
        };
      }

      // Execute the skill
      // Skills are primarily instructional - they provide context and instructions
      // The actual execution happens through the agent/LLM using the skill's instructions
      const output = {
        skillId: skill.id,
        skillName: skill.name,
        instructions: skill.instructions,
        content: skill.content,
        allowedTools: skill.metadata.allowedTools,
        executionContext: {
          parameters: context.parameters,
          userId: context.userId,
          sessionId: context.sessionId,
        },
      };

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output,
        metadata: {
          executionTime,
          resourcesUsed: ['skill-instructions'],
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
        metadata: {
          executionTime,
        },
      };
    }
  }

  /**
   * Validate skill parameters
   */
  async validate(skillId: string, parameters: Record<string, any>): Promise<ValidationResult> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return {
        valid: false,
        errors: [
          {
            parameter: 'skillId',
            message: `Skill with ID ${skillId} not found`,
          },
        ],
      };
    }

    const errors: ValidationResult['errors'] = [];

    // Validate each parameter
    for (const param of skill.parameters) {
      const value = parameters[param.name];

      // Check required parameters
      if (param.required && (value === undefined || value === null)) {
        errors.push({
          parameter: param.name,
          message: `Required parameter ${param.name} is missing`,
          constraint: 'required',
        });
        continue;
      }

      // Skip validation if parameter is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      const typeValid = this.validateParameterType(value, param.type);
      if (!typeValid) {
        errors.push({
          parameter: param.name,
          message: `Parameter ${param.name} must be of type ${param.type}`,
          constraint: 'type',
        });
        continue;
      }

      // Enum validation
      if (param.enum && Array.isArray(param.enum) && !param.enum.includes(value as never)) {
        errors.push({
          parameter: param.name,
          message: `Parameter ${param.name} must be one of: ${param.enum.join(', ')}`,
          constraint: 'enum',
        });
      }

      // Schema validation (for complex types)
      if (param.schema) {
        try {
          const schema = z.object(param.schema as z.ZodRawShape);
          schema.parse(value);
        } catch (error) {
          errors.push({
            parameter: param.name,
            message: `Parameter ${param.name} does not match the required schema`,
            constraint: 'schema',
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Validate parameter type
   */
  private validateParameterType(value: any, type: SkillParameter['type']): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && !Array.isArray(value) && value !== null;
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Get execution statistics
   */
  getStatistics(): {
    totalSkills: number;
    skillsByCategory: Record<string, number>;
  } {
    const stats = {
      totalSkills: this.skills.size,
      skillsByCategory: {} as Record<string, number>,
    };

    for (const skill of this.skills.values()) {
      const category = skill.category;
      stats.skillsByCategory[category] = (stats.skillsByCategory[category] || 0) + 1;
    }

    return stats;
  }

  /**
   * List all registered skills
   */
  listSkills(): ClaudeSkill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Clear all registered skills
   */
  clear(): void {
    this.skills.clear();
  }
}
