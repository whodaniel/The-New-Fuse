import { CollaborationManager } from './CollaborationManager.tsx';
import { FilterState } from './types/filters.tsx';
export declare class FilterSyncManager {
    private collaborationManager;
    private state;
    private listeners;
    constructor(collaborationManager: CollaborationManager, initialState: FilterState);
}
