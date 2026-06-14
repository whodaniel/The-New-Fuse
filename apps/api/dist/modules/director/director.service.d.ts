import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CascadeService } from '@the-new-fuse/core';
import { TaskService } from '../task/task.service';
import { AgentSwarmService } from './agent-swarm.service';
import { BMADService } from './bmad.service';
export declare class DirectorService implements OnModuleInit, OnModuleDestroy {
    private readonly swarmService;
    private readonly bmadService;
    private readonly taskService;
    private readonly cascadeService;
    private readonly configService;
    private readonly logger;
    private isRunning;
    private cycleCount;
    private intervalHandle;
    private redis;
    constructor(swarmService: AgentSwarmService, bmadService: BMADService, taskService: TaskService, cascadeService: CascadeService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    start(): Promise<void>;
    stop(): void;
    private executeCycle;
    private discoverTasks;
    private executeTasks;
    private performReflection;
    private updateHandoff;
    getStatus(): {
        isRunning: boolean;
        cycleCount: number;
        uptime: number;
    };
    /**
     * Get swarm activity logs from Redis
     */
    getSwarmLogs(limit?: number): Promise<any[]>;
}
//# sourceMappingURL=director.service.d.ts.map