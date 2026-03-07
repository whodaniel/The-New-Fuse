/**
 * Migration utilities for converting legacy data structures to airtable format
 * and providing deprecation warnings for smooth transitions.
 */

import { Table, Column, Row, DataType, View, ViewType } from '@the-new-fuse/fairtable-core';

// Migration warning system
interface MigrationWarning {
  component: string;
  message: string;
  migrationPath: string;
  severity: 'info' | 'warning' | 'error';
}

const migrationWarnings: MigrationWarning[] = [];

export const addMigrationWarning = (warning: MigrationWarning) => {
  migrationWarnings.push(warning);
  
  if (process.env.NODE_ENV === 'development') {
    const emoji = warning.severity === 'error' ? '❌' : warning.severity === 'warning' ? '⚠️' : 'ℹ️';
    console.warn(`${emoji} [MIGRATION] ${warning.component}: ${warning.message}`);
    console.warn(`📖 Migration guide: ${warning.migrationPath}`);
  }
};

export const getMigrationWarnings = () => [...migrationWarnings];

export const clearMigrationWarnings = () => {
  migrationWarnings.length = 0;
};

// Data transformation utilities
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
export const convertLegacyKanbanToAirtable = (
  legacyData: LegacyKanbanData,
  tableId: string = 'converted-kanban',
  tableName: string = 'Converted Kanban Board'
): AirtableConversionResult => {
  const conversionWarnings: MigrationWarning[] = [];

  // Define standard columns
  const columns: Column[] = [
    {
      id: 'title',
      name: 'Title',
      type: DataType.TEXT,
      width: 200
    },
    {
      id: 'description',
      name: 'Description', 
      type: DataType.LONG_TEXT,
      width: 300
    },
    {
      id: 'priority',
      name: 'Priority',
      type: DataType.SINGLE_SELECT,
      width: 120,
      options: [
        { id: 'LOW', name: 'Low', colorClass: 'bg-blue-100 text-blue-800' },
        { id: 'MEDIUM', name: 'Medium', colorClass: 'bg-yellow-100 text-yellow-800' },
        { id: 'HIGH', name: 'High', colorClass: 'bg-orange-100 text-orange-800' },
        { id: 'CRITICAL', name: 'Critical', colorClass: 'bg-red-100 text-red-800' }
      ]
    },
    {
      id: 'status',
      name: 'Status',
      type: DataType.SINGLE_SELECT,
      width: 150,
      options: legacyData.columns.map(col => ({
        id: col.id,
        name: col.title,
        colorClass: 'bg-gray-100 text-gray-800'
      }))
    }
  ];

  // Convert items to rows
  const rows: Row[] = [];
  const extraProperties = new Set<string>();

  legacyData.columns.forEach(column => {
    column.items.forEach(item => {
      // Track any extra properties for potential new columns
      Object.keys(item).forEach(key => {
        if (!['id', 'title', 'description', 'priority'].includes(key)) {
          extraProperties.add(key);
        }
      });

      const { id, title, description, priority, ...otherProps } = item;
      
      rows.push({
        id: id,
        data: {
          title: title || '',
          description: description || '',
          priority: priority || 'MEDIUM',
          status: column.id,
          ...otherProps
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parentId: null,
        depth: 0,
        isCollapsed: false
      });
    });
  });

  // Warn about extra properties that might need column mapping
  if (extraProperties.size > 0) {
    conversionWarnings.push({
      component: 'LegacyKanbanConverter',
      message: `Found additional properties that may need column mapping: ${Array.from(extraProperties).join(', ')}`,
      migrationPath: 'docs/migration/data-mapping.md',
      severity: 'warning'
    });
  }

  const table: Table = {
    id: tableId,
    name: tableName,
    columns,
    rows,
    columnOrder: ['title', 'description', 'priority', 'status'],
    views: [],
    activeViewId: 'kanban-view'
  };

  const view: View = {
    id: 'kanban-view',
    name: 'Kanban View',
    type: ViewType.KANBAN,
    filters: [],
    sorts: [],
    groupBy: [],
    columnOrder: ['title', 'description', 'priority'],
    columnVisibility: {
      title: true,
      description: true,
      priority: true,
      status: false
    },
    viewSpecificOptions: {
      groupByColumnId: 'status'
    }
  };

  table.views = [view];

  return {
    table,
    view,
    warnings: conversionWarnings
  };
};

/**
 * Validates data compatibility and suggests improvements
 */
export const validateDataCompatibility = (data: any): MigrationWarning[] => {
  const warnings: MigrationWarning[] = [];

  // Check for common compatibility issues
  if (Array.isArray(data.columns)) {
    data.columns.forEach((column: any, index: number) => {
      if (!column.id) {
        warnings.push({
          component: 'DataValidator',
          message: `Column at index ${index} missing required 'id' field`,
          migrationPath: 'docs/migration/data-validation.md',
          severity: 'error'
        });
      }

      if (!column.title && !column.name) {
        warnings.push({
          component: 'DataValidator',
          message: `Column at index ${index} missing title/name field`,
          migrationPath: 'docs/migration/data-validation.md',
          severity: 'error'
        });
      }

      if (Array.isArray(column.items)) {
        column.items.forEach((item: any, itemIndex: number) => {
          if (!item.id) {
            warnings.push({
              component: 'DataValidator',
              message: `Item at column ${index}, item ${itemIndex} missing required 'id' field`,
              migrationPath: 'docs/migration/data-validation.md',
              severity: 'error'
            });
          }
        });
      }
    });
  }

  return warnings;
};

/**
 * Preserves event handler compatibility by providing translation layer
 */
export const createEventHandlerAdapter = <T extends Record<string, any>>(
  legacyHandlers: T,
  translationMap: Record<keyof T, (args: any[]) => any[]>
): T => {
  const adaptedHandlers = {} as T;

  Object.keys(legacyHandlers).forEach(handlerKey => {
    const originalHandler = legacyHandlers[handlerKey];
    const translator = translationMap[handlerKey];

    if (originalHandler && translator) {
      (adaptedHandlers as any)[handlerKey] = (...args: any[]) => {
        const translatedArgs = translator(args);
        return originalHandler(...translatedArgs);
      };
    } else {
      (adaptedHandlers as any)[handlerKey] = originalHandler;
    }
  });

  return adaptedHandlers;
};

/**
 * Creates a deprecation notice for components
 */
export const createDeprecationNotice = (
  componentName: string,
  replacementComponent: string,
  migrationGuide: string,
  version: string = '2.0.0'
) => {
  return {
    message: `${componentName} is deprecated and will be removed in version ${version}. Use ${replacementComponent} instead.`,
    migrationGuide,
    showWarning: process.env.NODE_ENV === 'development'
  };
};

/**
 * Generates migration report
 */
export const generateMigrationReport = () => {
  const warnings = getMigrationWarnings();
  const report = {
    timestamp: new Date().toISOString(),
    totalWarnings: warnings.length,
    warningsBySeverity: {
      info: warnings.filter(w => w.severity === 'info').length,
      warning: warnings.filter(w => w.severity === 'warning').length,
      error: warnings.filter(w => w.severity === 'error').length
    },
    warningsByComponent: warnings.reduce((acc, warning) => {
      acc[warning.component] = (acc[warning.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    warnings
  };

  return report;
};

export default {
  addMigrationWarning,
  getMigrationWarnings,
  clearMigrationWarnings,
  convertLegacyKanbanToAirtable,
  validateDataCompatibility,
  createEventHandlerAdapter,
  createDeprecationNotice,
  generateMigrationReport
};
