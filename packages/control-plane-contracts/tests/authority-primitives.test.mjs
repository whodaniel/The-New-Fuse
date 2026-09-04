import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import {
  VALID_ROLES,
  RESIDENCIES,
  ROLE_RANK,
  MAX_CHAIN_DEPTH,
  isValidRole,
  buildAgentDid,
  parseAgentDid,
  didToCanonicalEntityId,
  residencyOf,
  canonicalGrantMaterial,
  signGrant,
  verifyGrant,
  attenuationHolds,
  verifyGrantChain,
  resolveRoleFromGrants,
  crossResidencyGrants,
} from "../dist/index.js";

test("valid roles and rank constants", () => {
  assert.equal(isValidRole("worker"), true);
  assert.equal(isValidRole("sub-director"), true);
  assert.equal(isValidRole("super-director"), true);
  assert.equal(isValidRole("super-admin"), true);
  assert.equal(isValidRole("bogus-role"), false);
  assert.equal(ROLE_RANK["worker"], 0);
  assert.equal(ROLE_RANK["sub-director"], 1);
  assert.equal(ROLE_RANK["super-director"], 2);
  assert.equal(ROLE_RANK["super-admin"], 3);
});

test("did:tnf parsing and serialization", () => {
  const did = buildAgentDid({
    scope: "local",
    category: "agent",
    provider: "tnfcli",
    name: "mbp-2015",
    instance: 1,
  });
  assert.equal(did, "did:tnf:local:agent:tnfcli:mbp_2015:001");

  const parsed = parseAgentDid(did);
  assert.ok(parsed);
  assert.equal(parsed.scope, "local");
  assert.equal(parsed.category, "agent");
  assert.equal(parsed.provider, "tnfcli");
  assert.equal(parsed.name, "mbp_2015");
  assert.equal(parsed.instance, "001");
  assert.equal(parsed.residency, "local");
  assert.equal(parsed.tenantId, null);

  assert.equal(residencyOf(did), "local");
  assert.equal(residencyOf("bare-agent-id"), "unknown");
  assert.equal(didToCanonicalEntityId(did), "TNF:LOCAL:AGENT:TNFCLI:MBP_2015:001");
});

test("grant signing and verification with Ed25519 keypair", () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const now = new Date();
  const grant = {
    id: "grant-001",
    subjectDid: "did:tnf:local:agent:test:worker:001",
    role: "sub-director",
    issuerDid: "did:tnf:cloud:user:tnf:daniel_goldberg:001",
    tenantId: null,
    residency: "local",
    notBefore: new Date(now.getTime() - 60_000).toISOString(),
    expiresAt: new Date(now.getTime() + 3600_000).toISOString(),
    nonce: "nonce-123",
    proofChain: [],
    crossResidency: true,
  };

  const sig = signGrant(grant, privateKey);
  assert.ok(sig && typeof sig === "string");

  const signedGrant = { ...grant, signature: sig, signatureAlgorithm: "Ed25519" };
  const verdict = verifyGrant(signedGrant, publicKey, { now });
  assert.equal(verdict.verdict, "valid");
  assert.equal(verdict.role, "sub-director");
});

test("attenuation holds enforces strict hierarchy and tenant boundaries", () => {
  const parent = {
    role: "sub-director",
    tenantId: "tenant-a",
    expiresAt: "2026-10-01T00:00:00Z",
    residency: "cloud",
    crossResidency: false,
  };

  const childValid = {
    role: "worker",
    tenantId: "tenant-a",
    expiresAt: "2026-09-15T00:00:00Z",
    residency: "cloud",
  };
  assert.equal(attenuationHolds(parent, childValid).ok, true);

  const childExceeds = {
    role: "super-director",
    tenantId: "tenant-a",
    expiresAt: "2026-09-15T00:00:00Z",
    residency: "cloud",
  };
  assert.equal(attenuationHolds(parent, childExceeds).ok, false);

  const childCrossTenant = {
    role: "worker",
    tenantId: "tenant-b",
    expiresAt: "2026-09-15T00:00:00Z",
    residency: "cloud",
  };
  assert.equal(attenuationHolds(parent, childCrossTenant).ok, false);
});

test("resolveRoleFromGrants with fallbackResolver", () => {
  const result = resolveRoleFromGrants("did:tnf:local:agent:test:fallback:001", [], {
    fallbackResolver: (id) => ({ ok: true, role: "sub-director", source: "registry", agentId: id }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.role, "sub-director");
  assert.equal(result.source, "roles.json");
});
