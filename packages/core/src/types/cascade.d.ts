import { EventEmitter } from 'events';
export declare enum CascadeMode {
    READ = "read",
    WRITE = "write"
}
export declare enum CascadeState {
    ACTIVE = "active",
    INACTIVE = "inactive"
}
export interface CascadeContext {
    mode: CascadeMode;
    state: CascadeState;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
export interface CascadeOptions {
    initialMode?: CascadeMode;
    initialState?: CascadeState;
    metadata?: Record<string, unknown>;
}
export declare class CascadeController extends EventEmitter {
    private context;
    constructor(options?: CascadeOptions);
    getMode(): CascadeMode;
    getState(): CascadeState;
    isWriteMode(): boolean;
    isActive(): boolean;
    setMode(mode: CascadeMode): void;
}
