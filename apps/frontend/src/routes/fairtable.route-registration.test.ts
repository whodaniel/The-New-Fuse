import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const routerPath = resolve(process.cwd(), 'src/ComprehensiveRouter.tsx');
const routerSource = readFileSync(routerPath, 'utf8');

describe('Fairtable route registration', () => {
  it('registers Fairtable dashboard lazy import', () => {
    expect(routerSource).toContain(
      "const FairtableDashboard = lazy(() => import('./pages/fairtable/FairtableDashboard'));"
    );
  });

  it('registers /fairtable route behind RequireAuth', () => {
    expect(routerSource).toMatch(
      /path="\/fairtable"[\s\S]*?<RequireAuth>[\s\S]*?<FairtableDashboard \/>[\s\S]*?<\/RequireAuth>/m
    );
  });

  it('registers /fairtable/:viewType route behind RequireAuth', () => {
    expect(routerSource).toMatch(
      /path="\/fairtable\/:viewType"[\s\S]*?<RequireAuth>[\s\S]*?<FairtableDashboard \/>[\s\S]*?<\/RequireAuth>/m
    );
  });
});
