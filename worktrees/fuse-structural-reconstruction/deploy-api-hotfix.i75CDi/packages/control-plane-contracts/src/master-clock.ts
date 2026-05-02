export type TenantScope = 'tnf' | 'agency' | 'user' | 'local';

export interface ClockNodeCertificateClaims {
  certificate_id: string;
  issued_at: string;
  expires_at: string;
  master_clock_id: string;
  issuer: 'master-clock-central';
  node_id: string;
  tenant_scope: TenantScope;
  wallet_address: string;
  nft_id: string;
  agency_id?: string;
  collective_access: true;
  node_signing_public_key_pem: string;
  node_encryption_public_key_pem: string;
}

export interface ClockNodeCertificate {
  claims: ClockNodeCertificateClaims;
  signature_algorithm: 'ed25519';
  issuer_signing_public_key_pem: string;
  signature_b64: string;
  certificate_fingerprint: string;
}

export interface RegisterClockNodeRequest {
  node_id: string;
  tenant_scope: TenantScope;
  wallet_address: string;
  nft_id: string;
  agency_id?: string;
  label?: string;
  collective_access?: boolean;
  status?: 'active' | 'paused';
  node_signing_public_key_pem: string;
  node_encryption_public_key_pem: string;
  metadata?: Record<string, unknown>;
}

export interface RegisteredClockNode extends RegisterClockNodeRequest {
  collective_access: boolean;
  status: 'active' | 'paused';
  certificate: ClockNodeCertificate;
  registered_at: string;
}

export interface PulseSnapshot {
  pulse_number: number;
  interval_ms: number;
  epoch_started_at: string;
  next_pulse_at: string;
}

export interface MasterClockSignalPlaintext {
  signal_id: string;
  pulse_id: string;
  master_clock_id: string;
  target_node_id: string;
  tenant_scope: TenantScope;
  agency_id?: string;
  wallet_address: string;
  nft_id: string;
  signal_kind: 'master_heartbeat';
  issued_at: string;
  expires_at: string;
  clock_state: PulseSnapshot;
  stall_defense: {
    required: boolean;
    window_ms: number;
  };
  collective_sync: {
    recognized: true;
    verifiable: true;
    nft_required: true;
    certificate_id: string;
    certificate_fingerprint: string;
    attested: true;
  };
  metadata?: Record<string, unknown>;
}

export interface MasterClockSignalEnvelope {
  trace_id: string;
  node_id: 'master-clock-central';
  status: 'ok' | 'partial' | 'blocked';
  confidence: number;
  payload: {
    signal_id: string;
    pulse_id: string;
    master_clock_id: string;
    target_node_id: string;
    tenant_scope: TenantScope;
    agency_id?: string;
    wallet_address: string;
    nft_id: string;
    signal_kind: 'master_heartbeat';
    issued_at: string;
    expires_at: string;
    clock_state: PulseSnapshot;
    transport: {
      encryption: 'x25519-aes-256-gcm';
      signature: 'ed25519';
    };
    ephemeral_public_key_pem: string;
    salt_b64: string;
    iv_b64: string;
    auth_tag_b64: string;
    ciphertext_b64: string;
    signature_b64: string;
    signing_public_key_pem: string;
    stall_defense: {
      required: boolean;
      window_ms: number;
    };
  };
  errors: Array<{
    code: string;
    message: string;
    retryable?: boolean;
  }>;
  next_action: string;
}

export interface SignalAckRequest {
  signal_id: string;
  node_id: string;
  wallet_address: string;
  nft_id: string;
  synchronized_at: string;
  sub_director_status: 'received' | 'stall_defense_engaged' | 'ignored';
  metadata?: Record<string, unknown>;
  signature_b64: string;
}

export interface SignalAckRecord extends SignalAckRequest {
  verified: boolean;
  recorded_at: string;
}

export interface MasterClockHealthResponse {
  status: string;
  clock_id: string;
  trust_mode: 'configured' | 'ephemeral_bootstrap';
  pulse: PulseSnapshot;
  registered_nodes: number;
  latest_signal_count: number;
  ack_count: number;
}

export interface IssueSignalRequest {
  node_id?: string;
  stall_defense_required?: boolean;
  metadata?: Record<string, unknown>;
}

export interface BroadcastSignalsRequest {
  tenant_scope?: TenantScope;
  agency_id?: string;
  stall_defense_required?: boolean;
  metadata?: Record<string, unknown>;
}
