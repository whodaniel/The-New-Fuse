/**
 * System Controller - System health and metrics
 */
import { Request, Response } from 'express';
export declare class SystemController {
    private logger;
    getHealth(req: Request, res: Response): Promise<void>;
    getMetrics(req: Request, res: Response): Promise<void>;
    getStatus(req: Request, res: Response): Promise<void>;
    restart(req: Request, res: Response): Promise<void>;
    getLogs(req: Request, res: Response): Promise<void>;
    private checkDatabaseHealth;
    private checkFilesystemHealth;
    private getMemoryStatus;
    private getCPUUsage;
    private getDiskUsage;
    private checkWorkflowEngineHealth;
    private checkAgentSystemHealth;
    private checkMCPHealth;
}
//# sourceMappingURL=system.controller.d.ts.map