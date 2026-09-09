#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const MAP_PATH = path.join(ROOT, 'data', 'distribution', 'product-repo-map.json');
const OSS_PATH = path.join(ROOT, 'data', 'distribution', 'oss-app-boundary.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeGithub(url) {
  return String(url || '')
    .trim()
    .replace(/^git@github\.com:/i, 'https://github.com/')
    .replace(/^ssh:\/\/git@github\.com\//i, 'https://github.com/')
    .replace(/\.git$/i, '')
    .replace(/\/$/, '')
    .toLowerCase();
}

function slugFromGithub(url) {
  const n = normalizeGithub(url);
  const m = n.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)$/i);
  return m ? m[1] : n;
}

function gitRemotes() {
  const result = spawnSync('git', ['remote', '-v'], { cwd: ROOT, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`git remote -v failed: ${result.stderr || result.status}`);
  }
  const map = new Map();
  for (const line of String(result.stdout || '').split('\n')) {
    const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)/);
    if (!match) continue;
    const [, name, url, kind] = match;
    const entry = map.get(name) || {};
    entry[kind] = url;
    map.set(name, entry);
  }
  return map;
}

function main() {
  const map = readJson(MAP_PATH);
  const oss = readJson(OSS_PATH);
  const errors = [];

  if (map.schemaVersion !== 1) {
    errors.push(`product-repo-map schemaVersion must be 1, got ${map.schemaVersion}`);
  }

  const remotes = gitRemotes();
  const required = map.monorepoRemotes.required || {};
  const origin = remotes.get('origin');
  const originNorm = normalizeGithub(origin && (origin.fetch || origin.push));
  const archivedGithubEarly = new Set(
    (map.lineageArchives || []).map((entry) => normalizeGithub(entry.github))
  );

  if (originNorm && archivedGithubEarly.has(originNorm)) {
    errors.push(`origin points at archived lineage repo ${originNorm}; canonical development is tnf-monorepo`);
  }

  for (const name of map.monorepoRemotes.forbidden || []) {
    if (remotes.has(name)) {
      errors.push(
        `forbidden remote ${name} is present (${remotes.get(name).fetch || remotes.get(name).push}). Remove it.`
      );
    }
  }

  const isMonorepoCheckout = originNorm === normalizeGithub(map.core.development.github);
  if (isMonorepoCheckout) {
    for (const [name, want] of Object.entries(required)) {
      const got = remotes.get(name);
      if (!got) {
        errors.push(`missing required remote ${name} → ${want}`);
        continue;
      }
      const fetchUrl = got.fetch || got.push;
      if (normalizeGithub(fetchUrl) !== normalizeGithub(want)) {
        errors.push(`remote ${name} is ${fetchUrl}, expected ${want}`);
      }
    }
  }

  const satelliteGithub = new Set();
  for (const entry of [
    ...(oss.standaloneSatelliteRepos || []),
    ...(oss.nonOssOrPersonalApps || []),
  ]) {
    if (entry.github) satelliteGithub.add(normalizeGithub(entry.github));
  }

  const liveGithub = new Set([
    normalizeGithub(map.core.development.github),
    normalizeGithub(map.core.openRuntime.github),
    normalizeGithub(map.core.controlPlane.github),
    ...satelliteGithub,
    ...(map.standaloneProducts || []).map((p) => normalizeGithub(p.github)),
    ...(map.infraBackups || []).map((p) => normalizeGithub(p.github)),
  ]);

  const archivedGithub = new Set();
  for (const entry of map.lineageArchives || []) {
    const slug = normalizeGithub(entry.github);
    archivedGithub.add(slug);
    if (liveGithub.has(slug)) {
      errors.push(`archive ${entry.github} is also listed as a live product`);
    }
  }

  for (const slug of satelliteGithub) {
    if (archivedGithub.has(slug)) {
      errors.push(`satellite ${slug} is listed as a lineage archive`);
    }
  }

  const seenArchive = new Set();
  for (const entry of map.lineageArchives || []) {
    const slug = slugFromGithub(entry.github);
    if (seenArchive.has(slug)) errors.push(`duplicate lineageArchives entry: ${slug}`);
    seenArchive.add(slug);
  }

  if (errors.length > 0) {
    console.error('[product-repo-map] FAIL');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log('[product-repo-map] OK');
  console.log(`checkout=${isMonorepoCheckout ? 'tnf-monorepo' : originNorm || '(no origin)'}`);
  console.log(`forbiddenRemotesAbsent=${(map.monorepoRemotes.forbidden || []).join(',')}`);
  console.log(`lineageArchives=${(map.lineageArchives || []).length}`);
  console.log(`standaloneProducts=${(map.standaloneProducts || []).length}`);
}

main();
