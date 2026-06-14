/**
 * State Manager
 * Handles infrastructure state persistence and management
 */
import { InfrastructureState } from '../types/infrastructure.js';
import { InfrastructureFilters } from '../interfaces/IInfrastructureManager.js';
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
    getState(id: string): Promise<InfrastructureState | null>;
    listStates(filters?: InfrastructureFilters): Promise<InfrastructureState[]>;
    deleteState(id: string): Promise<void>;
    lockState(id: string, lockReason: string, lockBy?: string): Promise<void>;
    unlockState(id: string): Promise<void>;
    isStateLocked(id: string): Promise<boolean>;
    validateStateIntegrity(id: string): Promise<StateIntegrityResult>;
    cleanupStaleStates(maxAge?: number): Promise<CleanupResult>;
    private calculateChecksum;
    clearCache(): void;
    getCacheSize(): number;
}
export interface StateIntegrityResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export interface CleanupResult {
    cleanedStates: string[];
    errors: string[];
}
/**
 * In-memory implementation of StateStorage for testing
 */
export declare class InMemoryStateStorage implements StateStorage {
    private states;
    private locks;
    save(state: InfrastructureState): Promise<void>;
    get(id: string): Promise<InfrastructureState | null>;
    list(filters?: InfrastructureFilters): Promise<InfrastructureState[]>;
    delete(id: string): Promise<void>;
    lock(id: string, lockReason: string, lockBy: string): Promise<void>;
    unlock(id: string): Promise<void>;
    isLocked(id: string): Promise<boolean>;
    clear(): void;
    size(): number;
}
//# sourceMappingURL=StateManager.d.ts.map