/**
 * Agent Registration with Invite Code Validation
 *
 * This module handles agent registration on the Edge Worker,
 * enforcing invite code requirements for new agents.
 */

import { z } from 'zod';
import { AuthError, EdgeAuth, createErrorResponse, getAuthContext, type AuthContext } from './auth';

// =====================================================
// TYPES & SCHEMAS
// =====================================================

export const RegisterAgentSchema = z.object({
  agentId: z.string().min(1).max(255),
  agentName: z.string().min(1).max(255),
  agentType: z.enum(['kimi-k2', 'kimi-k2.5', 'custom']),
  capabilities: z.array(z.string()).optional(),
  inviteCode: z.string().min(1).max(20),
});

export type RegisterAgentInput = z.infer<typeof RegisterAgentSchema>;

export interface AgentRegistration {
  id: string;
  userId: string;
  agentId: string;
  agentName: string;
  agentType: string;
  capabilities: string[];
  inviteCode: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

// =====================================================
// AGENT REGISTRATION SERVICE
// =====================================================

export class AgentRegistrationService {
  constructor(private env: any) {}

  /**
   * Register a new agent with invite code validation
   */
  async registerAgent(
    authContext: AuthContext,
    input: RegisterAgentInput
  ): Promise<AgentRegistration> {
    const { agentId, agentName, agentType, capabilities = [], inviteCode } = input;

    // 1. Validate invite code
    const auth = new EdgeAuth(this.env);
    const inviteValidation = await auth.validateInviteCode(inviteCode);

    if (!inviteValidation.valid) {
      throw new AuthError('Invalid or expired invite code', 400, 'INVALID_INVITE_CODE');
    }

    // 2. Check if agent ID already exists
    const existingAgent = await this.env.DB.prepare('SELECT id FROM agents WHERE agent_id = ?')
      .bind(agentId)
      .first();

    if (existingAgent) {
      throw new AuthError('Agent ID already registered', 409, 'AGENT_EXISTS');
    }

    // 3. Check if user has already registered an agent with this invite code
    const existingUserAgent = await this.env.DB.prepare(
      'SELECT id FROM agents WHERE user_id = ? AND invite_code = ?'
    )
      .bind(authContext.userId, inviteCode)
      .first();

    if (existingUserAgent) {
      throw new AuthError('You have already used this invite code', 400, 'INVITE_CODE_USED');
    }

    // 4. Register the agent
    const registrationId = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.env.DB.prepare(
      `
      INSERT INTO agents (
        id, user_id, agent_id, agent_name, agent_type,
        capabilities, invite_code, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(
        registrationId,
        authContext.userId,
        agentId,
        agentName,
        agentType,
        JSON.stringify(capabilities),
        inviteCode,
        'ACTIVE',
        now
      )
      .run();

    // 5. Mark invite code as used
    await this.env.DB.prepare(
      `
      UPDATE invite_codes
      SET is_used = true, used_by = ?
      WHERE code = ?
    `
    )
      .bind(authContext.userId, inviteCode)
      .run();

    return {
      id: registrationId,
      userId: authContext.userId,
      agentId,
      agentName,
      agentType,
      capabilities,
      inviteCode,
      status: 'ACTIVE',
      createdAt: now,
    };
  }

  /**
   * Get agent registration by ID
   */
  async getAgentRegistration(
    authContext: AuthContext,
    registrationId: string
  ): Promise<AgentRegistration | null> {
    const result = await this.env.DB.prepare(
      `
      SELECT * FROM agents
      WHERE id = ? AND user_id = ?
    `
    )
      .bind(registrationId, authContext.userId)
      .first();

    if (!result) return null;

    return {
      id: result.id as string,
      userId: result.user_id as string,
      agentId: result.agent_id as string,
      agentName: result.agent_name as string,
      agentType: result.agent_type as string,
      capabilities: JSON.parse(result.capabilities as string),
      inviteCode: result.invite_code as string,
      status: result.status as 'PENDING' | 'ACTIVE' | 'SUSPENDED',
      createdAt: result.created_at as string,
    };
  }

  /**
   * List all agents for a user
   */
  async listAgents(authContext: AuthContext): Promise<AgentRegistration[]> {
    const results = await this.env.DB.prepare(
      `
      SELECT * FROM agents
      WHERE user_id = ?
      ORDER BY created_at DESC
    `
    )
      .bind(authContext.userId)
      .all();

    return (results.results || []).map((result: any) => ({
      id: result.id,
      userId: result.user_id,
      agentId: result.agent_id,
      agentName: result.agent_name,
      agentType: result.agent_type,
      capabilities: JSON.parse(result.capabilities),
      inviteCode: result.invite_code,
      status: result.status,
      createdAt: result.created_at,
    }));
  }

  /**
   * Update agent status (admin only)
   */
  async updateAgentStatus(
    registrationId: string,
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  ): Promise<void> {
    await this.env.DB.prepare(
      `
      UPDATE agents
      SET status = ?
      WHERE id = ?
    `
    )
      .bind(status, registrationId)
      .run();
  }

  /**
   * Delete an agent
   */
  async deleteAgent(authContext: AuthContext, registrationId: string): Promise<void> {
    await this.env.DB.prepare(
      `
      DELETE FROM agents
      WHERE id = ? AND user_id = ?
    `
    )
      .bind(registrationId, authContext.userId)
      .run();
  }
}

// =====================================================
// HTTP HANDLERS
// =====================================================

export class AgentRegistrationHandlers {
  /**
   * POST /agents/register
   * Register a new agent with invite code
   */
  static async register(request: Request, env: any): Promise<Response> {
    try {
      // Authenticate user
      const authContext = await getAuthContext(request, env);

      // Parse and validate input
      const body = await request.json();
      const input = RegisterAgentSchema.parse(body);

      // Register agent
      const service = new AgentRegistrationService(env);
      const registration = await service.registerAgent(authContext, input);

      return Response.json(
        {
          success: true,
          data: registration,
        },
        { status: 201 }
      );
    } catch (error: any) {
      if (error instanceof AuthError) {
        return createErrorResponse(error);
      }
      if (error instanceof z.ZodError) {
        return Response.json(
          {
            error: 'Validation error',
            details: error.issues,
          },
          { status: 400 }
        );
      }
      return Response.json(
        {
          error: 'Internal server error',
          message: error.message,
        },
        { status: 500 }
      );
    }
  }

  /**
   * GET /agents/:id
   * Get agent registration details
   */
  static async getAgent(request: Request, env: any): Promise<Response> {
    try {
      const authContext = await getAuthContext(request, env);
      const url = new URL(request.url);
      const registrationId = url.pathname.split('/').pop();

      if (!registrationId) {
        return Response.json(
          {
            error: 'Agent ID required',
          },
          { status: 400 }
        );
      }

      const service = new AgentRegistrationService(env);
      const agent = await service.getAgentRegistration(authContext, registrationId);

      if (!agent) {
        return Response.json(
          {
            error: 'Agent not found',
          },
          { status: 404 }
        );
      }

      return Response.json({
        success: true,
        data: agent,
      });
    } catch (error: any) {
      if (error instanceof AuthError) {
        return createErrorResponse(error);
      }
      return Response.json(
        {
          error: 'Internal server error',
          message: error.message,
        },
        { status: 500 }
      );
    }
  }

  /**
   * GET /agents
   * List all agents for the authenticated user
   */
  static async listAgents(request: Request, env: any): Promise<Response> {
    try {
      const authContext = await getAuthContext(request, env);
      const service = new AgentRegistrationService(env);
      const agents = await service.listAgents(authContext);

      return Response.json({
        success: true,
        data: agents,
      });
    } catch (error: any) {
      if (error instanceof AuthError) {
        return createErrorResponse(error);
      }
      return Response.json(
        {
          error: 'Internal server error',
          message: error.message,
        },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /agents/:id
   * Delete an agent
   */
  static async deleteAgent(request: Request, env: any): Promise<Response> {
    try {
      const authContext = await getAuthContext(request, env);
      const url = new URL(request.url);
      const registrationId = url.pathname.split('/').pop();

      if (!registrationId) {
        return Response.json(
          {
            error: 'Agent ID required',
          },
          { status: 400 }
        );
      }

      const service = new AgentRegistrationService(env);
      await service.deleteAgent(authContext, registrationId);

      return Response.json({
        success: true,
        message: 'Agent deleted successfully',
      });
    } catch (error: any) {
      if (error instanceof AuthError) {
        return createErrorResponse(error);
      }
      return Response.json(
        {
          error: 'Internal server error',
          message: error.message,
        },
        { status: 500 }
      );
    }
  }
}
