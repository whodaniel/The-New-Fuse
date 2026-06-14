import { EventEmitter2 } from '@nestjs/event-emitter';
export interface DirectorStatus {
    directorId: string;
    status: 'active' | 'idle' | 'busy' | 'offline';
    currentTasks: number;
    capacity: number;
    lastHeartbeat: Date;
}
export interface DirectorHealth {
    directorId: string;
    healthy: boolean;
    issues: string[];
    uptime: number;
    responseTime: number;
}
export declare class DirectorMonitoringService {
    private eventEmitter;
    private readonly logger;
    private directorStatuses;
    constructor(eventEmitter: EventEmitter2);
    updateDirectorStatus(status: DirectorStatus): Promise<void>;
    getDirectorStatus(directorId: string): Promise<DirectorStatus | undefined>;
    getAllDirectorStatuses(): Promise<DirectorStatus[]>;
    checkDirectorHealth(directorId: string): Promise<DirectorHealth>;
}
//# sourceMappingURL=DirectorMonitoringService.d.ts.map