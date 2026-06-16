#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const os = require('os');
const path = require('path');

function parseArgs(argv) {
  const args = {
    apply: true,
    json: false,
    targets: 'all',
    repoRoot: null,
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

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function getErrorCode(error) {
  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code);
  }
  return '';
}

function isPermissionError(error) {
  const code = getErrorCode(error);
  return code === 'EPERM' || code === 'EACCES' || code === 'EBUSY';
}

function writeTextFile(filePath, content, apply) {
  const before = readFileSafe(filePath);
  const changed = before !== content;
  if (!apply || !changed) {
    return {
      changed,
      action: changed ? 'would-update' : 'unchanged',
    };
  }
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
  return {
    changed: true,
    action: before === null ? 'created' : 'updated',
  };
}

function syncDirectoryInPlace(sourceDir, destDir) {
  ensureDir(destDir);
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      syncDirectoryInPlace(sourcePath, destPath);
      continue;
    }
    if (entry.isSymbolicLink()) {
      const target = fs.readlinkSync(sourcePath);
      try {
        fs.rmSync(destPath, { recursive: true, force: true });
      } catch {
        // Best-effort cleanup before recreating symlink.
      }
      fs.symlinkSync(target, destPath);
      continue;
    }
    if (entry.isFile()) {
      ensureDir(path.dirname(destPath));
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

function copySkillDirectory(sourceDir, destDir, apply) {
  const existed = fs.existsSync(destDir);
  if (!apply) {
    return {
      action: existed ? 'would-replace' : 'would-create',
    };
  }
  ensureDir(path.dirname(destDir));
  if (!existed) {
    fs.cpSync(sourceDir, destDir, { recursive: true });
    return {
      action: 'created',
    };
  }

  // Prefer replace semantics, but tolerate protected runtime folders by
  // falling back to an in-place sync.
  try {
    fs.rmSync(destDir, { recursive: true, force: true });
    fs.cpSync(sourceDir, destDir, { recursive: true });
    return {
      action: 'replaced',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isPermissionError(error)) {
      try {
        syncDirectoryInPlace(sourceDir, destDir);
        return {
          action: 'synced-in-place',
          warning: message,
        };
      } catch (syncError) {
        const syncMessage =
          syncError instanceof Error ? syncError.message : String(syncError);
        if (isPermissionError(syncError)) {
          const sourceSkill = readFileSafe(path.join(sourceDir, 'SKILL.md'));
          const destSkill = readFileSafe(path.join(destDir, 'SKILL.md'));
          if (sourceSkill !== null && destSkill === sourceSkill) {
            return {
              action: 'unchanged-protected',
              warning: `${message}; ${syncMessage}`,
            };
          }
          if (destSkill !== null) {
            return {
              action: 'protected-existing',
              warning: `${message}; ${syncMessage}`,
            };
          }
        }
        throw syncError;
      }
    }
    throw error;
  }
}

function main() {
  const args = parseArgs(process.argv);
  const home = os.homedir();
  const repoRoot = path.resolve(
    args.repoRoot || path.resolve(__dirname, '..', '..')
  );

  const sourceCommandPath = path.join(
    repoRoot,
    '.claude',
    'commands',
    'tnf-full-auto-autopilot.md'
  );
  const sourceSkillDir = path.join(
    repoRoot,
    '.skills',
    'tnf-full-auto-network-autopilot'
  );
  const sourceSkillPath = path.join(sourceSkillDir, 'SKILL.md');

  if (!fs.existsSync(sourceCommandPath)) {
    throw new Error(`Missing source command file: ${sourceCommandPath}`);
  }
  if (!fs.existsSync(sourceSkillPath)) {
    throw new Error(`Missing source skill file: ${sourceSkillPath}`);
  }

  const sourceCommand = fs.readFileSync(sourceCommandPath, 'utf8');
  const sourceSkill = fs.readFileSync(sourceSkillPath, 'utf8');
  const skillSlug = 'tnf-full-auto-network-autopilot';
  const commandFileName = 'tnf-full-auto-autopilot.md';
  const flatSkillFileName = `${skillSlug}.skill`;

  const targets = {
    codex: {
      roots: [path.join(home, '.codex')],
      commandDirs: [path.join(home, '.codex', 'commands')],
      skillDirs: [path.join(home, '.codex', 'skills')],
    },
    claude: {
      roots: [path.join(home, '.claude')],
      commandDirs: [path.join(home, '.claude', 'commands')],
      skillDirs: [path.join(home, '.claude', 'skills')],
    },
    gemini: {
      roots: [path.join(home, '.gemini')],
      commandDirs: [path.join(home, '.gemini', 'commands')],
      skillDirs: [path.join(home, '.gemini', 'skills')],
    },
    opencode: {
      roots: [path.join(home, '.opencode')],
      commandDirs: [path.join(home, '.opencode', 'commands')],
      skillDirs: [path.join(home, '.opencode', 'skills')],
    },
    cursor: {
      roots: [path.join(home, '.cursor')],
      commandDirs: [path.join(home, '.cursor', 'commands')],
      skillDirs: [path.join(home, '.cursor', 'skills-cursor')],
    },
    kilo: {
      roots: [path.join(home, '.kilo')],
      commandDirs: [path.join(home, '.kilo', 'commands')],
      skillDirs: [path.join(home, '.kilo', 'skills')],
    },
    augment: {
      roots: [path.join(home, '.augment')],
      commandDirs: [path.join(home, '.augment', 'commands')],
      skillDirs: [path.join(home, '.augment', 'skills')],
    },
    tnf: {
      roots: [path.join(home, '.tnf')],
      commandDirs: [path.join(home, '.tnf', 'commands')],
      skillDirs: [path.join(home, '.tnf', 'skills')],
    },
    hermes: {
      roots: [path.join(home, '.hermes')],
      commandDirs: [
        path.join(home, '.hermes', 'commands'),
        path.join(home, '.hermes', 'hermes-agent', 'commands'),
      ],
      skillDirs: [
        path.join(home, '.hermes', 'skills'),
        path.join(home, '.hermes', 'hermes-agent', 'skills'),
      ],
    },
    project: {
      roots: [repoRoot],
      commandDirs: [
        path.join(repoRoot, '.claude', 'commands'),
        path.join(repoRoot, '.agent', 'commands'),
      ],
      skillDirs: [path.join(repoRoot, '.agent', 'skills')],
    },
  };

  const requested =
    args.targets === 'all'
      ? Object.keys(targets)
      : String(args.targets)
          .split(',')
          .map((v) => v.trim().toLowerCase())
          .filter(Boolean);

  const unknown = requested.filter((name) => !targets[name]);
  if (unknown.length > 0) {
    throw new Error(`Unknown targets: ${unknown.join(', ')}`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    apply: args.apply,
    repoRoot: toPosix(repoRoot),
    sourceCommandPath: toPosix(sourceCommandPath),
    sourceSkillPath: toPosix(sourceSkillPath),
    targets: [],
    summary: {
      processed: 0,
      skipped: 0,
      targetsWithErrors: 0,
      commandsTouched: 0,
      skillDirsTouched: 0,
      flatSkillsTouched: 0,
    },
  };

  for (const name of requested) {
    const target = targets[name];
    const rootDetected = target.roots.some((root) => fs.existsSync(root));
    if (!rootDetected && name !== 'project') {
      report.targets.push({
        name,
        status: 'skipped',
        reason: 'root-not-found',
      });
      report.summary.skipped += 1;
      continue;
    }

    const targetReport = {
      name,
      status: 'processed',
      commandWrites: [],
      skillDirWrites: [],
      flatSkillWrites: [],
    };
    let targetHadError = false;

    for (const commandDir of target.commandDirs) {
      const commandPath = path.join(commandDir, commandFileName);
      try {
        const result = writeTextFile(commandPath, sourceCommand, args.apply);
        targetReport.commandWrites.push({
          path: toPosix(commandPath),
          action: result.action,
        });
        if (result.changed) report.summary.commandsTouched += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        targetReport.commandWrites.push({
          path: toPosix(commandPath),
          action: 'error',
          error: message,
        });
        targetHadError = true;
      }
    }

    for (const skillDir of target.skillDirs) {
      const folderDestination = path.join(skillDir, skillSlug);
      try {
        const folderResult = copySkillDirectory(
          sourceSkillDir,
          folderDestination,
          args.apply
        );
        targetReport.skillDirWrites.push({
          path: toPosix(folderDestination),
          action: folderResult.action,
          ...(folderResult.warning ? { warning: folderResult.warning } : {}),
        });
        if (folderResult.action !== 'unchanged') {
          report.summary.skillDirsTouched += 1;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        targetReport.skillDirWrites.push({
          path: toPosix(folderDestination),
          action: 'error',
          error: message,
        });
        targetHadError = true;
      }

      const flatDestination = path.join(skillDir, flatSkillFileName);
      try {
        const flatResult = writeTextFile(flatDestination, sourceSkill, args.apply);
        targetReport.flatSkillWrites.push({
          path: toPosix(flatDestination),
          action: flatResult.action,
        });
        if (flatResult.changed) report.summary.flatSkillsTouched += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        targetReport.flatSkillWrites.push({
          path: toPosix(flatDestination),
          action: 'error',
          error: message,
        });
        targetHadError = true;
      }
    }

    if (targetHadError) {
      targetReport.status = 'partial-error';
      report.summary.targetsWithErrors += 1;
    }

    report.targets.push(targetReport);
    report.summary.processed += 1;
  }

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(
    `${args.apply ? 'Applied' : 'Planned'} full-auto command+skill provisioning`
  );
  console.log(`Processed targets: ${report.summary.processed}`);
  console.log(`Skipped targets: ${report.summary.skipped}`);
  console.log(`Targets with errors: ${report.summary.targetsWithErrors}`);
  console.log(`Command writes: ${report.summary.commandsTouched}`);
  console.log(`Skill directory writes: ${report.summary.skillDirsTouched}`);
  console.log(`Flat skill writes: ${report.summary.flatSkillsTouched}`);

  for (const target of report.targets) {
    if (target.status === 'skipped') {
      console.log(`- ${target.name}: skipped (${target.reason})`);
      continue;
    }
    console.log(`- ${target.name}:`);
    for (const write of target.commandWrites) {
      console.log(`  command ${write.action}: ${write.path}`);
    }
    for (const write of target.skillDirWrites) {
      console.log(`  skill-dir ${write.action}: ${write.path}`);
    }
    for (const write of target.flatSkillWrites) {
      console.log(`  skill-flat ${write.action}: ${write.path}`);
    }
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
}
