/**
 * Agent Status Durable Object
 * 
 * Tracks real-time agent activity for TNF Command Center visibility.
 * Used by OpenClaw mesh to broadcast agent state to TNF UI.
 */

export interface AgentStatusState {
  sessionKey: string;
  status: 'idle' | 'thinking' | 'working' | 'error';
  currentTool?: string;
  startedAt?: number;
  lastActivity: number;
}

// In-memory cache for fast access (resets on worker restart)
const statusCache = new Map<string, AgentStatusState>();

export class AgentStatusDO {
  private state: DurableObjectState;
  
  constructor(state: DurableObjectState) {
    this.state = state;
  }
  
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // POST /agent-status - Update agent status
    if (path === '/agent-status' && request.method === 'POST') {
      try {
        const body = await request.json() as AgentStatusState;
        const { sessionKey, status, currentTool, startedAt, lastActivity } = body;
        
        if (!sessionKey) {
          return new Response(JSON.stringify({ error: 'sessionKey required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const state: AgentStatusState = {
          sessionKey,
          status: status || 'idle',
          currentTool,
          startedAt,
          lastActivity: lastActivity || Date.now(),
        };
        
        // Store in cache
        statusCache.set(sessionKey, state);
        
        // Also persist to DO storage for durability
        await this.state.storage.put(`status:${sessionKey}`, state);
        
        return new Response(JSON.stringify({ success: true, sessionKey, status }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // GET /agent-status?sessionKey=... - Get specific session status
    // GET /agent-status - Get all active statuses
    if (path === '/agent-status' && request.method === 'GET') {
      const sessionKey = url.searchParams.get('sessionKey');
      
      if (sessionKey) {
        const state = statusCache.get(sessionKey) || await this.state.storage.get(`status:${sessionKey}`);
        return new Response(JSON.stringify(state || { status: 'unknown' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Return all active (non-idle) agents
      const activities: AgentStatusState[] = [];
      
      for (const [key, state] of statusCache.entries()) {
        if (state.status !== 'idle') {
          activities.push(state);
        }
      }
      
      // Also check storage for any we might have missed
      const allKeys = await this.state.storage.list<AgentStatusState>({ prefix: 'status:' });
      for (const [key, state] of allKeys) {
        if (state.status !== 'idle' && !statusCache.has(state.sessionKey)) {
          activities.push(state);
        }
      }
      
      return new Response(JSON.stringify({ 
        activities,
        count: activities.length,
        timestamp: Date.now()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // DELETE /agent-status?sessionKey=... - Clear a session's status
    if (path === '/agent-status' && request.method === 'DELETE') {
      const sessionKey = url.searchParams.get('sessionKey');
      
      if (!sessionKey) {
        return new Response(JSON.stringify({ error: 'sessionKey required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      statusCache.delete(sessionKey);
      await this.state.storage.delete(`status:${sessionKey}`);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
}

/**
 * Worker entry point that routes to the AgentStatusDO
 */
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Health check
    if (path === '/health') {
      return new Response(JSON.stringify({ 
        status: 'healthy', 
        worker: 'agent-status',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Route to Durable Object for /agent-status
    if (path.startsWith('/agent-status')) {
      const id = env.AGENT_STATUS_DO.idFromName('global');
      const stub = env.AGENT_STATUS_DO.get(id);
      return stub.fetch(request);
    }
    
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};
