#!/usr/bin/env node

/**
 * TNF Trust Root Providers — environment-adaptive operator authority.
 *
 * Implements `TrustRootProvider` from @the-new-fuse/control-plane-contracts
 * (packages/control-plane-contracts/src/authority.ts) for the OPEN runtime.
 * The proprietary control plane implements the same contract for its hosted
 * 'remote-attestation' root; nothing here depends on that existing.
 *
 * TNF must run out of the box on a Linux server, in a container, on Apple
 * Silicon, or on a 2015 Intel Mac. So the root is probed, not configured: each
 * provider reports what it can actually guarantee in THIS environment, and the
 * strongest real one wins.
 *
 * Honesty rules this module follows (see DIRECTIVES.md D23, and the
 * no-simulated-functionality tenet):
 *
 *  1. `available: true` means signing genuinely works here — never "the
 *     hardware exists." A detected-but-unimplemented backend reports
 *     `available: false` with `detail.hardwarePresent`, so an operator learns
 *     they could be stronger without being told they already are.
 *  2. Guarantees are reported per-provider and are phrased so `false` is the
 *     weak answer. `file` says outright that it is not a boundary.
 *  3. No silent downgrade. Selecting a weaker root than intended is the
 *     caller's explicit choice and is surfaced.
 */

'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const AUTHORITY_DIR =
  process.env.TNF_AUTHORITY_DIR || path.join(os.homedir(), '.tnf', 'authority');
const OPERATOR_KEY_PATH =
  process.env.TNF_OPERATOR_KEY_PATH || path.join(AUTHORITY_DIR, 'operator.ed25519');
const OPERATOR_PUB_PATH = `${OPERATOR_KEY_PATH}.pub`;

/** Mirrors TRUST_ROOT_PREFERENCE in the contracts package. */
const TRUST_ROOT_PREFERENCE = Object.freeze([
  'fido2',
  'secure-enclave',
  'tpm2',
  'pkcs11',
  'remote-attestation',
  'separate-uid',
  'os-keystore',
  'file',
]);

/** Weakest possible guarantee — the honest default a provider must improve on. */
function noGuarantee() {
  return {
    keyReadableBySameUid: true,
    hardwareBound: false,
    requiresHumanPresence: false,
    survivesAgentCompromise: false,
  };
}

/**
 * Ranks a guarantee. Higher is stronger. Used to pick a root by what it
 * actually provides rather than by its name.
 */
function guaranteeScore(g) {
  let score = 0;
  if (!g.keyReadableBySameUid) score += 4;
  if (g.hardwareBound) score += 3;
  if (g.requiresHumanPresence) score += 3;
  if (g.survivesAgentCompromise) score += 2;
  return score;
}

function commandExists(bin) {
  try {
    execFileSync('command', ['-v', bin], { stdio: 'ignore', shell: '/bin/sh' });
    return true;
  } catch {
    return false;
  }
}

function tryExec(bin, args, timeoutMs = 4000) {
  try {
    return execFileSync(bin, args, { encoding: 'utf8', timeout: timeoutMs, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

// ============================================================================
// file — universal fallback, no boundary
// ============================================================================

const fileProvider = {
  kind: 'file',

  async probe() {
    return {
      kind: 'file',
      available: true,
      guarantee: noGuarantee(),
      summary:
        'Plain file on disk (0600). Runs everywhere, but ANY process running as ' +
        'this user can read the key — this is not a security boundary.',
      detail: { keyPath: OPERATOR_KEY_PATH, exists: fs.existsSync(OPERATOR_KEY_PATH) },
    };
  },

  async getPublicKey() {
    ensureOperatorKey();
    const pem = fs.readFileSync(OPERATOR_PUB_PATH, 'utf8');
    return { did: didKeyFromPem(pem), publicKeyPem: pem, algorithm: 'Ed25519' };
  },

  async sign(payload, context) {
    ensureOperatorKey();
    const priv = crypto.createPrivateKey(fs.readFileSync(OPERATOR_KEY_PATH, 'utf8'));
    const sig = crypto.sign(null, Buffer.from(payload), priv);
    const pub = fs.readFileSync(OPERATOR_PUB_PATH, 'utf8');
    return {
      signature: sig.toString('base64'),
      algorithm: 'Ed25519',
      signedAt: new Date().toISOString(),
      rootDid: didKeyFromPem(pub),
      context: context?.purpose ?? null,
    };
  },
};

function ensureOperatorKey() {
  fs.mkdirSync(AUTHORITY_DIR, { recursive: true, mode: 0o700 });
  if (fs.existsSync(OPERATOR_KEY_PATH) && fs.existsSync(OPERATOR_PUB_PATH)) return;
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  fs.writeFileSync(OPERATOR_KEY_PATH, privateKey.export({ type: 'pkcs8', format: 'pem' }), {
    mode: 0o600,
  });
  fs.writeFileSync(OPERATOR_PUB_PATH, publicKey.export({ type: 'spki', format: 'pem' }), {
    mode: 0o644,
  });
}

/**
 * did:key for an Ed25519 SPKI PEM (multicodec 0xed01 + multibase base58btc 'z').
 */
function didKeyFromPem(pem) {
  const raw = crypto.createPublicKey(pem).export({ type: 'spki', format: 'der' });
  // Ed25519 SPKI DER is a fixed 44 bytes; the raw 32-byte key is the tail.
  const key = raw.subarray(raw.length - 32);
  return `did:key:z${base58btc(Buffer.concat([Buffer.from([0xed, 0x01]), key]))}`;
}

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58btc(buf) {
  let num = BigInt(`0x${buf.toString('hex')}`);
  let out = '';
  const base = 58n;
  while (num > 0n) {
    out = B58[Number(num % base)] + out;
    num /= base;
  }
  for (const byte of buf) {
    if (byte === 0) out = `1${out}`;
    else break;
  }
  return out;
}

// ============================================================================
// Detected-only backends
// ============================================================================
//
// These report hardware presence honestly without claiming to be usable.
// Implementing sign() for any of them is a strict upgrade and requires no
// change to callers — that is the point of the provider interface.

function detectedOnly(kind, { hardwarePresent, guarantee, presentSummary, absentReason, detail }) {
  return {
    kind,
    available: false,
    guarantee: guarantee || noGuarantee(),
    summary: hardwarePresent ? presentSummary : `${kind}: not available in this environment`,
    unavailableReason: hardwarePresent
      ? `${kind} detected but signing is not implemented yet — implement sign() to use it`
      : absentReason,
    detail: { hardwarePresent: Boolean(hardwarePresent), implemented: false, ...(detail || {}) },
  };
}

const secureEnclaveProvider = {
  kind: 'secure-enclave',
  async probe() {
    if (process.platform !== 'darwin') {
      return detectedOnly('secure-enclave', {
        hardwarePresent: false,
        absentReason: 'Secure Enclave is macOS-only',
      });
    }
    // Apple Silicon always has it; Intel needs a T1/T2 bridge chip.
    const model = (tryExec('sysctl', ['-n', 'hw.model']) || '').trim();
    const arch = process.arch;
    const hasBridge = tryExec('system_profiler', ['SPiBridgeDataType']) || '';
    const present = arch === 'arm64' || /Apple T[12]/i.test(hasBridge);
    return detectedOnly('secure-enclave', {
      hardwarePresent: present,
      guarantee: {
        keyReadableBySameUid: false,
        hardwareBound: true,
        requiresHumanPresence: true,
        survivesAgentCompromise: true,
      },
      presentSummary: 'Apple Secure Enclave: non-exportable key, biometric-gated',
      absentReason: `no Secure Enclave on this hardware (${model || arch}) — pre-T1/T2 Intel Mac`,
      detail: { model, arch },
    });
  },
};

const fido2Provider = {
  kind: 'fido2',
  async probe() {
    // ssh-keygen gained -t ed25519-sk in OpenSSH 8.2. A token must also be present.
    const sshKeygen = commandExists('ssh-keygen');
    const usbInfo =
      process.platform === 'darwin' ? tryExec('system_profiler', ['SPUSBDataType']) || '' : '';
    const tokenPresent = /yubi|fido|nitrokey|solokey|onlykey/i.test(usbInfo);
    return detectedOnly('fido2', {
      hardwarePresent: sshKeygen && tokenPresent,
      guarantee: {
        keyReadableBySameUid: false,
        hardwareBound: true,
        requiresHumanPresence: true,
        survivesAgentCompromise: true,
      },
      presentSummary:
        'FIDO2 security token: physical touch required per signature — an agent cannot sign unattended',
      absentReason: tokenPresent
        ? 'ssh-keygen not found'
        : 'no FIDO2 token detected (works on any machine — an external token is the strongest option on hardware without a Secure Enclave)',
      detail: { sshKeygen, tokenPresent },
    });
  },
};

const tpm2Provider = {
  kind: 'tpm2',
  async probe() {
    const devPresent = fs.existsSync('/dev/tpm0') || fs.existsSync('/dev/tpmrm0');
    return detectedOnly('tpm2', {
      hardwarePresent: devPresent,
      guarantee: {
        keyReadableBySameUid: false,
        hardwareBound: true,
        requiresHumanPresence: false,
        survivesAgentCompromise: true,
      },
      presentSummary: 'TPM 2.0: non-exportable key',
      absentReason:
        process.platform === 'darwin' ? 'TPM is not present on macOS' : 'no /dev/tpm0 or /dev/tpmrm0',
      detail: { platform: process.platform },
    });
  },
};

const separateUidProvider = {
  kind: 'separate-uid',
  async probe() {
    const agentUser = process.env.TNF_AGENT_USER || 'tnf-agent';
    const exists = tryExec('id', ['-u', agentUser]) !== null;
    const selfUid = typeof process.getuid === 'function' ? process.getuid() : null;
    return detectedOnly('separate-uid', {
      hardwarePresent: exists,
      guarantee: {
        // The kernel, not a convention, keeps the agent out of the key file.
        keyReadableBySameUid: false,
        hardwareBound: false,
        requiresHumanPresence: false,
        survivesAgentCompromise: true,
      },
      presentSummary: `Dedicated agent account "${agentUser}" exists: kernel-enforced file boundary`,
      absentReason: `no dedicated agent account (looked for "${agentUser}") — creating one makes 0600 on the operator key a real boundary, at no hardware cost`,
      detail: { agentUser, selfUid },
    });
  },
};

const osKeystoreProvider = {
  kind: 'os-keystore',
  async probe() {
    const present =
      (process.platform === 'darwin' && commandExists('security')) ||
      (process.platform === 'linux' && commandExists('secret-tool'));
    return detectedOnly('os-keystore', {
      hardwarePresent: present,
      guarantee: {
        keyReadableBySameUid: true, // same-uid processes can drive the keystore
        hardwareBound: false,
        requiresHumanPresence: true,
        survivesAgentCompromise: false,
      },
      presentSummary: 'OS keystore available: password-gated, but reachable by same-uid processes',
      absentReason: 'no supported OS keystore CLI found',
      detail: { platform: process.platform },
    });
  },
};

const remoteAttestationProvider = {
  kind: 'remote-attestation',
  async probe() {
    const endpoint = process.env.TNF_CONTROL_PLANE_URL || '';
    return detectedOnly('remote-attestation', {
      hardwarePresent: false,
      absentReason: endpoint
        ? 'control plane configured but the hosted root is proprietary and not bundled with the open runtime'
        : 'no control plane configured (TNF_CONTROL_PLANE_URL unset) — open runtime is fully functional without it',
      detail: { configured: Boolean(endpoint) },
    });
  },
};

const PROVIDERS = [
  fido2Provider,
  secureEnclaveProvider,
  tpm2Provider,
  remoteAttestationProvider,
  separateUidProvider,
  osKeystoreProvider,
  fileProvider,
];

// ============================================================================
// SELECTION
// ============================================================================

async function probeAll() {
  const out = [];
  for (const p of PROVIDERS) {
    try {
      out.push(await p.probe());
    } catch (err) {
      out.push({
        kind: p.kind,
        available: false,
        guarantee: noGuarantee(),
        summary: `${p.kind}: probe failed`,
        unavailableReason: err.message,
      });
    }
  }
  return out;
}

/**
 * Pick the strongest *usable* root.
 *
 * Ranked by guarantee, with TRUST_ROOT_PREFERENCE breaking ties only. Returns
 * the chosen provider plus every descriptor, so callers can show the operator
 * what was available and what was not.
 */
async function selectTrustRoot() {
  const descriptors = await probeAll();
  const usable = descriptors.filter((d) => d.available);
  usable.sort((a, b) => {
    const byGuarantee = guaranteeScore(b.guarantee) - guaranteeScore(a.guarantee);
    if (byGuarantee !== 0) return byGuarantee;
    return TRUST_ROOT_PREFERENCE.indexOf(a.kind) - TRUST_ROOT_PREFERENCE.indexOf(b.kind);
  });

  const chosen = usable[0];
  const provider = PROVIDERS.find((p) => p.kind === chosen?.kind) || fileProvider;
  return {
    provider,
    descriptor: chosen || (await fileProvider.probe()),
    all: descriptors,
    /** True when the selected root cannot survive an agent compromise. */
    degraded: !chosen || !chosen.guarantee.survivesAgentCompromise,
  };
}

/** Operator-facing summary. Names the weakness when there is one. */
function describeSelection(selection) {
  const lines = [`Trust root: ${selection.descriptor.kind} — ${selection.descriptor.summary}`];
  if (selection.degraded) {
    lines.push(
      'WARNING: this root does not survive compromise of an agent process. ' +
        'Grants signed with it are only as trustworthy as every process running as this user.'
    );
    const upgrades = selection.all
      .filter((d) => !d.available && d.detail && d.detail.hardwarePresent)
      .map((d) => `  - ${d.kind}: ${d.unavailableReason}`);
    if (upgrades.length) lines.push('Stronger roots detected but not implemented:', ...upgrades);
  }
  return lines.join('\n');
}

module.exports = {
  TRUST_ROOT_PREFERENCE,
  probeAll,
  selectTrustRoot,
  describeSelection,
  guaranteeScore,
  didKeyFromPem,
  base58btc,
  ensureOperatorKey,
  fileProvider,
  OPERATOR_KEY_PATH,
  OPERATOR_PUB_PATH,
};
