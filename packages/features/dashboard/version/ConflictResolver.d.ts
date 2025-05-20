export interface Conflict {
    id: string;
    path: string[];
    source: {
        value: unknown;
        version: string;
        branch: string;
    };
    target: {
        value: unknown;
        version: string;
        branch: string;
    };
    resolved?: boolean;
    resolution?: source' | 'target' | 'custom';
    customValue?: unknown;
}
export declare class ConflictResolver {
    private conflicts;
    constructor();
}
