import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DatabaseService,
  and,
  desc,
  eq,
  personalSkills,
  sql,
} from '@the-new-fuse/database/drizzle';
import { randomUUID } from 'crypto';
import { CreatePersonalSkillDto, UpdatePersonalSkillDto } from './dto/personal-skill.dto';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_NAME_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 1500;
const MAX_INSTRUCTIONS_LENGTH = 32000;
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 48;
const MAX_METADATA_BYTES = 50_000;

export type PersonalSkillRecord = {
  id: string;
  userId: string;
  slug: string;
  name: string;
  description: string;
  instructions: string;
  tags: string[];
  metadata: Record<string, unknown>;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class PersonalSkillsService {
  private initialized = false;
  private initializePromise: Promise<void> | null = null;

  constructor(private readonly db: DatabaseService) {}

  async listByUser(userId: string): Promise<PersonalSkillRecord[]> {
    const normalizedUserId = this.validateUuid(userId, 'userId');
    await this.ensureInitialized();

    const rows = await this.db.client
      .select()
      .from(personalSkills)
      .where(eq(personalSkills.userId, normalizedUserId))
      .orderBy(desc(personalSkills.updatedAt));

    return rows.map((row) => this.toRecord(row));
  }

  async getByUser(userId: string, skillId: string): Promise<PersonalSkillRecord> {
    const normalizedUserId = this.validateUuid(userId, 'userId');
    const normalizedSkillId = this.validateUuid(skillId, 'skillId');
    await this.ensureInitialized();

    const existing = await this.findOwnedSkill(normalizedUserId, normalizedSkillId);
    if (!existing) {
      throw new NotFoundException(`Personal skill not found: ${normalizedSkillId}`);
    }

    return this.toRecord(existing);
  }

  async createByUser(userId: string, input: CreatePersonalSkillDto): Promise<PersonalSkillRecord> {
    const normalizedUserId = this.validateUuid(userId, 'userId');
    await this.ensureInitialized();

    const name = this.normalizeRequiredText(input?.name, MAX_NAME_LENGTH, 'name');
    const description = this.normalizeOptionalText(input?.description, MAX_DESCRIPTION_LENGTH);
    const instructions = this.normalizeRequiredText(
      input?.instructions,
      MAX_INSTRUCTIONS_LENGTH,
      'instructions'
    );
    const tags = this.normalizeTags(input?.tags);
    const metadata = this.normalizeMetadata(input?.metadata);
    const slug = await this.ensureUniqueSlug(normalizedUserId, this.slugify(name));
    const now = new Date();

    const [saved] = await this.db.client
      .insert(personalSkills)
      .values({
        id: randomUUID(),
        userId: normalizedUserId,
        slug,
        name,
        description,
        instructions,
        tags,
        metadata,
        isPrivate: input?.isPrivate !== undefined ? Boolean(input.isPrivate) : true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!saved) {
      throw new BadRequestException('Failed to create personal skill');
    }

    return this.toRecord(saved);
  }

  async updateByUser(
    userId: string,
    skillId: string,
    input: UpdatePersonalSkillDto
  ): Promise<PersonalSkillRecord> {
    const normalizedUserId = this.validateUuid(userId, 'userId');
    const normalizedSkillId = this.validateUuid(skillId, 'skillId');
    await this.ensureInitialized();

    const hasUpdates = [
      'name',
      'description',
      'instructions',
      'tags',
      'metadata',
      'isPrivate',
    ].some((key) => (input as Record<string, unknown> | undefined)?.[key] !== undefined);
    if (!hasUpdates) {
      throw new BadRequestException(
        'At least one of name, description, instructions, tags, or metadata must be provided'
      );
    }

    const existing = await this.findOwnedSkill(normalizedUserId, normalizedSkillId);
    if (!existing) {
      throw new NotFoundException(`Personal skill not found: ${normalizedSkillId}`);
    }

    const name =
      input?.name !== undefined
        ? this.normalizeRequiredText(input.name, MAX_NAME_LENGTH, 'name')
        : existing.name;
    const description =
      input?.description !== undefined
        ? this.normalizeOptionalText(input.description, MAX_DESCRIPTION_LENGTH)
        : existing.description;
    const instructions =
      input?.instructions !== undefined
        ? this.normalizeRequiredText(input.instructions, MAX_INSTRUCTIONS_LENGTH, 'instructions')
        : existing.instructions;
    const tags = input?.tags !== undefined ? this.normalizeTags(input.tags) : existing.tags;
    const metadata =
      input?.metadata !== undefined
        ? this.normalizeMetadata(input.metadata)
        : this.normalizeMetadata(existing.metadata);
    const isPrivate =
      input?.isPrivate !== undefined ? Boolean(input.isPrivate) : existing.isPrivate;
    const nextSlug =
      input?.name !== undefined
        ? await this.ensureUniqueSlug(normalizedUserId, this.slugify(name), normalizedSkillId)
        : existing.slug;
    const now = new Date();

    const [updated] = await this.db.client
      .update(personalSkills)
      .set({
        slug: nextSlug,
        name,
        description,
        instructions,
        tags,
        metadata,
        isPrivate,
        updatedAt: now,
      })
      .where(
        and(eq(personalSkills.id, normalizedSkillId), eq(personalSkills.userId, normalizedUserId))
      )
      .returning();

    if (!updated) {
      throw new NotFoundException(`Personal skill not found: ${normalizedSkillId}`);
    }

    return this.toRecord(updated);
  }

  async deleteByUser(userId: string, skillId: string): Promise<void> {
    const normalizedUserId = this.validateUuid(userId, 'userId');
    const normalizedSkillId = this.validateUuid(skillId, 'skillId');
    await this.ensureInitialized();

    const deleted = await this.db.client
      .delete(personalSkills)
      .where(
        and(eq(personalSkills.id, normalizedSkillId), eq(personalSkills.userId, normalizedUserId))
      )
      .returning({ id: personalSkills.id });

    if (!deleted[0]) {
      throw new NotFoundException(`Personal skill not found: ${normalizedSkillId}`);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }
    if (this.initializePromise) {
      await this.initializePromise;
      return;
    }

    this.initializePromise = this.initializeSchema();
    await this.initializePromise;
    this.initialized = true;
  }

  private async initializeSchema(): Promise<void> {
    await this.db.client.execute(sql`
      CREATE TABLE IF NOT EXISTS "personal_skills" (
        "id" uuid PRIMARY KEY,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "slug" varchar(180) NOT NULL,
        "name" varchar(160) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "instructions" text NOT NULL,
        "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "is_private" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "personal_skills_user_slug_uq" UNIQUE ("user_id", "slug")
      )
    `);
    await this.db.client.execute(sql`
      CREATE INDEX IF NOT EXISTS "personal_skills_user_idx"
      ON "personal_skills" ("user_id")
    `);
    await this.db.client.execute(sql`
      CREATE INDEX IF NOT EXISTS "personal_skills_user_updated_idx"
      ON "personal_skills" ("user_id", "updated_at" DESC)
    `);
  }

  private async findOwnedSkill(userId: string, skillId: string) {
    const [row] = await this.db.client
      .select()
      .from(personalSkills)
      .where(and(eq(personalSkills.userId, userId), eq(personalSkills.id, skillId)))
      .limit(1);
    return row ?? null;
  }

  private async ensureUniqueSlug(
    userId: string,
    seedSlug: string,
    ignoreId?: string
  ): Promise<string> {
    const baseSlug = seedSlug || `skill-${Date.now()}`;
    let candidate = baseSlug;
    let suffix = 2;

    for (;;) {
      const [row] = await this.db.client
        .select({ id: personalSkills.id })
        .from(personalSkills)
        .where(and(eq(personalSkills.userId, userId), eq(personalSkills.slug, candidate)))
        .limit(1);

      if (!row || row.id === ignoreId) {
        return candidate;
      }

      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  private toRecord(row: typeof personalSkills.$inferSelect): PersonalSkillRecord {
    const toIso = (value: unknown): string => {
      if (value instanceof Date) return value.toISOString();
      if (typeof value === 'string' && value) return new Date(value).toISOString();
      return new Date().toISOString();
    };

    return {
      id: row.id,
      userId: row.userId,
      slug: row.slug,
      name: row.name,
      description: row.description || '',
      instructions: row.instructions,
      tags: this.normalizeTags(row.tags),
      metadata: this.normalizeMetadata(row.metadata),
      isPrivate: Boolean(row.isPrivate),
      createdAt: toIso(row.createdAt),
      updatedAt: toIso(row.updatedAt),
    };
  }

  private slugify(value: string): string {
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return normalized || `skill-${Date.now()}`;
  }

  private normalizeRequiredText(value: unknown, maxLength: number, field: string): string {
    const text = this.normalizeOptionalText(value, maxLength);
    if (!text) {
      throw new BadRequestException(`${field} is required`);
    }
    return text;
  }

  private normalizeOptionalText(value: unknown, maxLength: number): string {
    const text = String(value ?? '').trim();
    if (text.length > maxLength) {
      throw new BadRequestException(`Text exceeds maximum length of ${maxLength}`);
    }
    return text;
  }

  private normalizeTags(value: unknown): string[] {
    if (value === undefined || value === null) {
      return [];
    }

    if (!Array.isArray(value)) {
      throw new BadRequestException('tags must be an array of strings');
    }

    const normalized: string[] = [];
    for (const entry of value) {
      const tag = String(entry ?? '')
        .trim()
        .toLowerCase();
      if (!tag) continue;
      if (tag.length > MAX_TAG_LENGTH) {
        throw new BadRequestException(`Each tag must be at most ${MAX_TAG_LENGTH} characters`);
      }
      if (!normalized.includes(tag)) {
        normalized.push(tag);
      }
      if (normalized.length >= MAX_TAGS) {
        break;
      }
    }
    return normalized;
  }

  private normalizeMetadata(value: unknown): Record<string, unknown> {
    if (value === undefined || value === null) {
      return {};
    }
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('metadata must be an object');
    }

    let encoded = '';
    try {
      encoded = JSON.stringify(value);
    } catch {
      throw new BadRequestException('metadata must be JSON-serializable');
    }

    if (Buffer.byteLength(encoded, 'utf8') > MAX_METADATA_BYTES) {
      throw new BadRequestException(`metadata must be <= ${MAX_METADATA_BYTES} bytes`);
    }

    return JSON.parse(encoded) as Record<string, unknown>;
  }

  private validateUuid(value: string, field: string): string {
    const normalized = String(value || '').trim();
    if (!UUID_PATTERN.test(normalized)) {
      throw new BadRequestException(`${field} must be a valid UUID`);
    }
    return normalized;
  }
}
