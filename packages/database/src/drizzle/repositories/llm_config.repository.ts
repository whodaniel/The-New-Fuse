/**
 * LLM Config Repository - Drizzle ORM Implementation
 * Provides data access for LLM Provider configurations
 */
import { desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { llmConfigs } from '../schema';
import { LLMConfig, NewLLMConfig } from '../types';
import * as crypto from 'crypto';

// AES-256-GCM Encryption
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

function encrypt(text: string): string {
  if (!process.env.ENCRYPTION_KEY) return text;

  try {
    // Generate key from secret (ensure correct length)
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', KEY_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return text; // Fallback (should ideally throw)
  }
}

function decrypt(text: string): string {
  if (!process.env.ENCRYPTION_KEY) return text;
  if (!text.includes(':')) return text; // Not encrypted or legacy format

  try {
    const parts = text.split(':');
    if (parts.length !== 3) return text; // Unknown format

    const [ivHex, authTagHex, encryptedHex] = parts;

    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', KEY_LENGTH);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return text; // Return original on error (e.g. key mismatch or legacy data)
  }
}

export class DrizzleLLMConfigRepository {
  /**
   * Find all configs
   */
  async findAll(): Promise<LLMConfig[]> {
    const configs = await db
      .select()
      .from(llmConfigs)
      .orderBy(desc(llmConfigs.priority), desc(llmConfigs.updatedAt));

    return configs.map(c => ({
      ...c,
      apiKey: decrypt(c.apiKey)
    }));
  }

  /**
   * Find enabled configs
   */
  async findEnabled(): Promise<LLMConfig[]> {
    const configs = await db
      .select()
      .from(llmConfigs)
      .where(eq(llmConfigs.enabled, true))
      .orderBy(desc(llmConfigs.priority));

    return configs.map(c => ({
      ...c,
      apiKey: decrypt(c.apiKey)
    }));
  }

  /**
   * Find config by ID
   */
  async findById(id: string): Promise<LLMConfig | null> {
    const [config] = await db.select().from(llmConfigs).where(eq(llmConfigs.id, id));
    if (!config) return null;
    return {
      ...config,
      apiKey: decrypt(config.apiKey)
    };
  }

  /**
   * Create config
   */
  async create(data: NewLLMConfig): Promise<LLMConfig> {
    const dataToSave = {
      ...data,
      apiKey: encrypt(data.apiKey)
    };
    const [config] = await db.insert(llmConfigs).values(dataToSave).returning();
    return {
      ...config,
      apiKey: decrypt(config.apiKey)
    };
  }

  /**
   * Update config
   */
  async update(id: string, data: Partial<NewLLMConfig>): Promise<LLMConfig | null> {
    const dataToSave = { ...data };
    if (data.apiKey) {
      dataToSave.apiKey = encrypt(data.apiKey);
    }

    const [config] = await db
      .update(llmConfigs)
      .set({ ...dataToSave, updatedAt: new Date() })
      .where(eq(llmConfigs.id, id))
      .returning();

    if (!config) return null;
    return {
      ...config,
      apiKey: decrypt(config.apiKey)
    };
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
