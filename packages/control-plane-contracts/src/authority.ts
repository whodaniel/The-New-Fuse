/**
 * Agent authority contracts — trust roots and capability grants.
 *
 * Public API surface (DIRECTIVES.md D23). These types are deliberately open:
 * the security of this design rests on key custody, never on the secrecy of the
 * code. Anything that would be weakened by publication does not belong here.
 *
 * Two implementations are expected to satisfy `TrustRootProvider`:
 *   - open runtime  — local providers (file, os-keystore, separate-uid, tpm2,
 *                     fido2/pkcs11, secure-enclave). Fully functional standalone;
 *                     no dependency on the control plane existing.
 *   - control plane — the proprietary hosted root ('remote-attestation').
 *
 * @see docs/REPO_SEPARATION.md
 */

// ============================================================================
// TRUST ROOTS
// ============================================================================

/**
 * Where the operator's root signing key lives.
 *
 * TNF probes these at startup and selects the strongest available, so the same
 * build adapts to a Linux server, a container, an Apple Silicon Mac, or a 2015
 * Intel Mac without configuration.
 */
export type TrustRootKind =
  /** Apple T2 / Apple Silicon. Non-exportable, optionally biometric-gated. */
  | 'secure-enclave'
  /** TPM 2.0 on Linux/Windows. Non-exportable. */
  | 'tpm2'
  /** FIDO2 token (YubiKey, SoloKey). Portable across every OS; touch per signature. */
  | 'fido2'
  /** PKCS#11 smartcard / HSM. */
  | 'pkcs11'
  /** Agents run under a different OS user; the kernel enforces file permissions. */
  | 'separate-uid'
  /** macOS Keychain, Linux Secret Service, Windows Credential Manager. */
  | 'os-keystore'
  /** Plain file on disk. Universal fallback. Provides NO boundary against a
   *  same-uid process — it exists so TNF runs everywhere, not to be trusted. */
  | 'file'
  /** Hosted attestation provided by the proprietary control plane. */
  | 'remote-attestation';

/**
 * What a trust root actually guarantees.
 *
 * Every field is deliberately phrased so that `false` is the weak answer, and a
 * provider must state its weaknesses rather than omit them. Callers decide
 * policy from these booleans, never from `kind` — that keeps a new provider from
 * silently inheriting trust it has not earned.
 */
export interface TrustRootGuarantee {
  /** Can a process running as the same OS user read the private key? */
  keyReadableBySameUid: boolean;
  /** Is the key held in hardware that cannot export it? */
  hardwareBound: boolean;
  /** Does each signature require a physical human action (touch, biometric)? */
  requiresHumanPresence: boolean;
  /** Does the root survive full compromise of an agent process? */
  survivesAgentCompromise: boolean;
}

/** Result of probing one provider in the current environment. */
export interface TrustRootDescriptor {
  kind: TrustRootKind;
  available: boolean;
  guarantee: TrustRootGuarantee;
  /**
   * One line shown to operators. MUST name the weakness when there is one —
   * e.g. "plain file; any process running as this user can read it".
   */
  summary: string;
  /** Required when `available` is false. e.g. "no Secure Enclave on this hardware". */
  unavailableReason?: string;
  /** Free-form provider detail (token serial, TPM version, uid). Never secrets. */
  detail?: Record<string, unknown>;
}

/**
 * Preference order, strongest first.
 *
 * Selection is by *guarantee*, not by position — this array only breaks ties
 * between providers whose guarantees are otherwise equal. `file` is last and is
 * the only entry expected to report `survivesAgentCompromise: false`.
 */
export const TRUST_ROOT_PREFERENCE: readonly TrustRootKind[] = Object.freeze([
  'fido2',
  'secure-enclave',
  'tpm2',
  'pkcs11',
  'remote-attestation',
  'separate-uid',
  'os-keystore',
  'file',
]);

export interface TrustRootPublicKey {
  /** Multibase `did:key:z…` identifying this root. */
  did: string;
  /** SPKI PEM, for verifiers that want the raw key. */
  publicKeyPem: string;
  algorithm: 'Ed25519' | 'ES256';
}

/** Context recorded alongside a signature, for audit. Never contains secrets. */
export interface TrustRootSignContext {
  /** What is being authorized, in operator-readable words. */
  purpose: string;
  /** Correlates with the grant request this signature answers. */
  requestId?: string;
}

export interface TrustRootSignature {
  signature: string;
  algorithm: 'Ed25519' | 'ES256';
  signedAt: string;
  rootDid: string;
}

/**
 * A source of operator authority.
 *
 * Implementations must never silently downgrade. If the intended root is
 * unavailable, `probe()` reports it unavailable with a reason; choosing a weaker
 * root is the caller's explicit decision, made visible to the operator.
 */
export interface TrustRootProvider {
  readonly kind: TrustRootKind;
  /** Cheap, side-effect-free availability check for this environment. */
  probe(): Promise<TrustRootDescriptor>;
  getPublicKey(): Promise<TrustRootPublicKey>;
  /** May block on human presence (touch/biometric) depending on the provider. */
  sign(payload: Uint8Array, context: TrustRootSignContext): Promise<TrustRootSignature>;
}

// ============================================================================
// CAPABILITY GRANTS (UCAN-shaped)
// ============================================================================

/**
 * One capability being delegated.
 *
 * `can` uses TNF's existing plain-language capability vocabulary from agent
 * frontmatter (`lane_coordination`, `prompt_injection`, `master_clock_control`,
 * …) rather than a parallel taxonomy, so a grant reads the same way the staffing
 * and orchestration docs already do.
 */
export interface CapabilityAttenuation {
  /** Resource this applies to, e.g. `agent:sub-director`, `fs:/repo`, `net:api.example.com`. */
  with: string;
  /** Action, from the plain-language capability vocabulary. */
  can: string;
  /** Optional narrowing conditions (path prefix, host allowlist, max bytes). */
  conditions?: Record<string, unknown>;
}

/**
 * A signed, expiring, delegable capability grant.
 *
 * UCAN-shaped so delegation chains and offline verification work without a
 * central authority: a holder may sub-delegate a strict SUBSET of what it holds
 * by issuing a new grant whose `prf` cites this one. Attenuation is enforced by
 * the verifier — a chain can only ever narrow, never widen.
 */
export interface CapabilityGrant {
  /** Issuer DID. The operator root for a first-link grant. */
  iss: string;
  /** Audience DID — the agent receiving the capability. */
  aud: string;
  /** What is granted. Empty means nothing is granted. */
  att: CapabilityAttenuation[];
  /** Expiry, epoch seconds. Grants are short-lived by policy, not convention. */
  exp: number;
  /** Not-before, epoch seconds. */
  nbf?: number;
  /** Nonce — makes each grant single-use and replay-detectable. */
  nnc: string;
  /** Proof chain: grants this one derives from. Empty/absent for a root grant. */
  prf?: string[];
  /** Task this grant is bound to. A grant valid for any task is not scoped. */
  boundTask?: string;
  /** Operator-facing reason, recorded in the audit log. */
  purpose?: string;
}

/** A grant plus its detached signature, as transmitted. */
export interface SignedCapabilityGrant {
  grant: CapabilityGrant;
  signature: string;
  algorithm: 'Ed25519' | 'ES256';
}

export type GrantVerdict = 'valid' | 'expired' | 'not-yet-valid' | 'replayed'
  | 'signature-invalid' | 'chain-broken' | 'exceeds-parent' | 'unknown-issuer'
  | 'task-mismatch' | 'malformed';

export interface GrantVerificationResult {
  verdict: GrantVerdict;
  /** True only when verdict === 'valid'. Never infer authority from anything else. */
  authorized: boolean;
  /** Capabilities that actually survived chain attenuation. */
  effective: CapabilityAttenuation[];
  /** DIDs walked, root first. */
  chain: string[];
  reason?: string;
}

// ============================================================================
// APPROVAL CHANNEL
// ============================================================================

/**
 * An agent's request for elevation, awaiting a human decision.
 *
 * The requesting agent must not be able to reach the approval side of this
 * interface — that separation is what makes an approval real rather than
 * self-certified (see CHALLENGE_RATIONALE_LOG.md, 2026-07-21).
 */
export interface ElevationRequest {
  requestId: string;
  /** DID of the requesting agent, proven by an identity-bound signature. */
  requesterDid: string;
  /** Operator-owned role at request time — never a self-asserted title. */
  requesterRole: string;
  requested: CapabilityAttenuation[];
  boundTask?: string;
  /** Why the agent says it needs this. Untrusted input — display, don't act on it. */
  justification: string;
  requestedAt: string;
  /** Risk tier per DIRECTIVES.md D8. `executive` requires dual-key co-signature. */
  tier: 'tactical' | 'operational' | 'executive';
}

export interface ElevationDecision {
  requestId: string;
  decision: 'approved' | 'denied';
  decidedAt: string;
  /** Which trust root authorized this. Recorded so weak roots are visible in audit. */
  rootKind: TrustRootKind;
  /** Present when approved. May grant LESS than requested, never more. */
  grant?: SignedCapabilityGrant;
  /** Second signature for `executive` tier. */
  coSignature?: TrustRootSignature;
  reason?: string;
}

/**
 * Implemented locally by the open runtime (CLI + local trust root) and by the
 * proprietary control plane for hosted deployments. Both satisfy the same
 * contract, so the open runtime never depends on the hosted side existing.
 */
export interface ElevationBroker {
  submit(request: ElevationRequest): Promise<{ requestId: string }>;
  pending(): Promise<ElevationRequest[]>;
  /** Operator-side. Must be unreachable from a requesting agent's context. */
  decide(requestId: string, decision: ElevationDecision): Promise<void>;
  await(requestId: string, timeoutMs: number): Promise<ElevationDecision | null>;
}

// ============================================================================
// CREDENTIAL BROKER
// ============================================================================

/**
 * A named, pre-declared action that touches a secret the agent must never see.
 *
 * The broker performs the action on the agent's behalf: it pulls the secret
 * from the OS keystore, runs the action with the secret injected out of band,
 * and returns ONLY the result. The agent gets an answer, never a credential.
 * This is the whole reason the broker exists — an agent that never holds a
 * secret cannot leak, log, or exfiltrate one.
 *
 * Actions are declared by the operator, not requested ad hoc. An agent may only
 * invoke actions that already exist in the registry, so the blast radius is a
 * fixed, reviewable list rather than "whatever the agent asks for".
 */
export interface BrokerAction {
  /** Stable id an agent names to invoke, e.g. `mail.list-unread`. */
  name: string;
  /** Capability the caller's grant must hold: `account:<name>`. */
  requiredCapability: string;
  /**
   * Read-only actions cannot change external state. Only these run in phase 4a;
   * mutating actions stay declared-but-refused until the trust root is a real
   * boundary and per-action operator confirmation is wired.
   */
  readOnly: boolean;
  /** Keystore reference for the secret this action needs. Resolved by the broker. */
  secretRef: { service: string; account?: string };
  /** Human description shown when an agent lists what it may do. */
  description?: string;
}

export type BrokerRefusalReason =
  | 'unknown-action'
  | 'capability-missing'
  | 'grant-invalid'
  | 'mutating-action-disabled'
  | 'trust-root-too-weak'
  | 'secret-unavailable'
  | 'operator-confirmation-required';

export interface BrokerResult {
  ok: boolean;
  action: string;
  /** Present on success. Guaranteed scrubbed of the secret value. */
  output?: string;
  refusal?: BrokerRefusalReason;
  reason?: string;
  /** The trust root in force when this ran, recorded for audit. */
  rootKind?: TrustRootKind;
}

/**
 * Implemented locally by the open runtime against the OS keystore, and by the
 * proprietary control plane for hosted secrets. Both satisfy the same contract.
 *
 * `invoke` must fail closed on every path and must never place a secret in its
 * return value, its logs, or an exception message.
 */
export interface CredentialBroker {
  /** Actions the given grant is allowed to invoke. Safe to expose to an agent. */
  listAllowed(signedGrant: SignedCapabilityGrant): Promise<BrokerAction[]>;
  invoke(
    actionName: string,
    args: Record<string, unknown>,
    signedGrant: SignedCapabilityGrant
  ): Promise<BrokerResult>;
}
