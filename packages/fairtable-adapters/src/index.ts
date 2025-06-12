/**
 * @the-new-fuse/fairtable-adapters
 * 
 * Migration adapters for transitioning from legacy components to fairtable-based implementations.
 * Provides backward compatibility while enabling gradual migration to new fairtable architecture.
 */

// Core adapter components
export { default as KanbanBoardAdapter } from './KanbanBoardAdapter';

// Migration utilities
export * from './migration-utils';

// Re-export types from airtable-core for convenience
export type {
  Table,
  View,
  Row,
  Column,
  CellValue,
  AppState,
  DataType,
  ViewType,
  KanbanViewOptions
} from '@the-new-fuse/fairtable-core';

// Adapter-specific types
export interface AdapterProps<TLegacyProps = any, TNewProps = any> {
  legacyProps: TLegacyProps;
  onMigrationWarning?: (warning: string) => void;
  enableDeprecationWarnings?: boolean;
}

export interface MigrationStatus {
  component: string;
  status: 'compatible' | 'needs_migration' | 'deprecated';
  warnings: string[];
  migrationGuide?: string;
}

// Helper functions for common migration tasks
export const createMigrationStatus = (
  component: string,
  status: MigrationStatus['status'],
  warnings: string[] = [],
  migrationGuide?: string
): MigrationStatus => ({
  component,
  status,
  warnings,
  migrationGuide
});

// Version information
export const ADAPTER_VERSION = '1.0.0';
export const SUPPORTED_LEGACY_VERSIONS = ['1.x', '2.x'];
export const TARGET_AIRTABLE_VERSION = '1.0.0';

// Default configuration for migration adapters
export const DEFAULT_ADAPTER_CONFIG = {
  enableDeprecationWarnings: process.env.NODE_ENV === 'development',
  showMigrationTips: true,
  logMigrationEvents: false,
  validateDataIntegrity: true
};
