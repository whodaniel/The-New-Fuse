#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  const hit = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

const repoRoot = process.cwd();
const inputPath = path.resolve(
  repoRoot,
  getArg('input', 'docs/protocols/reports/PII_CLASSIFICATION_AUDIT_2026-05-07.json')
);
const outputDir = path.resolve(
  repoRoot,
  getArg('output-dir', 'docs/protocols/reports/public-safe-variants')
);
const manifestPath = path.resolve(
  repoRoot,
  getArg('manifest', 'docs/protocols/reports/INTERNAL_ONLY_PUBLIC_SAFE_VARIANTS_2026-05-07.json')
);
const manifestMdPath = path.resolve(
  repoRoot,
  getArg('manifest-md', 'docs/protocols/reports/INTERNAL_ONLY_PUBLIC_SAFE_VARIANTS_2026-05-07.md')
);

function isTracked(filePath) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', filePath], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

function sanitizeContent(content) {
  return content
    .replace(/\/Users\/[A-Za-z0-9._-]+/g, '/Users/<redacted-user>')
    .replace(/bizsynth@gmail\.com/gi, 'owner@example.com')
    .replace(/\bbizsynth\b/gi, 'owner')
    .replace(/Daniel Who's Media Empire/g, 'Media Empire Story (Private)')
    .replace(/Daniel Adam Goldberg Life Story/g, 'Personal Life Story (Private)');
}

function prependBanner(filePath, content) {
  const ext = path.extname(filePath).toLowerCase();
  const timestamp = new Date().toISOString();
  if (ext === '.md' || ext === '.txt') {
    return `<!-- Auto-sanitized public-safe variant. Generated: ${timestamp}. Source: ${filePath} -->\n\n${content}`;
  }
  if (ext === '.sh') {
    return `# Auto-sanitized public-safe variant. Generated: ${timestamp}. Source: ${filePath}\n\n${content}`;
  }
  return content;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text);
}

function main() {
  if (!fs.existsSync(inputPath)) {
    console.error(`[public-safe-variants] missing input: ${inputPath}`);
    process.exit(1);
  }

  const parsed = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const results = parsed.results || [];
  const internalDocs = results.filter((r) => r.classification === 'internal-only' && typeof r.file === 'string' && r.file.startsWith('docs/'));

  const created = [];
  const skipped = [];

  for (const entry of internalDocs) {
    const rel = entry.file;
    const srcPath = path.resolve(repoRoot, rel);

    if (!isTracked(rel)) {
      skipped.push({ file: rel, reason: 'not tracked by git' });
      continue;
    }

    if (!fs.existsSync(srcPath)) {
      skipped.push({ file: rel, reason: 'source missing on disk' });
      continue;
    }

    let source = '';
    try {
      source = fs.readFileSync(srcPath, 'utf8');
    } catch {
      skipped.push({ file: rel, reason: 'unable to read source as text' });
      continue;
    }

    const sanitized = prependBanner(rel, sanitizeContent(source));
    const destPath = path.join(outputDir, rel);
    writeText(destPath, sanitized);

    created.push({
      file: rel,
      output: path.relative(repoRoot, destPath),
      bytes: Buffer.byteLength(sanitized, 'utf8'),
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    input: path.relative(repoRoot, inputPath),
    outputDir: path.relative(repoRoot, outputDir),
    totals: {
      internalDocsCandidates: internalDocs.length,
      variantsCreated: created.length,
      skipped: skipped.length,
    },
    created,
    skipped,
  };

  writeJson(manifestPath, manifest);

  let md = '';
  md += '# Internal-Only Public-Safe Variants\n\n';
  md += `Generated: ${manifest.generatedAt}\n\n`;
  md += `- Input classification: \`${manifest.input}\`\n`;
  md += `- Output directory: \`${manifest.outputDir}\`\n`;
  md += `- Internal-only docs candidates: \`${manifest.totals.internalDocsCandidates}\`\n`;
  md += `- Variants created: \`${manifest.totals.variantsCreated}\`\n`;
  md += `- Skipped: \`${manifest.totals.skipped}\`\n\n`;

  md += '## Created Variants\n\n';
  if (created.length) {
    for (const item of created) {
      md += `- \`${item.file}\` -> \`${item.output}\` (${item.bytes} bytes)\n`;
    }
  } else {
    md += '- none\n';
  }

  md += '\n## Skipped\n\n';
  if (skipped.length) {
    for (const item of skipped) {
      md += `- \`${item.file}\` (${item.reason})\n`;
    }
  } else {
    md += '- none\n';
  }

  writeText(manifestMdPath, md);

  console.log(`[public-safe-variants] created=${created.length} skipped=${skipped.length}`);
  console.log(path.relative(repoRoot, manifestPath));
  console.log(path.relative(repoRoot, manifestMdPath));
}

main();
