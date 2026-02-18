import { TelemetryData } from './TelemetryWorker.js';
/**
 * Controller for handling telemetry data from clients
 */
export declare class TelemetryController {
    private telemetryWorker;
    constructor();
    /**
     * Receive telemetry events from clients
     */
    receiveEvents(payload: {
        events: TelemetryData[];
    }): Promise<{
        success: boolean;
        processed: number;
    }>;
    /**
     * Get recent agent activity
     */
    getAgentActivity(): Promise<{
        agents: {
            agentId: string;
            status: string;
        }[];
    }>;
    /**
     * Get tool usage metrics
     */
    getToolUsage(limitStr?: string): Promise<{
        tools: {
            toolId: string;
            count: number;
        }[];
    }>;
    /**
     * Get recent traces
     */
    getRecentTraces(limitStr?: string): Promise<{
        traces: any[];
    }>;
}
//# sourceMappingURL=TelemetryController.d.ts.map