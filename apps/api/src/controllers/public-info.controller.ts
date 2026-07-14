import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Public Info Controller
 *
 * Serves JSON responses for public-facing paths that the release checklist
 * (M02) requires to return application/json instead of 404.
 *
 * These are lightweight stubs for the alpha cohort. They confirm the path
 * exists and returns structured JSON. Real content (OpenAPI spec, pricing
 * tiers, feature matrix) can be filled in as the product matures.
 *
 * @security PUBLIC — No authentication required
 * @checklist M02 — All public REST endpoints return application/json
 */
@ApiTags('public')
@Controller()
export class PublicInfoController {
  @Get('docs')
  @ApiOperation({ summary: 'API documentation index' })
  @ApiResponse({ status: 200, description: 'Documentation endpoint info' })
  getDocs() {
    return {
      status: 'ok',
      path: '/docs',
      description: 'TNF API documentation',
      openapi: '/api/swagger',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('pricing')
  @ApiOperation({ summary: 'Pricing information' })
  @ApiResponse({ status: 200, description: 'Pricing tiers' })
  getPricing() {
    return {
      status: 'ok',
      path: '/pricing',
      plans: [
        {
          id: 'free',
          name: 'Free',
          description: 'Community access to TNF orchestration platform',
          price: 0,
          currency: 'USD',
          features: ['Agent orchestration', 'Relay mesh access', 'Community support'],
        },
        {
          id: 'pro',
          name: 'Pro',
          description: 'Full platform access with priority support',
          price: null,
          currency: 'USD',
          note: 'Pricing details coming soon',
          features: [
            'Everything in Free',
            'Priority relay bandwidth',
            'Advanced analytics',
            'Dedicated support',
          ],
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  @Get('features')
  @ApiOperation({ summary: 'Platform feature list' })
  @ApiResponse({ status: 200, description: 'Platform capabilities' })
  getFeatures() {
    return {
      status: 'ok',
      path: '/features',
      capabilities: [
        {
          id: 'agent-orchestration',
          name: 'Multi-Agent Orchestration',
          description: 'Coordinate AI agents across providers with the TNF relay mesh',
        },
        {
          id: 'mcp-servers',
          name: 'MCP Server Fleet',
          description: 'Model Context Protocol servers for tool integration',
        },
        {
          id: 'relay-mesh',
          name: 'WebSocket Relay Mesh',
          description: 'Real-time agent communication via the TNF relay protocol',
        },
        {
          id: 'federation',
          name: 'Federated Identity',
          description: 'Cross-platform agent identity with canonical entity IDs',
        },
        {
          id: 'cli',
          name: 'TNF CLI',
          description: 'Command-line interface for local-first agent management',
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }
}
