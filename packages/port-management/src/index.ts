// packages/port-management/src/index.ts

export { PortRegistryService } from './services/port-registry.service.js';
export { ConfigurationUpdater } from './config-updater.js';
export type {
  PortRegistration,
  PortConflict,
  PortResolution,
  ServiceConfiguration
} from './services/port-registry.service.js';
export type {
  ConfigUpdateTarget
} from './config-updater.js';
