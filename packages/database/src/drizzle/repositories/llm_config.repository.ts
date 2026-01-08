/**
 * LLM Config Repository - Drizzle ORM Implementation
 * Provides data access for LLM Provider configurations
 */
import { desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { llmConfigs } from '../schema';
import { LLMConfig, NewLLMConfig } from '../types';

export class DrizzleLLMConfigRepository {
  /**
   * Find all configs
   */
  async findAll(): Promise<LLMConfig[]> {
    return db
      .select()
      .from(llmConfigs)
      .orderBy(desc(llmConfigs.priority), desc(llmConfigs.updatedAt));
  }

  /**
   * Find enabled configs
   */
  async findEnabled(): Promise<LLMConfig[]> {
    return db
      .select()
      .from(llmConfigs)
      .where(eq(llmConfigs.enabled, true))
      .orderBy(desc(llmConfigs.priority));
  }

  /**
   * Find config by ID
   */
  async findById(id: string): Promise<LLMConfig | null> {
    const [config] = await db.select().from(llmConfigs).where(eq(llmConfigs.id, id));
    return config ?? null;
  }

  /**
   * Create config
   */
  async create(data: NewLLMConfig): Promise<LLMConfig> {
    const [config] = await db.insert(llmConfigs).values(data).returning();
    return config;
  }

  /**
   * Update config
   */
  async update(id: string, data: Partial<NewLLMConfig>): Promise<LLMConfig | null> {
    const [config] = await db
      .update(llmConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(llmConfigs.id, id))
      .returning();
    return config ?? null;
  }

  /**
   * Delete config
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(llmConfigs).where(eq(llmConfigs.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Set config as default (priority 1) and others to 10
   */
  async setDefault(id: string): Promise<LLMConfig | null> {
    return db.transaction(async (tx) => {
      // Reset all priorities to 10
      await tx.update(llmConfigs).set({ priority: 10 });

      // Set target to 1
      const [config] = await tx
        .update(llmConfigs)
        .set({ priority: 1, updatedAt: new Date() })
        .where(eq(llmConfigs.id, id))
        .returning();

      return config ?? null;
    });
  }
}

export const drizzleLLMConfigRepository = new DrizzleLLMConfigRepository();
