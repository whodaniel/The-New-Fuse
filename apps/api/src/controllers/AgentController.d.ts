import { Request, Response } from 'express';
/**
 * Agent controller for handling agent-related API endpoints
 */
export declare class AgentController {
    /**
     * List all available agents
     */
    list(req: Request, res: Response): Promise<void>;
    /**
     * Create a new agent
     */
    create(req: Request, res: Response): Promise<void>;
    /**
     * Get a specific agent
     */
    get(req: Request, res: Response): Promise<void>;
    /**
     * Update an agent
     */
    update(req: Request, res: Response): Promise<void>;
    /**
     * Delete an agent
     */
    delete(req: Request, res: Response): Promise<void>;
    /**
     * Start an agent
     */
    start(req: Request, res: Response): Promise<void>;
    /**
     * Stop an agent
     */
    stop(req: Request, res: Response): Promise<void>;
    /**
     * Get agent status
     */
    getStatus(req: Request, res: Response): Promise<void>;
}
