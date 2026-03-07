import { Request, Response } from 'express';

/**
 * Agent controller for handling agent-related API endpoints
 */
export class AgentController {
  private sendDeprecated(res: Response): void {
    res.status(410).json({
      success: false,
      message: 'Legacy AgentController is deprecated. Use /api/agents endpoints.',
      replacement: '/api/agents',
    });
  }

  /**
   * List all available agents
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      this.sendDeprecated(res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Create a new agent
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      this.sendDeprecated(res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get a specific agent
   */
  async get(req: Request, res: Response): Promise<void> {
    try {
      this.sendDeprecated(res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Update an agent
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      this.sendDeprecated(res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Delete an agent
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      this.sendDeprecated(res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Start an agent
   */
  async start(req: Request, res: Response): Promise<void> {
    try {
      this.sendDeprecated(res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Stop an agent
   */
  async stop(req: Request, res: Response): Promise<void> {
    try {
      this.sendDeprecated(res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get agent status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      this.sendDeprecated(res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }
}
