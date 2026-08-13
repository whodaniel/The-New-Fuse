import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const routerPath = resolve(process.cwd(), 'src/ComprehensiveRouter.tsx');
const routerSource = readFileSync(routerPath, 'utf8');

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const expectRouteWrappedBy = (path: string, wrapper: string) => {
  const pattern = new RegExp(
    `path="${escapeRegExp(path)}"[\\s\\S]*?<${wrapper}>[\\s\\S]*?<\\/${wrapper}>`,
    'm'
  );
  expect(routerSource).toMatch(pattern);
};

describe('Membership route protection contracts', () => {
  it('keeps key product routes protected behind RequireMemberAccess', () => {
    const memberProtectedRoutes = [
      '/analytics',
      '/suggestions',
      '/suggestions/new',
      '/suggestions/:id',
      '/goals',
      '/goals/:id',
      '/plans',
      '/plans/:id',
      '/timeline',
      '/macro-timeline',
      '/timeline/module',
    ];

    for (const path of memberProtectedRoutes) {
      expectRouteWrappedBy(path, 'RequireMemberAccess');
    }
  });

  it('keeps /membership route public and direct', () => {
    expect(routerSource).toContain('<Route path="/membership" element={<MembershipPage />} />');
  });
});
