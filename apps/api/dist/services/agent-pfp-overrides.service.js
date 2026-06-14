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
var AgentPfpOverridesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentPfpOverridesService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const node_crypto_1 = require("node:crypto");
const paypal_service_1 = require("../modules/billing/paypal.service");
let AgentPfpOverridesService = AgentPfpOverridesService_1 = class AgentPfpOverridesService {
    constructor(db, payPalService, storageService) {
        this.db = db;
        this.payPalService = payPalService;
        this.storageService = storageService;
        this.logger = new common_1.Logger(AgentPfpOverridesService_1.name);
        this.schemaReady = null;
    }
    async getCloudAccess(userId) {
        await this.ensureSchema();
        const membership = await this.payPalService.getMembershipForUser(userId);
        return {
            canSave: membership.active,
            tier: membership.tier,
            active: membership.active,
            storageBackend: this.getStorageBackend(),
        };
    }
    async listOverrides(userId, namespace = 'global') {
        await this.ensureSchema();
        const safeUserId = this.escapeSqlLiteral(userId);
        const safeNamespace = this.escapeSqlLiteral(this.normalizeNamespace(namespace));
        const rows = await this.db.executeRaw(`
      SELECT agent_id, image_url, prompt, provider, model, style, source, updated_at
      FROM agent_pfp_overrides
      WHERE user_id = '${safeUserId}'
        AND namespace = '${safeNamespace}'
      ORDER BY updated_at DESC
    `);
        const overrides = {};
        for (const row of rows) {
            if (!row?.agent_id || !row?.image_url)
                continue;
            overrides[row.agent_id] = {
                imageUrl: row.image_url,
                prompt: row.prompt || undefined,
                provider: row.provider || undefined,
                model: row.model || undefined,
                style: row.style || undefined,
                source: this.normalizeSource(row.source),
                updatedAt: this.toIso(row.updated_at),
            };
        }
        return overrides;
    }
    async upsertOverride(userId, namespace, agentId, override, options = {}) {
        await this.ensureSchema();
        if (options.requirePaid !== false) {
            await this.assertCloudWriteAccess(userId);
        }
        const safeUserId = this.escapeSqlLiteral(userId);
        const safeNamespace = this.escapeSqlLiteral(this.normalizeNamespace(namespace));
        const safeAgentId = this.escapeSqlLiteral(agentId.trim());
        const now = new Date().toISOString();
        const storedImageUrl = await this.prepareImageForStorage(userId, namespace, agentId, override.imageUrl);
        const id = (0, node_crypto_1.randomUUID)();
        const imageUrlSql = this.toSqlString(storedImageUrl);
        const promptSql = this.toSqlNullableString(override.prompt);
        const providerSql = this.toSqlNullableString(override.provider);
        const modelSql = this.toSqlNullableString(override.model);
        const styleSql = this.toSqlNullableString(override.style);
        const sourceSql = this.toSqlString(this.normalizeSource(override.source));
        await this.db.executeRaw(`
      INSERT INTO agent_pfp_overrides (
        id,
        namespace,
        user_id,
        agent_id,
        image_url,
        prompt,
        provider,
        model,
        style,
        source,
        updated_at,
        created_at
      ) VALUES (
        '${id}',
        '${safeNamespace}',
        '${safeUserId}',
        '${safeAgentId}',
        ${imageUrlSql},
        ${promptSql},
        ${providerSql},
        ${modelSql},
        ${styleSql},
        ${sourceSql},
        '${now}',
        '${now}'
      )
      ON CONFLICT (namespace, user_id, agent_id)
      DO UPDATE SET
        image_url = EXCLUDED.image_url,
        prompt = EXCLUDED.prompt,
        provider = EXCLUDED.provider,
        model = EXCLUDED.model,
        style = EXCLUDED.style,
        source = EXCLUDED.source,
        updated_at = EXCLUDED.updated_at
    `);
    }
    async removeOverride(userId, namespace, agentId, options = {}) {
        await this.ensureSchema();
        if (options.requirePaid !== false) {
            await this.assertCloudWriteAccess(userId);
        }
        const safeUserId = this.escapeSqlLiteral(userId);
        const safeNamespace = this.escapeSqlLiteral(this.normalizeNamespace(namespace));
        const safeAgentId = this.escapeSqlLiteral(agentId.trim());
        await this.db.executeRaw(`
      DELETE FROM agent_pfp_overrides
      WHERE user_id = '${safeUserId}'
        AND namespace = '${safeNamespace}'
        AND agent_id = '${safeAgentId}'
    `);
    }
    async assertCloudWriteAccess(userId) {
        const membership = await this.payPalService.getMembershipForUser(userId);
        if (!membership.active) {
            throw new common_1.ForbiddenException('Cloud save is available for paid memberships (PRO/ENTERPRISE).');
        }
    }
    async ensureSchema() {
        if (!this.schemaReady) {
            this.schemaReady = this.createSchema();
        }
        await this.schemaReady;
    }
    async createSchema() {
        try {
            await this.db.executeRaw(`
        CREATE TABLE IF NOT EXISTS agent_pfp_overrides (
          id VARCHAR(64) PRIMARY KEY,
          namespace VARCHAR(120) NOT NULL,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          agent_id VARCHAR(255) NOT NULL,
          image_url TEXT NOT NULL,
          prompt TEXT,
          provider VARCHAR(100),
          model VARCHAR(120),
          style VARCHAR(160),
          source VARCHAR(24) NOT NULL DEFAULT 'generated',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
            await this.db.executeRaw(`
        CREATE UNIQUE INDEX IF NOT EXISTS agent_pfp_overrides_user_namespace_agent_uq
        ON agent_pfp_overrides (user_id, namespace, agent_id)
      `);
            await this.db.executeRaw(`
        CREATE INDEX IF NOT EXISTS agent_pfp_overrides_user_namespace_updated_idx
        ON agent_pfp_overrides (user_id, namespace, updated_at DESC)
      `);
        }
        catch (error) {
            this.logger.error(`Failed to ensure agent_pfp_overrides schema: ${String(error)}`);
            throw error;
        }
    }
    normalizeNamespace(namespace) {
        const normalized = String(namespace || 'global')
            .trim()
            .replace(/[^a-zA-Z0-9:_-]+/g, '_')
            .slice(0, 120);
        return normalized || 'global';
    }
    getStorageBackend() {
        if (process.env.GCS_BUCKET)
            return 'gcs';
        if (this.hasCloudflareImagesConfig())
            return 'cloudflare-images';
        return 'inline';
    }
    hasCloudflareImagesConfig() {
        return Boolean(this.getCloudflareAccountId() && this.getCloudflareApiToken());
    }
    getCloudflareAccountId() {
        return (process.env.CLOUDFLARE_IMAGES_ACCOUNT_ID ||
            process.env.CLOUDFLARE_ACCOUNT_ID ||
            '').trim();
    }
    getCloudflareApiToken() {
        return (process.env.CLOUDFLARE_IMAGES_API_TOKEN ||
            process.env.CLOUDFLARE_API_TOKEN ||
            '').trim();
    }
    async prepareImageForStorage(userId, namespace, agentId, imageUrl) {
        const normalized = String(imageUrl || '').trim();
        if (!normalized || !normalized.startsWith('data:')) {
            return normalized;
        }
        const backend = this.getStorageBackend();
        if (backend === 'inline') {
            return normalized;
        }
        const parsed = this.parseDataUrl(normalized);
        if (!parsed) {
            return normalized;
        }
        try {
            if (backend === 'gcs') {
                const fileExt = this.extensionForMimeType(parsed.mimeType);
                const filename = `pfps/${userId}/${this.normalizeNamespace(namespace)}_${agentId}_${Date.now()}.${fileExt}`;
                const uploaded = await this.storageService.upload(filename, parsed.buffer, {
                    contentType: parsed.mimeType,
                    isPublic: true,
                    metadata: {
                        userId,
                        namespace: this.normalizeNamespace(namespace),
                        agentId,
                    },
                });
                return uploaded.publicUrl || normalized;
            }
            const uploaded = await this.uploadToCloudflareImages({
                userId,
                namespace,
                agentId,
                mimeType: parsed.mimeType,
                buffer: parsed.buffer,
            });
            return uploaded || normalized;
        }
        catch (error) {
            this.logger.warn(`${backend} storage upload failed; storing inline image: ${String(error)}`);
            return normalized;
        }
    }
    parseDataUrl(dataUrl) {
        const match = /^data:([^;,]+)(;base64)?,(.*)$/i.exec(dataUrl);
        if (!match)
            return null;
        const mimeType = match[1] || 'image/png';
        const isBase64 = Boolean(match[2]);
        const payload = match[3] || '';
        try {
            const buffer = isBase64
                ? Buffer.from(payload, 'base64')
                : Buffer.from(decodeURIComponent(payload), 'utf8');
            if (!buffer.length)
                return null;
            return { mimeType, buffer };
        }
        catch {
            return null;
        }
    }
    async uploadToCloudflareImages(input) {
        const accountId = this.getCloudflareAccountId();
        const token = this.getCloudflareApiToken();
        if (!accountId || !token)
            return null;
        const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;
        const fileExt = this.extensionForMimeType(input.mimeType);
        const filename = `${this.normalizeNamespace(input.namespace)}_${input.agentId}_${Date.now()}.${fileExt}`;
        const byteView = Uint8Array.from(input.buffer);
        const form = new FormData();
        form.append('file', new Blob([byteView], { type: input.mimeType || 'image/png' }), filename);
        form.append('metadata', JSON.stringify({
            userId: input.userId,
            namespace: this.normalizeNamespace(input.namespace),
            agentId: input.agentId,
        }));
        form.append('requireSignedURLs', 'false');
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: form,
        });
        const raw = await response.text().catch(() => '');
        if (!response.ok) {
            this.logger.warn(`Cloudflare upload failed with status ${response.status}: ${raw.slice(0, 240)}`);
            return null;
        }
        try {
            const payload = JSON.parse(raw);
            const variant = payload?.result?.variants?.[0];
            if (variant && typeof variant === 'string') {
                return variant;
            }
        }
        catch {
            this.logger.warn('Cloudflare upload returned non-JSON payload');
        }
        return null;
    }
    extensionForMimeType(mimeType) {
        const normalized = String(mimeType || '').toLowerCase();
        if (normalized.includes('jpeg') || normalized.includes('jpg'))
            return 'jpg';
        if (normalized.includes('webp'))
            return 'webp';
        if (normalized.includes('gif'))
            return 'gif';
        return 'png';
    }
    normalizeSource(source) {
        if (source === 'upload')
            return 'upload';
        if (source === 'cloud')
            return 'cloud';
        return 'generated';
    }
    toIso(value) {
        if (value instanceof Date)
            return value.toISOString();
        const parsed = new Date(value);
        if (!Number.isFinite(parsed.getTime()))
            return new Date().toISOString();
        return parsed.toISOString();
    }
    toSqlString(value) {
        return `'${this.escapeSqlLiteral(value)}'`;
    }
    toSqlNullableString(value) {
        if (value == null)
            return 'NULL';
        const normalized = String(value).trim();
        if (!normalized)
            return 'NULL';
        return `'${this.escapeSqlLiteral(normalized)}'`;
    }
    escapeSqlLiteral(value) {
        return String(value).replace(/'/g, "''");
    }
};
exports.AgentPfpOverridesService = AgentPfpOverridesService;
exports.AgentPfpOverridesService = AgentPfpOverridesService = AgentPfpOverridesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService,
        paypal_service_1.PayPalService,
        infrastructure_1.StorageService])
], AgentPfpOverridesService);
//# sourceMappingURL=agent-pfp-overrides.service.js.map