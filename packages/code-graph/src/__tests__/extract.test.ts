import assert from 'node:assert/strict';
import * as path from 'node:path';
import { after, before, test } from 'node:test';
import { disposeParsers } from '../parser.js';
import { collectFiles, extractFile } from '../extract/index.js';
import type { FileExtraction } from '../extract/base.js';
import { removeCorpus, writeCorpus } from './corpus.js';

let root = '';

before(async () => {
  root = await writeCorpus();
});

after(async () => {
  disposeParsers();
  await removeCorpus(root);
});

const of = async (rel: string): Promise<FileExtraction> => {
  const result = await extractFile(path.join(root, rel), root);
  assert.ok(result, `expected an extraction for ${rel}`);
  return result;
};

const labels = (e: FileExtraction, kind: string): string[] =>
  e.nodes.filter((n) => n.kind === kind).map((n) => n.label).sort();

const edge = (e: FileExtraction, relation: string, target: string) =>
  e.edges.find((x) => x.relation === relation && x.target.endsWith(target));

test('collectFiles finds every supported language and skips nothing it should parse', async () => {
  const files = await collectFiles(root);
  const rel = files.map((f) => path.relative(root, f).split(path.sep).join('/')).sort();
  assert.deepEqual(rel, [
    'app/base.ts',
    'app/consumer.ts',
    'app/legacy.cjs',
    'app/service.ts',
    'tools/pipeline.py',
    'tools/relay.rs',
    'tools/server.go',
  ]);
});

test('typescript: classes, interfaces, methods, constants, extends, implements', async () => {
  const e = await of('app/service.ts');
  assert.deepEqual(labels(e, 'class'), ['Service']);
  assert.deepEqual(labels(e, 'interface'), ['Runner']);
  assert.deepEqual(labels(e, 'constant'), ['RETRIES']);
  assert.deepEqual(labels(e, 'function'), ['normalise']);
  assert.deepEqual(labels(e, 'method'), ['Service.finish', 'Service.run']);

  const ext = edge(e, 'extends', 'Base');
  assert.ok(ext, 'expected an extends edge to Base');
  assert.equal(ext.confidence, 'EXTRACTED');

  const impl = edge(e, 'implements', 'Runner');
  assert.ok(impl, 'expected an implements edge to Runner');
  assert.equal(impl.confidence, 'EXTRACTED');

  const imports = e.edges.filter((x) => x.relation === 'imports').map((x) => x.target);
  assert.ok(imports.includes('external:./base'));
  assert.ok(imports.includes('external:external-pkg'));
});

test('typescript: a call to a same-file definition is EXTRACTED, not inferred', async () => {
  const e = await of('app/service.ts');
  const call = e.edges.find(
    (x) => x.relation === 'calls' && x.source.endsWith('#Service.run') && x.target.endsWith('#normalise')
  );
  assert.ok(call, 'Service.run -> normalise should be a resolved same-file call');
  assert.equal(call.confidence, 'EXTRACTED');
  assert.match(call.evidence ?? '', /same-file/);
});

test('typescript: a cross-file call is deferred, never guessed at extraction time', async () => {
  const e = await of('app/consumer.ts');
  const guessed = e.edges.find((x) => x.relation === 'calls' && x.target.includes('service.ts'));
  assert.equal(guessed, undefined, 'extraction must not invent a cross-file target');
  assert.ok(e.unresolvedCalls.some((c) => c.callee === 'run'));
});

test('python: imports, class bases, methods and calls', async () => {
  const e = await of('tools/pipeline.py');
  assert.deepEqual(labels(e, 'class'), ['Pipeline']);
  assert.deepEqual(labels(e, 'method'), ['Pipeline.run']);
  assert.deepEqual(labels(e, 'function'), ['transform']);

  const imports = e.edges.filter((x) => x.relation === 'imports').map((x) => x.target);
  assert.ok(imports.includes('external:os'));
  assert.ok(imports.includes('external:app.helpers'));

  const base = edge(e, 'extends', 'BasePipeline');
  assert.ok(base, 'expected Pipeline to extend BasePipeline');
  assert.equal(base.confidence, 'EXTRACTED');

  const call = e.edges.find(
    (x) => x.relation === 'calls' && x.source.endsWith('#Pipeline.run') && x.target.endsWith('#transform')
  );
  assert.ok(call, 'Pipeline.run -> transform should be extracted');
});

test('go: types, interfaces, constants, receiver methods and calls', async () => {
  const e = await of('tools/server.go');
  assert.deepEqual(labels(e, 'type'), ['Server']);
  assert.deepEqual(labels(e, 'interface'), ['Handler']);
  assert.deepEqual(labels(e, 'constant'), ['Port']);
  assert.deepEqual(labels(e, 'method'), ['Server.Serve']);
  assert.deepEqual(labels(e, 'function'), ['banner']);

  const contains = edge(e, 'contains', '#Server.Serve');
  assert.ok(contains, 'receiver method should be contained by its type');

  const call = e.edges.find(
    (x) => x.relation === 'calls' && x.source.endsWith('#Server.Serve') && x.target.endsWith('#banner')
  );
  assert.ok(call, 'Server.Serve -> banner should be extracted');
  assert.equal(call.confidence, 'EXTRACTED');

  assert.ok(e.edges.some((x) => x.relation === 'imports' && x.target === 'external:fmt'));
});

test('rust: structs, traits, impl-as-implements, and calls', async () => {
  const e = await of('tools/relay.rs');
  assert.deepEqual(labels(e, 'type'), ['Relay']);
  assert.deepEqual(labels(e, 'interface'), ['Transport']);
  assert.deepEqual(labels(e, 'constant'), ['MAX']);
  assert.deepEqual(labels(e, 'method'), ['Relay.send']);
  assert.deepEqual(labels(e, 'function'), ['encode']);

  const impl = edge(e, 'implements', '#Transport');
  assert.ok(impl, 'impl Transport for Relay should be an implements edge');
  assert.equal(impl.confidence, 'EXTRACTED');

  const call = e.edges.find(
    (x) => x.relation === 'calls' && x.source.endsWith('#Relay.send') && x.target.endsWith('#encode')
  );
  assert.ok(call, 'Relay.send -> encode should be extracted');

  assert.ok(e.edges.some((x) => x.relation === 'imports' && x.target === 'external:std::fmt'));
});

test('every extracted edge carries a confidence label', async () => {
  const files = await collectFiles(root);
  for (const file of files) {
    const e = await extractFile(file, root);
    assert.ok(e);
    for (const x of e.edges) {
      assert.ok(
        ['EXTRACTED', 'INFERRED', 'AMBIGUOUS'].includes(x.confidence),
        `${file}: ${x.source} -${x.relation}-> ${x.target} has no confidence`
      );
    }
  }
});

test('merging many files yields one node per shared external import', async () => {
  // Regression: node ids are unique within a file, but `external:` nodes are
  // shared across files. Concatenating per-file node lists produced a merged
  // extraction that failed its own schema on any real repo.
  const { extract } = await import('../extract/index.js');
  const files = await collectFiles(root);
  const merged = await extract(files, { root });
  const ids = merged.nodes.map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length, 'merged extraction must have unique node ids');
  assert.deepEqual(merged.failures, []);
});

test('CommonJS require() is an import edge, not a call to `require`', async () => {
  // Regression: 527 files under scripts/ use require(). Treating them as calls
  // produced zero import edges for CJS trees, which silently disabled the
  // import-narrowing rule that keeps call resolution precise.
  const e = await of('app/legacy.cjs');
  const targets = e.edges.filter((x) => x.relation === 'imports').map((x) => x.target);
  assert.ok(targets.includes('external:./service'), 'relative require should be an import');
  assert.ok(targets.includes('external:node:fs'), 'bare require should be an import');
  assert.ok(
    !e.unresolvedCalls.some((c) => c.callee === 'require'),
    'require itself must not be recorded as a callee'
  );
});
