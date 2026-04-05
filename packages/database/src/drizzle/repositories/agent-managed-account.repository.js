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
exports.drizzleAgentManagedAccountRepository = exports.DrizzleAgentManagedAccountRepository = void 0;
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
        throw new Error('ENCRYPTION_KEY is required for managed account credential storage');
    }
    return secret;
}
function encrypt(text) {
    const secret = getEncryptionSecret();
    const key = crypto.scryptSync(secret, 'agent-managed-accounts-salt', KEY_LENGTH);
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
        throw new Error('Invalid encrypted managed account secret format');
    }
    const key = crypto.scryptSync(secret, 'agent-managed-accounts-salt', KEY_LENGTH);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
function buildPreview(secret) {
    const trimmed = secret.trim();
    if (!trimmed)
        return '';
    if (trimmed.length <= 8)
        return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
    return `${trimmed.slice(0, 4)}***${trimmed.slice(-4)}`;
}
function normalizeValue(value) {
    return value.trim();
}
function hashGrantToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}
class DrizzleAgentManagedAccountRepository {
    async listByOwner(ownerUserId) {
        const rows = await client_1.db
            .select()
            .from(schema_1.agentManagedAccounts)
            .where((0, drizzle_orm_1.eq)(schema_1.agentManagedAccounts.ownerUserId, ownerUserId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.agentManagedAccounts.createdAt));
        return rows.map(({ encryptedSecret: _encryptedSecret, ...safe }) => safe);
    }
    async findByIdForOwner(ownerUserId, accountId) {
        const [row] = await client_1.db
            .select()
            .from(schema_1.agentManagedAccounts)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agentManagedAccounts.ownerUserId, ownerUserId), (0, drizzle_orm_1.eq)(schema_1.agentManagedAccounts.id, accountId)));
        if (!row)
            return null;
        const { encryptedSecret: _encryptedSecret, ...safe } = row;
        return safe;
    }
    async findDecryptedByIdForOwner(ownerUserId, accountId) {
        const [row] = await client_1.db
            .select()
            .from(schema_1.agentManagedAccounts)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agentManagedAccounts.ownerUserId, ownerUserId), (0, drizzle_orm_1.eq)(schema_1.agentManagedAccounts.id, accountId)));
        if (!row)
            return null;
        const { encryptedSecret, ...safe } = row;
        return {
            ...safe,
            secret: decrypt(encryptedSecret),
        };
    }
    async createAccount(ownerUserId, data) {
        const now = new Date();
        const [row] = await client_1.db
            .insert(schema_1.agentManagedAccounts)
            .values({
            ownerUserId,
            accountType: normalizeValue(data.accountType).toLowerCase(),
            provider: normalizeValue(data.provider).toLowerCase(),
            loginIdentifier: normalizeValue(data.loginIdentifier).toLowerCase(),
            encryptedSecret: encrypt(data.secret),
            secretPreview: buildPreview(data.secret),
            metadata: data.metadata || {},
            status: normalizeValue(data.status || 'active').toLowerCase(),
            createdByAgent: data.createdByAgent ? normalizeValue(data.createdByAgent) : null,
            createdAt: now,
            updatedAt: now,
        })
            .returning();
        const { encryptedSecret: _encryptedSecret, ...safe } = row;
        return safe;
    }
    async createGrant(input) {
        const grantToken = `tnf_cust_${crypto.randomBytes(24).toString('base64url')}`;
        const now = new Date();
        const [grant] = await client_1.db
            .insert(schema_1.agentManagedAccountGrants)
            .values({
            accountId: input.accountId,
            ownerUserId: input.ownerUserId,
            granteeAgentId: normalizeValue(input.granteeAgentId),
            accessTokenHash: hashGrantToken(grantToken),
            scopes: input.scopes,
            expiresAt: input.expiresAt,
            revoked: false,
            createdAt: now,
            updatedAt: now,
        })
            .returning();
        return { grant, grantToken };
    }
    async listGrantsForAccount(ownerUserId, accountId) {
        return client_1.db
            .select()
            .from(schema_1.agentManagedAccountGrants)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agentManagedAccountGrants.ownerUserId, ownerUserId), (0, drizzle_orm_1.eq)(schema_1.agentManagedAccountGrants.accountId, accountId)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.agentManagedAccountGrants.createdAt));
    }
    async revokeGrant(ownerUserId, grantId) {
        const [row] = await client_1.db
            .update(schema_1.agentManagedAccountGrants)
            .set({ revoked: true, updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agentManagedAccountGrants.ownerUserId, ownerUserId), (0, drizzle_orm_1.eq)(schema_1.agentManagedAccountGrants.id, grantId)))
            .returning();
        return row || null;
    }
    async redeemGrant(input) {
        const tokenHash = hashGrantToken(input.grantToken);
        const now = new Date();
        const [grant] = await client_1.db
            .select()
            .from(schema_1.agentManagedAccountGrants)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agentManagedAccountGrants.accessTokenHash, tokenHash), (0, drizzle_orm_1.eq)(schema_1.agentManagedAccountGrants.granteeAgentId, normalizeValue(input.granteeAgentId)), (0, drizzle_orm_1.eq)(schema_1.agentManagedAccountGrants.revoked, false), (0, drizzle_orm_1.gte)(schema_1.agentManagedAccountGrants.expiresAt, now)));
        if (!grant)
            return null;
        const [account] = await client_1.db
            .select()
            .from(schema_1.agentManagedAccounts)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.agentManagedAccounts.id, grant.accountId), (0, drizzle_orm_1.eq)(schema_1.agentManagedAccounts.ownerUserId, grant.ownerUserId)));
        if (!account)
            return null;
        await client_1.db
            .update(schema_1.agentManagedAccountGrants)
            .set({
            lastRedeemedAt: now,
            updatedAt: now,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.agentManagedAccountGrants.id, grant.id));
        const { encryptedSecret, ...safe } = account;
        return {
            grant,
            account: {
                ...safe,
                secret: decrypt(encryptedSecret),
            },
        };
    }
}
exports.DrizzleAgentManagedAccountRepository = DrizzleAgentManagedAccountRepository;
exports.drizzleAgentManagedAccountRepository = new DrizzleAgentManagedAccountRepository();
//# sourceMappingURL=agent-managed-account.repository.js.map