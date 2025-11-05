/**
 * Agent Gateway Controller
 * Unified endpoint for all agent operations across services including TRAYCER-style functionality
 */
import { MessageEvent } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { ProxyService } from '../proxy/proxy.service';
export declare class AgentGatewayController {
    private readonly proxyService;
    constructor(proxyService: ProxyService);
    getAgents(query: Record<string, string>, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    createAgent(body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getActiveAgents(headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getAgentById(id: string, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    updateAgent(id: string, body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    updateAgentStatus(id: string, body: any, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteAgent(id: string, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    executePlanInAgent(agentId: string, body: {
        planId: string;
        context?: any;
        workspace?: any;
    }, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    executeVerificationCommentInAgent(agentId: string, body: {
        verificationId: string;
        context?: any;
    }, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    executeAllVerificationCommentsInAgent(agentId: string, body: {
        context?: any;
        parallel?: boolean;
    }, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    sendStructuredPrompt(agentId: string, body: {
        prompt: string;
        workspace?: any;
        files?: string[];
        metadata?: any;
    }, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    discoverAgents(query: Record<string, string>, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getAgentTasks(agentId: string, query: Record<string, string>, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getAgentQueue(agentId: string, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    configureAgent(agentId: string, body: {
        configPath?: string;
        settings?: any;
    }, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getWorkspaceContext(query: Record<string, string>, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    getWorkspaceFiles(query: Record<string, string>, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    exportTasks(body: {
        format: 'json' | 'markdown' | 'csv';
        agentIds?: string[];
        dateRange?: any;
    }, headers: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    streamTaskUpdates(agentId?: string): Observable<MessageEvent>;
}
//# sourceMappingURL=agent-gateway.controller.d.ts.map