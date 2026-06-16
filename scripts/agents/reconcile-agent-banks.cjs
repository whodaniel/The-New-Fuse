#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

function parseArgs(argv) {
  const args = {
    apply: true,
    json: false,
    targets: 'all',
    repoRoot: null,
    skipRestore: false,
    skipProvision: false,
    skipImportedSync: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') args.apply = false;
    else if (arg === '--apply') args.apply = true;
    else if (arg === '--json') args.json = true;
    else if (arg === '--targets' && argv[i + 1]) {
      args.targets = argv[i + 1];
      i += 1;
    } else if (arg === '--repo-root' && argv[i + 1]) {
      args.repoRoot = argv[i + 1];
      i += 1;
    } else if (arg === '--skip-restore') {
      args.skipRestore = true;
    } else if (arg === '--skip-provision') {
      args.skipProvision = true;
    } else if (arg === '--skip-imported-sync') {
      args.skipImportedSync = true;
    }
  }

  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toPosix(p) {
  return p.replace(/\\/g, '/');
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function listMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function listImportedSkillSlugs(importedRoot) {
  if (!fs.existsSync(importedRoot)) return [];
  const entries = fs.readdirSync(importedRoot, { withFileTypes: true });
  return entries
    .filter((entry) => {
      if (!entry.isDirectory()) return false;
      return fs.existsSync(path.join(importedRoot, entry.name, 'SKILL.md'));
    })
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function normalizeSlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseFrontmatter(raw) {
  const text = raw.replace(/^\uFEFF/, '');
  if (!text.startsWith('---\n')) {
    return { frontmatter: {}, body: text.trim() };
  }
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) {
    return { frontmatter: {}, body: text.trim() };
  }

  const block = text.slice(4, end);
  const body = text.slice(end + 5).trim();
  const frontmatter = {};
  let currentKey = null;

  for (const line of block.split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const value = kv[2].trim();
      if (!value) {
        frontmatter[currentKey] = [];
      } else if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        frontmatter[currentKey] = value.slice(1, -1);
      } else {
        frontmatter[currentKey] = value;
      }
      continue;
    }

    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && currentKey) {
      if (!Array.isArray(frontmatter[currentKey])) frontmatter[currentKey] = [];
      frontmatter[currentKey].push(listItem[1].trim());
    }
  }

  return { frontmatter, body };
}

function countSkillDirs(root) {
  if (!fs.existsSync(root)) return 0;
  let count = 0;
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(root, entry.name, 'SKILL.md');
    if (fs.existsSync(skillPath)) count += 1;
  }
  return count;
}

function writeTextFile(filePath, content, apply) {
  const before = safeRead(filePath);
  const changed = before !== content;
  if (!apply || !changed) {
    return { changed, action: changed ? 'would-update' : 'unchanged' };
  }
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
  return { changed: true, action: before === null ? 'created' : 'updated' };
}

function isPermissionError(error) {
  if (!error || typeof error !== 'object' || !('code' in error)) return false;
  const code = String(error.code);
  return code === 'EPERM' || code === 'EACCES' || code === 'EBUSY';
}

function syncDirectoryBestEffort(sourceDir, destDir, apply) {
  const existed = fs.existsSync(destDir);
  if (!apply) {
    return { action: existed ? 'would-sync' : 'would-create' };
  }

  ensureDir(path.dirname(destDir));
  try {
    fs.cpSync(sourceDir, destDir, { recursive: true, force: true });
    return { action: existed ? 'synced' : 'created' };
  } catch (error) {
    if (!isPermissionError(error)) throw error;
    const warning = error instanceof Error ? error.message : String(error);
    let addedMissingEntries = 0;
    try {
      const sourceEntries = fs.readdirSync(sourceDir, { withFileTypes: true });
      for (const entry of sourceEntries) {
        const src = path.join(sourceDir, entry.name);
        const dst = path.join(destDir, entry.name);
        if (fs.existsSync(dst)) continue;
        try {
          fs.cpSync(src, dst, { recursive: true, force: true });
          addedMissingEntries += 1;
        } catch {
          // Best-effort: continue attempting other missing entries.
        }
      }
    } catch {
      // Best-effort only.
    }
    const existingSkillCount = countSkillDirs(destDir);
    return {
      action:
        existingSkillCount > 0
          ? addedMissingEntries > 0
            ? 'protected-partial-sync'
            : 'protected-existing'
          : 'error',
      warning,
      ...(addedMissingEntries > 0 ? { addedMissingEntries } : {}),
    };
  }
}

function listCommitsForPath(repoRoot, relPath) {
  try {
    const out = execSync(`git rev-list HEAD -- ${relPath}`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    if (!out) return [];
    return out.split('\n').map((line) => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function commitHasFilesForPath(repoRoot, commit, relPath) {
  try {
    const out = execSync(`git ls-tree -r --name-only ${commit} -- ${relPath}`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    if (!out) return false;
    return out.split('\n').some((line) => line.endsWith('.md'));
  } catch {
    return false;
  }
}

function findLatestRestorableCommit(repoRoot, relPath) {
  const commits = listCommitsForPath(repoRoot, relPath);
  for (const commit of commits) {
    if (commitHasFilesForPath(repoRoot, commit, relPath)) {
      return commit;
    }
  }
  return null;
}

function restorePathFromCommit(repoRoot, commit, relPath, apply) {
  if (!apply) {
    return { action: 'would-restore', commit };
  }
  execSync(`git archive ${commit} ${relPath} | tar -x`, {
    cwd: repoRoot,
    stdio: ['ignore', 'ignore', 'pipe'],
    shell: '/bin/bash',
  });
  return { action: 'restored', commit };
}

function inferPathway(slug, inTnf, inClaude) {
  const corporatePatterns = [
    'super-director',
    'sub-director',
    'staffing-director',
    'staff-review',
    'orchestrator-agent',
    'orchestrator-agent-copy',
    'agent-registry-manager',
    'interoperability-protocol-agent',
    'custom-slash-command-agent',
    'cursor-watch-learn-operator',
    'meta-agent-architect',
  ];
  if (corporatePatterns.some((pattern) => slug.includes(pattern))) {
    return 'corporate_staff';
  }
  if (inClaude && !inTnf) return 'agency_owner_ops';
  if (inTnf && !inClaude) return 'user_customer_ops';
  if (inClaude && inTnf) return 'shared_core';
  return 'unclassified';
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = path.resolve(args.repoRoot || process.cwd());
  const home = os.homedir();

  const claudeAgentsDir = path.join(repoRoot, '.claude', 'agents');
  const tnfAgentsDir = path.join(repoRoot, '.agent', 'agents');
  const importedRoot = path.join(repoRoot, '.skills', 'imported-claude-agents');
  const matrixPath = path.join(repoRoot, '.agent', 'fleet', 'agent-pathway-matrix.json');
  const trackedMatrixPath = path.join(
    repoRoot,
    'docs',
    'protocols',
    'reports',
    'agent-pathway-matrix.latest.json'
  );

  const targetMap = {
    codex: [path.join(home, '.codex', 'skills', 'imported-claude-agents')],
    claude: [path.join(home, '.claude', 'skills', 'imported-claude-agents')],
    gemini: [path.join(home, '.gemini', 'skills', 'imported-claude-agents')],
    cursor: [path.join(home, '.cursor', 'skills-cursor', 'imported-claude-agents')],
    opencode: [path.join(home, '.opencode', 'skills', 'imported-claude-agents')],
    kilo: [path.join(home, '.kilo', 'skills', 'imported-claude-agents')],
    augment: [path.join(home, '.augment', 'skills', 'imported-claude-agents')],
    tnf: [path.join(home, '.tnf', 'skills', 'imported-claude-agents')],
    hermes: [
      path.join(home, '.hermes', 'skills', 'imported-claude-agents'),
      path.join(home, '.hermes', 'hermes-agent', 'skills', 'imported-claude-agents'),
    ],
    project: [path.join(repoRoot, '.agent', 'skills', 'imported-claude-agents')],
  };

  const requestedTargets =
    args.targets === 'all'
      ? Object.keys(targetMap)
      : String(args.targets)
          .split(',')
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean);

  const report = {
    generatedAt: new Date().toISOString(),
    apply: args.apply,
    repoRoot: toPosix(repoRoot),
    phases: {
      restoreTnfBank: null,
      syncTnfMirror: {
        created: [],
        skippedExisting: [],
      },
      syncImportedSkills: {
        created: [],
        skippedExisting: [],
      },
      runtimeProvision: [],
    matrix: {
      runtime: null,
      tracked: null,
    },
    },
    summary: {
      claudeAgents: 0,
      tnfAgents: 0,
      importedSkills: 0,
      createdImportedSkills: 0,
      runtimeTargetsProcessed: 0,
      runtimeTargetsWithErrors: 0,
    },
  };

  if (!fs.existsSync(claudeAgentsDir)) {
    throw new Error(`Missing source directory: ${claudeAgentsDir}`);
  }
  ensureDir(importedRoot);

  const currentTnfAgents = listMarkdownFiles(tnfAgentsDir);
  const needsRestore = !args.skipRestore && currentTnfAgents.length === 0;
  if (needsRestore) {
    const commit = findLatestRestorableCommit(repoRoot, '.agent/agents');
    if (!commit) {
      report.phases.restoreTnfBank = {
        action: 'skipped',
        reason: 'no-restorable-commit-found',
      };
    } else {
      const restoreResult = restorePathFromCommit(repoRoot, commit, '.agent/agents', args.apply);
      report.phases.restoreTnfBank = restoreResult;
    }
  } else {
    report.phases.restoreTnfBank = {
      action: 'skipped',
      reason: args.skipRestore ? 'skip-restore-flag' : 'tnf-bank-present',
    };
  }

  const claudeFiles = listMarkdownFiles(claudeAgentsDir);
  const tnfFilesBeforeMirror = listMarkdownFiles(tnfAgentsDir);
  const tnfSlugSet = new Set(tnfFilesBeforeMirror.map((file) => normalizeSlug(file.replace(/\.md$/i, ''))));

  for (const claudeFile of claudeFiles) {
    const rawName = claudeFile.replace(/\.md$/i, '');
    const slug = normalizeSlug(rawName);
    if (tnfSlugSet.has(slug)) {
      report.phases.syncTnfMirror.skippedExisting.push(slug);
      continue;
    }

    const sourcePath = path.join(claudeAgentsDir, claudeFile);
    const destinationPath = path.join(tnfAgentsDir, claudeFile);
    const sourceRaw = safeRead(sourcePath) || '';
    const writeResult = writeTextFile(
      destinationPath,
      sourceRaw.endsWith('\n') ? sourceRaw : `${sourceRaw}\n`,
      args.apply
    );
    report.phases.syncTnfMirror.created.push({
      slug,
      source: path.posix.join('.claude', 'agents', claudeFile),
      destination: path.posix.join('.agent', 'agents', claudeFile),
      action: writeResult.action,
    });
    tnfSlugSet.add(slug);
  }

  const tnfFiles = listMarkdownFiles(tnfAgentsDir);
  const importedBefore = listImportedSkillSlugs(importedRoot);

  if (!args.skipImportedSync) {
    const importedSet = new Set(importedBefore.map((slug) => normalizeSlug(slug)));
    for (const file of claudeFiles) {
      const rawName = file.replace(/\.md$/i, '');
      const slug = normalizeSlug(rawName);
      if (importedSet.has(slug)) {
        report.phases.syncImportedSkills.skippedExisting.push(slug);
        continue;
      }

      const sourcePath = path.join(claudeAgentsDir, file);
      const sourceRaw = safeRead(sourcePath) || '';
      const parsed = parseFrontmatter(sourceRaw);
      const description =
        typeof parsed.frontmatter.description === 'string'
          ? parsed.frontmatter.description
          : `Imported wrapper for ${rawName}`;
      const displayName =
        typeof parsed.frontmatter.name === 'string' && parsed.frontmatter.name.trim().length > 0
          ? parsed.frontmatter.name.trim()
          : rawName;
      const sourceRel = path.posix.join('.claude', 'agents', file);

      const skillBody = `---\nname: ${slug}\ndescription: ${description.replace(/\n/g, ' ')}\nsource_agent: ${sourceRel}\n---\n\n# ${displayName}\n\nThis skill is a provider-neutral wrapper for the canonical Claude agent definition at \`${sourceRel}\`.\n\n## Canonical Agent Prompt\n\n${parsed.body || sourceRaw.trim()}\n`;

      const openaiAgent = `agent:\n  name: ${slug}\n  provider: openai\n  model: gpt-5\n  default_prompt: \"Run the ${displayName} workflow using SKILL.md instructions.\"\nsource:\n  kind: imported-claude-agent\n  agent_file: ${sourceRel}\n`;

      const skillDir = path.join(importedRoot, slug);
      const skillPath = path.join(skillDir, 'SKILL.md');
      const refPath = path.join(skillDir, 'references', 'source-agent.md');
      const openaiPath = path.join(skillDir, 'agents', 'openai.yaml');

      const writeResults = [
        writeTextFile(skillPath, skillBody, args.apply),
        writeTextFile(refPath, sourceRaw.endsWith('\n') ? sourceRaw : `${sourceRaw}\n`, args.apply),
        writeTextFile(openaiPath, openaiAgent, args.apply),
      ];
      const changed = writeResults.some((item) => item.changed);
      report.phases.syncImportedSkills.created.push({
        slug,
        source: sourceRel,
        action: args.apply ? (changed ? 'created' : 'unchanged') : 'would-create',
      });
    }
  }

  const importedAfter = listImportedSkillSlugs(importedRoot);
  const importedSet = new Set(importedAfter.map((slug) => normalizeSlug(slug)));
  const claudeSet = new Set(claudeFiles.map((file) => normalizeSlug(file.replace(/\.md$/i, ''))));
  const tnfSet = new Set(tnfFiles.map((file) => normalizeSlug(file.replace(/\.md$/i, ''))));

  if (!args.skipProvision) {
    for (const target of requestedTargets) {
      const destinations = targetMap[target];
      if (!destinations) {
        report.phases.runtimeProvision.push({
          target,
          status: 'skipped',
          reason: 'unknown-target',
        });
        continue;
      }

      const targetResult = {
        target,
        status: 'processed',
        writes: [],
      };
      let hadError = false;

      for (const destination of destinations) {
        try {
          const result = syncDirectoryBestEffort(importedRoot, destination, args.apply);
          targetResult.writes.push({
            destination: toPosix(destination),
            action: result.action,
            ...(result.warning ? { warning: result.warning } : {}),
            skillCount: countSkillDirs(destination),
          });
          if (result.action === 'error') hadError = true;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          targetResult.writes.push({
            destination: toPosix(destination),
            action: 'error',
            error: message,
          });
          hadError = true;
        }
      }

      if (hadError) targetResult.status = 'partial-error';
      report.phases.runtimeProvision.push(targetResult);
    }
  } else {
    report.phases.runtimeProvision.push({
      target: 'all',
      status: 'skipped',
      reason: 'skip-provision-flag',
    });
  }

  const allSlugs = new Set([...claudeSet, ...tnfSet, ...importedSet]);
  const pathways = {
    corporate_staff: [],
    agency_owner_ops: [],
    user_customer_ops: [],
    shared_core: [],
    unclassified: [],
  };
  for (const slug of Array.from(allSlugs).sort((a, b) => a.localeCompare(b))) {
    const pathway = inferPathway(slug, tnfSet.has(slug), claudeSet.has(slug));
    pathways[pathway].push(slug);
  }

  const matrix = {
    generatedAt: report.generatedAt,
    canonicalSources: {
      tnfBank: '.agent/agents/*.md',
      claudeBank: '.claude/agents/*.md',
      sharedImportedSkills: '.skills/imported-claude-agents/*/SKILL.md',
    },
    counts: {
      tnfBank: tnfFiles.length,
      claudeBank: claudeFiles.length,
      importedSkills: importedAfter.length,
    },
    drift: {
      claudeMissingInImported: Array.from(claudeSet)
        .filter((slug) => !importedSet.has(slug))
        .sort((a, b) => a.localeCompare(b)),
      importedMissingInClaude: Array.from(importedSet)
        .filter((slug) => !claudeSet.has(slug))
        .sort((a, b) => a.localeCompare(b)),
      claudeMissingInTnfBank: Array.from(claudeSet)
        .filter((slug) => !tnfSet.has(slug))
        .sort((a, b) => a.localeCompare(b)),
      tnfOnly: Array.from(tnfSet)
        .filter((slug) => !claudeSet.has(slug))
        .sort((a, b) => a.localeCompare(b)),
    },
    pathways,
    runtimeCoverage: report.phases.runtimeProvision,
  };

  const matrixRuntimeWrite = writeTextFile(
    matrixPath,
    JSON.stringify(matrix, null, 2) + '\n',
    args.apply
  );
  const matrixTrackedWrite = writeTextFile(
    trackedMatrixPath,
    JSON.stringify(matrix, null, 2) + '\n',
    args.apply
  );
  report.phases.matrix.runtime = {
    path: toPosix(matrixPath),
    action: matrixRuntimeWrite.action,
  };
  report.phases.matrix.tracked = {
    path: toPosix(trackedMatrixPath),
    action: matrixTrackedWrite.action,
  };

  report.summary.claudeAgents = claudeFiles.length;
  report.summary.tnfAgents = tnfFiles.length;
  report.summary.importedSkills = importedAfter.length;
  report.summary.createdImportedSkills = report.phases.syncImportedSkills.created.length;
  report.summary.runtimeTargetsProcessed = report.phases.runtimeProvision.filter(
    (target) => target.status === 'processed' || target.status === 'partial-error'
  ).length;
  report.summary.runtimeTargetsWithErrors = report.phases.runtimeProvision.filter(
    (target) => target.status === 'partial-error'
  ).length;

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(
    `${args.apply ? 'Applied' : 'Planned'} TNF agent-bank reconciliation from ${toPosix(repoRoot)}`
  );
  console.log(`Claude agents: ${report.summary.claudeAgents}`);
  console.log(`TNF agents: ${report.summary.tnfAgents}`);
  console.log(`Imported shared skills: ${report.summary.importedSkills}`);
  console.log(`Created imported wrappers: ${report.summary.createdImportedSkills}`);
  console.log(`Runtime targets processed: ${report.summary.runtimeTargetsProcessed}`);
  console.log(`Runtime targets with errors: ${report.summary.runtimeTargetsWithErrors}`);
  console.log(
    `Pathway matrix (runtime): ${report.phases.matrix.runtime.path} (${report.phases.matrix.runtime.action})`
  );
  console.log(
    `Pathway matrix (tracked): ${report.phases.matrix.tracked.path} (${report.phases.matrix.tracked.action})`
  );
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
}
