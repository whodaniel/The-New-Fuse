/**
 * @the-new-fuse/fairtable-adapters
 *
 * Migration adapters for transitioning from legacy components to fairtable-based implementations.
 * Provides backward compatibility while enabling gradual migration to new fairtable architecture.
 */
export { default as KanbanBoardAdapter } from './KanbanBoardAdapter.js';
export * from './migration-utils.js';
export type { Table, View, Row, Column, CellValue, AppState, DataType, ViewType, KanbanViewOptions } from '@the-new-fuse/fairtable-core';
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
export declare const createMigrationStatus: (component: string, status: MigrationStatus["status"], warnings?: string[], migrationGuide?: string) => MigrationStatus;
export declare const ADAPTER_VERSION = "1.0.0";
export declare const SUPPORTED_LEGACY_VERSIONS: string[];
export declare const TARGET_AIRTABLE_VERSION = "1.0.0";
export declare const DEFAULT_ADAPTER_CONFIG: {
    enableDeprecationWarnings: boolean;
    showMigrationTips: boolean;
    logMigrationEvents: boolean;
    validateDataIntegrity: boolean;
};
//# sourceMappingURL=index.d.ts.map