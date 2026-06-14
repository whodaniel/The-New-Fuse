import { EventEmitter2 } from '@nestjs/event-emitter';
export interface StateSnapshot {
    id: string;
    data: Record<string, any>;
    timestamp: Date;
    version: number;
}
export declare class StateSynchronizer {
    private eventEmitter;
    private readonly logger;
    private state;
    private version;
    constructor(eventEmitter: EventEmitter2);
    updateState(key: string, value: any): Promise<void>;
    getState(key?: string): any;
    createSnapshot(): Promise<StateSnapshot>;
    restoreSnapshot(snapshot: StateSnapshot): Promise<void>;
    synchronize(remoteState: Record<string, any>): Promise<void>;
}
//# sourceMappingURL=StateSynchronizer.d.ts.map