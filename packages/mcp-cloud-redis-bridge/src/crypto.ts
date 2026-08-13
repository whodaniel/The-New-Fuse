import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createPrivateKey,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  hkdfSync,
  randomBytes,
  sign,
  verify,
  type KeyObject,
} from 'node:crypto';
import { MasterClockSignalEnvelope, MasterClockSignalPlaintext, SignalAckRequest } from './types.js';

/**
 * Stable stringify for deterministic signing
 */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * Security Service for Signal Trust Protocol
 */
export class SecurityService {
  /**
   * Verify and decrypt a Master Clock signal
   */
  static verifyAndDecryptSignal(
    signal: MasterClockSignalEnvelope,
    nodeEncryptionPrivateKeyPem: string
  ): MasterClockSignalPlaintext {
    const payload = signal.payload;
    
    // 1. Verify Signature (Ed25519)
    const signable = {
      signal_id: payload.signal_id,
      pulse_id: payload.pulse_id,
      master_clock_id: payload.master_clock_id,
      target_node_id: payload.target_node_id,
      tenant_scope: payload.tenant_scope,
      wallet_address: payload.wallet_address,
      nft_id: payload.nft_id,
      signal_kind: payload.signal_kind,
      issued_at: payload.issued_at,
      expires_at: payload.expires_at,
      clock_state: payload.clock_state,
      stall_defense: payload.stall_defense,
      transport: payload.transport,
      ephemeral_public_key_pem: payload.ephemeral_public_key_pem,
      salt_b64: payload.salt_b64,
      iv_b64: payload.iv_b64,
      auth_tag_b64: payload.auth_tag_b64,
      ciphertext_b64: payload.ciphertext_b64,
      signing_public_key_pem: payload.signing_public_key_pem,
    };

    const signatureValid = verify(
      null,
      Buffer.from(stableStringify(signable)),
      createPublicKey(payload.signing_public_key_pem),
      Buffer.from(payload.signature_b64, 'base64')
    );

    if (!signatureValid) {
      throw new Error('INVALID_MASTER_CLOCK_SIGNATURE');
    }

    // 2. Decrypt (X25519 + AES-256-GCM)
    const sharedSecret = diffieHellman({
      privateKey: createPrivateKey(nodeEncryptionPrivateKeyPem),
      publicKey: createPublicKey(payload.ephemeral_public_key_pem),
    });

    const key = Buffer.from(
      hkdfSync(
        'sha256',
        sharedSecret,
        Buffer.from(payload.salt_b64, 'base64'),
        Buffer.from(`tnf-master-clock:${payload.signal_id}`),
        32
      )
    );

    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(payload.iv_b64, 'base64')
    );
    decipher.setAuthTag(Buffer.from(payload.auth_tag_b64, 'base64'));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext_b64, 'base64')),
      decipher.final(),
    ]).toString('utf8');

    return JSON.parse(plaintext) as MasterClockSignalPlaintext;
  }

  /**
   * Create a signed acknowledgement for a signal
   */
  static createNodeAckSignature(
    request: Omit<SignalAckRequest, 'signature_b64'>,
    nodeSigningPrivateKeyPem: string
  ): string {
    const signable = {
      signal_id: request.signal_id,
      node_id: request.node_id,
      wallet_address: request.wallet_address,
      nft_id: request.nft_id,
      synchronized_at: request.synchronized_at,
      sub_director_status: request.sub_director_status,
      metadata: request.metadata || {},
    };

    return sign(
      null,
      Buffer.from(stableStringify(signable)),
      createPrivateKey(nodeSigningPrivateKeyPem)
    ).toString('base64');
  }

  /**
   * Helper to generate a new node key pair (for bootstrapping)
   */
  static generateNodeKeys() {
    const signing = generateKeyPairSync('ed25519');
    const encryption = generateKeyPairSync('x25519');
    
    return {
      signing: {
        publicKey: signing.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
        privateKey: signing.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
      },
      encryption: {
        publicKey: encryption.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
        privateKey: encryption.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
      }
    };
  }
}
