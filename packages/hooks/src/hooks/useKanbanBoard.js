import { useCallback, useState, useEffect, useMemo } from 'react';
import { SuggestionStatus, TaskStatus } from '../types/index';
import { useUndoRedo } from './useUndoRedo';
// Temporarily commented out to fix build
// import {
//   Table,
//   View,
//   Row,
//   Column,
//   AppState,
//   KanbanViewOptions,
//   DataType,
//   ViewType
// } from '@the-new-fuse/fairtable-core';
// Define temporary types for build
var DataType;
(function (DataType) {
    DataType["text"] = "text";
    DataType["number"] = "number";
    DataType["boolean"] = "boolean";
    DataType["date"] = "date";
    DataType["TEXT"] = "TEXT";
    DataType["LONG_TEXT"] = "LONG_TEXT";
    DataType["SINGLE_SELECT"] = "SINGLE_SELECT";
})(DataType || (DataType = {}));
var ViewType;
(function (ViewType) {
    ViewType["table"] = "table";
    ViewType["kanban"] = "kanban";
    ViewType["calendar"] = "calendar";
    ViewType["KANBAN"] = "KANBAN";
})(ViewType || (ViewType = {}));
export const useKanbanBoard = ({ suggestionService, initialSuggestions = [], initialTodos = [], retryAttempts = 3 }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        searchTerm: '',
        priorities: [],
        tags: []
    });
    const { state: { suggestions, todos }, canUndo, canRedo, undo, redo, set, reset } = useUndoRedo({
        suggestions: initialSuggestions,
        todos: initialTodos
    });
    const retryConfig = useMemo(() => ({
        maxAttempts: retryAttempts,
        delayMs: 1000,
    }), [retryAttempts]);
    const retryOperation = useCallback(async (operation, config) => {
        let lastError = null;
        for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
            try {
                return await operation();
            }
            catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                if (attempt < config.maxAttempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, config.delayMs));
                }
            }
        }
        throw lastError;
    }, []);
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [suggestionsData, todosData] = await Promise.all([
                retryOperation(() => suggestionService.getSuggestionsByStatus(SuggestionStatus.SUBMITTED), retryConfig),
                retryOperation(() => suggestionService.getAllTodos(), retryConfig)
            ]);
            reset({
                suggestions: suggestionsData,
                todos: todosData
            });
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load kanban data'));
        }
        finally {
            setLoading(false);
        }
    }, [suggestionService, retryOperation, retryConfig, reset]);
    useEffect(() => {
        loadData();
    }, [loadData]);
    const updateSuggestionStatus = useCallback(async (id, status) => {
        try {
            setError(null);
            const updatedSuggestion = await retryOperation(() => suggestionService.updateSuggestionStatus(id, status), retryConfig);
            set({
                suggestions: suggestions.map(s => s.id === id ? updatedSuggestion : s),
                todos
            });
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to update suggestion status'));
            throw err;
        }
    }, [suggestionService, retryOperation, retryConfig, set, suggestions, todos]);
    const updateTodoStatus = useCallback(async (id, status) => {
        try {
            setError(null);
            const updatedTodo = await retryOperation(() => suggestionService.updateTodoStatus(id, status), retryConfig);
            set({
                suggestions,
                todos: todos.map(t => t.id === id ? updatedTodo : t)
            });
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to update todo status'));
            throw err;
        }
    }, [suggestionService, retryOperation, retryConfig, set, suggestions, todos]);
    const convertSuggestionToFeature = useCallback(async (suggestionId) => {
        try {
            setError(null);
            const convertedSuggestion = await retryOperation(() => suggestionService.convertToFeature(suggestionId), retryConfig);
            set({
                suggestions: suggestions.filter(s => s.id !== suggestionId),
                todos
            });
            return convertedSuggestion;
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to convert suggestion to feature'));
            throw err;
        }
    }, [suggestionService, retryOperation, retryConfig, set, suggestions, todos]);
    const filterItems = useCallback((items, criteria) => {
        return items.filter(item => {
            // Search term filter
            const matchesSearchTerm = !criteria.searchTerm ||
                item.title.toLowerCase().includes(criteria.searchTerm.toLowerCase()) ||
                ('description' in item && item.description && item.description.toLowerCase().includes(criteria.searchTerm.toLowerCase()));
            // Priority filter
            const matchesPriority = criteria.priorities.length === 0 ||
                (item.priority && criteria.priorities.includes(item.priority.toLowerCase()));
            // Tags filter (only for FeatureSuggestion)
            const matchesTags = criteria.tags.length === 0 ||
                ('tags' in item && item.tags && criteria.tags.every(tag => item.tags.includes(tag)));
            return matchesSearchTerm && matchesPriority && matchesTags;
        });
    }, []);
    const filteredColumns = useMemo(() => [
        {
            id: 'suggestions',
            title: 'Feature Suggestions',
            items: filterItems(suggestions.filter(s => s.status === SuggestionStatus.SUBMITTED), filters),
        },
        {
            id: 'under-review',
            title: 'Under Review',
            items: filterItems(suggestions.filter(s => s.status === SuggestionStatus.UNDER_REVIEW), filters),
        },
        {
            id: 'todo',
            title: 'To Do',
            items: filterItems(todos.filter(t => t.status === TaskStatus.PENDING), filters),
        },
        {
            id: 'in-progress',
            title: 'In Progress',
            items: filterItems(todos.filter(t => t.status === TaskStatus.IN_PROGRESS), filters),
        },
        {
            id: 'done',
            title: 'Done',
            items: filterItems(todos.filter(t => t.status === TaskStatus.COMPLETED), filters),
        }
    ], [suggestions, todos, filters, filterItems]);
    const availableTags = useMemo(() => {
        const allTags = new Set();
        suggestions.forEach((suggestion) => {
            if (suggestion.tags) {
                suggestion.tags.forEach((tag) => allTags.add(tag));
            }
        });
        return Array.from(allTags);
    }, [suggestions]);
    const updateSearchTerm = useCallback((term) => {
        setFilters(prev => ({ ...prev, searchTerm: term }));
    }, []);
    const updatePriorityFilter = useCallback((priorities) => {
        setFilters(prev => ({ ...prev, priorities }));
    }, []);
    const updateTagsFilter = useCallback((tags) => {
        setFilters(prev => ({ ...prev, tags }));
    }, []);
    const handleDragEnd = useCallback(async (result) => {
        if (!result.destination)
            return;
        const { source, destination, draggableId } = result;
        if (source.droppableId === destination.droppableId) {
            return; // Same column, no status change needed
        }
        try {
            setError(null);
            if (source.droppableId === 'suggestions' || destination.droppableId === 'under-review') {
                const newStatus = destination.droppableId === 'under-review'
                    ? SuggestionStatus.UNDER_REVIEW
                    : SuggestionStatus.SUBMITTED;
                await updateSuggestionStatus(draggableId, newStatus);
            }
            else {
                const newStatus = destination.droppableId === 'in-progress'
                    ? TaskStatus.IN_PROGRESS
                    : destination.droppableId === 'done'
                        ? TaskStatus.COMPLETED
                        : TaskStatus.PENDING;
                await updateTodoStatus(draggableId, newStatus);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to update item status'));
            throw err;
        }
    }, [updateSuggestionStatus, updateTodoStatus]);
    const handleBatchOperation = useCallback(async (operation, itemIds, newStatus) => {
        try {
            setError(null);
            const isSuggestion = (id) => suggestions.some(s => s.id === id);
            const updates = await Promise.all(itemIds.map(async (id) => {
                if (operation === 'move' && newStatus) {
                    return isSuggestion(id)
                        ? suggestionService.updateSuggestionStatus(id, newStatus)
                        : suggestionService.updateTodoStatus(id, newStatus);
                }
                else if (operation === 'delete') {
                    return isSuggestion(id)
                        ? suggestionService.deleteSuggestion(id)
                        : suggestionService.deleteTodo(id);
                }
                else if (operation === 'duplicate') {
                    return isSuggestion(id)
                        ? suggestionService.duplicateSuggestion(id)
                        : suggestionService.duplicateTodo(id);
                }
            }));
            const newState = { suggestions, todos };
            updates.forEach((update) => {
                if (!update)
                    return;
                if ('status' in update) {
                    if (isSuggestion(update.id)) {
                        newState.suggestions = newState.suggestions.map(s => s.id === update.id ? update : s);
                    }
                    else {
                        newState.todos = newState.todos.map(t => t.id === update.id ? update : t);
                    }
                }
                else if (operation === 'delete') {
                    if (isSuggestion(update.id)) {
                        newState.suggestions = newState.suggestions.filter(s => s.id !== update.id);
                    }
                    else {
                        newState.todos = newState.todos.filter(t => t.id !== update.id);
                    }
                }
                else if (operation === 'duplicate') {
                    if (isSuggestion(update.id)) {
                        newState.suggestions = [...newState.suggestions, update];
                    }
                    else {
                        newState.todos = [...newState.todos, update];
                    }
                }
            });
            set(newState);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error(`Failed to perform batch ${operation}`));
            throw err;
        }
    }, [suggestionService, set, suggestions, todos]);
    // Add airtable-compatible data structures for gradual migration
    const airtableData = useMemo(() => {
        // Create columns for the airtable
        const titleColumn = {
            id: 'title',
            name: 'Title',
            type: DataType.TEXT,
            width: 200
        };
        const descriptionColumn = {
            id: 'description',
            name: 'Description',
            type: DataType.LONG_TEXT,
            width: 300
        };
        const priorityColumn = {
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
        };
        const statusColumn = {
            id: 'status',
            name: 'Status',
            type: DataType.SINGLE_SELECT,
            width: 150,
            options: filteredColumns.map(col => ({
                id: col.id,
                name: col.title,
                colorClass: 'bg-gray-100 text-gray-800'
            }))
        };
        const tableColumns = [titleColumn, descriptionColumn, priorityColumn, statusColumn];
        // Convert legacy items to rows
        const rows = [];
        filteredColumns.forEach(column => {
            column.items.forEach(item => {
                const suggestion = item;
                const todo = item;
                rows.push({
                    id: item.id,
                    data: {
                        title: item.title,
                        description: suggestion.description || todo.description || '',
                        priority: suggestion.priority || todo.priority || 'MEDIUM',
                        status: column.id,
                        // Preserve additional properties
                        ...Object.fromEntries(Object.entries(item).filter(([key]) => !['id', 'title', 'description', 'priority'].includes(key)))
                    },
                    createdAt: suggestion.createdAt ? (suggestion.createdAt instanceof Date ? suggestion.createdAt.toISOString() : suggestion.createdAt) :
                        todo.createdAt ? (todo.createdAt instanceof Date ? todo.createdAt.toISOString() : todo.createdAt) :
                            new Date().toISOString(),
                    updatedAt: suggestion.updatedAt ? (suggestion.updatedAt instanceof Date ? suggestion.updatedAt.toISOString() : suggestion.updatedAt) :
                        todo.updatedAt ? (todo.updatedAt instanceof Date ? todo.updatedAt.toISOString() : todo.updatedAt) :
                            new Date().toISOString(),
                    parentId: null,
                    depth: 0,
                    isCollapsed: false
                });
            });
        });
        // Create table
        const table = {
            id: 'kanban-board-table',
            name: 'Kanban Board',
            columns: tableColumns,
            rows,
            columnOrder: ['title', 'description', 'priority', 'status'],
            views: [],
            activeViewId: 'kanban-view'
        };
        // Create kanban view
        const kanbanViewOptions = {
            groupByColumnId: 'status'
        };
        const view = {
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
                status: false // Hidden since it's used for grouping
            },
            options: kanbanViewOptions
        };
        table.views = [view];
        const appState = {
            tables: [table],
            activeTableId: table.id
        };
        return {
            table,
            view,
            appState,
            columnsToDisplay: [titleColumn, descriptionColumn, priorityColumn],
            rowsToDisplay: rows
        };
    }, [filteredColumns, suggestions, todos]);
    // Show migration notice in development
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.info('🔄 [MIGRATION] useKanbanBoard now provides airtable-compatible data via .airtableData property. ' +
                'Consider migrating to direct airtable integration for better performance. ' +
                'See migration guide: docs/migration/kanban-board.md');
        }
    }, []);
    return {
        // Legacy API
        suggestions,
        todos,
        loading,
        error,
        updateSuggestionStatus,
        updateTodoStatus,
        convertSuggestionToFeature,
        handleBatchOperation,
        refresh: loadData,
        columns: filteredColumns,
        handleDragEnd,
        filters,
        availableTags,
        updateSearchTerm,
        updatePriorityFilter,
        updateTagsFilter,
        canUndo,
        canRedo,
        undo,
        redo,
        // New airtable-compatible API
        airtableData
    };
};
//# sourceMappingURL=useKanbanBoard.js.map