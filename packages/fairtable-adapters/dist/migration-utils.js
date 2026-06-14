"use strict";
/**
 * Migration utilities for converting legacy data structures to airtable format
 * and providing deprecation warnings for smooth transitions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMigrationReport = exports.createDeprecationNotice = exports.createEventHandlerAdapter = exports.validateDataCompatibility = exports.convertLegacyKanbanToAirtable = exports.clearMigrationWarnings = exports.getMigrationWarnings = exports.addMigrationWarning = void 0;
const fairtable_core_1 = require("@the-new-fuse/fairtable-core");
const migrationWarnings = [];
const addMigrationWarning = (warning) => {
    migrationWarnings.push(warning);
    if (process.env.NODE_ENV === 'development') {
        const emoji = warning.severity === 'error' ? '❌' : warning.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.warn(`${emoji} [MIGRATION] ${warning.component}: ${warning.message}`);
        console.warn(`📖 Migration guide: ${warning.migrationPath}`);
    }
};
exports.addMigrationWarning = addMigrationWarning;
const getMigrationWarnings = () => [...migrationWarnings];
exports.getMigrationWarnings = getMigrationWarnings;
const clearMigrationWarnings = () => {
    migrationWarnings.length = 0;
};
exports.clearMigrationWarnings = clearMigrationWarnings;
/**
 * Converts legacy kanban data to airtable format
 */
const convertLegacyKanbanToAirtable = (legacyData, tableId = 'converted-kanban', tableName = 'Converted Kanban Board') => {
    const conversionWarnings = [];
    // Define standard columns
    const columns = [
        {
            id: 'title',
            name: 'Title',
            type: fairtable_core_1.DataType.TEXT,
            width: 200
        },
        {
            id: 'description',
            name: 'Description',
            type: fairtable_core_1.DataType.LONG_TEXT,
            width: 300
        },
        {
            id: 'priority',
            name: 'Priority',
            type: fairtable_core_1.DataType.SINGLE_SELECT,
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
            type: fairtable_core_1.DataType.SINGLE_SELECT,
            width: 150,
            options: legacyData.columns.map(col => ({
                id: col.id,
                name: col.title,
                colorClass: 'bg-gray-100 text-gray-800'
            }))
        }
    ];
    // Convert items to rows
    const rows = [];
    const extraProperties = new Set();
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
    const table = {
        id: tableId,
        name: tableName,
        columns,
        rows,
        columnOrder: ['title', 'description', 'priority', 'status'],
        views: [],
        activeViewId: 'kanban-view'
    };
    const view = {
        id: 'kanban-view',
        name: 'Kanban View',
        type: fairtable_core_1.ViewType.KANBAN,
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
exports.convertLegacyKanbanToAirtable = convertLegacyKanbanToAirtable;
/**
 * Validates data compatibility and suggests improvements
 */
const validateDataCompatibility = (data) => {
    const warnings = [];
    // Check for common compatibility issues
    if (Array.isArray(data.columns)) {
        data.columns.forEach((column, index) => {
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
                column.items.forEach((item, itemIndex) => {
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
exports.validateDataCompatibility = validateDataCompatibility;
/**
 * Preserves event handler compatibility by providing translation layer
 */
const createEventHandlerAdapter = (legacyHandlers, translationMap) => {
    const adaptedHandlers = {};
    Object.keys(legacyHandlers).forEach(handlerKey => {
        const originalHandler = legacyHandlers[handlerKey];
        const translator = translationMap[handlerKey];
        if (originalHandler && translator) {
            adaptedHandlers[handlerKey] = (...args) => {
                const translatedArgs = translator(args);
                return originalHandler(...translatedArgs);
            };
        }
        else {
            adaptedHandlers[handlerKey] = originalHandler;
        }
    });
    return adaptedHandlers;
};
exports.createEventHandlerAdapter = createEventHandlerAdapter;
/**
 * Creates a deprecation notice for components
 */
const createDeprecationNotice = (componentName, replacementComponent, migrationGuide, version = '2.0.0') => {
    return {
        message: `${componentName} is deprecated and will be removed in version ${version}. Use ${replacementComponent} instead.`,
        migrationGuide,
        showWarning: process.env.NODE_ENV === 'development'
    };
};
exports.createDeprecationNotice = createDeprecationNotice;
/**
 * Generates migration report
 */
const generateMigrationReport = () => {
    const warnings = (0, exports.getMigrationWarnings)();
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
        }, {}),
        warnings
    };
    return report;
};
exports.generateMigrationReport = generateMigrationReport;
exports.default = {
    addMigrationWarning: exports.addMigrationWarning,
    getMigrationWarnings: exports.getMigrationWarnings,
    clearMigrationWarnings: exports.clearMigrationWarnings,
    convertLegacyKanbanToAirtable: exports.convertLegacyKanbanToAirtable,
    validateDataCompatibility: exports.validateDataCompatibility,
    createEventHandlerAdapter: exports.createEventHandlerAdapter,
    createDeprecationNotice: exports.createDeprecationNotice,
    generateMigrationReport: exports.generateMigrationReport
};
//# sourceMappingURL=migration-utils.js.map