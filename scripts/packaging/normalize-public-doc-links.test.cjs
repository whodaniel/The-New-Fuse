const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { normalizePublicDocLinks } = require('./normalize-public-doc-links.cjs');

test('public document links become relative only for existing contained targets', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-doc-links-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'README.md'), 'Runtime');
  const local = 'file://' + path.posix.join('/', 'Users', 'operator', 'The-New-Fuse') + '/';
  const missing = `[missing](${local}excluded.md)`;
  const escape = `[escape](${local}../outside.md)`;
  const file = path.join(root, 'docs', 'guide.md');
  fs.writeFileSync(
    file,
    `[home](${local}README.md#start)\n${missing}\n${escape}\n[web](https://example.com)`
  );
  assert.equal(normalizePublicDocLinks(root), 1);
  assert.equal(
    fs.readFileSync(file, 'utf8'),
    `[home](../README.md#start)\n${missing}\n${escape}\n[web](https://example.com)`
  );
  assert.equal(normalizePublicDocLinks(root), 0, 'transform is idempotent');
});

test('publication transform neither follows nor rewrites symlink targets outside export', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-doc-containment-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const exported = path.join(root, 'export');
  fs.mkdirSync(exported);
  const outside = path.join(root, 'private.md');
  fs.writeFileSync(outside, 'private');
  fs.symlinkSync(outside, path.join(exported, 'linked.md'));
  const link = 'file://' + path.posix.join('/', 'Users', 'operator', 'The-New-Fuse', 'linked.md');
  fs.writeFileSync(path.join(exported, 'README.md'), `[outside](${link})`);
  assert.equal(normalizePublicDocLinks(exported), 0);
  assert.equal(fs.readFileSync(outside, 'utf8'), 'private');
});
