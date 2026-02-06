import { z } from 'zod';
import {
  AuthError,
  EdgeAccessControl,
  EdgeRateLimiter,
  checkRateLimitOrThrow,
  checkSkillAccessOrThrow,
  createErrorResponse,
  getAuthContext,
  type AuthContext,
} from './auth';
import { EdgeSkills } from './skills';

// Minimal MCP Protocol Types
const JSONRPCRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.any().optional(),
  id: z.union([z.string(), z.number()]).optional(),
});

// Tool to service mapping for rate limiting
const TOOL_SERVICE_MAP: Record<string, 'ai' | 'browser' | 'storage' | 'general'> = {
  ai_inference: 'ai',
  browser_scrape: 'browser',
  browser_screenshot: 'browser',
  research_topic: 'ai',
  remember: 'storage',
  recall: 'storage',
  generate_report: 'storage',
};

export const EdgeMCPTools = [
  {
    name: 'browser_scrape',
    description: 'Scrape a webpage using Cloudflare Browser Rendering',
    inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
    tier: 'PRO', // Requires PRO or higher
  },
  {
    name: 'browser_screenshot',
    description: 'Take a screenshot of a webpage',
    inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
    tier: 'PRO', // Requires PRO or higher
  },
  {
    name: 'ai_inference',
    description: 'Run AI inference on Cloudflare Workers AI',
    inputSchema: {
      type: 'object',
      properties: { prompt: { type: 'string' } },
      required: ['prompt'],
    },
    tier: 'FREE', // Available to all tiers
  },
  // NEW HIGH-LEVEL SKILLS
  {
    name: 'research_topic',
    description: 'Conduct deep research on a topic using AI planning and synthesis',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
        depth: { type: 'number' },
      },
      required: ['topic'],
    },
    tier: 'PRO', // Requires PRO or higher
  },
  {
    name: 'remember',
    description: 'Save a piece of information to long-term vector memory',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['content'],
    },
    tier: 'FREE', // Available to all tiers
  },
  {
    name: 'recall',
    description: 'Recall information from long-term memory',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
    tier: 'FREE', // Available to all tiers
  },
  {
    name: 'generate_report',
    description: 'Generate and save a markdown report to storage',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
        filename: { type: 'string' },
      },
      required: ['topic'],
    },
    tier: 'PRO', // Requires PRO or higher
  },
];

export class EdgeMCPHandler {
  static async handleRequest(request: Request, env: any) {
    try {
      // Authenticate request
      let authContext: AuthContext | null = null;
      try {
        authContext = await getAuthContext(request, env);
      } catch (error) {
        if (error instanceof AuthError) {
          return createErrorResponse(error);
        }
        throw error;
      }

      const body = await request.json();
      const { method, params, id } = JSONRPCRequestSchema.parse(body);

      if (method === 'tools/list') {
        // Filter tools based on user's tier
        const availableTools = EdgeMCPTools.filter((tool) =>
          EdgeAccessControl.canAccessSkill(authContext!.tier, tool.name)
        );

        return Response.json({
          jsonrpc: '2.0',
          id,
          result: {
            tools: availableTools,
          },
        });
      }

      if (method === 'tools/call') {
        const { name, arguments: args } = params;

        // Check if user has access to this tool
        checkSkillAccessOrThrow(authContext!.tier, name);

        // Check rate limits
        const service = TOOL_SERVICE_MAP[name] || 'general';
        await checkRateLimitOrThrow(authContext!.userId, authContext!.tier, service, env);

        const skills = new EdgeSkills(env);
        const rateLimiter = new EdgeRateLimiter(env);
        let result;

        switch (name) {
          // Low-level Tools
          case 'browser_scrape':
            result = { content: `Scraping ${args.url} (Simulated via MCP)` };
            await rateLimiter.recordUsage(authContext!.userId, 'browser', 1);
            break;
          case 'ai_inference':
            const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
              prompt: args.prompt,
              max_tokens: 256,
            });
            result = { text: response.response };
            await rateLimiter.recordUsage(authContext!.userId, 'ai', 256); // Approximate token count
            break;

          // High-level Skills
          case 'research_topic':
            result = await skills.researchTopic(args);
            await rateLimiter.recordUsage(authContext!.userId, 'ai', 1000); // Estimate
            break;
          case 'remember':
            result = await skills.saveMemory(args);
            await rateLimiter.recordUsage(authContext!.userId, 'storage', 1);
            break;
          case 'recall':
            result = await skills.recallMemory(args);
            await rateLimiter.recordUsage(authContext!.userId, 'storage', 1);
            break;
          case 'generate_report':
            result = await skills.generateReport(args);
            await rateLimiter.recordUsage(authContext!.userId, 'storage', 1);
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return Response.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result) }],
          },
        });
      }

      return Response.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: 'Method not found' },
      });
    } catch (e: any) {
      if (e instanceof AuthError) {
        return createErrorResponse(e);
      }
      return Response.json({ jsonrpc: '2.0', error: { code: -32700, message: e.message } });
    }
  }
}
