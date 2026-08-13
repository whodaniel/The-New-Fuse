#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const REQUIRED_FRONTMATTER_KEYS = [
  'name',
  'description',
  'primary_type',
  'category',
  'risk_tier',
  'harmful_pattern_detection',
];

function walkSkillFiles(root) {
  if (!fs.existsSync(root)) return [];
  const out = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.DS_Store') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name === 'SKILL.md') {
        out.push(full);
      }
    }
  }
  return out.sort();
}

function extractFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  return m ? m[1] : null;
}

function getScalar(frontmatter, key) {
  const re = new RegExp(`^${key}:\\s*(.*)$`, 'm');
  const m = frontmatter.match(re);
  if (!m) return null;
  return m[1].trim();
}

function getList(frontmatter, key) {
  const lines = frontmatter.split('\n');
  const idx = lines.findIndex((line) => line.trim() === `${key}:`);
  if (idx === -1) return [];
  const out = [];
  for (let i = idx + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^[A-Za-z0-9_-]+:\s*/.test(line)) break;
    const m = line.match(/^\s*-\s*(.+?)\s*$/);
    if (m) out.push(m[1].trim());
  }
  return out;
}

function normalizeSnapshotId(skillDirName) {
  return skillDirName.toLowerCase().replace(/-[0-9a-f]{8}$/i, '');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function rel(repoRoot, absPath) {
  return path.relative(repoRoot, absPath);
}

function main() {
  const repoRoot = process.cwd();
  const warnOnly = process.argv.includes('--warn-only');
  const writeReport = process.argv.includes('--write-report');
  const reportFile = path.join(repoRoot, '.agent/skill-bank/skill-governance-report.json');

  const errors = [];
  const warnings = [];

  const catalogPath = path.join(repoRoot, '.skills/skill-catalog/promoted-snapshot-skills.json');
  if (!fs.existsSync(catalogPath)) {
    console.error(`Missing catalog: ${catalogPath}`);
    process.exit(1);
  }

  let catalog = null;
  try {
    catalog = readJson(catalogPath);
  } catch (err) {
    console.error(`Failed to parse catalog JSON: ${err.message}`);
    process.exit(1);
  }

  const permanentFiles = [
    ...walkSkillFiles(path.join(repoRoot, '.skills')),
    ...walkSkillFiles(path.join(repoRoot, '.agent/skills')),
  ];
  const permanentBases = new Set(
    permanentFiles.map((file) => path.basename(path.dirname(file)).toLowerCase())
  );

  const projectAgentSnapshots = walkSkillFiles(
    path.join(repoRoot, '.agent/skill-bank/snapshots/project-agent')
  );
  const missingPromotions = [];
  for (const snap of projectAgentSnapshots) {
    const skillDirName = path.basename(path.dirname(snap));
    const base = normalizeSnapshotId(skillDirName);
    if (!permanentBases.has(base)) {
      missingPromotions.push({ snapshot: rel(repoRoot, snap), normalizedId: base });
    }
  }
  if (missingPromotions.length > 0) {
    errors.push(
      `Found ${missingPromotions.length} project-agent snapshot skills without permanent counterparts`
    );
  }

  const skills = Array.isArray(catalog.skills) ? catalog.skills : [];
  if (skills.length === 0) {
    errors.push('Catalog has no skills entries');
  }

  for (const entry of skills) {
    const id = entry.id || '(missing-id)';
    if (!entry.category) errors.push(`Catalog entry ${id} missing category`);
    if (!entry.primaryType) errors.push(`Catalog entry ${id} missing primaryType`);
    if (!entry.riskTier) errors.push(`Catalog entry ${id} missing riskTier`);
    if (!Array.isArray(entry.permanentPaths) || entry.permanentPaths.length < 2) {
      errors.push(`Catalog entry ${id} missing permanentPaths mirror entries`);
      continue;
    }

    const parsedByPath = [];
    for (const relPath of entry.permanentPaths) {
      const absPath = path.join(repoRoot, relPath);
      if (!fs.existsSync(absPath)) {
        errors.push(`Catalog entry ${id} references missing file ${relPath}`);
        continue;
      }
      const raw = fs.readFileSync(absPath, 'utf8');
      const frontmatter = extractFrontmatter(raw);
      if (!frontmatter) {
        errors.push(`File ${relPath} missing frontmatter`);
        continue;
      }

      for (const key of REQUIRED_FRONTMATTER_KEYS) {
        const v = getScalar(frontmatter, key);
        if (v === null) errors.push(`File ${relPath} missing frontmatter key ${key}`);
      }

      const harmfulSignals = getList(frontmatter, 'harmful_pattern_signals');
      const harmfulFlag = getScalar(frontmatter, 'harmful_pattern_detection');
      if (harmfulFlag === 'true' && harmfulSignals.length === 0) {
        errors.push(`File ${relPath} has harmful_pattern_detection=true but no harmful_pattern_signals`);
      }

      const riskTier = getScalar(frontmatter, 'risk_tier');
      if (riskTier && !['low', 'medium', 'high', 'critical'].includes(riskTier)) {
        errors.push(`File ${relPath} has invalid risk_tier "${riskTier}"`);
      }

      const category = getScalar(frontmatter, 'category');
      if (category && !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(category)) {
        warnings.push(`File ${relPath} has non-normalized category "${category}"`);
      }

      const sourceSnapshot = getScalar(frontmatter, 'source_snapshot');
      if (sourceSnapshot && sourceSnapshot !== 'none') {
        const snapshotAbs = path.join(repoRoot, sourceSnapshot);
        if (!fs.existsSync(snapshotAbs)) {
          warnings.push(`File ${relPath} points to missing source_snapshot ${sourceSnapshot}`);
        }
      }

      parsedByPath.push({
        relPath,
        category: getScalar(frontmatter, 'category'),
        primaryType: getScalar(frontmatter, 'primary_type'),
        riskTier: getScalar(frontmatter, 'risk_tier'),
        harmfulPatternDetection: getScalar(frontmatter, 'harmful_pattern_detection'),
      });
    }

    if (parsedByPath.length >= 2) {
      const first = parsedByPath[0];
      for (const p of parsedByPath.slice(1)) {
        if (
          p.category !== first.category ||
          p.primaryType !== first.primaryType ||
          p.riskTier !== first.riskTier ||
          p.harmfulPatternDetection !== first.harmfulPatternDetection
        ) {
          errors.push(
            `Mirror drift for ${id}: classification metadata mismatch between ${first.relPath} and ${p.relPath}`
          );
        }
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    checks: {
      promotedCatalogEntries: skills.length,
      projectAgentSnapshotFiles: projectAgentSnapshots.length,
      permanentSkillFiles: permanentFiles.length,
    },
    errors,
    warnings,
    missingPromotions,
  };

  if (writeReport) {
    fs.mkdirSync(path.dirname(reportFile), { recursive: true });
    fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  if (errors.length > 0 || warnings.length > 0) {
    console.log(JSON.stringify({ errors: errors.length, warnings: warnings.length }, null, 2));
  } else {
    console.log('Skill governance check passed with no errors/warnings.');
  }
  if (writeReport) {
    console.log(`Report: ${rel(repoRoot, reportFile)}`);
  }

  if (errors.length > 0 && !warnOnly) {
    process.exit(1);
  }
}

main();
