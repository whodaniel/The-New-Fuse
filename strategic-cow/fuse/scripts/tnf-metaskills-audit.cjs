#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();

function abs(relPath) {
  return path.join(ROOT, relPath);
}

function exists(relPath) {
  return fs.existsSync(abs(relPath));
}

function read(relPath) {
  return fs.readFileSync(abs(relPath), "utf8");
}

function findFiles(relDir, matcher) {
  const out = [];
  const rootDir = abs(relDir);
  if (!fs.existsSync(rootDir)) return out;

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      const relPath = path.relative(ROOT, fullPath).replace(/\\/g, "/");
      if (!matcher || matcher(relPath)) out.push(relPath);
    }
  }

  walk(rootDir);
  return out.sort();
}

function parseArgs(argv) {
  const opts = { json: false };
  for (const arg of argv) {
    if (arg === "--") continue;
    if (arg === "--json") {
      opts.json = true;
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      return { help: true, ...opts };
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return { help: false, ...opts };
}

function printUsage() {
  console.log("Usage: node scripts/tnf-metaskills-audit.cjs [options]");
  console.log("");
  console.log("Options:");
  console.log("  --json        Print JSON output");
  console.log("  -h, --help    Show this help");
}

function getMetaSkills() {
  const skillFiles = findFiles(".agent/skills", (p) => p.endsWith("/SKILL.md"));
  const claudeSkillFiles = findFiles(".claude/skills", (p) => p.endsWith(".md"));
  const explicitMetaNames = new Set([
    "skill-builder",
    "library-of-living-knowledge",
    "context-frontloader",
    "framework-consciousness",
  ]);

  const out = [];
  for (const relPath of [...skillFiles, ...claudeSkillFiles]) {
    const base = path.basename(path.dirname(relPath));
    const name = relPath.includes(".claude/skills/")
      ? path.basename(relPath, ".md")
      : base;
    let isMeta = explicitMetaNames.has(name);
    if (!isMeta) {
      try {
        const content = read(relPath);
        const intro = content.slice(0, 1500);
        isMeta =
          /(^|\n)\s*#\s*META-SKILL\b/i.test(intro) ||
          /(^|\n)\s*\*\*Type\*\*:\s*Foundational Meta-Skill\b/i.test(intro) ||
          /(^|\n)\s*\*\*Skill ID\*\*:.*\bMeta-Orchestration Skill\b/i.test(intro);
      } catch {
        isMeta = false;
      }
    }
    if (isMeta) {
      out.push({ name, path: relPath });
    }
  }

  const unique = new Map();
  for (const item of out) unique.set(item.path, item);
  return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function safeRead(relPath) {
  try {
    return read(relPath);
  } catch {
    return "";
  }
}

function getMetaSkillCoverage(metaSkills) {
  const guide = safeRead(".agent/META_SKILLS_GUIDE.md");
  const resourceMap = safeRead(".agent/context/resource-map.md");
  const onboarding = safeRead(".agent/context/agent-onboarding.md");
  const tests = findFiles("scripts", (p) => p.endsWith(".test.cjs") || p.endsWith(".test.js"));

  const bySkill = metaSkills.map((skill) => {
    const content = safeRead(skill.path);
    const triggerRules =
      /trigger|activate|when user|keywords|automatic/i.test(content) ||
      /trigger rules/i.test(guide);
    const dependencyMap =
      /orchestrates|coordinates|depends|dependencies|load:|uses:/i.test(content) ||
      /meta-skills work together/i.test(guide);
    const testCoverage = tests.some((testPath) => testPath.toLowerCase().includes(skill.name));
    const distributionReference =
      guide.toLowerCase().includes(skill.name.toLowerCase()) ||
      resourceMap.toLowerCase().includes(skill.name.toLowerCase()) ||
      onboarding.toLowerCase().includes(skill.name.toLowerCase());

    return {
      name: skill.name,
      path: skill.path,
      checks: {
        triggerRules,
        dependencyMap,
        testCoverage,
        distributionReference,
      },
      score: [triggerRules, dependencyMap, testCoverage, distributionReference].filter(Boolean)
        .length,
    };
  });

  const allChecksCovered = bySkill.every((item) =>
    Object.values(item.checks).every((value) => value)
  );

  return {
    bySkill,
    summary: {
      totalMetaSkills: bySkill.length,
      fullyCoveredMetaSkills: bySkill.filter((item) => item.score === 4).length,
      allChecksCovered,
    },
  };
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    printUsage();
    process.exit(2);
  }

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (!exists(".agent")) {
    console.error("FAIL: run this from TNF repo root (missing .agent/).");
    process.exit(1);
  }

  const counts = {
    agentSkills: findFiles(".agent/skills", (p) => p.endsWith("/SKILL.md")).length,
    claudeSkills: findFiles(".claude/skills", (p) => p.endsWith(".md")).length,
    agentDefinitions: findFiles(".agent/agents", (p) => p.endsWith(".md")).length,
    claudeAgentDefinitions: findFiles(".claude/agents", (p) => p.endsWith(".md")).length,
    claudeCommands: findFiles(".claude/commands", (p) => p.endsWith(".md")).length,
  };

  const requiredProcedureFiles = [
    ".agent/SYSTEM_PROMPT.md",
    ".agent/context/resource-map.md",
    ".agent/context/agent-onboarding.md",
    ".agent/workflows/frontload.md",
    ".agent/META_SKILLS_GUIDE.md",
    "AGENTS.md",
  ];
  const procedureStatus = requiredProcedureFiles.map((file) => ({
    file,
    present: exists(file),
  }));

  const distribution = {
    mcpConfig: exists("data/mcp_config.json"),
    generatedClients: [
      "data/mcp.clients/codex.mcp.json",
      "data/mcp.clients/claude.mcp.json",
      "data/mcp.clients/gemini.mcp.json",
    ].filter((file) => exists(file)).length,
    skillsServerPackage: exists("packages/mcp-skills-server/package.json"),
    resourceRegistryPackage: exists("packages/resource-registry/package.json"),
    claudeSkillsPackage: exists("packages/claude-skills/package.json"),
  };

  const metaSkills = getMetaSkills();
  const metaSkillCoverage = getMetaSkillCoverage(metaSkills);
  const readiness = {
    proceduresReady: procedureStatus.every((item) => item.present),
    skillCatalogReady: counts.agentSkills > 0 && counts.agentDefinitions > 0,
    distributionReady:
      distribution.mcpConfig &&
      distribution.generatedClients === 3 &&
      distribution.skillsServerPackage &&
      distribution.resourceRegistryPackage &&
      distribution.claudeSkillsPackage,
    metaCoverageReady: metaSkillCoverage.summary.allChecksCovered,
  };

  const report = {
    workspace: ROOT,
    generatedAt: new Date().toISOString(),
    counts,
    procedures: procedureStatus,
    distribution,
    metaSkills,
    metaSkillCoverage,
    readiness,
  };

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log("TNF Meta-Skills Audit");
  console.log(`Workspace: ${ROOT}`);
  console.log("");
  console.log("=== Readiness ===");
  console.log(`- Procedures: ${readiness.proceduresReady ? "READY" : "GAPS"}`);
  console.log(`- Skills/Agents Catalog: ${readiness.skillCatalogReady ? "READY" : "GAPS"}`);
  console.log(`- Distribution Layer: ${readiness.distributionReady ? "READY" : "GAPS"}`);
  console.log(`- Meta-Skill Coverage: ${readiness.metaCoverageReady ? "READY" : "GAPS"}`);
  console.log("");
  console.log("=== Counts ===");
  console.log(`- .agent skills (SKILL.md): ${counts.agentSkills}`);
  console.log(`- .claude skills: ${counts.claudeSkills}`);
  console.log(`- .agent agent definitions: ${counts.agentDefinitions}`);
  console.log(`- .claude agent definitions: ${counts.claudeAgentDefinitions}`);
  console.log(`- .claude commands: ${counts.claudeCommands}`);
  console.log("");
  console.log("=== Procedure Files ===");
  for (const item of procedureStatus) {
    console.log(`- ${item.file}: ${item.present ? "present" : "missing"}`);
  }
  console.log("");
  console.log("=== Distribution ===");
  console.log(`- data/mcp_config.json: ${distribution.mcpConfig ? "present" : "missing"}`);
  console.log(`- generated mcp clients: ${distribution.generatedClients}/3`);
  console.log(
    `- packages/mcp-skills-server: ${distribution.skillsServerPackage ? "present" : "missing"}`
  );
  console.log(
    `- packages/resource-registry: ${distribution.resourceRegistryPackage ? "present" : "missing"}`
  );
  console.log(`- packages/claude-skills: ${distribution.claudeSkillsPackage ? "present" : "missing"}`);
  console.log("");
  console.log("=== Meta-Skills ===");
  for (const skill of metaSkills) {
    console.log(`- ${skill.name}: ${skill.path}`);
  }
  console.log("");
  console.log("=== Meta-Skill Coverage ===");
  for (const item of metaSkillCoverage.bySkill) {
    const checks = item.checks;
    console.log(
      `- ${item.name}: ${item.score}/4 (trigger=${checks.triggerRules ? "Y" : "N"}, deps=${
        checks.dependencyMap ? "Y" : "N"
      }, tests=${checks.testCoverage ? "Y" : "N"}, dist=${
        checks.distributionReference ? "Y" : "N"
      })`
    );
  }
}

main();
