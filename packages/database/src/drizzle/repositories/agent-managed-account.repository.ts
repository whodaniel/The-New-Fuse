import * as crypto from 'crypto';
import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '../client.js';
import { agentManagedAccountGrants, agentManagedAccounts } from '../schema/index.js';
import { AgentManagedAccount, AgentManagedAccountGrant, NewAgentManagedAccount } from '../types.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY is required for managed account credential storage');
  }
  return secret;
}

function encrypt(text: string): string {
  const secret = getEncryptionSecret();
  const key = crypto.scryptSync(secret, 'agent-managed-accounts-salt', KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(text: string): string {
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

function buildPreview(secret: string): string {
  const trimmed = secret.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
  return `${trimmed.slice(0, 4)}***${trimmed.slice(-4)}`;
}

function normalizeValue(value: string): string {
  return value.trim();
}

function hashGrantToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class DrizzleAgentManagedAccountRepository {
  async listByOwner(ownerUserId: string): Promise<Omit<AgentManagedAccount, 'encryptedSecret'>[]> {
    const rows = await db
      .select()
      .from(agentManagedAccounts)
      .where(eq(agentManagedAccounts.ownerUserId, ownerUserId))
      .orderBy(desc(agentManagedAccounts.createdAt));

    return rows.map(({ encryptedSecret: _encryptedSecret, ...safe }) => safe);
  }

  async findByIdForOwner(
    ownerUserId: string,
    accountId: string
  ): Promise<Omit<AgentManagedAccount, 'encryptedSecret'> | null> {
    const [row] = await db
      .select()
      .from(agentManagedAccounts)
      .where(
        and(
          eq(agentManagedAccounts.ownerUserId, ownerUserId),
          eq(agentManagedAccounts.id, accountId)
        )
      );

    if (!row) return null;
    const { encryptedSecret: _encryptedSecret, ...safe } = row;
    return safe;
  }

  async findDecryptedByIdForOwner(
    ownerUserId: string,
    accountId: string
  ): Promise<(Omit<AgentManagedAccount, 'encryptedSecret'> & { secret: string }) | null> {
    const [row] = await db
      .select()
      .from(agentManagedAccounts)
      .where(
        and(
          eq(agentManagedAccounts.ownerUserId, ownerUserId),
          eq(agentManagedAccounts.id, accountId)
        )
      );

    if (!row) return null;

    const { encryptedSecret, ...safe } = row;
    return {
      ...safe,
      secret: decrypt(encryptedSecret),
    };
  }

  async createAccount(
    ownerUserId: string,
    data: {
      accountType: string;
      provider: string;
      loginIdentifier: string;
      secret: string;
      metadata?: Record<string, unknown>;
      status?: string;
      createdByAgent?: string;
    }
  ): Promise<Omit<AgentManagedAccount, 'encryptedSecret'>> {
    const now = new Date();
    const [row] = await db
      .insert(agentManagedAccounts)
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
      } satisfies NewAgentManagedAccount)
      .returning();

    const { encryptedSecret: _encryptedSecret, ...safe } = row;
    return safe;
  }

  async createGrant(input: {
    ownerUserId: string;
    accountId: string;
    granteeAgentId: string;
    scopes: string[];
    expiresAt: Date;
  }): Promise<{ grant: AgentManagedAccountGrant; grantToken: string }> {
    const grantToken = `tnf_cust_${crypto.randomBytes(24).toString('base64url')}`;
    const now = new Date();
    const [grant] = await db
      .insert(agentManagedAccountGrants)
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

  async listGrantsForAccount(
    ownerUserId: string,
    accountId: string
  ): Promise<AgentManagedAccountGrant[]> {
    return db
      .select()
      .from(agentManagedAccountGrants)
      .where(
        and(
          eq(agentManagedAccountGrants.ownerUserId, ownerUserId),
          eq(agentManagedAccountGrants.accountId, accountId)
        )
      )
      .orderBy(desc(agentManagedAccountGrants.createdAt));
  }

  async revokeGrant(
    ownerUserId: string,
    grantId: string
  ): Promise<AgentManagedAccountGrant | null> {
    const [row] = await db
      .update(agentManagedAccountGrants)
      .set({ revoked: true, updatedAt: new Date() })
      .where(
        and(
          eq(agentManagedAccountGrants.ownerUserId, ownerUserId),
          eq(agentManagedAccountGrants.id, grantId)
        )
      )
      .returning();
    return row || null;
  }

  async redeemGrant(input: { grantToken: string; granteeAgentId: string }): Promise<{
    grant: AgentManagedAccountGrant;
    account: Omit<AgentManagedAccount, 'encryptedSecret'> & { secret: string };
  } | null> {
    const tokenHash = hashGrantToken(input.grantToken);
    const now = new Date();

    const [grant] = await db
      .select()
      .from(agentManagedAccountGrants)
      .where(
        and(
          eq(agentManagedAccountGrants.accessTokenHash, tokenHash),
          eq(agentManagedAccountGrants.granteeAgentId, normalizeValue(input.granteeAgentId)),
          eq(agentManagedAccountGrants.revoked, false),
          gte(agentManagedAccountGrants.expiresAt, now)
        )
      );

    if (!grant) return null;

    const [account] = await db
      .select()
      .from(agentManagedAccounts)
      .where(
        and(
          eq(agentManagedAccounts.id, grant.accountId),
          eq(agentManagedAccounts.ownerUserId, grant.ownerUserId)
        )
      );
    if (!account) return null;

    await db
      .update(agentManagedAccountGrants)
      .set({
        lastRedeemedAt: now,
        updatedAt: now,
      })
      .where(eq(agentManagedAccountGrants.id, grant.id));

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

export const drizzleAgentManagedAccountRepository = new DrizzleAgentManagedAccountRepository();
