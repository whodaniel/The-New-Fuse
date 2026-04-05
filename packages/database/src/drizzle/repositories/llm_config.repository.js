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
exports.drizzleLLMConfigRepository = exports.DrizzleLLMConfigRepository = void 0;
/**
 * LLM Config Repository - Drizzle ORM Implementation
 * Provides data access for LLM Provider configurations
 */
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
const crypto = __importStar(require("crypto"));
// AES-256-GCM Encryption
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
function encrypt(text) {
    if (!process.env.ENCRYPTION_KEY)
        return text;
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
    }
    catch (error) {
        console.error('Encryption failed:', error);
        return text; // Fallback (should ideally throw)
    }
}
function decrypt(text) {
    if (!process.env.ENCRYPTION_KEY)
        return text;
    if (!text.includes(':'))
        return text; // Not encrypted or legacy format
    try {
        const parts = text.split(':');
        if (parts.length !== 3)
            return text; // Unknown format
        const [ivHex, authTagHex, encryptedHex] = parts;
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', KEY_LENGTH);
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('Decryption failed:', error);
        return text; // Return original on error (e.g. key mismatch or legacy data)
    }
}
class DrizzleLLMConfigRepository {
    /**
     * Find all configs
     */
    async findAll() {
        const configs = await client_1.db
            .select()
            .from(schema_1.llmConfigs)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.llmConfigs.priority), (0, drizzle_orm_1.desc)(schema_1.llmConfigs.updatedAt));
        return configs.map(c => ({
            ...c,
            apiKey: decrypt(c.apiKey)
        }));
    }
    /**
     * Find enabled configs
     */
    async findEnabled() {
        const configs = await client_1.db
            .select()
            .from(schema_1.llmConfigs)
            .where((0, drizzle_orm_1.eq)(schema_1.llmConfigs.enabled, true))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.llmConfigs.priority));
        return configs.map(c => ({
            ...c,
            apiKey: decrypt(c.apiKey)
        }));
    }
    /**
     * Find config by ID
     */
    async findById(id) {
        const [config] = await client_1.db.select().from(schema_1.llmConfigs).where((0, drizzle_orm_1.eq)(schema_1.llmConfigs.id, id));
        if (!config)
            return null;
        return {
            ...config,
            apiKey: decrypt(config.apiKey)
        };
    }
    /**
     * Create config
     */
    async create(data) {
        const dataToSave = {
            ...data,
            apiKey: encrypt(data.apiKey)
        };
        const [config] = await client_1.db.insert(schema_1.llmConfigs).values(dataToSave).returning();
        return {
            ...config,
            apiKey: decrypt(config.apiKey)
        };
    }
    /**
     * Update config
     */
    async update(id, data) {
        const dataToSave = { ...data };
        if (data.apiKey) {
            dataToSave.apiKey = encrypt(data.apiKey);
        }
        const [config] = await client_1.db
            .update(schema_1.llmConfigs)
            .set({ ...dataToSave, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.llmConfigs.id, id))
            .returning();
        if (!config)
            return null;
        return {
            ...config,
            apiKey: decrypt(config.apiKey)
        };
    }
    /**
     * Delete config
     */
    async delete(id) {
        const result = await client_1.db.delete(schema_1.llmConfigs).where((0, drizzle_orm_1.eq)(schema_1.llmConfigs.id, id)).returning();
        return result.length > 0;
    }
    /**
     * Set config as default (priority 1) and others to 10
     */
    async setDefault(id) {
        return client_1.db.transaction(async (tx) => {
            // Reset all priorities to 10
            await tx.update(schema_1.llmConfigs).set({ priority: 10 });
            // Set target to 1
            const [config] = await tx
                .update(schema_1.llmConfigs)
                .set({ priority: 1, updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.llmConfigs.id, id))
                .returning();
            return config ?? null;
        });
    }
}
exports.DrizzleLLMConfigRepository = DrizzleLLMConfigRepository;
exports.drizzleLLMConfigRepository = new DrizzleLLMConfigRepository();
//# sourceMappingURL=llm_config.repository.js.map