import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { contentTypeFor, resolveVisualizationFile } from './tnfStaticSurfaces';

const tmpDirs: string[] = [];

function makeRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-viz-'));
  tmpDirs.push(root);
  const semantic = path.join(root, 'semantic');
  fs.mkdirSync(semantic, { recursive: true });
  fs.writeFileSync(path.join(semantic, 'index.html'), '<title>hub</title>');
  fs.writeFileSync(path.join(semantic, 'unified_graph_explorer.html'), '<title>explorer</title>');
  return root;
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('resolveVisualizationFile', () => {
  it('resolves semantic hub and explorer HTML', () => {
    const root = makeRoot();
    expect(resolveVisualizationFile(root, '/visualizations/semantic/index.html')).toBe(
      path.join(root, 'semantic', 'index.html')
    );
    expect(
      resolveVisualizationFile(root, '/visualizations/semantic/unified_graph_explorer.html')
    ).toBe(path.join(root, 'semantic', 'unified_graph_explorer.html'));
  });

  it('serves directory index.html', () => {
    const root = makeRoot();
    expect(resolveVisualizationFile(root, '/visualizations/semantic/')).toBe(
      path.join(root, 'semantic', 'index.html')
    );
    expect(resolveVisualizationFile(root, '/visualizations/semantic')).toBe(
      path.join(root, 'semantic', 'index.html')
    );
  });

  it('strips query strings', () => {
    const root = makeRoot();
    expect(resolveVisualizationFile(root, '/visualizations/semantic/index.html?x=1')).toBe(
      path.join(root, 'semantic', 'index.html')
    );
  });

  it('rejects path traversal and missing files', () => {
    const root = makeRoot();
    expect(resolveVisualizationFile(root, '/visualizations/../package.json')).toBeNull();
    expect(resolveVisualizationFile(root, '/visualizations/semantic/nope.html')).toBeNull();
    expect(resolveVisualizationFile(root, '/dashboard')).toBeNull();
  });
});

describe('contentTypeFor', () => {
  it('maps html and gzip', () => {
    expect(contentTypeFor('index.html')).toContain('text/html');
    expect(contentTypeFor('unified_graph.json.gz')).toBe('application/gzip');
    expect(contentTypeFor('stats.json')).toContain('application/json');
  });
});
