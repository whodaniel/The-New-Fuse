import { defineConfig } from 'deepsec/config';

export default defineConfig({
  projects: [
    {
      id: 'The-New-Fuse',
      root: '..',
      scan: {
        ignorePaths: [
          'node_modules/**',
          '.git/**',
          '.next/**',
          'dist/**',
          'build/**',
          'coverage/**',
          '*.test.ts',
          '*.test.tsx',
          '*.spec.ts',
          '*.spec.tsx',
          '**/__tests__/**',
          '**/__mocks__/**',
          '**/vendor/**',
          '**/*.generated.*',
          '**/fixtures/**',
          '**/mocks/**',
          '**/__snapshots__/**',
          'archive/**',
          '.deepsec/**',
          '.tnf/**',
          '.fuse/**',
          '**/*.lock',
          '**/*.log',
          'apps/external/**',
          'apps/skideancer-ide/**',
          'clean_landing/**',
          'app_deploy_final/**',
          'data/ingestion-runs/**',
        ],
        priorityPaths: [
          'packages/relay-core/**',
          'packages/tnf-cli/**',
          'packages/protocol-contracts/**',
          'apps/api/**',
          'apps/frontend/src/**',
        ],
      },
    },
    // <deepsec:projects-insert-above>
  ],
});
