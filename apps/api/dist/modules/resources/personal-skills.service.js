"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalSkillsService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_1 = require("@the-new-fuse/database/drizzle");
const node_crypto_1 = require("node:crypto");
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_NAME_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 1500;
const MAX_INSTRUCTIONS_LENGTH = 32000;
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 48;
const MAX_METADATA_BYTES = 50_000;
let PersonalSkillsService = class PersonalSkillsService {
    constructor(db) {
        this.db = db;
        this.initialized = false;
        this.initializePromise = null;
    }
    async listByUser(userId) {
        const normalizedUserId = this.validateUuid(userId, 'userId');
        await this.ensureInitialized();
        const rows = await this.db.client
            .select()
            .from(drizzle_1.personalSkills)
            .where((0, drizzle_1.eq)(drizzle_1.personalSkills.userId, normalizedUserId))
            .orderBy((0, drizzle_1.desc)(drizzle_1.personalSkills.updatedAt));
        return rows.map((row) => this.toRecord(row));
    }
    async getByUser(userId, skillId) {
        const normalizedUserId = this.validateUuid(userId, 'userId');
        const normalizedSkillId = this.validateUuid(skillId, 'skillId');
        await this.ensureInitialized();
        const existing = await this.findOwnedSkill(normalizedUserId, normalizedSkillId);
        if (!existing) {
            throw new common_1.NotFoundException(`Personal skill not found: ${normalizedSkillId}`);
        }
        return this.toRecord(existing);
    }
    async createByUser(userId, input) {
        const normalizedUserId = this.validateUuid(userId, 'userId');
        await this.ensureInitialized();
        const name = this.normalizeRequiredText(input?.name, MAX_NAME_LENGTH, 'name');
        const description = this.normalizeOptionalText(input?.description, MAX_DESCRIPTION_LENGTH);
        const instructions = this.normalizeRequiredText(input?.instructions, MAX_INSTRUCTIONS_LENGTH, 'instructions');
        const tags = this.normalizeTags(input?.tags);
        const metadata = this.normalizeMetadata(input?.metadata);
        const slug = await this.ensureUniqueSlug(normalizedUserId, this.slugify(name));
        const now = new Date();
        const [saved] = await this.db.client
            .insert(drizzle_1.personalSkills)
            .values({
            id: (0, node_crypto_1.randomUUID)(),
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
            throw new common_1.BadRequestException('Failed to create personal skill');
        }
        return this.toRecord(saved);
    }
    async updateByUser(userId, skillId, input) {
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
        ].some((key) => input?.[key] !== undefined);
        if (!hasUpdates) {
            throw new common_1.BadRequestException('At least one of name, description, instructions, tags, or metadata must be provided');
        }
        const existing = await this.findOwnedSkill(normalizedUserId, normalizedSkillId);
        if (!existing) {
            throw new common_1.NotFoundException(`Personal skill not found: ${normalizedSkillId}`);
        }
        const name = input?.name !== undefined
            ? this.normalizeRequiredText(input.name, MAX_NAME_LENGTH, 'name')
            : existing.name;
        const description = input?.description !== undefined
            ? this.normalizeOptionalText(input.description, MAX_DESCRIPTION_LENGTH)
            : existing.description;
        const instructions = input?.instructions !== undefined
            ? this.normalizeRequiredText(input.instructions, MAX_INSTRUCTIONS_LENGTH, 'instructions')
            : existing.instructions;
        const tags = input?.tags !== undefined ? this.normalizeTags(input.tags) : existing.tags;
        const metadata = input?.metadata !== undefined
            ? this.normalizeMetadata(input.metadata)
            : this.normalizeMetadata(existing.metadata);
        const isPrivate = input?.isPrivate !== undefined ? Boolean(input.isPrivate) : existing.isPrivate;
        const nextSlug = input?.name !== undefined
            ? await this.ensureUniqueSlug(normalizedUserId, this.slugify(name), normalizedSkillId)
            : existing.slug;
        const now = new Date();
        const [updated] = await this.db.client
            .update(drizzle_1.personalSkills)
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
            .where((0, drizzle_1.and)((0, drizzle_1.eq)(drizzle_1.personalSkills.id, normalizedSkillId), (0, drizzle_1.eq)(drizzle_1.personalSkills.userId, normalizedUserId)))
            .returning();
        if (!updated) {
            throw new common_1.NotFoundException(`Personal skill not found: ${normalizedSkillId}`);
        }
        return this.toRecord(updated);
    }
    async deleteByUser(userId, skillId) {
        const normalizedUserId = this.validateUuid(userId, 'userId');
        const normalizedSkillId = this.validateUuid(skillId, 'skillId');
        await this.ensureInitialized();
        const deleted = await this.db.client
            .delete(drizzle_1.personalSkills)
            .where((0, drizzle_1.and)((0, drizzle_1.eq)(drizzle_1.personalSkills.id, normalizedSkillId), (0, drizzle_1.eq)(drizzle_1.personalSkills.userId, normalizedUserId)))
            .returning({ id: drizzle_1.personalSkills.id });
        if (!deleted[0]) {
            throw new common_1.NotFoundException(`Personal skill not found: ${normalizedSkillId}`);
        }
    }
    async ensureInitialized() {
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
    async initializeSchema() {
        await this.db.client.execute((0, drizzle_1.sql) `
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
        await this.db.client.execute((0, drizzle_1.sql) `
      CREATE INDEX IF NOT EXISTS "personal_skills_user_idx"
      ON "personal_skills" ("user_id")
    `);
        await this.db.client.execute((0, drizzle_1.sql) `
      CREATE INDEX IF NOT EXISTS "personal_skills_user_updated_idx"
      ON "personal_skills" ("user_id", "updated_at" DESC)
    `);
    }
    async findOwnedSkill(userId, skillId) {
        const [row] = await this.db.client
            .select()
            .from(drizzle_1.personalSkills)
            .where((0, drizzle_1.and)((0, drizzle_1.eq)(drizzle_1.personalSkills.userId, userId), (0, drizzle_1.eq)(drizzle_1.personalSkills.id, skillId)))
            .limit(1);
        return row ?? null;
    }
    async ensureUniqueSlug(userId, seedSlug, ignoreId) {
        const baseSlug = seedSlug || `skill-${Date.now()}`;
        let candidate = baseSlug;
        let suffix = 2;
        for (;;) {
            const [row] = await this.db.client
                .select({ id: drizzle_1.personalSkills.id })
                .from(drizzle_1.personalSkills)
                .where((0, drizzle_1.and)((0, drizzle_1.eq)(drizzle_1.personalSkills.userId, userId), (0, drizzle_1.eq)(drizzle_1.personalSkills.slug, candidate)))
                .limit(1);
            if (!row || row.id === ignoreId) {
                return candidate;
            }
            candidate = `${baseSlug}-${suffix}`;
            suffix += 1;
        }
    }
    toRecord(row) {
        const toIso = (value) => {
            if (value instanceof Date)
                return value.toISOString();
            if (typeof value === 'string' && value)
                return new Date(value).toISOString();
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
    slugify(value) {
        const normalized = value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        return normalized || `skill-${Date.now()}`;
    }
    normalizeRequiredText(value, maxLength, field) {
        const text = this.normalizeOptionalText(value, maxLength);
        if (!text) {
            throw new common_1.BadRequestException(`${field} is required`);
        }
        return text;
    }
    normalizeOptionalText(value, maxLength) {
        const text = String(value ?? '').trim();
        if (text.length > maxLength) {
            throw new common_1.BadRequestException(`Text exceeds maximum length of ${maxLength}`);
        }
        return text;
    }
    normalizeTags(value) {
        if (value === undefined || value === null) {
            return [];
        }
        if (!Array.isArray(value)) {
            throw new common_1.BadRequestException('tags must be an array of strings');
        }
        const normalized = [];
        for (const entry of value) {
            const tag = String(entry ?? '')
                .trim()
                .toLowerCase();
            if (!tag)
                continue;
            if (tag.length > MAX_TAG_LENGTH) {
                throw new common_1.BadRequestException(`Each tag must be at most ${MAX_TAG_LENGTH} characters`);
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
    normalizeMetadata(value) {
        if (value === undefined || value === null) {
            return {};
        }
        if (typeof value !== 'object' || Array.isArray(value)) {
            throw new common_1.BadRequestException('metadata must be an object');
        }
        let encoded = '';
        try {
            encoded = JSON.stringify(value);
        }
        catch {
            throw new common_1.BadRequestException('metadata must be JSON-serializable');
        }
        if (Buffer.byteLength(encoded, 'utf8') > MAX_METADATA_BYTES) {
            throw new common_1.BadRequestException(`metadata must be <= ${MAX_METADATA_BYTES} bytes`);
        }
        return JSON.parse(encoded);
    }
    validateUuid(value, field) {
        const normalized = String(value || '').trim();
        if (!UUID_PATTERN.test(normalized)) {
            throw new common_1.BadRequestException(`${field} must be a valid UUID`);
        }
        return normalized;
    }
};
exports.PersonalSkillsService = PersonalSkillsService;
exports.PersonalSkillsService = PersonalSkillsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_1.DatabaseService])
], PersonalSkillsService);
//# sourceMappingURL=personal-skills.service.js.map