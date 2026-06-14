import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findSlashCommand, getAllSlashCommands, parseSlashCommand, renderSlashCommandList, } from '../slashCommands.js';
import { ProjectConfigService } from '../services/ProjectConfigService.js';
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = path.resolve(packageRoot, '../..');
const rootTnf = path.join(repoRoot, 'tnf');
function withTempProject(run) {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-cli-slash-'));
    try {
        run(projectRoot);
    }
    finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
    }
}
function assertFile(projectRoot, relativePath) {
    const filePath = path.join(projectRoot, relativePath);
    assert.equal(fs.existsSync(filePath), true, `expected ${relativePath} to exist`);
    return filePath;
}
function runRootTnf(projectRoot, args) {
    const result = spawnSync(rootTnf, args, {
        cwd: projectRoot,
        env: process.env,
        encoding: 'utf8',
        timeout: 60_000,
    });
    assert.equal(result.status, 0, `tnf ${args.join(' ')} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
    return `${result.stdout}\n${result.stderr}`;
}
withTempProject((projectRoot) => {
    const commands = getAllSlashCommands(projectRoot);
    const names = commands.map((command) => command.name);
    assert.deepEqual(names.filter((name, index) => names.indexOf(name) !== index), [], 'built-in slash command names must be unique');
    assert.equal(findSlashCommand('?', projectRoot)?.name, 'help');
    assert.equal(findSlashCommand('mcpserver', projectRoot)?.name, 'mcp-server');
    assert.equal(findSlashCommand('auto', projectRoot)?.name, 'autopilot');
    assert.equal(findSlashCommand('full-auto', projectRoot)?.name, 'autopilot');
    assert.equal(findSlashCommand('self-improvement', projectRoot)?.name, 'self-improve');
    assert.deepEqual(parseSlashCommand('/workflow release-triage')?.args, ['release-triage']);
    for (const expected of ['/agent', '/skill', '/workflow', '/mcp-server', '/model', '/autopilot', '/self-improve']) {
        assert.match(renderSlashCommandList(projectRoot), new RegExp(`\\s${expected.replace('/', '\\/')}`));
    }
});
withTempProject((projectRoot) => {
    const service = new ProjectConfigService(projectRoot);
    const cases = [
        ['command', 'Release Check', '.tnf/command/release-check.md'],
        ['agent', 'Review Bot', '.tnf/agent/review-bot.md'],
        ['skill', 'Prompt Auditor', '.agent/skills/prompt-auditor/SKILL.md'],
        ['workflow', 'Triage Flow', '.tnf/workflow/triage-flow.json'],
        ['mcp-server', 'Browser Tools', '.tnf/mcp-server/browser-tools.ts'],
    ];
    for (const [kind, name, relativePath] of cases) {
        const result = service.createScaffold(kind, name);
        assert.equal(result.created, true);
        assert.equal(result.overwritten, false);
        assert.equal(result.filePath, path.join(projectRoot, relativePath));
        assertFile(projectRoot, relativePath);
    }
    assert.equal(new ProjectConfigService(projectRoot).getCommands().some((command) => command.name === 'release-check'), true);
    assert.equal(new ProjectConfigService(projectRoot).getAgents().some((agent) => agent.name === 'review-bot'), true);
    assert.doesNotThrow(() => {
        JSON.parse(fs.readFileSync(path.join(projectRoot, '.tnf/workflow/triage-flow.json'), 'utf8'));
    });
    assert.throws(() => service.createScaffold('agent', 'Review Bot'), /already exists/);
    const showOutput = runRootTnf(projectRoot, ['slash', 'show', '/release-check']);
    assert.match(showOutput, /Source: project/);
    assert.match(showOutput, /\.tnf\/command\/release-check\.md/);
    const wrapperWorkflowName = `wrapper-flow-${process.pid}`;
    const leakedWorkflowPath = path.join(repoRoot, '.tnf/workflow', `${wrapperWorkflowName}.json`);
    fs.rmSync(leakedWorkflowPath, { force: true });
    try {
        runRootTnf(projectRoot, ['slash', 'run', '/workflow', wrapperWorkflowName]);
        assertFile(projectRoot, `.tnf/workflow/${wrapperWorkflowName}.json`);
        assert.equal(fs.existsSync(leakedWorkflowPath), false, 'root tnf wrapper must preserve caller cwd');
    }
    finally {
        fs.rmSync(leakedWorkflowPath, { force: true });
    }
});
console.log('slash command registry and project scaffolds: ok');
//# sourceMappingURL=slashCommands.test.js.map