/**
 * Migration utilities for converting legacy data structures to airtable format
 * and providing deprecation warnings for smooth transitions.
 */
import { Table, View } from '@the-new-fuse/fairtable-core';
interface MigrationWarning {
    component: string;
    message: string;
    migrationPath: string;
    severity: 'info' | 'warning' | 'error';
}
export declare const addMigrationWarning: (warning: MigrationWarning) => void;
export declare const getMigrationWarnings: () => MigrationWarning[];
export declare const clearMigrationWarnings: () => void;
export interface LegacyKanbanData {
    columns: Array<{
        id: string;
        title: string;
        items: Array<{
            id: string;
            title: string;
            description: string;
            priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
            [key: string]: any;
        }>;
    }>;
}
export interface AirtableConversionResult {
    table: Table;
    view: View;
    warnings: MigrationWarning[];
}
/**
 * Converts legacy kanban data to airtable format
 */
export declare const convertLegacyKanbanToAirtable: (legacyData: LegacyKanbanData, tableId?: string, tableName?: string) => AirtableConversionResult;
/**
 * Validates data compatibility and suggests improvements
 */
export declare const validateDataCompatibility: (data: any) => MigrationWarning[];
/**
 * Preserves event handler compatibility by providing translation layer
 */
export declare const createEventHandlerAdapter: <T extends Record<string, any>>(legacyHandlers: T, translationMap: Record<keyof T, (args: any[]) => any[]>) => T;
/**
 * Creates a deprecation notice for components
 */
export declare const createDeprecationNotice: (componentName: string, replacementComponent: string, migrationGuide: string, version?: string) => {
    message: string;
    migrationGuide: string;
    showWarning: boolean;
};
/**
 * Generates migration report
 */
export declare const generateMigrationReport: () => {
    timestamp: string;
    totalWarnings: number;
    warningsBySeverity: {
        info: number;
        warning: number;
        error: number;
    };
    warningsByComponent: Record<string, number>;
    warnings: MigrationWarning[];
};
declare const _default: {
    addMigrationWarning: (warning: MigrationWarning) => void;
    getMigrationWarnings: () => MigrationWarning[];
    clearMigrationWarnings: () => void;
    convertLegacyKanbanToAirtable: (legacyData: LegacyKanbanData, tableId?: string, tableName?: string) => AirtableConversionResult;
    validateDataCompatibility: (data: any) => MigrationWarning[];
    createEventHandlerAdapter: <T extends Record<string, any>>(legacyHandlers: T, translationMap: Record<keyof T, (args: any[]) => any[]>) => T;
    createDeprecationNotice: (componentName: string, replacementComponent: string, migrationGuide: string, version?: string) => {
        message: string;
        migrationGuide: string;
        showWarning: boolean;
    };
    generateMigrationReport: () => {
        timestamp: string;
        totalWarnings: number;
        warningsBySeverity: {
            info: number;
            warning: number;
            error: number;
        };
        warningsByComponent: Record<string, number>;
        warnings: MigrationWarning[];
    };
};
export default _default;
//# sourceMappingURL=migration-utils.d.ts.map