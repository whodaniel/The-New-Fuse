import { describe, expect, it } from 'vitest';
import {
  LOCAL_SEMANTIC_PATHS,
  LOCAL_UI_ORIGIN,
  isLoopbackHttpOrigin,
  localStaticSurfaceUrl,
} from './localSurfaces';

describe('localStaticSurfaceUrl', () => {
  it('uses the current loopback origin so boot :1420 serves visualizations', () => {
    expect(localStaticSurfaceUrl(LOCAL_SEMANTIC_PATHS.hub, 'http://localhost:1420')).toBe(
      'http://localhost:1420/visualizations/semantic/index.html'
    );
    expect(localStaticSurfaceUrl(LOCAL_SEMANTIC_PATHS.explorer, 'http://127.0.0.1:5173/')).toBe(
      'http://127.0.0.1:5173/visualizations/semantic/unified_graph_explorer.html'
    );
  });

  it('falls back to the local UI origin off loopback', () => {
    expect(localStaticSurfaceUrl(LOCAL_SEMANTIC_PATHS.wordcount, 'https://thenewfuse.com')).toBe(
      `${LOCAL_UI_ORIGIN}/visualizations/semantic/wordcount_report.html`
    );
  });

  it('recognizes loopback origins', () => {
    expect(isLoopbackHttpOrigin('http://localhost:1420')).toBe(true);
    expect(isLoopbackHttpOrigin('http://127.0.0.1:1421')).toBe(true);
    expect(isLoopbackHttpOrigin('https://thenewfuse.com')).toBe(false);
  });
});
