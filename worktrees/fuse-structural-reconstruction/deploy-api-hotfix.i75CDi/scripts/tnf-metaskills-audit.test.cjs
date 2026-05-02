const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.join(__dirname, "tnf-metaskills-audit.cjs");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tnf-metaskills-"));
}

function writeFile(root, relPath, contents = "x") {
  const absPath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, contents);
}

function runAudit(cwd, args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd,
    env: process.env,
    encoding: "utf8",
  });
}

test("fails when not run from TNF repo root (.agent missing)", () => {
  const root = makeTempDir();
  const result = runAudit(root);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing \.agent\//);
});

test("prints JSON report with meta-skills and readiness fields", () => {
  const root = makeTempDir();
  writeFile(root, ".agent/SYSTEM_PROMPT.md");
  writeFile(root, ".agent/context/resource-map.md");
  writeFile(root, ".agent/context/agent-onboarding.md");
  writeFile(root, ".agent/workflows/frontload.md");
  writeFile(root, ".agent/META_SKILLS_GUIDE.md");
  writeFile(root, ".agent/skills/skill-builder/SKILL.md", "# META-SKILL");
  writeFile(root, ".agent/skills/library-of-living-knowledge/SKILL.md", "# META-SKILL");
  writeFile(root, ".agent/skills/context-frontloader/SKILL.md", "# META-SKILL");
  writeFile(root, ".claude/skills/framework-consciousness.md", "# Meta-Orchestration Skill");
  writeFile(root, ".agent/agents/orchestrator.md");
  writeFile(root, "AGENTS.md");
  writeFile(root, "data/mcp_config.json", JSON.stringify({ mcpServers: {} }, null, 2));
  writeFile(root, "data/mcp.clients/codex.mcp.json", "{}");
  writeFile(root, "data/mcp.clients/claude.mcp.json", "{}");
  writeFile(root, "data/mcp.clients/gemini.mcp.json", "{}");
  writeFile(root, "packages/mcp-skills-server/package.json", "{}");
  writeFile(root, "packages/resource-registry/package.json", "{}");
  writeFile(root, "packages/claude-skills/package.json", "{}");

  const result = runAudit(root, ["--json"]);
  assert.equal(result.status, 0);

  const json = JSON.parse(result.stdout);
  assert.equal(typeof json.readiness.proceduresReady, "boolean");
  assert.equal(typeof json.readiness.skillCatalogReady, "boolean");
  assert.equal(typeof json.readiness.distributionReady, "boolean");
  assert.equal(typeof json.readiness.metaCoverageReady, "boolean");
  assert.ok(Array.isArray(json.metaSkills));
  assert.ok(Array.isArray(json.metaSkillCoverage.bySkill));
  assert.ok(json.metaSkills.some((item) => item.name === "framework-consciousness"));
});
