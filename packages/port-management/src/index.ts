// packages/port-management/src/index.ts

export { ConfigurationUpdater } from './config-updater';
export type { ConfigUpdateTarget } from './config-updater';
export { PortRegistryService } from './services/port-registry.service';
export type {
  PortConflict,
  PortRegistration,
  PortResolution,
  ServiceConfiguration,
} from './services/port-registry.service';
