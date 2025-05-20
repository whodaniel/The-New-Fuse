import { CollaborationManager } from './CollaborationManager.js';
import { FilterState } from './types/filters.js';
export declare class FilterSyncManager {
    private collaborationManager;
    private state;
    private listeners;
    constructor(collaborationManager: CollaborationManager, initialState: FilterState);
}
