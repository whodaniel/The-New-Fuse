#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

function parseArgs(argv) {
  const out = {
    manifest: 'docs/NANOBANANA_POKER_GRAPHICS_MANIFEST.json',
    assetsDir: 'assets/generated/poker',
    strictDimensions: false,
    failOnUnexpected: true,
    allowEmpty: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--strict-dimensions') out.strictDimensions = true;
    else if (a === '--no-fail-on-unexpected') out.failOnUnexpected = false;
    else if (a === '--allow-empty') out.allowEmpty = true;
    else if (a === '--manifest' && argv[i + 1]) {
      out.manifest = argv[i + 1];
      i += 1;
    } else if (a === '--assets-dir' && argv[i + 1]) {
      out.assetsDir = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

function walkFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(abs);
      else if (entry.isFile()) out.push(abs);
    }
  }
  return out;
}

function parsePngSize(buf) {
  if (buf.length < 24) return null;
  const pngSig = '89504e470d0a1a0a';
  if (buf.subarray(0, 8).toString('hex') !== pngSig) return null;
  const ihdr = buf.subarray(12, 16).toString('ascii');
  if (ihdr !== 'IHDR') return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

function parseWebpSize(buf) {
  if (buf.length < 30) return null;
  const riff = buf.subarray(0, 4).toString('ascii');
  const webp = buf.subarray(8, 12).toString('ascii');
  if (riff !== 'RIFF' || webp !== 'WEBP') return null;
  const chunkType = buf.subarray(12, 16).toString('ascii');

  if (chunkType === 'VP8 ') {
    if (buf.length < 30) return null;
    const width = buf.readUInt16LE(26) & 0x3fff;
    const height = buf.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }

  if (chunkType === 'VP8L') {
    if (buf.length < 25) return null;
    const b0 = buf[21];
    const b1 = buf[22];
    const b2 = buf[23];
    const b3 = buf[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  }

  if (chunkType === 'VP8X') {
    if (buf.length < 30) return null;
    const width = 1 + buf.readUIntLE(24, 3);
    const height = 1 + buf.readUIntLE(27, 3);
    return { width, height };
  }

  return null;
}

function readImageSize(absPath) {
  const ext = path.extname(absPath).toLowerCase();
  const buf = readFileSync(absPath);
  if (ext === '.png') return parsePngSize(buf);
  if (ext === '.webp') return parseWebpSize(buf);
  return null;
}

function sameDimensions(a, b) {
  return a.width === b.width && a.height === b.height;
}

function main() {
  const args = parseArgs(process.argv);
  const manifestPath = path.resolve(ROOT, args.manifest);
  const assetsDir = path.resolve(ROOT, args.assetsDir);

  if (!existsSync(manifestPath)) {
    console.error(`Missing manifest: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const manifestAssets = Array.isArray(manifest.assets) ? manifest.assets : [];

  const files = walkFiles(assetsDir)
    .filter((f) => ['.png', '.webp'].includes(path.extname(f).toLowerCase()))
    .sort();

  if (files.length === 0 && !args.allowEmpty) {
    console.error(`No .png/.webp files found in ${path.relative(ROOT, assetsDir)}.`);
    process.exit(1);
  }

  const relFiles = files.map((f) => path.relative(assetsDir, f).replace(/\\/g, '/'));
  const relFileSet = new Set(relFiles);
  const fileByRel = new Map(relFiles.map((r, idx) => [r, files[idx]]));

  const filenameRule = /^pkr_[a-z0-9]+(?:_[a-z0-9]+)+_v\d{2}\.(png|webp)$/;
  const namingViolations = relFiles.filter((f) => !filenameRule.test(path.basename(f)));

  const missing = [];
  const resolved = new Map();
  const setCoverageWarnings = [];

  for (const asset of manifestAssets) {
    const expectedPng = asset.filename;
    const expectedWebp = expectedPng.replace(/\.png$/i, '.webp');

    let matched = null;
    if (relFileSet.has(expectedPng)) matched = expectedPng;
    else if (relFileSet.has(expectedWebp)) matched = expectedWebp;

    const requiredVariants = Array.isArray(asset.requiredVariants) ? asset.requiredVariants : [];
    const expectedDims = asset.expectedDimensions;

    if (!matched && asset.isSetAsset && requiredVariants.length > 0) {
      const prefix = expectedPng.replace(/_set_v\d+\.png$/i, '');
      const variantMatches = relFiles.filter((name) => {
        const base = path.basename(name);
        return (
          base.startsWith(`${path.basename(prefix)}_`) &&
          base.endsWith('_v01.png') ||
          base.endsWith('_v01.webp')
        );
      });

      if (variantMatches.length > 0) {
        const foundVariants = new Set(
          variantMatches
            .map((name) => path.basename(name))
            .map((base) => {
              const m = base.match(/^(.+)_([a-z0-9_-]+)_v\d+\.(png|webp)$/i);
              return m ? m[2].toLowerCase() : '';
            })
            .filter(Boolean)
        );

        const missingVariants = requiredVariants.filter((v) => !foundVariants.has(v));
        if (missingVariants.length === 0) {
          matched = variantMatches[0];
          if (variantMatches.length > 1) {
            setCoverageWarnings.push(
              `Set asset ${expectedPng} expanded into ${variantMatches.length} variant files.`
            );
          }
        } else {
          missing.push(
            `${expectedPng} (missing required variants: ${missingVariants.join(', ')})`
          );
          continue;
        }
      }
    }

    if (!matched) {
      missing.push(expectedPng);
      continue;
    }

    const absPath = fileByRel.get(matched);
    if (!absPath) continue;

    const dim = readImageSize(absPath);
    resolved.set(matched, { asset, dim });

    if (!dim) {
      missing.push(`${expectedPng} (unreadable dimensions for ${matched})`);
      continue;
    }

    if (expectedDims && Number.isInteger(expectedDims.width) && Number.isInteger(expectedDims.height)) {
      const expected = { width: expectedDims.width, height: expectedDims.height };
      if (!sameDimensions(dim, expected)) {
        const conf = asset.dimensionConfidence || 'medium';
        const msg = `${asset.filename} expected ${expected.width}x${expected.height}, got ${dim.width}x${dim.height}`;
        if (args.strictDimensions || conf === 'high') {
          missing.push(`${asset.filename} (${msg})`);
        } else {
          setCoverageWarnings.push(msg);
        }
      }
    }
  }

  const matchedBaseNames = new Set(
    Array.from(resolved.keys()).map((k) => path.basename(k))
  );

  const expectedBaseNames = new Set(
    manifestAssets.map((a) => path.basename(a.filename))
  );

  const unexpected = relFiles.filter((name) => {
    const base = path.basename(name);
    if (expectedBaseNames.has(base)) return false;
    return !Array.from(expectedBaseNames).some((expected) => {
      const prefix = expected.replace(/_set_v\d+\.png$/i, '');
      return base.startsWith(`${prefix}_`) && /_v\d+\.(png|webp)$/i.test(base);
    });
  });

  const errors = [];
  if (namingViolations.length) {
    errors.push(`Naming violations (${namingViolations.length}):\n- ${namingViolations.join('\n- ')}`);
  }
  if (missing.length) {
    errors.push(`Missing or invalid assets (${missing.length}):\n- ${missing.join('\n- ')}`);
  }
  if (args.failOnUnexpected && unexpected.length) {
    errors.push(`Unexpected assets (${unexpected.length}):\n- ${unexpected.join('\n- ')}`);
  }

  console.log('Nanobanana graphics validation summary');
  console.log(`- Manifest assets: ${manifestAssets.length}`);
  console.log(`- Files discovered: ${files.length}`);
  console.log(`- Matched assets: ${matchedBaseNames.size}`);
  console.log(`- Naming violations: ${namingViolations.length}`);
  console.log(`- Missing/invalid: ${missing.length}`);
  console.log(`- Unexpected: ${unexpected.length}`);

  if (setCoverageWarnings.length) {
    console.log(`- Warnings: ${setCoverageWarnings.length}`);
    for (const warning of setCoverageWarnings) {
      console.log(`  * ${warning}`);
    }
  }

  if (errors.length) {
    console.error('\nValidation failed:\n');
    console.error(errors.join('\n\n'));
    process.exit(1);
  }

  console.log('\nValidation passed.');
}

main();
