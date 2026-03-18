#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const Ajv2020 = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');

const repoRoot = path.resolve(__dirname, '..', '..');
const schemaDir = path.join(repoRoot, 'docs', 'protocols', 'schemas');
const fixturesDir = path.join(schemaDir, 'fixtures', 'twip');
const relayServerPath = path.join(repoRoot, 'apps', 'relay-server', 'src', 'mcp-server.js');

const envelopeSchemaPath = path.join(schemaDir, 'twip-envelope.schema.json');
const identitySchemaPath = path.join(schemaDir, 'twip-identity.schema.json');
const validFixturePath = path.join(fixturesDir, 'envelope.publish.valid.json');
const invalidFixturePath = path.join(fixturesDir, 'envelope.publish.invalid-missing-tenant.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseToolJson(result) {
  const text = result?.content?.[0]?.text;
  if (!text) return {};
  return JSON.parse(text);
}

function formatErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) return 'none';
  return errors
    .slice(0, 5)
    .map((error) => `${error.instancePath || '/'} ${error.message}`)
    .join('; ');
}

function cloneJson(input) {
  return JSON.parse(JSON.stringify(input));
}

async function main() {
  const envelopeSchema = readJson(envelopeSchemaPath);
  const identitySchema = readJson(identitySchemaPath);
  const validFixture = readJson(validFixturePath);
  const invalidFixture = readJson(invalidFixturePath);

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const envelopeSchemaResolved = cloneJson(envelopeSchema);
  if (envelopeSchemaResolved?.properties?.payload?.oneOf?.[0]?.properties?.identity?.$ref) {
    envelopeSchemaResolved.properties.payload.oneOf[0].properties.identity.$ref = identitySchema.$id;
  }
  ajv.addSchema(identitySchema);
  const validateEnvelope = ajv.compile(envelopeSchemaResolved);

  const validResult = validateEnvelope(validFixture);
  assert(validResult === true, `Expected valid fixture to pass: ${formatErrors(validateEnvelope.errors)}`);

  const invalidResult = validateEnvelope(invalidFixture);
  assert(invalidResult === false, 'Expected invalid fixture to fail schema validation.');

  const priorEnv = {
    TWIP_REQUIRE_SIGNATURE: process.env.TWIP_REQUIRE_SIGNATURE,
    TWIP_SIGNING_KEY: process.env.TWIP_SIGNING_KEY,
    TWIP_MAX_CLOCK_SKEW_SECONDS: process.env.TWIP_MAX_CLOCK_SKEW_SECONDS,
    TWIP_MAX_REPLAY_AGE_SECONDS: process.env.TWIP_MAX_REPLAY_AGE_SECONDS,
  };

  process.env.TWIP_REQUIRE_SIGNATURE = 'true';
  process.env.TWIP_SIGNING_KEY = 'twip-conformance-secret';
  process.env.TWIP_MAX_CLOCK_SKEW_SECONDS = '300';
  process.env.TWIP_MAX_REPLAY_AGE_SECONDS = '1200';

  const { TNFRelayMCPServer } = await import(pathToFileURL(relayServerPath).href);
  const relay = new TNFRelayMCPServer();

  try {
    const commonIdentityInput = {
      tenantId: 'tenant-alpha',
      hostId: 'h:abc12345',
      tty: 'ttys001',
      includeCommands: false,
      observedAt: '2026-03-18T00:00:00.000Z',
    };
    const processSetA = [
      { pid: 301, ppid: 1, pgid: 301, sid: 301, tty: 'ttys001', command: '/bin/zsh' },
      { pid: 302, ppid: 301, pgid: 301, sid: 301, tty: 'ttys001', command: 'node server.js' },
    ];
    const processSetB = [
      { pid: 302, ppid: 301, pgid: 301, sid: 301, tty: 'ttys001', command: 'node server.js' },
      { pid: 301, ppid: 1, pgid: 301, sid: 301, tty: 'ttys001', command: '/bin/zsh' },
    ];

    const identityKernel = relay.buildTerminalIdentity({
      ...commonIdentityInput,
      processes: processSetA,
      tmuxInfo: null,
    });
    const identityTmux = relay.buildTerminalIdentity({
      ...commonIdentityInput,
      processes: processSetB,
      tmuxInfo: {
        kind: 'tmux',
        session_id: '$1',
        window_id: '@1',
        pane_id: '%1',
      },
    });
    assert(
      identityKernel.twid === identityTmux.twid,
      'Adapter parity failed: kernel and tmux normalization produced different twid values.'
    );

    const missingTenantDecision = relay.evaluateTwipPolicy({
      scope: {},
      policy: { ttl_seconds: 300, allow_remote_propagation: false },
    });
    assert(
      missingTenantDecision.allow === false && missingTenantDecision.reason === 'missing_tenant_scope',
      `Expected missing_tenant_scope deny, got: ${JSON.stringify(missingTenantDecision)}`
    );

    const invalidTtlDecision = relay.evaluateTwipPolicy({
      scope: { tenant_id: 'tenant-alpha' },
      policy: { ttl_seconds: 0, allow_remote_propagation: false },
    });
    assert(
      invalidTtlDecision.allow === false && invalidTtlDecision.reason === 'ttl_out_of_bounds',
      `Expected ttl_out_of_bounds deny, got: ${JSON.stringify(invalidTtlDecision)}`
    );

    const remotePropagationDecision = relay.evaluateTwipPolicy({
      scope: { tenant_id: 'tenant-alpha' },
      policy: { ttl_seconds: 120, allow_remote_propagation: true },
    });
    assert(
      remotePropagationDecision.allow === false &&
        remotePropagationDecision.reason === 'remote_propagation_not_allowed',
      `Expected remote_propagation_not_allowed deny, got: ${JSON.stringify(remotePropagationDecision)}`
    );

    const unsignedPublishEnvelope = cloneJson(validFixture);
    unsignedPublishEnvelope.id = '55555555-5555-4555-8555-555555555555';
    unsignedPublishEnvelope.sent_at = new Date().toISOString();
    unsignedPublishEnvelope.trace.correlation_id = '66666666-6666-4666-8666-666666666666';
    unsignedPublishEnvelope.trace.causation_id = '77777777-7777-4777-8777-777777777777';
    unsignedPublishEnvelope.payload.identity.twid = '88888888-8888-4888-8888-888888888888';
    const unsignedPublishResult = await relay.twipPublishIdentity({ envelope: unsignedPublishEnvelope });
    const unsignedPublishPayload = parseToolJson(unsignedPublishResult);
    assert(
      unsignedPublishResult.isError === true && unsignedPublishPayload.code === 'SECURITY_DENY',
      `Expected unsigned publish to be denied, got: ${JSON.stringify(unsignedPublishPayload)}`
    );

    const signedPublishEnvelope = cloneJson(validFixture);
    signedPublishEnvelope.id = '99999999-9999-4999-8999-999999999999';
    signedPublishEnvelope.sent_at = new Date().toISOString();
    signedPublishEnvelope.trace.correlation_id = '12121212-1212-4121-8121-121212121212';
    signedPublishEnvelope.trace.causation_id = '34343434-3434-4343-8343-343434343434';
    signedPublishEnvelope.payload.identity.twid = 'abababab-abab-4bab-8bab-abababababab';
    signedPublishEnvelope.sig = `hmac-sha256:${relay.computeTwipSignature(signedPublishEnvelope)}`;

    const signedPublishResult = await relay.twipPublishIdentity({ envelope: signedPublishEnvelope });
    const signedPublishPayload = parseToolJson(signedPublishResult);
    assert(
      signedPublishResult.isError !== true && signedPublishPayload.success === true,
      `Expected signed publish allow, got: ${JSON.stringify(signedPublishPayload)}`
    );

    const replayPublishResult = await relay.twipPublishIdentity({ envelope: signedPublishEnvelope });
    const replayPublishPayload = parseToolJson(replayPublishResult);
    assert(
      replayPublishResult.isError === true &&
        replayPublishPayload.code === 'SECURITY_DENY' &&
        replayPublishPayload.security?.reason === 'replay_detected',
      `Expected replay publish deny, got: ${JSON.stringify(replayPublishPayload)}`
    );

    const signedResolveEnvelope = {
      id: 'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
      spec: 'twip/0.1',
      type: 'IDENTITY.RESOLVE',
      sent_at: new Date().toISOString(),
      scope: {
        tenant_id: 'tenant-alpha',
      },
      trace: {
        correlation_id: 'efefefef-efef-4fef-8fef-efefefefefef',
        causation_id: '01010101-0101-4101-8101-010101010101',
      },
      policy: {
        ttl_seconds: 120,
        allow_remote_propagation: false,
        redact_gui_fields: true,
      },
      payload: {
        twid: 'abababab-abab-4bab-8bab-abababababab',
      },
    };
    signedResolveEnvelope.sig = `hmac-sha256:${relay.computeTwipSignature(signedResolveEnvelope)}`;

    const signedResolveResult = await relay.twipResolveIdentity({ envelope: signedResolveEnvelope });
    const signedResolvePayload = parseToolJson(signedResolveResult);
    assert(
      signedResolveResult.isError !== true &&
        signedResolvePayload.twid === 'abababab-abab-4bab-8bab-abababababab',
      `Expected signed resolve allow, got: ${JSON.stringify(signedResolvePayload)}`
    );

    const replayResolveResult = await relay.twipResolveIdentity({ envelope: signedResolveEnvelope });
    const replayResolvePayload = parseToolJson(replayResolveResult);
    assert(
      replayResolveResult.isError === true &&
        replayResolvePayload.code === 'SECURITY_DENY' &&
        replayResolvePayload.security?.reason === 'replay_detected',
      `Expected replay resolve deny, got: ${JSON.stringify(replayResolvePayload)}`
    );

    console.log('TWIP conformance passed.');
    console.log(`- Envelope schema: ${path.relative(repoRoot, envelopeSchemaPath)}`);
    console.log(`- Identity schema: ${path.relative(repoRoot, identitySchemaPath)}`);
    console.log(`- Valid fixture: ${path.relative(repoRoot, validFixturePath)}`);
    console.log(`- Invalid fixture: ${path.relative(repoRoot, invalidFixturePath)}`);
    console.log('- Adapter parity: PASS');
    console.log('- Policy deny checks: PASS');
    console.log('- Signed publish/resolve replay checks: PASS');
  } finally {
    process.env.TWIP_REQUIRE_SIGNATURE = priorEnv.TWIP_REQUIRE_SIGNATURE;
    process.env.TWIP_SIGNING_KEY = priorEnv.TWIP_SIGNING_KEY;
    process.env.TWIP_MAX_CLOCK_SKEW_SECONDS = priorEnv.TWIP_MAX_CLOCK_SKEW_SECONDS;
    process.env.TWIP_MAX_REPLAY_AGE_SECONDS = priorEnv.TWIP_MAX_REPLAY_AGE_SECONDS;
  }
}

main().catch((error) => {
  console.error(`TWIP conformance failed: ${error.message}`);
  process.exit(1);
});
