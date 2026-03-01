#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, 'docs');
const SOURCE_MD = path.join(DOCS_DIR, 'NANOBANANA_POKER_GRAPHICS_SWARM_PROMPTS.md');
const OUT_JSON = path.join(DOCS_DIR, 'NANOBANANA_POKER_GRAPHICS_MANIFEST.json');
const OUT_CSV = path.join(DOCS_DIR, 'NANOBANANA_POKER_GRAPHICS_MANIFEST.csv');

const GLOBAL_STYLE_START = 'Use this style block at the top of every generation request:';

function normalize(s) {
  return s.replace(/\r\n/g, '\n');
}

function parseGlobalStyle(md) {
  const start = md.indexOf(GLOBAL_STYLE_START);
  if (start === -1) return '';
  const after = md.slice(start);
  const blockMatch = after.match(/```text\n([\s\S]*?)\n```/);
  return blockMatch ? blockMatch[1].trim() : '';
}

function parseAssets(md) {
  const lines = md.split('\n');
  const groups = [];
  let currentGroup = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const groupMatch = line.match(/^##\s+(\d+)\)\s+(.+)$/);
    if (groupMatch) {
      currentGroup = {
        groupIndex: Number(groupMatch[1]),
        groupName: groupMatch[2].trim(),
        assets: [],
      };
      groups.push(currentGroup);
      continue;
    }

    const assetMatch = line.match(/^1\.\s+`([^`]+)`\s*$/);
    if (!assetMatch || !currentGroup) continue;

    const filename = assetMatch[1].trim();

    while (i + 1 < lines.length && lines[i + 1].trim() === '') i += 1;
    if (i + 1 >= lines.length || lines[i + 1].trim() !== '```text') continue;

    i += 2;
    const promptLines = [];
    while (i < lines.length && lines[i].trim() !== '```') {
      promptLines.push(lines[i]);
      i += 1;
    }

    const prompt = promptLines.join('\n').trim();
    currentGroup.assets.push({ filename, prompt });
  }

  return groups;
}

function extractExplicitDimensions(text) {
  const m = text.match(/\((\d{3,5})x(\d{3,5})\)/);
  if (!m) return null;
  return { width: Number(m[1]), height: Number(m[2]), confidence: 'high', reason: 'explicit-in-prompt' };
}

function inferDimensions(asset) {
  const explicit = extractExplicitDimensions(asset.prompt);
  if (explicit) return explicit;

  const filename = asset.filename;
  const group = asset.groupName.toLowerCase();
  const promptLower = asset.prompt.toLowerCase();

  if (filename.includes('_bg_') || filename.includes('_scene_') || promptLower.includes('hero background')) {
    return { width: 2560, height: 1440, confidence: 'medium', reason: 'background-scene-standard' };
  }

  if (
    filename.includes('_panel_') ||
    filename.includes('_banner_') ||
    filename.includes('_timeline_') ||
    filename.includes('_tabbar_') ||
    filename.includes('_action_sheet_') ||
    filename.includes('_header_') ||
    group.includes('hud')
  ) {
    return { width: 1600, height: 900, confidence: 'medium', reason: 'panel-component-standard' };
  }

  return { width: 2048, height: 2048, confidence: 'medium', reason: 'prop-icon-standard' };
}

function parseVariantList(text) {
  const tokens = text
    .split(/[,/]|\bor\b|\band\b/gi)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .map((t) => t.replace(/\.$/, ''));

  const out = [];
  for (const t of tokens) {
    if (/^[a-z][a-z0-9_-]{1,30}$/.test(t) && !out.includes(t)) {
      out.push(t);
    }
  }
  return out;
}

function inferRequiredVariants(asset) {
  const filename = asset.filename;
  const prompt = asset.prompt;

  const singleVariant = filename.match(/^pkr_[a-z0-9_]+_([a-z0-9]+)_v\d+\.(png|webp)$/i);
  if (singleVariant && singleVariant[1] !== 'set') {
    return [singleVariant[1].toLowerCase()];
  }

  const variants = [];

  const slashSet = prompt.match(/\b(idle\s*\/\s*hover\s*\/\s*pressed\s*\/\s*disabled)\b/i);
  if (slashSet) variants.push(...parseVariantList(slashSet[1]));

  const statesMatch = prompt.match(/\b(?:states|variants?)\s*:\s*([^\.\n]+)/i);
  if (statesMatch) variants.push(...parseVariantList(statesMatch[1]));

  const inlineSet = prompt.match(/\b(?:set|pair)\b[^:.]*:\s*([^\.\n]+)/i);
  if (inlineSet) variants.push(...parseVariantList(inlineSet[1]));

  const unique = [];
  for (const v of variants) {
    if (!unique.includes(v)) unique.push(v);
  }

  return unique;
}

function buildAssetRecords(groups) {
  const records = [];
  for (const group of groups) {
    for (const [idx, raw] of group.assets.entries()) {
      const dimensions = inferDimensions({ ...raw, groupName: group.groupName });
      const requiredVariants = inferRequiredVariants(raw);
      records.push({
        id: `g${String(group.groupIndex).padStart(2, '0')}-${String(idx + 1).padStart(2, '0')}`,
        groupIndex: group.groupIndex,
        groupName: group.groupName,
        filename: raw.filename,
        extension: path.extname(raw.filename).replace('.', '').toLowerCase(),
        isSetAsset: raw.filename.includes('_set_'),
        requiredVariants,
        expectedDimensions: { width: dimensions.width, height: dimensions.height },
        dimensionConfidence: dimensions.confidence,
        dimensionReason: dimensions.reason,
        prompt: raw.prompt,
      });
    }
  }
  return records;
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(records) {
  const headers = [
    'id',
    'groupIndex',
    'groupName',
    'filename',
    'isSetAsset',
    'requiredVariants',
    'expectedWidth',
    'expectedHeight',
    'dimensionConfidence',
    'dimensionReason',
    'prompt',
  ];

  const rows = [headers.join(',')];
  for (const r of records) {
    rows.push(
      [
        r.id,
        r.groupIndex,
        r.groupName,
        r.filename,
        r.isSetAsset,
        r.requiredVariants.join('|'),
        r.expectedDimensions.width,
        r.expectedDimensions.height,
        r.dimensionConfidence,
        r.dimensionReason,
        r.prompt,
      ]
        .map(csvEscape)
        .join(',')
    );
  }
  return `${rows.join('\n')}\n`;
}

function main() {
  const md = normalize(readFileSync(SOURCE_MD, 'utf8'));
  const globalStyle = parseGlobalStyle(md);
  const groups = parseAssets(md);
  const assets = buildAssetRecords(groups);

  const manifest = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    source: path.relative(ROOT, SOURCE_MD),
    namingConvention: 'pkr_<group>_<asset>_<variant>_v01.png',
    formats: {
      primary: 'png',
      optional: ['webp'],
    },
    globalStyleBlock: globalStyle,
    summary: {
      totalGroups: groups.length,
      totalAssets: assets.length,
      setAssets: assets.filter((a) => a.isSetAsset).length,
      singleAssets: assets.filter((a) => !a.isSetAsset).length,
    },
    assets,
  };

  writeFileSync(OUT_JSON, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(OUT_CSV, toCsv(assets));

  console.log(`Wrote ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`Wrote ${path.relative(ROOT, OUT_CSV)}`);
  console.log(`Assets: ${assets.length}`);
}

main();
