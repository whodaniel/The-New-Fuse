"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleProviderApiKeyRepository = exports.DrizzleProviderApiKeyRepository = void 0;
const crypto = __importStar(require("crypto"));
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
function getEncryptionSecret() {
    const secret = process.env.ENCRYPTION_KEY;
    if (!secret) {
        throw new Error('ENCRYPTION_KEY is required for provider key storage');
    }
    return secret;
}
function encrypt(text) {
    const secret = getEncryptionSecret();
    const key = crypto.scryptSync(secret, 'provider-api-keys-salt', KEY_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
function decrypt(text) {
    const secret = getEncryptionSecret();
    const [ivHex, authTagHex, encryptedHex] = text.split(':');
    if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error('Invalid encrypted provider key format');
    }
    const key = crypto.scryptSync(secret, 'provider-api-keys-salt', KEY_LENGTH);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
function normalizeProvider(provider) {
    return provider.trim().toLowerCase();
}
function buildPreview(apiKey) {
    const trimmed = apiKey.trim();
    if (!trimmed)
        return '';
    if (trimmed.length <= 8)
        return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
    return `${trimmed.slice(0, 4)}***${trimmed.slice(-4)}`;
}
class DrizzleProviderApiKeyRepository {
    async listByUser(userId) {
        const rows = await client_1.db.select().from(schema_1.providerApiKeys).where((0, drizzle_orm_1.eq)(schema_1.providerApiKeys.userId, userId));
        return rows.map(({ encryptedKey: _encryptedKey, ...rest }) => rest);
    }
    async findDecryptedByUserAndProvider(userId, provider) {
        const normalized = normalizeProvider(provider);
        const [row] = await client_1.db
            .select()
            .from(schema_1.providerApiKeys)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.providerApiKeys.userId, userId), (0, drizzle_orm_1.eq)(schema_1.providerApiKeys.provider, normalized)));
        if (!row)
            return null;
        const { encryptedKey, ...rest } = row;
        return {
            ...rest,
            apiKey: decrypt(encryptedKey),
        };
    }
    async upsert(userId, provider, apiKey) {
        const normalized = normalizeProvider(provider);
        const now = new Date();
        const payload = {
            userId,
            provider: normalized,
            encryptedKey: encrypt(apiKey),
            keyPreview: buildPreview(apiKey),
            updatedAt: now,
        };
        const [row] = await client_1.db
            .insert(schema_1.providerApiKeys)
            .values({
            ...payload,
            createdAt: now,
        })
            .onConflictDoUpdate({
            target: [schema_1.providerApiKeys.userId, schema_1.providerApiKeys.provider],
            set: payload,
        })
            .returning();
        const { encryptedKey: _encryptedKey, ...safe } = row;
        return safe;
    }
    async deleteByUserAndId(userId, id) {
        const rows = await client_1.db
            .delete(schema_1.providerApiKeys)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.providerApiKeys.userId, userId), (0, drizzle_orm_1.eq)(schema_1.providerApiKeys.id, id)))
            .returning({ id: schema_1.providerApiKeys.id });
        return rows.length > 0;
    }
}
exports.DrizzleProviderApiKeyRepository = DrizzleProviderApiKeyRepository;
exports.drizzleProviderApiKeyRepository = new DrizzleProviderApiKeyRepository();
//# sourceMappingURL=provider-api-key.repository.js.map