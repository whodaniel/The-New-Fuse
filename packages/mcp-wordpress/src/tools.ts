/**
 * MCP tool schemas + executors for the WordPress spoke.
 */
import { type WordpressCredentials, WordpressRestClient } from './client';

export const wordpressTools = [
  {
    name: 'wp_publish_post',
    description: 'Publishes or stages an article with SEO schema and metadata on WordPress',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'publish', 'pending'] },
        categories: { type: 'array', items: { type: 'string' } },
        tags: { type: 'array', items: { type: 'string' } },
        slug: { type: 'string' },
        meta: { type: 'object', description: 'RankMath / Yoast / custom meta injection' },
        featuredMediaId: { type: 'number' },
      },
      required: ['title', 'content', 'status'],
    },
  },
  {
    name: 'wp_get_content_graph',
    description: 'Pulls existing post titles, slugs, and categories for internal link mapping',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 50 },
      },
    },
  },
  {
    name: 'wp_ping',
    description: 'Verifies WordPress Application Password credentials',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'wp_verify_agent_discovery',
    description:
      'Fetches /ai-plugin.json, OpenAPI, and spoke health — confirms Agentic Web readiness',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'wp_get_agent_optimized_post',
    description: 'GET a post with agent_optimized semantic HTML (strips Elementor/layout noise)',
    inputSchema: {
      type: 'object',
      properties: { postId: { type: 'number' } },
      required: ['postId'],
    },
  },
  {
    name: 'wp_upsert_citation_map',
    description:
      'Writes GEO citation / internal-link graph meta consumed by JSON-LD on the live page',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'number' },
        citationMap: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of schema.org CreativeWork / URL citation objects',
        },
      },
      required: ['postId', 'citationMap'],
    },
  },
  {
    name: 'wp_get_citation_map',
    description: 'Reads the GEO citation map for a post',
    inputSchema: {
      type: 'object',
      properties: { postId: { type: 'number' } },
      required: ['postId'],
    },
  },
] as const;

export type WordpressToolName = (typeof wordpressTools)[number]['name'];

export async function executeWordpressTool(
  creds: WordpressCredentials,
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const client = new WordpressRestClient(creds);
  switch (name) {
    case 'wp_publish_post':
      return client.publishPost(args as unknown as Parameters<typeof client.publishPost>[0]);
    case 'wp_get_content_graph':
      return client.getContentGraph(Number(args.limit) || 50);
    case 'wp_ping':
      return client.ping();
    case 'wp_verify_agent_discovery':
      return client.verifyAgentDiscovery();
    case 'wp_get_agent_optimized_post':
      return client.getAgentOptimizedPost(Number(args.postId));
    case 'wp_upsert_citation_map':
      return client.putCitationMap(Number(args.postId), (args.citationMap as unknown[]) || []);
    case 'wp_get_citation_map':
      return client.getCitationMap(Number(args.postId));
    default:
      throw new Error(`Unknown WordPress tool: ${name}`);
  }
}
