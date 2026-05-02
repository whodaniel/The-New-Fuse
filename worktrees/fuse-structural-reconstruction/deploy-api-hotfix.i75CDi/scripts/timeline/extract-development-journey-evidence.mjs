#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const DEFAULT_KEYWORDS = [
  'tnf',
  'fuse',
  'the-new-fuse',
  'new fuse',
  'openclaw',
  'clawdbot',
  'antigravity',
  'bizsynth',
  'zeroclaw',
  'picoclaw',
];

const DEFAULT_CODE_EXTENSIONS = [
  '.c',
  '.cc',
  '.cpp',
  '.cs',
  '.css',
  '.go',
  '.java',
  '.js',
  '.json',
  '.jsx',
  '.kt',
  '.mdx',
  '.mjs',
  '.php',
  '.py',
  '.rb',
  '.rs',
  '.scss',
  '.sh',
  '.sql',
  '.swift',
  '.ts',
  '.tsx',
  '.vue',
  '.yaml',
  '.yml',
];

const DEFAULT_MEDIA_EXTENSIONS = [
  '.avi',
  '.gif',
  '.heic',
  '.jpeg',
  '.jpg',
  '.m4v',
  '.mov',
  '.mp4',
  '.png',
  '.webm',
  '.webp',
];

const LOCAL_SCAN_EXCLUDED_SEGMENTS = [
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}.venv${path.sep}`,
  `${path.sep}site-packages${path.sep}`,
  `${path.sep}dist-info${path.sep}`,
  `${path.sep}vendor${path.sep}`,
  `${path.sep}.git${path.sep}`,
  `${path.sep}.turbo${path.sep}`,
  `${path.sep}.next${path.sep}`,
];

const LOCAL_SCAN_EXCLUDED_DIRECTORY_NAMES = [
  'node_modules',
  '.venv',
  'site-packages',
  'dist-info',
  'vendor',
  '.git',
  '.turbo',
  '.next',
];

const DEFAULT_PROJECT_ROOT_MARKERS = [
  '.git',
  'package.json',
  'pnpm-workspace.yaml',
  'pyproject.toml',
  'requirements.txt',
  'go.mod',
  'Cargo.toml',
  'Gemfile',
];

const SENSITIVE_BASENAME_PATTERNS = [
  /^\.env(\..+)?$/i,
  /^id_[a-z0-9._-]+$/i,
  /^(?:known_hosts|authorized_keys)$/i,
  /^.*\.(?:pem|p12|pfx|key|keystore)$/i,
  /(?:^|[-_.])(secret|secrets|credential|credentials|token|wallet|mnemonic|seed|passphrase|private-key|private_key)(?:[-_.]|$)/i,
];

const SENSITIVE_CONTENT_PATTERNS = [
  { label: 'openai_api_key', regex: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { label: 'github_token', regex: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
  { label: 'aws_access_key', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: 'google_api_key', regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { label: 'slack_token', regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { label: 'jwt', regex: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g },
  { label: 'bearer_token', regex: /\bBearer\s+[A-Za-z0-9._-]{16,}\b/g },
  { label: 'token_assignment', regex: /\b(access[_ -]?token|refresh[_ -]?token|api[_ -]?key|client[_ -]?secret|secret[_ -]?key|password|passphrase|ssn|social security number|passport number|date of birth|dob)\b\s*[:=]\s*["']?[^\s"']+/gi },
  { label: 'private_key_marker', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { label: 'wallet_seed', regex: /\b(wallet|seed phrase|mnemonic)\b\s*[:=]\s*["']?[^\n"']+/gi },
];

const MAX_TEXT_SAMPLE_BYTES = 128 * 1024;
const MAX_LOCAL_FILE_BYTES = 8 * 1024 * 1024;

const DEFAULT_REPO_ARTIFACT_PATHS = [
  'docs/protocols/reports',
  'docs/protocols/bridges/reports',
  'docs/migration',
  'docs/database',
  'docs/_archives',
  'output/playwright',
  'logs/trajectories',
  'memory-bank',
  'agent-communication',
];

const DEFAULT_ROOT_FILES = [
  'FINAL-SESSION-SUMMARY.md',
  'SESSION-SUMMARY.md',
  'SESSION_SUMMARY_2025-12-28.md',
  'RELEASE_WAR_ROOM_2026-03-03.md',
  'QA_REPORT_2026-01-11.md',
  'QA_BUG_REPORT_2026-01-11.md',
  'AUDIT_REPORT_2024-12-29.md',
  'SECURITY_AUDIT_FINDINGS.md',
  'COMPREHENSIVE_TEST_REPORT.md',
  'TNF_OPENCLAW_CLOUDFLARE_MIRROR_PLAN.md',
  'deployments.txt',
  'release-gate-output.log',
];

const GITHUB_REPOS = [
  {
    owner: 'whodaniel',
    repo: 'fuse',
    label: 'whodaniel/fuse',
    category: 'repo_created',
  },
  {
    owner: 'clawdbot',
    repo: 'clawdbot',
    label: 'clawdbot/clawdbot',
    category: 'repo_created',
  },
  {
    owner: 'openclaw',
    repo: 'openclaw',
    label: 'openclaw/openclaw',
    category: 'repo_created',
  },
];

function parseArgs(argv) {
  const options = {
    repoRoot: process.cwd(),
    outDir: null,
    includeDefaultLocalRoots: false,
    localRoots: [],
    keywords: [...DEFAULT_KEYWORDS],
    gitLimit: 50,
    artifactLimit: 500,
    localArtifactLimit: 200,
    fetchGithub: true,
    includeExcerpts: false,
    writeSummary: true,
    includeCodeArtifacts: false,
    includeMediaArtifacts: false,
    includeProjectRoots: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--repo-root') {
      options.repoRoot = requireValue(argv, ++i, '--repo-root');
    } else if (arg.startsWith('--repo-root=')) {
      options.repoRoot = arg.slice('--repo-root='.length);
    } else if (arg === '--out-dir') {
      options.outDir = requireValue(argv, ++i, '--out-dir');
    } else if (arg.startsWith('--out-dir=')) {
      options.outDir = arg.slice('--out-dir='.length);
    } else if (arg === '--include-default-local-roots') {
      options.includeDefaultLocalRoots = true;
    } else if (arg === '--local-root') {
      options.localRoots.push(requireValue(argv, ++i, '--local-root'));
    } else if (arg.startsWith('--local-root=')) {
      options.localRoots.push(arg.slice('--local-root='.length));
    } else if (arg === '--keyword') {
      options.keywords.push(requireValue(argv, ++i, '--keyword'));
    } else if (arg.startsWith('--keyword=')) {
      options.keywords.push(arg.slice('--keyword='.length));
    } else if (arg === '--git-limit') {
      options.gitLimit = Number(requireValue(argv, ++i, '--git-limit'));
    } else if (arg.startsWith('--git-limit=')) {
      options.gitLimit = Number(arg.slice('--git-limit='.length));
    } else if (arg === '--artifact-limit') {
      options.artifactLimit = Number(requireValue(argv, ++i, '--artifact-limit'));
    } else if (arg.startsWith('--artifact-limit=')) {
      options.artifactLimit = Number(arg.slice('--artifact-limit='.length));
    } else if (arg === '--local-artifact-limit') {
      options.localArtifactLimit = Number(requireValue(argv, ++i, '--local-artifact-limit'));
    } else if (arg.startsWith('--local-artifact-limit=')) {
      options.localArtifactLimit = Number(arg.slice('--local-artifact-limit='.length));
    } else if (arg === '--no-github') {
      options.fetchGithub = false;
    } else if (arg === '--include-excerpts') {
      options.includeExcerpts = true;
    } else if (arg === '--include-code-artifacts') {
      options.includeCodeArtifacts = true;
    } else if (arg === '--include-media-artifacts') {
      options.includeMediaArtifacts = true;
    } else if (arg === '--include-project-roots') {
      options.includeProjectRoots = true;
    } else if (arg === '--no-summary') {
      options.writeSummary = false;
    } else if (arg === '-h' || arg === '--help') {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!Number.isFinite(options.gitLimit) || options.gitLimit < 0) {
    throw new Error('--git-limit must be a non-negative number');
  }
  if (!Number.isFinite(options.artifactLimit) || options.artifactLimit < 0) {
    throw new Error('--artifact-limit must be a non-negative number');
  }
  if (!Number.isFinite(options.localArtifactLimit) || options.localArtifactLimit < 0) {
    throw new Error('--local-artifact-limit must be a non-negative number');
  }

  if (!options.outDir) {
    options.outDir = path.join(options.repoRoot, 'reports', 'development-journey');
  }

  if (options.includeDefaultLocalRoots) {
    options.localRoots.push(
      path.join(os.homedir(), 'Desktop'),
      path.join(os.homedir(), 'Documents'),
      path.join(os.homedir(), 'Downloads')
    );
  }

  options.repoRoot = path.resolve(options.repoRoot);
  options.outDir = path.resolve(options.outDir);
  options.localRoots = Array.from(new Set(options.localRoots.map((root) => path.resolve(expandHome(root)))));
  options.keywords = Array.from(new Set(options.keywords.map((keyword) => keyword.toLowerCase()).filter(Boolean)));

  return options;
}

function printUsage() {
  console.log('Usage: node scripts/timeline/extract-development-journey-evidence.mjs [options]');
  console.log('');
  console.log('Options:');
  console.log('  --repo-root <path>               TNF repo root (default: current working directory)');
  console.log('  --out-dir <path>                 Output directory (default: reports/development-journey)');
  console.log('  --include-default-local-roots    Include ~/Desktop, ~/Documents, ~/Downloads');
  console.log('  --local-root <path>              Add a local root to scan for note-like files');
  console.log(`  --keyword <term>                 Add a keyword filter (default: ${DEFAULT_KEYWORDS.join(', ')})`);
  console.log('  --git-limit <n>                  Number of earliest git commits to keep (default: 50)');
  console.log('  --artifact-limit <n>             Max repo artifact events (default: 500)');
  console.log('  --local-artifact-limit <n>       Max local note-like artifact events (default: 200)');
  console.log('  --no-github                      Skip GitHub metadata lookups');
  console.log('  --include-excerpts               Include short text excerpts in event payloads when available');
  console.log('  --include-code-artifacts         Include local source code and config files when they match keywords');
  console.log('  --include-media-artifacts        Include screenshots and videos that match keywords');
  console.log('  --include-project-roots          Include local project/repo roots inferred from manifests and .git folders');
  console.log('  --no-summary                     Skip markdown summary output');
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value) throw new Error(`Missing value for ${flag}`);
  return value;
}

function expandHome(value) {
  if (!value.startsWith('~')) return value;
  return path.join(os.homedir(), value.slice(1));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function runCommand(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    throw new Error(`${command} ${args.join(' ')} failed${stderr ? `: ${stderr}` : ''}`);
  }
  return result.stdout;
}

function safeRunCommand(command, args, cwd) {
  try {
    return runCommand(command, args, cwd);
  } catch {
    return '';
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function makeEventId(prefix, value) {
  return `${prefix}:${slugify(value)}`;
}

function toIso(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function extractDateFromFilename(input) {
  const name = path.basename(input);
  const isoLike = name.match(/(20\d{2}-\d{2}-\d{2}T\d{2}[-:]\d{2}[-:]\d{2}Z)/);
  if (isoLike) {
    return toIso(isoLike[1].replace(/T(\d{2})-(\d{2})-(\d{2})Z/, 'T$1:$2:$3Z'));
  }

  const dashed = name.match(/(20\d{2}-\d{2}-\d{2})/);
  if (dashed) {
    return toIso(`${dashed[1]}T00:00:00Z`);
  }

  const compactWithTime = name.match(/(20\d{2})(\d{2})(\d{2})[-_]?(\d{2})(\d{2})(\d{2})/);
  if (compactWithTime) {
    return toIso(
      `${compactWithTime[1]}-${compactWithTime[2]}-${compactWithTime[3]}T${compactWithTime[4]}:${compactWithTime[5]}:${compactWithTime[6]}Z`
    );
  }

  const compactDate = name.match(/(20\d{2})(\d{2})(\d{2})/);
  if (compactDate) {
    return toIso(`${compactDate[1]}-${compactDate[2]}-${compactDate[3]}T00:00:00Z`);
  }

  return null;
}

function guessCategoryFromPath(filePath) {
  const normalized = filePath.toLowerCase();
  if (normalized.includes('migration')) return 'migration';
  if (normalized.includes('qa') || normalized.includes('audit') || normalized.includes('test')) return 'qa';
  if (normalized.includes('trajectory') || normalized.includes('handoff') || normalized.includes('execution')) {
    return 'execution';
  }
  if (normalized.includes('report') || normalized.includes('summary') || normalized.includes('plan')) {
    return 'strategy_doc';
  }
  return 'strategy_doc';
}

function buildKeywordsRegex(keywords) {
  const pattern = keywords.map((keyword) => escapeRegex(keyword)).join('|');
  return new RegExp(pattern, 'i');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function walkFiles(root, predicate, out = [], walkOptions = {}) {
  if (!fs.existsSync(root)) return out;
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (walkOptions.skipDir?.(abs, entry)) continue;
      walkFiles(abs, predicate, out, walkOptions);
    } else if (predicate(abs, entry)) {
      out.push(abs);
    }
  }
  return out;
}

function readTextSample(filePath, maxBytes = MAX_TEXT_SAMPLE_BYTES) {
  try {
    return fs.readFileSync(filePath, 'utf8').replace(/\r/g, '').slice(0, maxBytes);
  } catch {
    return null;
  }
}

function excerptFromSample(sample) {
  const line = sample
      .split('\n')
      .map((value) => value.trim())
      .find((value) => value && !value.startsWith('#!/'));
  if (!line) return null;
  return line.slice(0, 220);
}

function readExcerpt(filePath) {
  const sample = readTextSample(filePath);
  if (!sample) return null;
  return excerptFromSample(sample);
}

function isCodeLike(filePath) {
  return DEFAULT_CODE_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}

function isMediaLike(filePath) {
  return DEFAULT_MEDIA_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}

export function detectLocalSourceKind(filePath, options = {}) {
  if (isTextLike(filePath)) return 'text';
  if (options.includeCodeArtifacts && isCodeLike(filePath)) return 'code';
  if (options.includeMediaArtifacts && isMediaLike(filePath)) return 'media';
  return null;
}

function isLocalExcludedPath(filePath) {
  const normalized = filePath.toLowerCase();
  const basename = path.basename(normalized);
  return (
    LOCAL_SCAN_EXCLUDED_SEGMENTS.some((segment) => normalized.includes(segment)) ||
    LOCAL_SCAN_EXCLUDED_DIRECTORY_NAMES.includes(basename)
  );
}

function isSensitivePath(filePath) {
  const normalized = filePath.toLowerCase();
  const basename = path.basename(normalized);
  return SENSITIVE_BASENAME_PATTERNS.some((pattern) => pattern.test(basename) || pattern.test(normalized));
}

export function findSensitiveContentSignals(text) {
  if (!text) return [];
  const signals = new Set();
  for (const pattern of SENSITIVE_CONTENT_PATTERNS) {
    if (pattern.regex.test(text)) {
      signals.add(pattern.label);
    }
    pattern.regex.lastIndex = 0;
  }
  return [...signals];
}

function createPrivacyStats() {
  return {
    skippedSensitivePathCount: 0,
    skippedSensitiveContentCount: 0,
    skippedOversizeCount: 0,
  };
}

function inspectTextCandidate(filePath, privacyStats) {
  const sample = readTextSample(filePath);
  if (!sample) {
    return { sample: null, excerpt: null, sensitiveSignals: [] };
  }

  const sensitiveSignals = findSensitiveContentSignals(sample);
  if (sensitiveSignals.length) {
    privacyStats.skippedSensitiveContentCount += 1;
    return { sample, excerpt: null, sensitiveSignals };
  }

  return {
    sample,
    excerpt: excerptFromSample(sample),
    sensitiveSignals: [],
  };
}

function checkLocalFileSize(filePath, privacyStats) {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_LOCAL_FILE_BYTES) {
      privacyStats.skippedOversizeCount += 1;
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function maybeSkipSensitivePath(filePath, privacyStats) {
  if (!isSensitivePath(filePath)) return false;
  privacyStats.skippedSensitivePathCount += 1;
  return true;
}

function describeLocalCategory(filePath, sourceKind) {
  if (sourceKind === 'code') return 'code_artifact';
  if (sourceKind === 'media') return 'media_experiment';
  return guessCategoryFromPath(filePath);
}

function describeLocalSummary(relativeLabel, sourceKind) {
  if (sourceKind === 'code') {
    return `Local code artifact matched journey keywords: ${relativeLabel}`;
  }
  if (sourceKind === 'media') {
    return `Local media artifact matched journey keywords: ${relativeLabel}`;
  }
  return `Local note-like artifact matched journey keywords: ${relativeLabel}`;
}

function localConfidenceFromSource(source, sourceKind) {
  if (sourceKind === 'media') return source === 'filename' ? 'strong' : 'moderate';
  return source === 'filename' ? 'strong' : 'moderate';
}

function buildLocalEvidence(absPath, root, source, sourceKind) {
  return [
    buildEvidence(sourceKind === 'media' ? 'media' : 'document', absPath, {
      dateSource: source,
      root,
      sourceKind,
    }),
  ];
}

function firstGitCommitForRepo(repoRoot) {
  const output = safeRunCommand(
    'git',
    ['log', '--reverse', '--format=%aI\t%H\t%s'],
    repoRoot
  );
  if (!output.trim()) return null;
  const [timestamp, hash, subject] = output.trim().split('\n')[0].split('\t');
  if (!timestamp || !hash) return null;
  return { timestamp, hash, subject: subject || null };
}

function discoverProjectRoots(root, options) {
  const results = [];
  const repoRootPrefix = `${options.repoRoot}${path.sep}`;

  function walk(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    if (isLocalExcludedPath(dirPath)) return;
    if (dirPath === options.repoRoot || dirPath.startsWith(repoRootPrefix)) return;

    let entries;
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    const names = new Set(entries.map((entry) => entry.name));
    const marker = DEFAULT_PROJECT_ROOT_MARKERS.find((candidate) => names.has(candidate));
    if (marker) {
      results.push({ root: dirPath, marker });
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      walk(path.join(dirPath, entry.name));
    }
  }

  walk(root);
  return results;
}

function readProjectDescriptor(projectRoot, privacyStats) {
  const candidates = ['README.md', 'README.txt', 'README', 'package.json', 'pyproject.toml', 'Cargo.toml'];
  for (const candidate of candidates) {
    const absPath = path.join(projectRoot, candidate);
    if (!fs.existsSync(absPath) || maybeSkipSensitivePath(absPath, privacyStats)) continue;
    const inspected = inspectTextCandidate(absPath, privacyStats);
    if (inspected.sensitiveSignals.length) continue;
    if (inspected.excerpt) {
      return {
        excerpt: inspected.excerpt,
        source: absPath,
      };
    }
  }
  return { excerpt: null, source: null };
}

function collectLocalProjectRootEvents(options, privacyStats) {
  if (!options.includeProjectRoots) return [];

  const keywordRegex = buildKeywordsRegex(options.keywords);
  const results = [];

  for (const localRoot of options.localRoots) {
    const projectRoots = discoverProjectRoots(localRoot, options);
    for (const project of projectRoots) {
      if (results.length >= options.localArtifactLimit * 2) break;
      if (maybeSkipSensitivePath(project.root, privacyStats)) continue;

      const relativeLabel = project.root.startsWith(localRoot) ? path.relative(localRoot, project.root) : project.root;
      const descriptor = readProjectDescriptor(project.root, privacyStats);
      if (!keywordRegex.test(relativeLabel) && !(descriptor.excerpt && keywordRegex.test(descriptor.excerpt))) {
        continue;
      }

      let timestampInfo = fileTimestamp(project.root);
      const gitInfo = project.marker === '.git' ? firstGitCommitForRepo(project.root) : null;
      if (gitInfo?.timestamp) {
        timestampInfo = { timestamp: gitInfo.timestamp, source: 'git_first_commit' };
      }
      if (!timestampInfo.timestamp) continue;

      const payload = {
        path: project.root,
        root: localRoot,
        dateSource: timestampInfo.source,
        projectMarker: project.marker,
        descriptorSource: descriptor.source,
      };
      if (options.includeExcerpts && descriptor.excerpt) {
        payload.excerpt = descriptor.excerpt;
      }

      const evidence = [
        buildEvidence('project_root', project.root, {
          root: localRoot,
          projectMarker: project.marker,
          dateSource: timestampInfo.source,
        }),
      ];
      if (gitInfo?.hash) {
        evidence.push(buildEvidence('git_commit', gitInfo.hash));
      }

      results.push(
        createLedgerEntry({
          eventId: makeEventId('local-project-root', project.root),
          timestamp: timestampInfo.timestamp,
          label: path.basename(project.root),
          category: 'project_root',
          confidence: timestampInfo.source === 'git_first_commit' ? 'strong' : 'moderate',
          summary: `Local project or repo root matched journey keywords: ${relativeLabel}`,
          evidence,
          payload,
        })
      );
    }
  }

  return results;
}

function collectLocalArtifactEvents(options, privacyStats) {
  const localKeywords = options.keywords.filter((keyword) => keyword !== 'fuse');
  const keywordRegex = buildKeywordsRegex(localKeywords);
  const results = [];
  const repoRootPrefix = `${options.repoRoot}${path.sep}`;

  for (const localRoot of options.localRoots) {
    const files = walkFiles(
      localRoot,
      (filePath) => Boolean(detectLocalSourceKind(filePath, options)),
      [],
      { skipDir: (dirPath) => isLocalExcludedPath(dirPath) }
    );
    for (const absPath of files) {
      if (results.length >= options.localArtifactLimit * 4) break;
      if (absPath === options.repoRoot || absPath.startsWith(repoRootPrefix)) {
        continue;
      }
      if (maybeSkipSensitivePath(absPath, privacyStats)) continue;
      if (!checkLocalFileSize(absPath, privacyStats)) continue;

      const sourceKind = detectLocalSourceKind(absPath, options);
      if (!sourceKind) continue;

      const relativeLabel = absPath.startsWith(localRoot) ? path.relative(localRoot, absPath) : absPath;
      let excerpt = null;
      if (sourceKind !== 'media') {
        const inspected = inspectTextCandidate(absPath, privacyStats);
        if (inspected.sensitiveSignals.length) continue;
        excerpt = inspected.excerpt;
      }

      if (!keywordRegex.test(relativeLabel) && !(excerpt && keywordRegex.test(excerpt))) {
        continue;
      }

      const { timestamp, source } = fileTimestamp(absPath);
      if (!timestamp) continue;

      const payload = {
        path: absPath,
        root: localRoot,
        dateSource: source,
        sourceKind,
      };
      if (options.includeExcerpts && excerpt) {
        payload.excerpt = excerpt;
      }

      results.push(
        createLedgerEntry({
          eventId: makeEventId(`local-${sourceKind}`, absPath),
          timestamp,
          label: path.basename(absPath),
          category: describeLocalCategory(absPath, sourceKind),
          confidence: localConfidenceFromSource(source, sourceKind),
          summary: describeLocalSummary(relativeLabel, sourceKind),
          evidence: buildLocalEvidence(absPath, localRoot, source, sourceKind),
          payload,
        })
      );
    }
  }

  return results;
}

function trimLocalEntries(entries, limit) {
  return sortLedger(entries).slice(0, limit);
}

function buildSourceModeSummary(options) {
  const enabled = ['notes'];
  if (options.includeCodeArtifacts) enabled.push('code');
  if (options.includeMediaArtifacts) enabled.push('media');
  if (options.includeProjectRoots) enabled.push('project-roots');
  return enabled.join(', ');
}

function buildPrivacyWarnings(privacyStats) {
  const warnings = [];
  if (privacyStats.skippedSensitivePathCount) {
    warnings.push(`Sensitive paths skipped: ${privacyStats.skippedSensitivePathCount}`);
  }
  if (privacyStats.skippedSensitiveContentCount) {
    warnings.push(`Sensitive-content files skipped: ${privacyStats.skippedSensitiveContentCount}`);
  }
  if (privacyStats.skippedOversizeCount) {
    warnings.push(`Oversize local files skipped: ${privacyStats.skippedOversizeCount}`);
  }
  return warnings;
}

function fileTimestamp(filePath) {
  const datedName = extractDateFromFilename(filePath);
  if (datedName) return { timestamp: datedName, source: 'filename' };
  try {
    const stats = fs.statSync(filePath);
    const timestamp = stats.birthtimeMs > 0 ? stats.birthtime : stats.mtime;
    return { timestamp: timestamp.toISOString(), source: stats.birthtimeMs > 0 ? 'birthtime' : 'mtime' };
  } catch {
    return { timestamp: null, source: null };
  }
}

function normalizeRelative(repoRoot, filePath) {
  if (filePath.startsWith(repoRoot)) {
    return path.relative(repoRoot, filePath) || '.';
  }
  return filePath;
}

function buildEvidence(type, ref, extra = {}) {
  return { type, ref, ...extra };
}

function createLedgerEntry({
  eventId,
  timestamp,
  label,
  category,
  confidence,
  summary,
  evidence,
  payload = {},
}) {
  return {
    eventId,
    timestamp,
    label,
    category,
    confidence,
    summary,
    evidence,
    payload,
  };
}

async function fetchRepoMetadata(owner, repo) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      'User-Agent': 'tnf-development-journey-extractor',
      Accept: 'application/vnd.github+json',
    },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`GitHub lookup failed for ${owner}/${repo}: ${response.status}`);
  }
  return response.json();
}

async function collectGithubEvents(options) {
  if (!options.fetchGithub) return [];
  const events = [];
  for (const repo of GITHUB_REPOS) {
    try {
      const metadata = await fetchRepoMetadata(repo.owner, repo.repo);
      if (!metadata?.created_at || !metadata?.full_name) continue;
      events.push(
        createLedgerEntry({
          eventId: makeEventId('github-repo-created', metadata.full_name),
          timestamp: metadata.created_at,
          label: `${metadata.full_name} repository created`,
          category: repo.category,
          confidence: 'hard',
          summary: `${metadata.full_name} was created on GitHub.`,
          evidence: [
            buildEvidence('github_api', `https://api.github.com/repos/${repo.owner}/${repo.repo}`),
            buildEvidence('github_repo', metadata.html_url || `https://github.com/${metadata.full_name}`),
          ],
          payload: {
            repoFullName: metadata.full_name,
            sourceLabel: repo.label,
            defaultBranch: metadata.default_branch || null,
          },
        })
      );
    } catch (error) {
      events.push(
        createLedgerEntry({
          eventId: makeEventId('github-repo-lookup-failed', `${repo.owner}-${repo.repo}`),
          timestamp: new Date().toISOString(),
          label: `GitHub metadata lookup failed for ${repo.owner}/${repo.repo}`,
          category: 'inference',
          confidence: 'moderate',
          summary: String(error.message || error),
          evidence: [buildEvidence('github_api', `https://api.github.com/repos/${repo.owner}/${repo.repo}`)],
          payload: {
            lookupFailed: true,
          },
        })
      );
    }
  }
  return events;
}

function collectGitCommitEvents(options) {
  const output = safeRunCommand(
    'git',
    ['log', '--reverse', '--format=%aI\t%H\t%s'],
    options.repoRoot
  );
  if (!output.trim()) return [];
  const lines = output.trim().split('\n').filter(Boolean).slice(0, options.gitLimit);
  return lines
    .map((line) => {
      const [timestamp, hash, subject] = line.split('\t');
      if (!timestamp || !hash || !subject) return null;
      return createLedgerEntry({
        eventId: makeEventId('git-commit', hash),
        timestamp,
        label: subject,
        category: 'commit_milestone',
        confidence: 'hard',
        summary: `Early git milestone commit: ${subject}`,
        evidence: [
          buildEvidence('git_commit', hash),
          buildEvidence('git_repo', options.repoRoot),
        ],
        payload: {
          hash,
          subject,
        },
      });
    })
    .filter(Boolean);
}

function firstGitCommitForFile(repoRoot, relativePath) {
  const output = safeRunCommand(
    'git',
    ['log', '--follow', '--reverse', '--format=%aI\t%H\t%s', '--', relativePath],
    repoRoot
  );
  if (!output.trim()) return null;
  const [timestamp, hash, subject] = output.trim().split('\n')[0].split('\t');
  if (!timestamp || !hash) return null;
  return { timestamp, hash, subject: subject || null };
}

function collectRepoArtifactEvents(options, privacyStats) {
  const keywordRegex = buildKeywordsRegex(options.keywords);
  const files = [];

  for (const relative of DEFAULT_REPO_ARTIFACT_PATHS) {
    const abs = path.join(options.repoRoot, relative);
    walkFiles(abs, (filePath) => /\.(md|txt|rtf|json|log)$/i.test(filePath), files);
  }

  for (const relative of DEFAULT_ROOT_FILES) {
    const abs = path.join(options.repoRoot, relative);
    if (fs.existsSync(abs)) files.push(abs);
  }

  const uniqueFiles = Array.from(new Set(files)).sort();
  const events = [];

  for (const absPath of uniqueFiles) {
    if (events.length >= options.artifactLimit) break;
    if (maybeSkipSensitivePath(absPath, privacyStats)) continue;
    const relativePath = normalizeRelative(options.repoRoot, absPath);
    const inspected = inspectTextCandidate(absPath, privacyStats);
    if (inspected.sensitiveSignals.length) continue;
    const excerpt = inspected.excerpt;
    if (!keywordRegex.test(relativePath) && !(excerpt && keywordRegex.test(excerpt))) {
      continue;
    }

    let timestampInfo = fileTimestamp(absPath);
    let gitInfo = null;
    if (!timestampInfo.timestamp || timestampInfo.source === 'birthtime' || timestampInfo.source === 'mtime') {
      gitInfo = firstGitCommitForFile(options.repoRoot, relativePath);
      if (gitInfo?.timestamp) {
        timestampInfo = { timestamp: gitInfo.timestamp, source: 'git_first_commit' };
      }
    }
    if (!timestampInfo.timestamp) continue;

    const evidence = [buildEvidence('document', relativePath, { dateSource: timestampInfo.source })];
    if (gitInfo?.hash) {
      evidence.push(buildEvidence('git_commit', gitInfo.hash));
    }

    const payload = {
      path: relativePath,
      dateSource: timestampInfo.source,
    };
    if (options.includeExcerpts && excerpt) {
      payload.excerpt = excerpt;
    }

    events.push(
      createLedgerEntry({
        eventId: makeEventId('artifact', relativePath),
        timestamp: timestampInfo.timestamp,
        label: path.basename(relativePath),
        category: guessCategoryFromPath(relativePath),
        confidence: timestampInfo.source === 'filename' || timestampInfo.source === 'git_first_commit' ? 'strong' : 'moderate',
        summary: `Relevant project artifact discovered at ${relativePath}`,
        evidence,
        payload,
      })
    );
  }

  return events;
}

function isTextLike(filePath) {
  return /\.(md|markdown|txt|rtf)$/i.test(filePath);
}

export function buildTimelineBatch(ledger, actor = 'tnf_journey_reconstruction') {
  return ledger.map((entry) => ({
    eventType: 'historical_event',
    actor,
    timestamp: entry.timestamp,
    payload: {
      category: entry.category,
      label: entry.label,
      summary: entry.summary,
      confidence: entry.confidence,
      evidenceRefs: entry.evidence.map((item) => item.ref),
      sourceEventId: entry.eventId,
      metadata: entry.payload,
    },
  }));
}

function dedupeLedger(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = `${entry.eventId}|${entry.timestamp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortLedger(entries) {
  return [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.eventId.localeCompare(b.eventId));
}

function buildSummaryMarkdown({ options, ledger, timelineBatch, warnings, privacyStats }) {
  const countsByCategory = countBy(ledger, (entry) => entry.category);
  const countsByConfidence = countBy(ledger, (entry) => entry.confidence);
  const earliest = ledger[0] || null;
  const latest = ledger[ledger.length - 1] || null;
  const nonPrivacyWarnings = warnings.filter(
    (warning) =>
      !warning.startsWith('Sensitive paths skipped:') &&
      !warning.startsWith('Sensitive-content files skipped:') &&
      !warning.startsWith('Oversize local files skipped:')
  );
  const lines = [];
  lines.push('# TNF Development Journey Evidence Summary');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Repo root: ${options.repoRoot}`);
  lines.push('');
  lines.push('## Counts');
  lines.push('');
  lines.push(`- Ledger events: ${ledger.length}`);
  lines.push(`- Timeline batch events: ${timelineBatch.length}`);
  lines.push(`- Keywords: ${options.keywords.join(', ')}`);
  lines.push(`- Local roots scanned: ${options.localRoots.length ? options.localRoots.join(', ') : '(none)'}`);
  lines.push(`- Source modes: ${buildSourceModeSummary(options)}`);
  lines.push('');
  lines.push('## By Category');
  lines.push('');
  for (const [category, count] of Object.entries(countsByCategory).sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`- ${category}: ${count}`);
  }
  lines.push('');
  lines.push('## By Confidence');
  lines.push('');
  for (const [confidence, count] of Object.entries(countsByConfidence).sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`- ${confidence}: ${count}`);
  }
  lines.push('');
  if (earliest || latest) {
    lines.push('## Range');
    lines.push('');
    if (earliest) lines.push(`- Earliest: ${earliest.timestamp} — ${earliest.label}`);
    if (latest) lines.push(`- Latest: ${latest.timestamp} — ${latest.label}`);
    lines.push('');
  }
  lines.push('## Anchor Samples');
  lines.push('');
  for (const entry of ledger.slice(0, 12)) {
    lines.push(`- ${entry.timestamp} | ${entry.category} | ${entry.label}`);
  }
  if (nonPrivacyWarnings.length) {
    lines.push('');
    lines.push('## Warnings');
    lines.push('');
    for (const warning of nonPrivacyWarnings) {
      lines.push(`- ${warning}`);
    }
  }
  lines.push('');
  lines.push('## Privacy Guardrails');
  lines.push('');
  lines.push(`- Sensitive paths skipped: ${privacyStats.skippedSensitivePathCount}`);
  lines.push(`- Sensitive-content files skipped: ${privacyStats.skippedSensitiveContentCount}`);
  lines.push(`- Oversize local files skipped: ${privacyStats.skippedOversizeCount}`);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function countBy(list, keyFn) {
  return list.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export async function extractDevelopmentJourneyEvidence(options) {
  const warnings = [];
  const ledger = [];
  const privacyStats = createPrivacyStats();

  if (!fs.existsSync(path.join(options.repoRoot, '.git'))) {
    throw new Error(`No .git directory found at repo root: ${options.repoRoot}`);
  }

  ledger.push(...(await collectGithubEvents(options)));
  ledger.push(...collectGitCommitEvents(options));
  ledger.push(...collectRepoArtifactEvents(options, privacyStats));

  const localEntries = [
    ...collectLocalProjectRootEvents(options, privacyStats),
    ...collectLocalArtifactEvents(options, privacyStats),
  ];
  ledger.push(...trimLocalEntries(localEntries, options.localArtifactLimit));

  if (!options.localRoots.length) {
    warnings.push('No local roots were scanned. Exported Notes/TextEdit material can be added with --local-root or --include-default-local-roots.');
  } else if (!ledger.some((entry) => entry.eventId.startsWith('local-'))) {
    warnings.push('Local roots were scanned, but no external artifacts matched the current journey keywords and privacy filters.');
  }
  warnings.push(...buildPrivacyWarnings(privacyStats));

  const deduped = sortLedger(dedupeLedger(ledger));
  const timelineBatch = buildTimelineBatch(deduped);

  ensureDir(options.outDir);
  const ledgerPath = path.join(options.outDir, 'tnf-development-journey-evidence.json');
  const timelinePath = path.join(options.outDir, 'tnf-development-journey-timeline-events.json');
  fs.writeFileSync(ledgerPath, JSON.stringify(deduped, null, 2));
  fs.writeFileSync(timelinePath, JSON.stringify(timelineBatch, null, 2));

  let summaryPath = null;
  if (options.writeSummary) {
    summaryPath = path.join(options.outDir, 'tnf-development-journey-summary.md');
    fs.writeFileSync(
      summaryPath,
      buildSummaryMarkdown({ options, ledger: deduped, timelineBatch, warnings, privacyStats })
    );
  }

  return {
    ledger: deduped,
    timelineBatch,
    warnings,
    privacyStats,
    output: {
      ledgerPath,
      timelinePath,
      summaryPath,
    },
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await extractDevelopmentJourneyEvidence(options);
  const payload = {
    ok: true,
    ledgerEvents: result.ledger.length,
    timelineEvents: result.timelineBatch.length,
    privacyStats: result.privacyStats,
    output: result.output,
    warnings: result.warnings,
  };
  console.log(JSON.stringify(payload, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Journey extraction failed: ${error.message}`);
    process.exit(1);
  });
}
