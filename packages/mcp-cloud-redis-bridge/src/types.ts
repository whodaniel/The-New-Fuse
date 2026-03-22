export interface SignalTransport {
  encryption: 'x25519-aes-256-gcm';
  signature: 'ed25519';
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
  tenant_scope: string;
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
    recognized: boolean;
    verifiable: boolean;
    nft_required: boolean;
    certificate_id?: string;
    certificate_fingerprint?: string;
    attested?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface MasterClockSignalEnvelope {
  trace_id: string;
  node_id: string;
  status: 'ok' | 'error';
  confidence: number;
  payload: {
    signal_id: string;
    pulse_id: string;
    master_clock_id: string;
    target_node_id: string;
    tenant_scope: string;
    wallet_address: string;
    nft_id: string;
    signal_kind: string;
    issued_at: string;
    expires_at: string;
    clock_state: PulseSnapshot;
    stall_defense: {
      required: boolean;
      window_ms: number;
    };
    transport: SignalTransport;
    ephemeral_public_key_pem: string;
    salt_b64: string;
    iv_b64: string;
    auth_tag_b64: string;
    ciphertext_b64: string;
    signature_b64: string;
    signing_public_key_pem: string;
  };
  errors: string[];
  next_action: string;
}

export interface SignalAckRequest {
  signal_id: string;
  node_id: string;
  wallet_address: string;
  nft_id: string;
  synchronized_at: string;
  sub_director_status: string;
  signature_b64: string;
  metadata?: Record<string, unknown>;
}

export interface TNFEnvelope {
  id: string;
  type: string;
  source: string;
  channel: string;
  payload: any;
  timestamp: number;
  sig?: string;
  traceId?: string;
}
