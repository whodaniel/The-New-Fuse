#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function countSkillDirs(root) {
  if (!fs.existsSync(root)) return 0;
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() || entry.isSymbolicLink()).length;
}

function runResourceScan(root) {
  const engine = path.join(root, 'scripts/harness/agent-resource-converge.cjs');
  if (!fs.existsSync(engine)) {
    return { ok: false, available: false, reason: 'resource-fabric-engine-missing' };
  }

  const result = spawnSync(process.execPath, [engine, 'scan', '--json'], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    return {
      ok: false,
      available: true,
      reason: 'resource-scan-failed',
      stderr: String(result.stderr || '').trim(),
    };
  }

  try {
    const parsed = JSON.parse(String(result.stdout || '{}'));
    return {
      ok: true,
      available: true,
      duplicateGroups: parsed.summary?.duplicateGroups ?? parsed.duplicateGroups?.length ?? null,
      reclaimableBytes: parsed.summary?.reclaimableBytes ?? parsed.reclaimableBytes ?? null,
      eligibleFiles: parsed.summary?.eligibleFiles ?? parsed.files?.length ?? null,
      excludedFiles: parsed.summary?.excludedFiles ?? parsed.excluded?.length ?? null,
    };
  } catch {
    return { ok: false, available: true, reason: 'resource-scan-invalid-json' };
  }
}

function scanAssimilationSurfaces({
  root = path.resolve(__dirname, '..', '..'),
  home = os.homedir(),
  writeReceipt = false,
} = {}) {
  const fabric = readJson(path.join(root, 'data/harness/agent-resource-fabric.json'));
  const providerPolicy = readJson(path.join(root, 'data/harness/provider-failover-policy.json'));
  const parodySkill = path.join(root, '.agent/skills/tnf-parody-assimilate-cycle/SKILL.md');
  const ubiquitySkill = path.join(root, '.agent/skills/tnf-skill-ubiquity-propagation/SKILL.md');
  const legacyRoute = path.join(root, '.agent/assimilation-routes.json');
  const legacyFlywheel = path.join(root, 'scripts/protocols/tnf-self-evolution-flywheel.cjs');
  const resourceScan = runResourceScan(root);

  const report = {
    spec: 'tnf/assimilation-scan/0.1',
    observedAt: new Date().toISOString(),
    model: {
      assimilation: 'capability-and-evolution-intake',
      resourceFabric: 'reusable-static-artifact-substrate',
      providerRouting: 'existing-provider-and-host-authorities',
      memory: 'stateful-history-compaction-and-recall',
      userContext: 'user-owned-durable-context-provider-layer',
      secrets: 'private-credential-boundary',
    },
    authorities: {
      parodyAssimilateSkill: {
        path: '.agent/skills/tnf-parody-assimilate-cycle/SKILL.md',
        present: fs.existsSync(parodySkill),
      },
      skillUbiquity: {
        path: '.agent/skills/tnf-skill-ubiquity-propagation/SKILL.md',
        present: fs.existsSync(ubiquitySkill),
      },
      resourceFabric: {
        path: 'data/harness/agent-resource-fabric.json',
        present: Boolean(fabric),
        hostProfiles: fabric?.hosts?.length ?? 0,
      },
      providerPolicy: {
        path: 'data/harness/provider-failover-policy.json',
        present: Boolean(providerPolicy),
        hostPins: Object.keys(providerPolicy?.hostPins || {}).length,
      },
    },
    skillTopology: {
      repoAgentSkills: countSkillDirs(path.join(root, '.agent/skills')),
      repoMirrorSkills: countSkillDirs(path.join(root, '.skills')),
      machineSharedSkillsPresent: fs.existsSync(path.join(home, '.agents', 'skills')),
      machineTnfSkillsPresent: fs.existsSync(path.join(home, '.tnf', 'skills')),
    },
    resourceFabricScan: resourceScan,
    staleSeams: [
      !fs.existsSync(legacyRoute)
        ? {
            id: 'legacy-assimilation-routes-absent',
            path: '.agent/assimilation-routes.json',
            disposition: 'do-not-resurrect-as-parallel-registry',
          }
        : null,
      !fs.existsSync(legacyFlywheel)
        ? {
            id: 'legacy-self-evolution-flywheel-absent',
            path: 'scripts/protocols/tnf-self-evolution-flywheel.cjs',
            disposition: 'replace-stale-scan-route-with-current-composition',
          }
        : null,
    ].filter(Boolean),
    outputRouting: {
      reusableReadMostlyArtifact: 'agent-resource-fabric',
      providerExecutionOrHostBinding:
        'provider-failover-policy + host adapter/frontload authorities',
      learnedCapability: 'TNF-native code/skill via parody-assimilate gap matrix',
      statefulHistoryOrMemory: 'memory/compaction layer',
      userOwnedDurableContext: 'user-context storage mandate',
      secretOrCredential: 'machine-private credential boundary',
    },
  };

  if (writeReceipt) {
    const dir = path.join(home, '.tnf', 'assimilation', 'receipts');
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const stamp = report.observedAt.replace(/[:.]/g, '-');
    const body = `${JSON.stringify(report, null, 2)}\n`;
    const dated = path.join(dir, `assimilation-scan-${stamp}.json`);
    const latest = path.join(dir, 'assimilation-scan.latest.json');
    fs.writeFileSync(dated, body, { mode: 0o600 });
    fs.writeFileSync(latest, body, { mode: 0o600 });
    report.receipt = { dated, latest };
  }

  return report;
}

function main() {
  const args = process.argv.slice(2);
  const report = scanAssimilationSurfaces({ writeReceipt: args.includes('--write-receipt') });
  if (args.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log('TNF Assimilation Surface Scan');
  console.log(`- resource fabric hosts: ${report.authorities.resourceFabric.hostProfiles}`);
  console.log(`- provider host pins: ${report.authorities.providerPolicy.hostPins}`);
  console.log(
    `- repo skill roots: .agent=${report.skillTopology.repoAgentSkills}, mirror=${report.skillTopology.repoMirrorSkills}`
  );
  console.log(
    `- resource scan: ${report.resourceFabricScan.ok ? 'PASS' : report.resourceFabricScan.reason}`
  );
  report.staleSeams.forEach((item) =>
    console.log(`- stale seam: ${item.path} → ${item.disposition}`)
  );
  if (report.receipt) console.log(`- receipt: ${report.receipt.latest}`);
}

if (require.main === module) main();
module.exports = { scanAssimilationSurfaces, countSkillDirs };
