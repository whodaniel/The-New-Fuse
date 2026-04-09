#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const DOCS = path.join(ROOT, 'docs');
const MANIFEST_PATH = path.join(DOCS, 'NANOBANANA_POKER_GRAPHICS_MANIFEST.json');

const OUT_MAIN = path.join(DOCS, 'NANOBANANA_POKER_GRAPHICS_TASK_PACKET.json');
const OUT_LANE_CORE = path.join(DOCS, 'NANOBANANA_POKER_GRAPHICS_TASK_PACKET_CORE_TABLE.json');
const OUT_LANE_HUD = path.join(DOCS, 'NANOBANANA_POKER_GRAPHICS_TASK_PACKET_HUD_CONTROLS.json');
const OUT_LANE_MOBILE = path.join(DOCS, 'NANOBANANA_POKER_GRAPHICS_TASK_PACKET_MOBILE_STATES.json');

const LANE_RULES = [
  { lane: 'core-table', groups: new Set([1, 2, 3, 4, 5]) },
  { lane: 'hud-controls', groups: new Set([6, 7, 8]) },
  { lane: 'mobile-states', groups: new Set([9, 10]) },
];

function laneForGroup(groupIndex) {
  for (const rule of LANE_RULES) {
    if (rule.groups.has(groupIndex)) return rule.lane;
  }
  return 'core-table';
}

function buildTask(asset, globalStyleBlock) {
  return {
    taskId: `gfx-${asset.id}`,
    assetId: asset.id,
    lane: laneForGroup(asset.groupIndex),
    groupIndex: asset.groupIndex,
    groupName: asset.groupName,
    filename: asset.filename,
    expectedDimensions: asset.expectedDimensions,
    requiredVariants: asset.requiredVariants || [],
    promptParts: {
      globalStyleBlock,
      assetPrompt: asset.prompt,
    },
  };
}

function buildPacket(manifest, tasks, lane = null) {
  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    sourceManifest: 'docs/NANOBANANA_POKER_GRAPHICS_MANIFEST.json',
    scope: lane ? `poker-graphics-${lane}` : 'poker-graphics-full-pack',
    namingConvention: manifest.namingConvention,
    outputFormats: manifest.formats,
    summary: {
      tasks: tasks.length,
      lanes: Array.from(new Set(tasks.map((t) => t.lane))),
      groups: Array.from(new Set(tasks.map((t) => t.groupIndex))).sort((a, b) => a - b),
    },
    tasks,
  };
}

function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];

  const tasks = assets.map((asset) => buildTask(asset, manifest.globalStyleBlock || ''));

  const fullPacket = buildPacket(manifest, tasks);
  const corePacket = buildPacket(
    manifest,
    tasks.filter((t) => t.lane === 'core-table'),
    'core-table'
  );
  const hudPacket = buildPacket(
    manifest,
    tasks.filter((t) => t.lane === 'hud-controls'),
    'hud-controls'
  );
  const mobilePacket = buildPacket(
    manifest,
    tasks.filter((t) => t.lane === 'mobile-states'),
    'mobile-states'
  );

  writeFileSync(OUT_MAIN, `${JSON.stringify(fullPacket, null, 2)}\n`);
  writeFileSync(OUT_LANE_CORE, `${JSON.stringify(corePacket, null, 2)}\n`);
  writeFileSync(OUT_LANE_HUD, `${JSON.stringify(hudPacket, null, 2)}\n`);
  writeFileSync(OUT_LANE_MOBILE, `${JSON.stringify(mobilePacket, null, 2)}\n`);

  console.log(`Wrote ${path.relative(ROOT, OUT_MAIN)} (${fullPacket.summary.tasks} tasks)`);
  console.log(`Wrote ${path.relative(ROOT, OUT_LANE_CORE)} (${corePacket.summary.tasks} tasks)`);
  console.log(`Wrote ${path.relative(ROOT, OUT_LANE_HUD)} (${hudPacket.summary.tasks} tasks)`);
  console.log(`Wrote ${path.relative(ROOT, OUT_LANE_MOBILE)} (${mobilePacket.summary.tasks} tasks)`);
}

main();
