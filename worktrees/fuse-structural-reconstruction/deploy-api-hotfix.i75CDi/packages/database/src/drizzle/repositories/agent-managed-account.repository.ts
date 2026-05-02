import * as crypto from 'crypto';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { agentManagedAccounts } from '../schema';
import { AgentManagedAccount } from '../types';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

export type AgentManagedAccountSafe = Omit<AgentManagedAccount, 'encryptedSecret'>;
export type AgentManagedAccountWithSecret = AgentManagedAccountSafe & { secret: string };

export interface AgentManagedAccountFilter {
  accountType?: string;
  provider?: string;
  username?: string;
}

export interface UpsertAgentManagedAccountInput {
  accountType: string;
  provider: string;
  username: string;
  secret: string;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
  createdByAgentId?: string | null;
}

function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY is required for managed account storage');
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

function normalizeProvider(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeAccountType(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

function buildSecretPreview(secret: string): string {
  const trimmed = secret.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
  return `${trimmed.slice(0, 4)}***${trimmed.slice(-4)}`;
}

function toSafe(row: AgentManagedAccount): AgentManagedAccountSafe {
  const { encryptedSecret: _encryptedSecret, ...safe } = row;
  return safe;
}

export class DrizzleAgentManagedAccountRepository {
  async listByOwner(
    ownerUserId: string,
    filter: AgentManagedAccountFilter = {}
  ): Promise<AgentManagedAccountSafe[]> {
    const rows = await db
      .select()
      .from(agentManagedAccounts)
      .where(
        and(
          eq(agentManagedAccounts.ownerUserId, ownerUserId),
          filter.accountType
            ? eq(agentManagedAccounts.accountType, normalizeAccountType(filter.accountType))
            : undefined,
          filter.provider
            ? eq(agentManagedAccounts.provider, normalizeProvider(filter.provider))
            : undefined,
          filter.username
            ? eq(agentManagedAccounts.username, normalizeUsername(filter.username))
            : undefined
        )
      )
      .orderBy(desc(agentManagedAccounts.updatedAt));

    return rows.map(toSafe);
  }

  async upsert(
    ownerUserId: string,
    input: UpsertAgentManagedAccountInput
  ): Promise<AgentManagedAccountSafe> {
    const now = new Date();
    const payload = {
      ownerUserId,
      accountType: normalizeAccountType(input.accountType),
      provider: normalizeProvider(input.provider),
      username: normalizeUsername(input.username),
      encryptedSecret: encrypt(input.secret),
      secretPreview: buildSecretPreview(input.secret),
      metadata: input.metadata ?? {},
      isActive: input.isActive ?? true,
      createdByAgentId: input.createdByAgentId ?? null,
      updatedAt: now,
    };

    const [row] = await db
      .insert(agentManagedAccounts)
      .values({
        ...payload,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: [
          agentManagedAccounts.ownerUserId,
          agentManagedAccounts.provider,
          agentManagedAccounts.username,
        ],
        set: payload,
      })
      .returning();

    return toSafe(row);
  }

  async findDecryptedByOwnerAndId(
    ownerUserId: string,
    id: string
  ): Promise<AgentManagedAccountWithSecret | null> {
    const [row] = await db
      .select()
      .from(agentManagedAccounts)
      .where(and(eq(agentManagedAccounts.ownerUserId, ownerUserId), eq(agentManagedAccounts.id, id)));

    if (!row) return null;

    return {
      ...toSafe(row),
      secret: decrypt(row.encryptedSecret),
    };
  }

  async issueForAgent(
    ownerUserId: string,
    agentId: string,
    filter: AgentManagedAccountFilter = {}
  ): Promise<AgentManagedAccountWithSecret | null> {
    const [row] = await db
      .select()
      .from(agentManagedAccounts)
      .where(
        and(
          eq(agentManagedAccounts.ownerUserId, ownerUserId),
          eq(agentManagedAccounts.isActive, true),
          filter.accountType
            ? eq(agentManagedAccounts.accountType, normalizeAccountType(filter.accountType))
            : undefined,
          filter.provider
            ? eq(agentManagedAccounts.provider, normalizeProvider(filter.provider))
            : undefined,
          filter.username
            ? eq(agentManagedAccounts.username, normalizeUsername(filter.username))
            : undefined
        )
      )
      .orderBy(asc(agentManagedAccounts.lastIssuedAt), desc(agentManagedAccounts.updatedAt))
      .limit(1);

    if (!row) return null;

    const [updated] = await db
      .update(agentManagedAccounts)
      .set({
        lastIssuedAt: new Date(),
        lastIssuedToAgentId: agentId,
        updatedAt: new Date(),
      })
      .where(eq(agentManagedAccounts.id, row.id))
      .returning();

    const current = updated ?? row;

    return {
      ...toSafe(current),
      secret: decrypt(current.encryptedSecret),
    };
  }

  async setActive(ownerUserId: string, id: string, isActive: boolean): Promise<boolean> {
    const rows = await db
      .update(agentManagedAccounts)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(and(eq(agentManagedAccounts.ownerUserId, ownerUserId), eq(agentManagedAccounts.id, id)))
      .returning({ id: agentManagedAccounts.id });

    return rows.length > 0;
  }
}

export const drizzleAgentManagedAccountRepository = new DrizzleAgentManagedAccountRepository();
