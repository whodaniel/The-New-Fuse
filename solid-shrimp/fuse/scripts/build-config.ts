export const BUILD_ORDER = [
  '@the-new-fuse/types',
  '@the-new-fuse/utils',
  '@the-new-fuse/core',
  '@the-new-fuse/ui',
  '@the-new-fuse/database',
  '@the-new-fuse/feature-tracker',
  '@the-new-fuse/feature-suggestions'
] as const;

export const SERVICES = [
  'api',
  'backend',
  'frontend',
  'trae-agent'
] as const;

export const DEV_PORTS = {
  frontend: 3000,
  api: 3001,
  backend: 3002,
  'trae-agent': 3003
} as const;

export type WorkspacePackage = typeof BUILD_ORDER[number];
export type Service = typeof SERVICES[number];