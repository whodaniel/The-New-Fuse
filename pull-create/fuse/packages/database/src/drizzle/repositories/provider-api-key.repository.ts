import * as crypto from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../client';
import { providerApiKeys } from '../schema';
import { ProviderApiKey } from '../types';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY is required for provider key storage');
  }
  return secret;
}

function encrypt(text: string): string {
  const secret = getEncryptionSecret();
  const key = crypto.scryptSync(secret, 'provider-api-keys-salt', KEY_LENGTH);
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

function normalizeProvider(provider: string): string {
  return provider.trim().toLowerCase();
}

function buildPreview(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
  return `${trimmed.slice(0, 4)}***${trimmed.slice(-4)}`;
}

export class DrizzleProviderApiKeyRepository {
  async listByUser(userId: string): Promise<Omit<ProviderApiKey, 'encryptedKey'>[]> {
    const rows = await db.select().from(providerApiKeys).where(eq(providerApiKeys.userId, userId));

    return rows.map(({ encryptedKey: _encryptedKey, ...rest }) => rest);
  }

  async findDecryptedByUserAndProvider(
    userId: string,
    provider: string
  ): Promise<(Omit<ProviderApiKey, 'encryptedKey'> & { apiKey: string }) | null> {
    const normalized = normalizeProvider(provider);
    const [row] = await db
      .select()
      .from(providerApiKeys)
      .where(and(eq(providerApiKeys.userId, userId), eq(providerApiKeys.provider, normalized)));

    if (!row) return null;

    const { encryptedKey, ...rest } = row;
    return {
      ...rest,
      apiKey: decrypt(encryptedKey),
    };
  }

  async upsert(
    userId: string,
    provider: string,
    apiKey: string
  ): Promise<Omit<ProviderApiKey, 'encryptedKey'>> {
    const normalized = normalizeProvider(provider);
    const now = new Date();
    const payload = {
      userId,
      provider: normalized,
      encryptedKey: encrypt(apiKey),
      keyPreview: buildPreview(apiKey),
      updatedAt: now,
    };

    const [row] = await db
      .insert(providerApiKeys)
      .values({
        ...payload,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: [providerApiKeys.userId, providerApiKeys.provider],
        set: payload,
      })
      .returning();

    const { encryptedKey: _encryptedKey, ...safe } = row;
    return safe;
  }

  async deleteByUserAndId(userId: string, id: string): Promise<boolean> {
    const rows = await db
      .delete(providerApiKeys)
      .where(and(eq(providerApiKeys.userId, userId), eq(providerApiKeys.id, id)))
      .returning({ id: providerApiKeys.id });

    return rows.length > 0;
  }
}

export const drizzleProviderApiKeyRepository = new DrizzleProviderApiKeyRepository();
