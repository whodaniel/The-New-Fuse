import {
  createDecipheriv,
  createHash,
  createPrivateKey,
  createPublicKey,
  diffieHellman,
  hkdfSync,
  sign,
  verify,
} from 'node:crypto';
import type {
  ClockNodeCertificate,
  MasterClockSignalEnvelope,
  MasterClockSignalPlaintext,
  RegisterClockNodeRequest,
  RegisteredClockNode,
  SignalAckRequest,
  TenantScope,
} from '@the-new-fuse/control-plane-contracts';

function stableStringify(value: unknown): string {
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

function normalizePem(value: string): string {
  return String(value || '').trim();
}

function asTimestamp(value: string, code: string): number {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    throw new Error(code);
  }
  return timestamp;
}

function assertEnvelopeMatchesPlaintext(
  envelope: MasterClockSignalEnvelope,
  plaintext: MasterClockSignalPlaintext
): void {
  const envelopeProjection = {
    signal_id: envelope.payload.signal_id,
    pulse_id: envelope.payload.pulse_id,
    master_clock_id: envelope.payload.master_clock_id,
    target_node_id: envelope.payload.target_node_id,
    tenant_scope: envelope.payload.tenant_scope,
    agency_id: envelope.payload.agency_id,
    wallet_address: envelope.payload.wallet_address,
    nft_id: envelope.payload.nft_id,
    signal_kind: envelope.payload.signal_kind,
    issued_at: envelope.payload.issued_at,
    expires_at: envelope.payload.expires_at,
    clock_state: envelope.payload.clock_state,
    stall_defense: envelope.payload.stall_defense,
  };

  const plaintextProjection = {
    signal_id: plaintext.signal_id,
    pulse_id: plaintext.pulse_id,
    master_clock_id: plaintext.master_clock_id,
    target_node_id: plaintext.target_node_id,
    tenant_scope: plaintext.tenant_scope,
    agency_id: plaintext.agency_id,
    wallet_address: plaintext.wallet_address,
    nft_id: plaintext.nft_id,
    signal_kind: plaintext.signal_kind,
    issued_at: plaintext.issued_at,
    expires_at: plaintext.expires_at,
    clock_state: plaintext.clock_state,
    stall_defense: plaintext.stall_defense,
  };

  if (stableStringify(envelopeProjection) !== stableStringify(plaintextProjection)) {
    throw new Error('MASTER_CLOCK_ENVELOPE_PAYLOAD_MISMATCH');
  }
}

export interface MasterClockNodeIdentity {
  nodeId: string;
  tenantScope: TenantScope;
  walletAddress: string;
  nftId: string;
  agencyId?: string;
  label?: string;
  signingPrivateKeyPem: string;
  encryptionPrivateKeyPem: string;
  trustedSigningPublicKeyPem?: string;
  expectedMasterClockId?: string;
  metadata?: Record<string, unknown>;
}

export interface MasterClockDispatchResult {
  subDirectorStatus: 'received' | 'stall_defense_engaged' | 'ignored';
  metadata?: Record<string, unknown>;
}

export interface MasterClockDispatchTarget {
  dispatch(signal: MasterClockSignalPlaintext): Promise<MasterClockDispatchResult> | MasterClockDispatchResult;
}

export interface MasterClockSignalReceiverOptions {
  identity: MasterClockNodeIdentity;
  dispatchTarget: MasterClockDispatchTarget;
  registeredNode?: RegisteredClockNode;
  maxPastSkewMs?: number;
  maxFutureSkewMs?: number;
  now?: () => number;
}

export interface MasterClockReceiveResult {
  plaintext: MasterClockSignalPlaintext;
  ack: SignalAckRequest;
  dispatch: MasterClockDispatchResult;
  trustMode: 'configured' | 'envelope_bootstrap';
  trustedSigningPublicKeyFingerprint: string;
}

export function deriveClockNodePublicKeys(input: {
  signingPrivateKeyPem: string;
  encryptionPrivateKeyPem: string;
}): {
  nodeSigningPublicKeyPem: string;
  nodeEncryptionPublicKeyPem: string;
} {
  const signingPrivateKey = createPrivateKey(normalizePem(input.signingPrivateKeyPem));
  const encryptionPrivateKey = createPrivateKey(normalizePem(input.encryptionPrivateKeyPem));

  return {
    nodeSigningPublicKeyPem: createPublicKey(signingPrivateKey)
      .export({ type: 'spki', format: 'pem' })
      .toString(),
    nodeEncryptionPublicKeyPem: createPublicKey(encryptionPrivateKey)
      .export({ type: 'spki', format: 'pem' })
      .toString(),
  };
}

export function createMasterClockAckSignature(
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
    createPrivateKey(normalizePem(nodeSigningPrivateKeyPem))
  ).toString('base64');
}

export function buildClockNodeRegistration(
  identity: MasterClockNodeIdentity
): RegisterClockNodeRequest {
  const derived = deriveClockNodePublicKeys({
    signingPrivateKeyPem: identity.signingPrivateKeyPem,
    encryptionPrivateKeyPem: identity.encryptionPrivateKeyPem,
  });

  return {
    node_id: identity.nodeId,
    tenant_scope: identity.tenantScope,
    wallet_address: identity.walletAddress,
    nft_id: identity.nftId,
    agency_id: identity.agencyId,
    label: identity.label,
    collective_access: true,
    status: 'active',
    node_signing_public_key_pem: derived.nodeSigningPublicKeyPem,
    node_encryption_public_key_pem: derived.nodeEncryptionPublicKeyPem,
    metadata: identity.metadata,
  };
}

export class MasterClockSignalReceiver {
  private readonly identity: MasterClockNodeIdentity;
  private readonly dispatchTarget: MasterClockDispatchTarget;
  private readonly maxPastSkewMs: number;
  private readonly maxFutureSkewMs: number;
  private readonly now: () => number;
  private registeredNode?: RegisteredClockNode;

  constructor(options: MasterClockSignalReceiverOptions) {
    this.identity = options.identity;
    this.dispatchTarget = options.dispatchTarget;
    this.registeredNode = options.registeredNode;
    this.maxPastSkewMs = options.maxPastSkewMs ?? 60_000;
    this.maxFutureSkewMs = options.maxFutureSkewMs ?? 5_000;
    this.now = options.now ?? (() => Date.now());
  }

  getNodeId(): string {
    return this.identity.nodeId;
  }

  getIdentity(): MasterClockNodeIdentity {
    return this.identity;
  }

  setRegisteredNode(registeredNode: RegisteredClockNode): void {
    this.registeredNode = registeredNode;
  }

  async receive(signal: MasterClockSignalEnvelope): Promise<MasterClockReceiveResult> {
    const trustPublicKeyPem = normalizePem(
      this.identity.trustedSigningPublicKeyPem || signal.payload.signing_public_key_pem
    );
    const trustMode = this.identity.trustedSigningPublicKeyPem
      ? 'configured'
      : 'envelope_bootstrap';
    const trustedSigningPublicKeyFingerprint = createSigningPublicKeyFingerprint(
      trustPublicKeyPem
    );

    this.verifyEnvelopeSignature(signal, trustPublicKeyPem);

    const plaintext = this.decryptSignal(signal);
    assertEnvelopeMatchesPlaintext(signal, plaintext);
    this.assertIdentityMatch(plaintext);
    this.assertFreshness(plaintext);

    if (this.identity.expectedMasterClockId) {
      const expectedClockId = String(this.identity.expectedMasterClockId).trim();
      if (plaintext.master_clock_id !== expectedClockId) {
        throw new Error('MASTER_CLOCK_ID_MISMATCH');
      }
    }

    if (
      !plaintext.collective_sync.recognized ||
      !plaintext.collective_sync.verifiable ||
      !plaintext.collective_sync.nft_required ||
      !plaintext.collective_sync.attested ||
      !plaintext.collective_sync.certificate_id ||
      !plaintext.collective_sync.certificate_fingerprint
    ) {
      throw new Error('MASTER_CLOCK_COLLECTIVE_SYNC_INVALID');
    }

    this.assertRegisteredNodeAttestation(plaintext);

    const dispatch = await this.dispatchTarget.dispatch(plaintext);
    const ack = this.createAck(plaintext, dispatch);

    return {
      plaintext,
      ack,
      dispatch,
      trustMode,
      trustedSigningPublicKeyFingerprint,
    };
  }

  private verifyEnvelopeSignature(
    signal: MasterClockSignalEnvelope,
    signingPublicKeyPem: string
  ): void {
    if (signal.payload.transport.signature !== 'ed25519') {
      throw new Error('MASTER_CLOCK_SIGNATURE_ALGORITHM_UNSUPPORTED');
    }

    const signable = {
      signal_id: signal.payload.signal_id,
      pulse_id: signal.payload.pulse_id,
      master_clock_id: signal.payload.master_clock_id,
      target_node_id: signal.payload.target_node_id,
      tenant_scope: signal.payload.tenant_scope,
      agency_id: signal.payload.agency_id,
      wallet_address: signal.payload.wallet_address,
      nft_id: signal.payload.nft_id,
      signal_kind: signal.payload.signal_kind,
      issued_at: signal.payload.issued_at,
      expires_at: signal.payload.expires_at,
      clock_state: signal.payload.clock_state,
      stall_defense: signal.payload.stall_defense,
      transport: signal.payload.transport,
      ephemeral_public_key_pem: signal.payload.ephemeral_public_key_pem,
      salt_b64: signal.payload.salt_b64,
      iv_b64: signal.payload.iv_b64,
      auth_tag_b64: signal.payload.auth_tag_b64,
      ciphertext_b64: signal.payload.ciphertext_b64,
      signing_public_key_pem: signal.payload.signing_public_key_pem,
    };

    const verified = verify(
      null,
      Buffer.from(stableStringify(signable)),
      createPublicKey(signingPublicKeyPem),
      Buffer.from(signal.payload.signature_b64, 'base64')
    );

    if (!verified) {
      throw new Error('INVALID_MASTER_CLOCK_SIGNATURE');
    }
  }

  private decryptSignal(signal: MasterClockSignalEnvelope): MasterClockSignalPlaintext {
    if (signal.payload.transport.encryption !== 'x25519-aes-256-gcm') {
      throw new Error('MASTER_CLOCK_ENCRYPTION_ALGORITHM_UNSUPPORTED');
    }

    const sharedSecret = diffieHellman({
      privateKey: createPrivateKey(normalizePem(this.identity.encryptionPrivateKeyPem)),
      publicKey: createPublicKey(normalizePem(signal.payload.ephemeral_public_key_pem)),
    });

    const key = Buffer.from(
      hkdfSync(
        'sha256',
        sharedSecret,
        Buffer.from(signal.payload.salt_b64, 'base64'),
        Buffer.from(`tnf-master-clock:${signal.payload.signal_id}`),
        32
      )
    );

    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(signal.payload.iv_b64, 'base64')
    );
    decipher.setAuthTag(Buffer.from(signal.payload.auth_tag_b64, 'base64'));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(signal.payload.ciphertext_b64, 'base64')),
      decipher.final(),
    ]).toString('utf8');

    return JSON.parse(plaintext) as MasterClockSignalPlaintext;
  }

  private assertIdentityMatch(plaintext: MasterClockSignalPlaintext): void {
    if (plaintext.target_node_id !== this.identity.nodeId) {
      throw new Error('MASTER_CLOCK_TARGET_NODE_MISMATCH');
    }
    if (plaintext.wallet_address !== this.identity.walletAddress) {
      throw new Error('MASTER_CLOCK_WALLET_MISMATCH');
    }
    if (plaintext.nft_id !== this.identity.nftId) {
      throw new Error('MASTER_CLOCK_NFT_MISMATCH');
    }
    if (plaintext.tenant_scope !== this.identity.tenantScope) {
      throw new Error('MASTER_CLOCK_TENANT_SCOPE_MISMATCH');
    }
    if (this.identity.agencyId && plaintext.agency_id !== this.identity.agencyId) {
      throw new Error('MASTER_CLOCK_AGENCY_MISMATCH');
    }
  }

  private assertFreshness(plaintext: MasterClockSignalPlaintext): void {
    const now = this.now();
    const issuedAtMs = asTimestamp(plaintext.issued_at, 'MASTER_CLOCK_ISSUED_AT_INVALID');
    const expiresAtMs = asTimestamp(plaintext.expires_at, 'MASTER_CLOCK_EXPIRES_AT_INVALID');

    if (issuedAtMs > now + this.maxFutureSkewMs) {
      throw new Error('MASTER_CLOCK_SIGNAL_FROM_FUTURE');
    }
    if (expiresAtMs < now - this.maxPastSkewMs) {
      throw new Error('MASTER_CLOCK_SIGNAL_EXPIRED');
    }
    if (expiresAtMs <= issuedAtMs) {
      throw new Error('MASTER_CLOCK_SIGNAL_WINDOW_INVALID');
    }
  }

  private createAck(
    plaintext: MasterClockSignalPlaintext,
    dispatch: MasterClockDispatchResult
  ): SignalAckRequest {
    const request: Omit<SignalAckRequest, 'signature_b64'> = {
      signal_id: plaintext.signal_id,
      node_id: this.identity.nodeId,
      wallet_address: this.identity.walletAddress,
      nft_id: this.identity.nftId,
      synchronized_at: new Date(this.now()).toISOString(),
      sub_director_status: dispatch.subDirectorStatus,
      metadata: {
        pulse_id: plaintext.pulse_id,
        master_clock_id: plaintext.master_clock_id,
        tenant_scope: plaintext.tenant_scope,
        stall_defense_required: plaintext.stall_defense.required,
        certificate_id: plaintext.collective_sync.certificate_id,
        certificate_fingerprint: plaintext.collective_sync.certificate_fingerprint,
        ...(dispatch.metadata || {}),
      },
    };

    return {
      ...request,
      signature_b64: createMasterClockAckSignature(
        request,
        this.identity.signingPrivateKeyPem
      ),
    };
  }

  private assertRegisteredNodeAttestation(plaintext: MasterClockSignalPlaintext): void {
    if (!this.registeredNode) {
      return;
    }

    if (!verifyClockNodeCertificate(this.registeredNode.certificate, this.identity.trustedSigningPublicKeyPem)) {
      throw new Error('MASTER_CLOCK_NODE_CERTIFICATE_INVALID');
    }
    if (Date.parse(this.registeredNode.certificate.claims.expires_at) <= this.now()) {
      throw new Error('MASTER_CLOCK_NODE_CERTIFICATE_EXPIRED');
    }

    const derived = deriveClockNodePublicKeys({
      signingPrivateKeyPem: this.identity.signingPrivateKeyPem,
      encryptionPrivateKeyPem: this.identity.encryptionPrivateKeyPem,
    });

    if (this.registeredNode.node_id !== this.identity.nodeId) {
      throw new Error('MASTER_CLOCK_REGISTERED_NODE_MISMATCH');
    }
    if (this.registeredNode.wallet_address !== this.identity.walletAddress) {
      throw new Error('MASTER_CLOCK_REGISTERED_WALLET_MISMATCH');
    }
    if (this.registeredNode.nft_id !== this.identity.nftId) {
      throw new Error('MASTER_CLOCK_REGISTERED_NFT_MISMATCH');
    }
    if (
      createSigningPublicKeyFingerprint(this.registeredNode.node_signing_public_key_pem) !==
      createSigningPublicKeyFingerprint(derived.nodeSigningPublicKeyPem)
    ) {
      throw new Error('MASTER_CLOCK_REGISTERED_SIGNING_KEY_MISMATCH');
    }
    if (
      createSigningPublicKeyFingerprint(this.registeredNode.node_encryption_public_key_pem) !==
      createSigningPublicKeyFingerprint(derived.nodeEncryptionPublicKeyPem)
    ) {
      throw new Error('MASTER_CLOCK_REGISTERED_ENCRYPTION_KEY_MISMATCH');
    }
    if (
      plaintext.collective_sync.certificate_id !==
      this.registeredNode.certificate.claims.certificate_id
    ) {
      throw new Error('MASTER_CLOCK_CERTIFICATE_ID_MISMATCH');
    }
    if (
      plaintext.collective_sync.certificate_fingerprint !==
      this.registeredNode.certificate.certificate_fingerprint
    ) {
      throw new Error('MASTER_CLOCK_CERTIFICATE_FINGERPRINT_MISMATCH');
    }
  }
}

export function createSigningPublicKeyFingerprint(signingPublicKeyPem: string): string {
  const canonicalDer = createPublicKey(normalizePem(signingPublicKeyPem)).export({
    type: 'spki',
    format: 'der',
  });
  return createHash('sha256').update(Buffer.from(canonicalDer)).digest('hex');
}

export function createClockNodeCertificateFingerprint(
  certificate: Pick<
    ClockNodeCertificate,
    'claims' | 'signature_algorithm' | 'issuer_signing_public_key_pem' | 'signature_b64'
  >
): string {
  const canonicalClaims = canonicalizeClockNodeCertificateClaims(certificate.claims);
  return createHash('sha256')
    .update(
      stableStringify({
        claims: canonicalClaims,
        signature_algorithm: certificate.signature_algorithm,
        issuer_signing_public_key_pem: certificate.issuer_signing_public_key_pem,
        signature_b64: certificate.signature_b64,
      })
    )
    .digest('hex');
}

export function verifyClockNodeCertificate(
  certificate: ClockNodeCertificate,
  trustedSigningPublicKeyPem?: string
): boolean {
  const verificationKeyPem =
    normalizePem(trustedSigningPublicKeyPem || certificate.issuer_signing_public_key_pem);
  if (certificate.signature_algorithm !== 'ed25519') {
    return false;
  }
  if (
    createClockNodeCertificateFingerprint(certificate) !== certificate.certificate_fingerprint
  ) {
    return false;
  }
  return verify(
    null,
    Buffer.from(stableStringify(canonicalizeClockNodeCertificateClaims(certificate.claims))),
    createPublicKey(verificationKeyPem),
    Buffer.from(certificate.signature_b64, 'base64')
  );
}

function canonicalizeClockNodeCertificateClaims(claims: ClockNodeCertificate['claims']) {
  return {
    certificate_id: claims.certificate_id,
    issued_at: claims.issued_at,
    expires_at: claims.expires_at,
    master_clock_id: claims.master_clock_id,
    issuer: claims.issuer,
    node_id: claims.node_id,
    tenant_scope: claims.tenant_scope,
    wallet_address: claims.wallet_address,
    nft_id: claims.nft_id,
    agency_id: claims.agency_id,
    collective_access: claims.collective_access,
    node_signing_public_key_pem: claims.node_signing_public_key_pem,
    node_encryption_public_key_pem: claims.node_encryption_public_key_pem,
  };
}
