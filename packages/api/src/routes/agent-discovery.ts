/**
 * Agent Discovery API Routes
 *
 * REST API endpoints for agent discovery, registration, and querying.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AgentDiscoveryRegistry } from '../services/agent-discovery-registry.service';
import { CapabilityMatcher } from '../services/capability-matcher.service';
import { ApiError } from '../middleware/error.middleware';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.util';
import {
  AgentRegistration,
  AgentHeartbeat,
  DiscoveryQuery,
  AgentStatus,
} from '../types/agent-discovery.types';

const router: Router = Router();

// Initialize services
const discoveryRegistry = new AgentDiscoveryRegistry({
  heartbeatInterval: 30000,
  heartbeatTimeout: 60000,
  enablePubSub: true,
});

const capabilityMatcher = new CapabilityMatcher();

/**
 * POST /api/agents/discovery/register
 * Register a new agent or update existing registration
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const registration: AgentRegistration = req.body;

    // Validate registration
    if (!registration.agentId) {
      return next(new ApiError('agentId is required', 400));
    }
    if (!registration.name) {
      return next(new ApiError('name is required', 400));
    }
    if (!registration.version) {
      return next(new ApiError('version is required', 400));
    }
    if (!registration.capabilities || !Array.isArray(registration.capabilities)) {
      return next(new ApiError('capabilities array is required', 400));
    }

    // Validate capabilities
    for (const capability of registration.capabilities) {
      if (!capability.name || !capability.version || !capability.description) {
        return next(
          new ApiError('Each capability must have name, version, and description', 400)
        );
      }
      if (capability.confidence === undefined || capability.confidence < 0 || capability.confidence > 1) {
        return next(new ApiError('Capability confidence must be between 0 and 1', 400));
      }
    }

    await discoveryRegistry.registerAgent(registration);

    sendCreated(res, {
      message: 'Agent registered successfully',
      agentId: registration.agentId,
    });
  } catch (err: any) {
    next(new ApiError(err.message || 'Failed to register agent', 500));
  }
});

/**
 * POST /api/agents/discovery/heartbeat
 * Send agent heartbeat with current metrics
 */
router.post('/heartbeat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const heartbeat: AgentHeartbeat = req.body;

    // Validate heartbeat
    if (!heartbeat.agentId) {
      return next(new ApiError('agentId is required', 400));
    }
    if (!heartbeat.metrics) {
      return next(new ApiError('metrics are required', 400));
    }
    if (!heartbeat.status) {
      return next(new ApiError('status is required', 400));
    }

    // Set timestamp
    heartbeat.timestamp = new Date();

    await discoveryRegistry.heartbeat(heartbeat);

    sendSuccess(res, {
      message: 'Heartbeat received',
      timestamp: heartbeat.timestamp,
    });
  } catch (err: any) {
    next(new ApiError(err.message || 'Failed to process heartbeat', 500));
  }
});

/**
 * POST /api/agents/discovery/deregister
 * Deregister an agent
 */
router.post('/deregister', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.body;

    if (!agentId) {
      return next(new ApiError('agentId is required', 400));
    }

    await discoveryRegistry.deregisterAgent(agentId);

    sendSuccess(res, {
      message: 'Agent deregistered successfully',
      agentId,
    });
  } catch (err: any) {
    next(new ApiError(err.message || 'Failed to deregister agent', 500));
  }
});

/**
 * POST /api/agents/discover
 * Discover agents based on query criteria
 */
router.post('/discover', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: DiscoveryQuery = req.body;

    const result = await discoveryRegistry.discoverAgents(query);

    sendSuccess(res, result);
  } catch (err: any) {
    next(new ApiError(err.message || 'Failed to discover agents', 500));
  }
});

/**
 * GET /api/agents/discovery
 * Get all registered agents
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = await discoveryRegistry.getAllAgents();

    sendSuccess(res, {
      agents,
      total: agents.length,
      timestamp: new Date(),
    });
  } catch (err: any) {
    next(new ApiError(err.message || 'Failed to get agents', 500));
  }
});

/**
 * GET /api/agents/discovery/:agentId
 * Get specific agent details
 */
router.get('/:agentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;

    const agent = await discoveryRegistry.getAgentById(agentId);

    if (!agent) {
      return next(new ApiError('Agent not found', 404));
    }

    sendSuccess(res, agent);
  } catch (err: any) {
    next(new ApiError(err.message || 'Failed to get agent', 500));
  }
});

/**
 * POST /api/agents/discovery/match
 * Find best capability matches using semantic search
 */
router.post('/match', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, minScore, maxResults, preferLowLoad } = req.body;

    if (!query) {
      return next(new ApiError('query is required', 400));
    }

    const agents = await discoveryRegistry.getAllAgents();
    const matches = capabilityMatcher.findCapabilityMatches(agents, query, {
      minScore,
      maxResults,
      preferLowLoad,
    });

    sendSuccess(res, {
      matches,
      total: matches.length,
      query,
    });
  } catch (err: any) {
    next(new ApiError(err.message || 'Failed to match capabilities', 500));
  }
});

/**
 * POST /api/agents/discovery/compose
 * Compose capabilities by chaining multiple agents
 */
router.post('/compose', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { capabilities, maxChainLength, preferReliable, maxCost } = req.body;

    if (!capabilities || !Array.isArray(capabilities) || capabilities.length === 0) {
      return next(new ApiError('capabilities array is required', 400));
    }

    const agents = await discoveryRegistry.getAllAgents();
    const compositions = capabilityMatcher.composeCapabilities(capabilities, agents, {
      maxChainLength,
      preferReliable,
      maxCost,
    });

    sendSuccess(res, {
      compositions,
      total: compositions.length,
      requestedCapabilities: capabilities,
    });
  } catch (err: any) {
    next(new ApiError(err.message || 'Failed to compose capabilities', 500));
  }
});

/**
 * GET /api/agents/discovery/health
 * Get discovery system health status
 */
router.get('/system/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = await discoveryRegistry.getAllAgents();
    const onlineAgents = agents.filter((a) => a.status === AgentStatus.ONLINE);
    const healthyAgents = agents.filter((a) => a.metrics.isHealthy);

    const avgLoad =
      agents.length > 0
        ? agents.reduce((sum, a) => sum + a.load, 0) / agents.length
        : 0;

    const avgSuccessRate =
      agents.length > 0
        ? agents.reduce((sum, a) => sum + a.metrics.successRate, 0) / agents.length
        : 0;

    sendSuccess(res, {
      system: {
        healthy: true,
        timestamp: new Date(),
      },
      agents: {
        total: agents.length,
        online: onlineAgents.length,
        healthy: healthyAgents.length,
        avgLoad: Number(avgLoad.toFixed(3)),
        avgSuccessRate: Number(avgSuccessRate.toFixed(3)),
      },
    });
  } catch (err: any) {
    next(new ApiError(err.message || 'Failed to get system health', 500));
  }
});

/**
 * POST /api/agents/discovery/query/advanced
 * Advanced query with multiple filters and semantic search
 */
router.post('/query/advanced', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: DiscoveryQuery = {
      ...req.body,
      semanticSearch: true, // Enable semantic search for advanced queries
    };

    const result = await discoveryRegistry.discoverAgents(query);

    // Add capability matches if query includes capability search
    let matches = undefined;
    if (query.capability) {
      matches = capabilityMatcher.findCapabilityMatches(result.agents, query.capability, {
        minScore: query.minConfidence,
        maxResults: query.limit,
      });
    }

    sendSuccess(res, {
      ...result,
      matches,
    });
  } catch (err: any) {
    next(new ApiError(err.message || 'Failed to execute advanced query', 500));
  }
});

/**
 * WebSocket endpoint would be defined separately for real-time updates
 * Example structure:
 *
 * discoveryRegistry.on(DiscoveryEvent.AGENT_REGISTERED, (data) => {
 *   // Broadcast to connected WebSocket clients
 *   wsServer.broadcast({ event: 'agent:registered', data });
 * });
 */

export default router;
