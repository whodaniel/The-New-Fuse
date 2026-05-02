#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function usage() {
  console.log(
    [
      'Usage:',
      '  node scripts/protocols/twip-sign-envelope.cjs --in <envelope.json> [--out <signed.json>] [--key <secret>]',
      '  node scripts/protocols/twip-sign-envelope.cjs --verify --in <signed.json> [--key <secret>]',
      '',
      'Options:',
      '  --in       Input TWIP envelope JSON file (required)',
      '  --out      Output file path (optional for sign mode)',
      '  --key      HMAC key (falls back to TWIP_SIGNING_KEY env)',
      '  --verify   Verify signature instead of writing a new signature',
    ].join('\n')
  );
}

function parseArgs(argv) {
  const args = {
    in: null,
    out: null,
    key: process.env.TWIP_SIGNING_KEY || '',
    verify: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--in') args.in = argv[++i];
    else if (token === '--out') args.out = argv[++i];
    else if (token === '--key') args.key = argv[++i] || '';
    else if (token === '--verify') args.verify = true;
    else if (token === '--help' || token === '-h') {
      usage();
      process.exit(0);
    }
  }
  return args;
}

function stableSortObject(value) {
  if (Array.isArray(value)) return value.map((item) => stableSortObject(item));
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableSortObject(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function canonicalizeEnvelopeForSignature(envelope) {
  const clone = JSON.parse(JSON.stringify(envelope || {}));
  delete clone.sig;
  return JSON.stringify(stableSortObject(clone));
}

function normalizeSignature(sig) {
  if (!sig || typeof sig !== 'string') return null;
  const trimmed = sig.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('hmac-sha256:')) return trimmed.slice('hmac-sha256:'.length);
  return trimmed;
}

function computeSignature(envelope, key) {
  const canonical = canonicalizeEnvelopeForSignature(envelope);
  return crypto.createHmac('sha256', key).update(canonical).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function assertBasicEnvelopeShape(envelope) {
  if (!envelope || typeof envelope !== 'object') throw new Error('Envelope must be an object.');
  if (envelope.spec !== 'twip/0.1') throw new Error('Envelope spec must be twip/0.1.');
  if (!envelope.id) throw new Error('Envelope id is required.');
  if (!envelope.type) throw new Error('Envelope type is required.');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.in) {
    usage();
    throw new Error('Missing --in argument.');
  }
  if (!args.key) {
    throw new Error('Missing signing key. Provide --key or TWIP_SIGNING_KEY.');
  }

  const absoluteIn = path.resolve(args.in);
  const envelope = readJson(absoluteIn);
  assertBasicEnvelopeShape(envelope);

  if (args.verify) {
    const presented = normalizeSignature(envelope.sig);
    if (!presented) {
      throw new Error('Envelope has no signature to verify.');
    }
    const expected = computeSignature(envelope, args.key);
    const expectedBuf = Buffer.from(expected, 'hex');
    const presentedBuf = Buffer.from(presented, 'hex');
    const verified =
      expectedBuf.length === presentedBuf.length && crypto.timingSafeEqual(expectedBuf, presentedBuf);
    if (!verified) {
      throw new Error('Signature verification failed.');
    }
    console.log(
      JSON.stringify(
        {
          verified: true,
          envelope: absoluteIn,
          algorithm: 'hmac-sha256',
        },
        null,
        2
      )
    );
    return;
  }

  const signature = computeSignature(envelope, args.key);
  const signedEnvelope = { ...envelope, sig: `hmac-sha256:${signature}` };

  if (args.out) {
    const absoluteOut = path.resolve(args.out);
    writeJson(absoluteOut, signedEnvelope);
    console.log(
      JSON.stringify(
        {
          signed: true,
          envelope: absoluteIn,
          output: absoluteOut,
          algorithm: 'hmac-sha256',
        },
        null,
        2
      )
    );
  } else {
    process.stdout.write(`${JSON.stringify(signedEnvelope, null, 2)}\n`);
  }
}

try {
  main();
} catch (error) {
  console.error(`twip-sign-envelope failed: ${error.message}`);
  process.exit(1);
}
