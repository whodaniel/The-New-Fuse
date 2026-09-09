import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { SkillsService } from '../../../../packages/tnf-cli/src/services/SkillsService.js';

test('compiler rejects blocking inputs and oversized context before model invocation', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnf-skill-service-'));
  try {
    const service = new SkillsService(root);
    await service.ensureBank();
    assert.deepEqual(await service.listCompiled(), []);
    assert.deepEqual(await fs.readdir(root), []);
    await assert.rejects(service.compile('x'.repeat(16385)), /budget/);
    await assert.rejects(service.compile('work', Array(9).fill('file')), /budget/);
    await fs.writeFile(path.join(root, 'oversized'), 'x'.repeat(16385));
    await assert.rejects(service.compile('work', ['oversized']), /budget/);
    await fs.symlink(path.join(root, 'oversized'), path.join(root, 'link'));
    await assert.rejects(service.compile('work', ['link']));
    await fs.mkdir(path.join(root, 'directory'));
    await assert.rejects(service.compile('work', ['directory']), /regular file/);
    execFileSync('mkfifo', [path.join(root, 'pipe')]);
    await assert.rejects(service.compile('work', ['pipe']), /regular file/);
    for (let i = 0; i < 5; i++) await fs.writeFile(path.join(root, `part${i}`), 'x'.repeat(16000));
    await assert.rejects(
      service.compile('work', ['part0', 'part1', 'part2', 'part3', 'part4']),
      /total context budget/
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
