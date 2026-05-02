const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.join(__dirname, "tnf-onboard.cjs");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tnf-onboard-"));
}

function writeFile(root, relPath, contents = "x") {
  const absPath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, contents);
}

function runOnboard(cwd, extraEnv = {}, args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd,
    env: {
      ...process.env,
      DATABASE_URL: "",
      TNF_REQUIRE_CLOUD_DB: "1",
      TNF_ALLOW_LOCAL_DB: "0",
      ...extraEnv,
    },
    encoding: "utf8",
  });
}

test("fails when not run from TNF repo root (.agent missing)", () => {
  const root = makeTempDir();
  const result = runOnboard(root);

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /This command must run from TNF repo root \(missing \.agent\/\)\./
  );
});

test("prints frontload checklist and marks required files as present", () => {
  const root = makeTempDir();

  fs.mkdirSync(path.join(root, ".agent"), { recursive: true });
  writeFile(root, ".agent/SYSTEM_PROMPT.md");
  writeFile(root, ".agent/context/resource-map.md");
  writeFile(root, ".agent/context/agent-onboarding.md");
  writeFile(root, ".agent/workflows/frontload.md");
  writeFile(root, ".agent/handoff_notes.txt");

  writeFile(root, ".agent/agents/sample-agent.md");
  writeFile(root, ".claude/agents/sample-claude-agent.md");
  writeFile(root, ".claude/commands/sample-command.md");
  writeFile(root, ".gemini/info.txt");
  writeFile(root, ".agent/skills/example/SKILL.md");

  const result = runOnboard(root);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /=== Frontload Checklist ===/);
  assert.match(result.stdout, /- \.agent\/SYSTEM_PROMPT\.md: present/);
  assert.match(result.stdout, /- \.agent\/context\/resource-map\.md: present/);
  assert.match(
    result.stdout,
    /- \.agent\/context\/agent-onboarding\.md: present/
  );
  assert.match(result.stdout, /- \.agent\/workflows\/frontload\.md: present/);
  assert.match(result.stdout, /- \.agent\/handoff_notes\.txt: present/);
  assert.match(result.stdout, /=== OpenClaw \/ Claw Operator Policy ===/);
  assert.match(
    result.stdout,
    /Use TNF as the control plane for OpenClaw and other Claw-type agents/
  );
  assert.match(result.stdout, /tnf compat openclaw/);
});

test("skips runtime snapshot when cloud mode is required and DB URL is local", () => {
  const root = makeTempDir();
  fs.mkdirSync(path.join(root, ".agent"), { recursive: true });

  const result = runOnboard(root, {
    DATABASE_URL: "postgres://localhost:5432/tnf_dev",
    TNF_REQUIRE_CLOUD_DB: "1",
    TNF_ALLOW_LOCAL_DB: "0",
  });

  assert.equal(result.status, 0);
  assert.match(
    result.stdout,
    /\.agent\/runtime-state\.json: skipped \(DATABASE_URL points to local DB but cloud-rooted mode is required\)/
  );
  assert.match(
    result.stdout,
    /Hint: set cloud DATABASE_URL or override with TNF_ALLOW_LOCAL_DB=1/
  );
});

test("accepts --allow-local-db flag to bypass local DB policy skip", () => {
  const root = makeTempDir();
  fs.mkdirSync(path.join(root, ".agent"), { recursive: true });

  const result = runOnboard(
    root,
    {
      DATABASE_URL: "postgres://localhost:5432/tnf_dev",
      TNF_REQUIRE_CLOUD_DB: "1",
      TNF_ALLOW_LOCAL_DB: "0",
    },
    ["--allow-local-db"]
  );

  assert.equal(result.status, 0);
  assert.doesNotMatch(
    result.stdout,
    /DATABASE_URL points to local DB but cloud-rooted mode is required/
  );
});

test("accepts pnpm-style '--' argument separator", () => {
  const root = makeTempDir();
  fs.mkdirSync(path.join(root, ".agent"), { recursive: true });

  const result = runOnboard(
    root,
    {
      DATABASE_URL: "postgres://localhost:5432/tnf_dev",
      TNF_REQUIRE_CLOUD_DB: "1",
      TNF_ALLOW_LOCAL_DB: "0",
    },
    ["--", "--allow-local-db"]
  );

  assert.equal(result.status, 0);
  assert.doesNotMatch(
    result.stdout,
    /DATABASE_URL points to local DB but cloud-rooted mode is required/
  );
});
