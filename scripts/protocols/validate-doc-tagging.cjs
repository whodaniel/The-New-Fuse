#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = process.cwd();
const HEADER_SCAN_LINES = 40;

const STRICT_FILES = [
  'docs/protocols/TNF_DOCUMENT_TAGGING_PROTOCOL.md',
  'docs/protocols/TNF_DOCUMENT_VETTING_PROCEDURE.md',
  'docs/protocols/TNF_SYSTEM_LEXICON.md',
  'docs/protocols/TNF_VIRTUAL_LIBRARY_CONSOLIDATION_PROTOCOL.md',
  'docs/protocols/TNF_INFORMATION_INGESTION_PIPELINE.md',
  'docs/library/README.md',
  'docs/library/REGISTRY.md',
];

const ENUM = {
  CLASS: new Set(['PRIME', 'INTEL', 'RAW', 'SRC', 'HYBRID']),
  STATUS: new Set(['LOCKED', 'VETTED', 'PENDING', 'LEGACY', 'PURGE', 'SYNCHRONIZED']),
  DOC_TYPE: new Set([
    'PROTOCOL_STANDARD',
    'PROTOCOL_RUNBOOK',
    'TECHNICAL_DOSSIER',
    'SESSION_SUMMARY',
    'INDEX',
    'BOOK_MANUSCRIPT',
    'STORY_OUTLINE',
    'STORY_CHAPTER',
    'STORY_NOTE',
    'SOURCE_VERBATIM',
    'DATA_SCHEMA',
  ]),
  VISIBILITY: new Set(['PRIVATE', 'AGENT_SCOPE', 'COLLECTIVE', 'PUBLIC']),
};

const MANUSCRIPT_DOC_TYPES = new Set([
  'BOOK_MANUSCRIPT',
  'STORY_OUTLINE',
  'STORY_CHAPTER',
  'STORY_NOTE',
]);

const OWNER_REQUIRED_VISIBILITY = new Set(['PRIVATE', 'AGENT_SCOPE']);

function walkMarkdown(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  const out = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        out.push(full);
      }
    }
  }
  return out;
}

function toRel(absPath) {
  return path.relative(REPO_ROOT, absPath).replaceAll(path.sep, '/');
}

function parseHeaderTags(fileText) {
  const lines = fileText.split('\n').slice(0, HEADER_SCAN_LINES);
  const header = lines.join('\n');
  const tags = new Map();
  const regex = /\[([A-Z_]+):([^\]]+)\]/g;
  let match = regex.exec(header);
  while (match) {
    const key = match[1];
    if (!tags.has(key)) {
      tags.set(key, String(match[2]).trim());
    }
    match = regex.exec(header);
  }
  return tags;
}

function main() {
  const errors = [];
  const warnings = [];

  const strictFiles = STRICT_FILES
    .map((relPath) => path.join(REPO_ROOT, relPath))
    .filter((absPath) => fs.existsSync(absPath));

  const libraryDocs = walkMarkdown(path.join(REPO_ROOT, 'docs', 'library'));
  const filesToCheck = [...new Set([...strictFiles, ...libraryDocs])].sort();

  if (filesToCheck.length === 0) {
    console.log('[doc-tagging-gate] No files found to validate.');
    return;
  }

  for (const absPath of filesToCheck) {
    const relPath = toRel(absPath);
    const raw = fs.readFileSync(absPath, 'utf8');
    const tags = parseHeaderTags(raw);

    for (const key of ['CLASS', 'STATUS', 'DOC_TYPE', 'VISIBILITY']) {
      if (!tags.has(key)) {
        errors.push(`${relPath}: missing required tag [${key}:...]`);
      }
    }

    const classValue = tags.get('CLASS');
    const statusValue = tags.get('STATUS');
    const docTypeValue = tags.get('DOC_TYPE');
    const visibilityValue = tags.get('VISIBILITY');
    const ownerValue = tags.get('OWNER');
    const workIdValue = tags.get('WORK_ID');

    if (classValue && !ENUM.CLASS.has(classValue)) {
      errors.push(`${relPath}: invalid CLASS "${classValue}"`);
    }
    if (statusValue && !ENUM.STATUS.has(statusValue)) {
      errors.push(`${relPath}: invalid STATUS "${statusValue}"`);
    }
    if (docTypeValue && !ENUM.DOC_TYPE.has(docTypeValue)) {
      errors.push(`${relPath}: invalid DOC_TYPE "${docTypeValue}"`);
    }
    if (visibilityValue && !ENUM.VISIBILITY.has(visibilityValue)) {
      errors.push(`${relPath}: invalid VISIBILITY "${visibilityValue}"`);
    }

    if (visibilityValue && OWNER_REQUIRED_VISIBILITY.has(visibilityValue) && !ownerValue) {
      errors.push(`${relPath}: visibility "${visibilityValue}" requires [OWNER:...]`);
    }

    if (docTypeValue && MANUSCRIPT_DOC_TYPES.has(docTypeValue) && !workIdValue) {
      errors.push(`${relPath}: doc type "${docTypeValue}" requires [WORK_ID:...]`);
    }

    if (ownerValue && !/^[A-Z0-9_.-]+$/.test(ownerValue)) {
      warnings.push(`${relPath}: OWNER "${ownerValue}" should be normalized uppercase slug`);
    }
  }

  if (errors.length > 0 || warnings.length > 0) {
    console.log(
      JSON.stringify(
        {
          checked_files: filesToCheck.map(toRel),
          errors,
          warnings,
        },
        null,
        2
      )
    );
  }

  if (errors.length > 0) {
    process.exit(1);
  }

  console.log(`[doc-tagging-gate] OK (${filesToCheck.length} files checked)`);
}

main();
