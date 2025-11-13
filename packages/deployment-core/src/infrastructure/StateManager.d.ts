/**
 * State Manager
 * Handles infrastructure state persistence and management
 */
import { InfrastructureState } from '../types/infrastructure';
import { InfrastructureFilters } from '../interfaces/IInfrastructureManager';
export interface StateStorage {
    save(state: InfrastructureState): Promise<void>;
    get(id: string): Promise<InfrastructureState | null>;
    list(filters?: InfrastructureFilters): Promise<InfrastructureState[]>;
    delete(id: string): Promise<void>;
    lock(id: string, lockReason: string, lockBy: string): Promise<void>;
    unlock(id: string): Promise<void>;
    isLocked(id: string): Promise<boolean>;
}
export declare class StateManager {
    private storage;
    private stateCache;
    private lockTimeout;
    constructor(storage: StateStorage, lockTimeout?: number);
    saveState(state: InfrastructureState): Promise<void>;
    listStates(filters?: InfrastructureFilters): Promise<InfrastructureState[]>;
    deleteState(id: string): Promise<void>;
    unlockState(id: string): Promise<void>;
    const errors: string[];
    const warnings: string[];
    const currentChecksum: any;
    if(currentChecksum: any): any;
}
//# sourceMappingURL=StateManager.d.ts.map