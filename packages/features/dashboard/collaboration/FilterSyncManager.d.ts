import { CollaborationManager } from './CollaborationManager';
import { FilterState } from './types/filters';
export declare class FilterSyncManager {
    private collaborationManager;
    private state;
    private listeners;
    constructor(collaborationManager: CollaborationManager, initialState: FilterState);
}
