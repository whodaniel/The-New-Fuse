// packages/port-management/src/index.ts

export { PortRegistryService } from './services/port-registry.service';
export { ConfigurationUpdater } from './config-updater.js';
export type {
  PortRegistration,
  PortConflict,
  PortResolution,
  ServiceConfiguration
} from './services/port-registry.service';
export type {
  ConfigUpdateTarget
} from './config-updater.js';
