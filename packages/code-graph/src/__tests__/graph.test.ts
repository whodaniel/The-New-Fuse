import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { buildGraph } from '../index.js';
import { cluster } from '../cluster.js';
import { resolveCalls, resolveExternalReferences } from '../resolve.js';
import { explain, findNodes, path as graphPath, query } from '../query.js';
import { hydrate, toJson } from '../export.js';
import { disposeParsers } from '../parser.js';
import type { CodeGraph, GraphNode } from '../schema.js';
import { removeCorpus, writeCorpus } from './corpus.js';

let root = '';
let graph: CodeGraph;
let built: Awaited<ReturnType<typeof buildGraph>>;

before(async () => {
  root = await writeCorpus();
  built = await buildGraph(root);
  graph = built.graph;
});

after(async () => {
  disposeParsers();
  await removeCorpus(root);
});

test('the corpus builds without any file failing to parse', () => {
  assert.deepEqual(built.extraction.failures, []);
  assert.equal(built.extraction.filesExtracted, 7);
  assert.deepEqual(built.stats.languages, ['go', 'javascript', 'python', 'rust', 'typescript']);
});

test('every edge in the built graph carries a confidence label', () => {
  const total =
    built.stats.edgesByConfidence.EXTRACTED +
    built.stats.edgesByConfidence.INFERRED +
    built.stats.edgesByConfidence.AMBIGUOUS;
  assert.equal(total, built.stats.edgeCount);
  assert.ok(built.stats.edgesByConfidence.EXTRACTED > 0);
});

test('a cross-file call with one candidate resolves to INFERRED', () => {
  // consumer.launch() calls normalise(), which is defined only in service.ts.
  const inferred = graph.edges.find(
    (e) =>
      e.relation === 'calls' &&
      e.source === 'app/consumer.ts#launch' &&
      e.target === 'app/service.ts#normalise'
  );
  assert.ok(inferred, 'expected launch -> normalise to resolve across files');
  assert.equal(inferred.confidence, 'INFERRED');
  assert.match(inferred.evidence ?? '', /exactly one definition/);
});

test('the import graph narrows a call that would otherwise be ambiguous', async () => {
  // `run` names both Service.run and Pipeline.run. consumer.ts imports only
  // ./service, so the call site can only mean Service.run.
  const narrowed = graph.edges.find(
    (e) =>
      e.relation === 'calls' &&
      e.source === 'app/consumer.ts#launch' &&
      e.target === 'app/service.ts#Service.run'
  );
  assert.ok(narrowed, 'expected launch -> Service.run');
  assert.equal(narrowed.confidence, 'INFERRED');
  assert.match(narrowed.evidence ?? '', /among the files this file imports/);
  assert.ok(
    !graph.edges.some(
      (e) => e.source === 'app/consumer.ts#launch' && e.target.includes('pipeline.py')
    ),
    'a python method must not be a candidate for a TypeScript call site that imports ./service'
  );

  // Without the import graph there is nothing to narrow on, and the same call
  // is honestly reported as ambiguous rather than guessed.
  const unnarrowed = await buildGraph(root, { skipExternalResolution: true });
  const ambiguous = unnarrowed.graph.edges.filter(
    (e) => e.confidence === 'AMBIGUOUS' && e.source === 'app/consumer.ts#launch'
  );
  assert.equal(ambiguous.length, 2);
  for (const e of ambiguous) assert.equal(e.meta?.candidateCount, 2);
});

test('an ambiguous callee records every candidate rather than picking one', () => {
  // `sharedHelper` is defined in both base.ts and consumer.ts.
  const nodes: GraphNode[] = [
    { id: 'a.ts#helper', label: 'helper', kind: 'function', sourceFile: 'a.ts' },
    { id: 'b.ts#helper', label: 'helper', kind: 'function', sourceFile: 'b.ts' },
    { id: 'c.ts#caller', label: 'caller', kind: 'function', sourceFile: 'c.ts' },
  ];
  const { edges, stats } = resolveCalls(nodes, [
    { from: 'c.ts#caller', callee: 'helper', viaMember: false, sourceFile: 'c.ts', sourceLocation: 'L3' },
  ]);
  assert.equal(stats.resolvedAmbiguous, 1);
  assert.equal(edges.length, 2);
  for (const e of edges) {
    assert.equal(e.confidence, 'AMBIGUOUS');
    assert.equal(e.meta?.candidateCount, 2);
  }
});

test('a callee matching nothing is dropped and counted, never invented', () => {
  const { edges, stats } = resolveCalls(
    [{ id: 'a.ts#f', label: 'f', kind: 'function', sourceFile: 'a.ts' }],
    [{ from: 'a.ts#f', callee: 'console', viaMember: false, sourceFile: 'a.ts', sourceLocation: 'L1' }]
  );
  assert.deepEqual(edges, []);
  assert.equal(stats.droppedNoMatch, 1);
});

test('a callee that is too common is dropped rather than treated as evidence', () => {
  const nodes: GraphNode[] = Array.from({ length: 9 }, (_, i) => ({
    id: `f${i}.ts#run`,
    label: 'run',
    kind: 'function' as const,
    sourceFile: `f${i}.ts`,
  }));
  const { edges, stats } = resolveCalls(nodes, [
    { from: 'z.ts#caller', callee: 'run', viaMember: false, sourceFile: 'z.ts', sourceLocation: 'L1' },
  ]);
  assert.deepEqual(edges, []);
  assert.equal(stats.droppedTooCommon, 1);
});

test('findNodes prefers an exact id, then an exact label', () => {
  const byId = findNodes(graph, 'app/service.ts');
  assert.equal(byId.length, 1);
  assert.equal(byId[0]?.kind, 'file');

  const byLabel = findNodes(graph, 'Service');
  assert.equal(byLabel[0]?.label, 'Service');
  assert.equal(byLabel[0]?.kind, 'class');
});

test('path finds a route between two symbols and reports its weakest link', () => {
  const result = graphPath(graph, 'Service', 'Base');
  assert.equal(result.found, true);
  assert.ok(result.steps.length >= 2);
  assert.equal(result.steps[0]?.node.label, 'Service');
  assert.equal(result.steps.at(-1)?.node.label, 'Base');
  assert.ok(['EXTRACTED', 'INFERRED', 'AMBIGUOUS'].includes(result.weakestLink as string));
});

test('path reports honestly when there is no route or no such node', () => {
  const missing = graphPath(graph, 'Service', 'NoSuchThingAnywhere');
  assert.equal(missing.found, false);
  assert.match(missing.reason ?? '', /no node matches/);
});

test('explain returns the node with its incoming and outgoing edges', () => {
  const result = explain(graph, 'normalise');
  assert.equal(result.node?.label, 'normalise');
  assert.ok(result.incoming.length > 0, 'normalise is called and defined, so it has incoming edges');
  assert.ok(result.incoming.some((i) => i.edge.relation === 'defines'));
});

test('query seeds from the question and stays inside its token budget', () => {
  const result = query(graph, 'how does the Service run', { budget: 200 });
  assert.ok(result.seeds.length > 0);
  assert.ok(result.seeds.some((s) => s.label.includes('Service')));
  assert.ok(result.tokensUsed <= 200);
  for (const e of result.edges) {
    assert.ok(result.nodes.some((n) => n.id === e.source));
    assert.ok(result.nodes.some((n) => n.id === e.target));
  }
});

test('query with minConfidence EXTRACTED crosses no inferred edge', () => {
  const result = query(graph, 'Service run normalise', { minConfidence: 'EXTRACTED', budget: 4000 });
  for (const e of result.edges) assert.equal(e.confidence, 'EXTRACTED');
});

test('query returns an empty result rather than guessing when nothing matches', () => {
  const result = query(graph, 'zzzzz nonexistent subject');
  assert.deepEqual(result.seeds, []);
  assert.deepEqual(result.nodes, []);
});

test('clustering separates two disconnected triangles', () => {
  const nodes = new Map<string, GraphNode>();
  for (const id of ['a', 'b', 'c', 'x', 'y', 'z']) {
    nodes.set(id, { id, label: id, kind: 'function', sourceFile: 'f.ts' });
  }
  const pairs: Array<[string, string]> = [
    ['a', 'b'], ['b', 'c'], ['c', 'a'],
    ['x', 'y'], ['y', 'z'], ['z', 'x'],
  ];
  const edges = pairs.map(([source, target]) => ({
    source,
    target,
    relation: 'calls' as const,
    confidence: 'EXTRACTED' as const,
  }));
  const adjacency = new Map<string, Set<string>>();
  for (const id of nodes.keys()) adjacency.set(id, new Set());
  for (const e of edges) {
    adjacency.get(e.source)?.add(e.target);
    adjacency.get(e.target)?.add(e.source);
  }

  const result = cluster({ nodes, edges, adjacency });
  assert.equal(result.communities.size, 2);
  for (const members of result.communities.values()) assert.equal(members.length, 3);
  assert.ok(result.modularity > 0.3, `expected positive modularity, got ${result.modularity}`);
});

test('clustering the real corpus produces communities covering every node', () => {
  const result = cluster(graph);
  const covered = [...result.communities.values()].flat();
  assert.equal(covered.length, graph.nodes.size);
  assert.equal(new Set(covered).size, graph.nodes.size);
});

test('a graph document round-trips through toJson and hydrate', () => {
  const doc = toJson(graph, { root, stats: built.stats });
  const back = hydrate(doc);
  assert.equal(back.nodes.size, graph.nodes.size);
  assert.equal(back.edges.length, graph.edges.length);
  assert.equal(doc.schemaVersion, 1);
  assert.equal(explain(back, 'Service').node?.label, 'Service');
});

test('a relative import is linked to the file it names', () => {
  const edge = graph.edges.find(
    (e) => e.relation === 'imports' && e.source === 'app/service.ts' && e.target === 'app/base.ts'
  );
  assert.ok(edge, "import './base' should resolve to app/base.ts");
  assert.equal(edge.confidence, 'INFERRED');
  assert.match(edge.evidence ?? '', /resolved to app\/base\.ts/);
});

test('a third-party import stays external rather than being forced onto a corpus file', () => {
  const external = graph.edges.filter(
    (e) => e.relation === 'imports' && e.target.startsWith('external:')
  );
  const targets = external.map((e) => e.target);
  assert.ok(targets.includes('external:external-pkg'));
  assert.ok(targets.includes('external:fmt'));
  for (const e of external) assert.equal(e.confidence, 'EXTRACTED');
});

test('a base class defined in another file is linked, and an unknown one is not', () => {
  const linked = graph.edges.find(
    (e) => e.relation === 'extends' && e.source.endsWith('#Service')
  );
  assert.ok(linked);
  assert.equal(linked.target, 'app/base.ts#Base');
  assert.equal(linked.confidence, 'INFERRED');

  const unknown = graph.edges.find(
    (e) => e.relation === 'extends' && e.source.endsWith('#Pipeline')
  );
  assert.ok(unknown);
  assert.equal(unknown.target, 'external:BasePipeline', 'an unknown base must stay external');
  assert.equal(unknown.confidence, 'EXTRACTED');
});

test('external resolution counts what it linked and what it left alone', () => {
  const externals = built.document.externals;
  assert.ok(externals);
  // service.ts -> base.ts, consumer.ts -> service.ts, legacy.cjs -> service.ts
  assert.equal(externals.modulesResolved, 3);
  assert.ok(externals.modulesLeftExternal >= 4);
  assert.equal(externals.typesResolved, 1);
});

test('skipExternalResolution leaves the graph as per-file islands', async () => {
  const islands = await buildGraph(root, { skipExternalResolution: true });
  assert.equal(islands.document.externals, null);
  const crossFile = islands.graph.edges.find(
    (e) => e.relation === 'imports' && e.target === 'app/base.ts'
  );
  assert.equal(crossFile, undefined);
});

test('modularity stays inside its valid range', () => {
  // Regression: scoring an aggregated Louvain level instead of the original
  // graph reported 3.665 on a real repo. Modularity is bounded by [-1, 1].
  const result = cluster(graph);
  assert.ok(
    result.modularity >= -1 && result.modularity <= 1,
    `modularity out of range: ${result.modularity}`
  );
});

test("a TypeScript ESM './x.js' specifier resolves to the './x.ts' source", () => {
  // Regression: the dominant import style in this monorepo writes the compiled
  // extension. Without stripping it, zero relative imports resolved.
  const nodes = [
    { id: 'a/one.ts', label: 'one.ts', kind: 'file' as const, sourceFile: 'a/one.ts' },
    { id: 'a/two.ts', label: 'two.ts', kind: 'file' as const, sourceFile: 'a/two.ts' },
    { id: 'external:./two.js', label: './two.js', kind: 'external' as const, sourceFile: '' },
  ];
  const { edges, stats } = resolveExternalReferences(nodes, [
    {
      source: 'a/one.ts',
      target: 'external:./two.js',
      relation: 'imports' as const,
      confidence: 'EXTRACTED' as const,
    },
  ]);
  assert.equal(stats.modulesResolved, 1);
  assert.equal(edges[0]?.target, 'a/two.ts');
  assert.equal(edges[0]?.confidence, 'INFERRED');
});

test('a member call never resolves to a free function of the same name', () => {
  // Regression: `pattern.test(x)` resolved to a top-level `test()` elsewhere in
  // the repo, putting a false INFERRED edge on the shortest path between two
  // unrelated services.
  const nodes: GraphNode[] = [
    { id: 'a.ts#test', label: 'test', kind: 'function', sourceFile: 'a.ts' },
    { id: 'b.ts#Klass.test', label: 'Klass.test', kind: 'method', sourceFile: 'b.ts' },
    { id: 'c.ts#caller', label: 'caller', kind: 'function', sourceFile: 'c.ts' },
  ];
  const member = resolveCalls(nodes, [
    { from: 'c.ts#caller', callee: 'test', viaMember: true, sourceFile: 'c.ts', sourceLocation: 'L1' },
  ]);
  assert.equal(member.edges.length, 1);
  assert.equal(member.edges[0]?.target, 'b.ts#Klass.test', 'only the method is a candidate');

  const bare = resolveCalls(nodes, [
    { from: 'c.ts#caller', callee: 'test', viaMember: false, sourceFile: 'c.ts', sourceLocation: 'L1' },
  ]);
  assert.equal(bare.stats.resolvedAmbiguous, 1, 'a bare call may mean either');
});

test('a CommonJS require resolves to the corpus file it names', () => {
  const edge = graph.edges.find(
    (e) => e.relation === 'imports' && e.source === 'app/legacy.cjs' && e.target === 'app/service.ts'
  );
  assert.ok(edge, "require('./service') should resolve to app/service.ts");
  assert.equal(edge.confidence, 'INFERRED');
});
