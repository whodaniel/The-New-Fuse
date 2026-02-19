/**
 * TNF Entity ID Taxonomy V2 - Registration Script
 *
 * Populates the new V2 tables with all known entities:
 * - LLM Models
 * - Harnesses
 * - MCP Servers
 * - Agent Definitions
 *
 * Reference: docs/TNF_ENTITY_ID_TAXONOMY_V2.md
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/thenewfuse';

const sql = postgres(DATABASE_URL);

interface LlmRecord {
  tnf_id: string;
  name: string;
  provider: string;
  model_id: string;
  family: string;
  version: string;
  context_window?: number;
  supports_vision: boolean;
  supports_tools: boolean;
  supports_streaming: boolean;
  is_current: boolean;
}

interface HarnessRecord {
  tnf_id: string;
  name: string;
  platform: string;
  instance?: string;
  environment: string;
  endpoint_url?: string;
  ws_url?: string;
  status: string;
}

interface McpRecord {
  tnf_id: string;
  name: string;
  description?: string;
  protocol: string;
  transport?: string;
  command?: string;
  scope: string;
  status: string;
}

interface AgentDefRecord {
  tnf_id: string;
  name: string;
  description?: string;
  definition_source?: string;
  agent_type: string;
  is_system: boolean;
  access_level: string;
}

function dbValue<T>(value: T | undefined): T | null {
  return value === undefined ? null : value;
}

async function registerLlm(record: LlmRecord) {
  try {
    await sql`
      INSERT INTO tnf_llm_models (tnf_id, name, provider, model_id, family, version, context_window, supports_vision, supports_tools, supports_streaming, is_current)
      VALUES (${record.tnf_id}, ${record.name}, ${record.provider}, ${record.model_id}, ${record.family}, ${dbValue(record.version)}, ${dbValue(record.context_window)}, ${record.supports_vision}, ${record.supports_tools}, ${record.supports_streaming}, ${record.is_current})
      ON CONFLICT (tnf_id) DO UPDATE SET
        name = EXCLUDED.name,
        provider = EXCLUDED.provider,
        model_id = EXCLUDED.model_id,
        family = EXCLUDED.family,
        version = EXCLUDED.version,
        is_current = EXCLUDED.is_current
    `;
    console.log(`✅ Registered: ${record.tnf_id}`);
  } catch (error) {
    console.error(`❌ Failed to register ${record.tnf_id}:`, error);
  }
}

async function registerHarness(record: HarnessRecord) {
  try {
    await sql`
      INSERT INTO tnf_harnesses (tnf_id, name, platform, instance, environment, endpoint_url, ws_url, status)
      VALUES (${record.tnf_id}, ${record.name}, ${record.platform}, ${dbValue(record.instance)}, ${record.environment}, ${dbValue(record.endpoint_url)}, ${dbValue(record.ws_url)}, ${record.status})
      ON CONFLICT (tnf_id) DO UPDATE SET
        name = EXCLUDED.name,
        platform = EXCLUDED.platform,
        instance = EXCLUDED.instance,
        environment = EXCLUDED.environment,
        endpoint_url = EXCLUDED.endpoint_url,
        ws_url = EXCLUDED.ws_url,
        status = EXCLUDED.status
    `;
    console.log(`✅ Registered: ${record.tnf_id}`);
  } catch (error) {
    console.error(`❌ Failed to register ${record.tnf_id}:`, error);
  }
}

async function registerMcp(record: McpRecord) {
  try {
    await sql`
      INSERT INTO tnf_mcp_servers (tnf_id, name, description, protocol, transport, command, scope, status)
      VALUES (${record.tnf_id}, ${record.name}, ${dbValue(record.description)}, ${record.protocol}, ${dbValue(record.transport)}, ${dbValue(record.command)}, ${record.scope}, ${record.status})
      ON CONFLICT (tnf_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        protocol = EXCLUDED.protocol,
        transport = EXCLUDED.transport,
        command = EXCLUDED.command,
        scope = EXCLUDED.scope,
        status = EXCLUDED.status
    `;
    console.log(`✅ Registered: ${record.tnf_id}`);
  } catch (error) {
    console.error(`❌ Failed to register ${record.tnf_id}:`, error);
  }
}

async function registerAgentDef(record: AgentDefRecord) {
  try {
    await sql`
      INSERT INTO tnf_agent_definitions (tnf_id, name, description, definition_source, agent_type, is_system, access_level)
      VALUES (${record.tnf_id}, ${record.name}, ${dbValue(record.description)}, ${dbValue(record.definition_source)}, ${record.agent_type}, ${record.is_system}, ${record.access_level})
      ON CONFLICT (tnf_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        definition_source = EXCLUDED.definition_source,
        agent_type = EXCLUDED.agent_type,
        is_system = EXCLUDED.is_system,
        access_level = EXCLUDED.access_level
    `;
    console.log(`✅ Registered: ${record.tnf_id}`);
  } catch (error) {
    console.error(`❌ Failed to register ${record.tnf_id}:`, error);
  }
}

async function main() {
  console.log('🚀 TNF Entity Registration V2 Started\n');

  // ============================================================================
  // LLM MODELS (TNF:LLM:base:...)
  // ============================================================================
  console.log('🧠 LLM Models...\n');

  const llms: LlmRecord[] = [
    // Claude
    {
      tnf_id: 'TNF:LLM:base:claude-opus@4.6',
      name: 'Claude Opus 4.6',
      provider: 'Anthropic',
      model_id: 'claude-opus-4-20250514',
      family: 'claude',
      version: '4.6',
      context_window: 200000,
      supports_vision: true,
      supports_tools: true,
      supports_streaming: true,
      is_current: true,
    },
    {
      tnf_id: 'TNF:LLM:base:claude-opus@4.5',
      name: 'Claude Opus 4.5',
      provider: 'Anthropic',
      model_id: 'claude-opus-4-5-20250929',
      family: 'claude',
      version: '4.5',
      context_window: 200000,
      supports_vision: true,
      supports_tools: true,
      supports_streaming: true,
      is_current: false,
    },
    {
      tnf_id: 'TNF:LLM:base:claude-sonnet@4.5',
      name: 'Claude Sonnet 4.5',
      provider: 'Anthropic',
      model_id: 'claude-sonnet-4-5-20250929',
      family: 'claude',
      version: '4.5',
      context_window: 200000,
      supports_vision: true,
      supports_tools: true,
      supports_streaming: true,
      is_current: true,
    },
    {
      tnf_id: 'TNF:LLM:base:claude-haiku@4.5',
      name: 'Claude Haiku 4.5',
      provider: 'Anthropic',
      model_id: 'claude-haiku-4-5-20251001',
      family: 'claude',
      version: '4.5',
      context_window: 200000,
      supports_vision: true,
      supports_tools: true,
      supports_streaming: true,
      is_current: true,
    },

    // Gemini
    {
      tnf_id: 'TNF:LLM:base:gemini-3-pro',
      name: 'Gemini 3 Pro',
      provider: 'Google',
      model_id: 'gemini-2.0-pro-exp-02-05',
      family: 'gemini',
      version: '3',
      context_window: 1048576,
      supports_vision: true,
      supports_tools: true,
      supports_streaming: true,
      is_current: true,
    },
    {
      tnf_id: 'TNF:LLM:base:gemini-3-flash',
      name: 'Gemini 3 Flash',
      provider: 'Google',
      model_id: 'gemini-2.0-flash-001',
      family: 'gemini',
      version: '3',
      context_window: 1048576,
      supports_vision: true,
      supports_tools: true,
      supports_streaming: true,
      is_current: true,
    },

    // OpenAI
    {
      tnf_id: 'TNF:LLM:base:gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      model_id: 'gpt-4o',
      family: 'gpt',
      version: '4o',
      context_window: 128000,
      supports_vision: true,
      supports_tools: true,
      supports_streaming: true,
      is_current: true,
    },
    {
      tnf_id: 'TNF:LLM:base:o3',
      name: 'OpenAI o3',
      provider: 'OpenAI',
      model_id: 'o3',
      family: 'o-series',
      version: '3',
      context_window: 200000,
      supports_vision: false,
      supports_tools: true,
      supports_streaming: false,
      is_current: true,
    },
    {
      tnf_id: 'TNF:LLM:base:codex',
      name: 'OpenAI Codex',
      provider: 'OpenAI',
      model_id: 'codex',
      family: 'codex',
      version: '1',
      context_window: 128000,
      supports_vision: false,
      supports_tools: true,
      supports_streaming: true,
      is_current: true,
    },

    // Chinese Models
    {
      tnf_id: 'TNF:LLM:base:glm@5.0',
      name: 'GLM 5.0',
      provider: 'Zhipu',
      model_id: 'glm-5',
      family: 'glm',
      version: '5.0',
      context_window: 128000,
      supports_vision: true,
      supports_tools: true,
      supports_streaming: true,
      is_current: true,
    },
    {
      tnf_id: 'TNF:LLM:base:minimax-m2.1',
      name: 'MiniMax M2.1',
      provider: 'MiniMax',
      model_id: 'MiniMax-M2.1',
      family: 'minimax',
      version: '2.1',
      context_window: 128000,
      supports_vision: true,
      supports_tools: true,
      supports_streaming: true,
      is_current: true,
    },
    {
      tnf_id: 'TNF:LLM:base:kimi-k2',
      name: 'Kimi K2',
      provider: 'Moonshot',
      model_id: 'kimi-k2-0905-preview',
      family: 'kimi',
      version: 'k2',
      context_window: 128000,
      supports_vision: true,
      supports_tools: true,
      supports_streaming: true,
      is_current: true,
    },
    {
      tnf_id: 'TNF:LLM:base:deepseek-v3',
      name: 'DeepSeek V3',
      provider: 'DeepSeek',
      model_id: 'DeepSeek-V3',
      family: 'deepseek',
      version: '3',
      context_window: 128000,
      supports_vision: false,
      supports_tools: true,
      supports_streaming: true,
      is_current: true,
    },

    // xAI
    {
      tnf_id: 'TNF:LLM:base:grok-3',
      name: 'Grok 3',
      provider: 'xAI',
      model_id: 'grok-3',
      family: 'grok',
      version: '3',
      context_window: 131072,
      supports_vision: true,
      supports_tools: true,
      supports_streaming: true,
      is_current: true,
    },
  ];

  for (const llm of llms) {
    await registerLlm(llm);
  }

  // ============================================================================
  // HARNESSES (TNF:HARNESS:sys:...)
  // ============================================================================
  console.log('\n🏗️ Harnesses...\n');

  const harnesses: HarnessRecord[] = [
    // OpenClaw
    {
      tnf_id: 'TNF:HARNESS:sys:openclaw:primary',
      name: 'OpenClaw Primary',
      platform: 'OpenClaw',
      instance: 'primary',
      environment: 'local',
      ws_url: 'ws://127.0.0.1:18789',
      status: 'active',
    },
    {
      tnf_id: 'TNF:HARNESS:sys:openclaw:cloud-primary',
      name: 'OpenClaw Cloud Primary',
      platform: 'OpenClaw',
      instance: 'cloud-primary',
      environment: 'railway',
      status: 'offline',
    },
    {
      tnf_id: 'TNF:HARNESS:sys:openclaw:fleet',
      name: 'OpenClaw Fleet Cluster',
      platform: 'OpenClaw',
      environment: 'production',
      status: 'active',
    },

    // PicoClaw
    {
      tnf_id: 'TNF:HARNESS:sys:picoclaw:tester',
      name: 'PicoClaw Tester',
      platform: 'PicoClaw',
      instance: 'tester',
      environment: 'railway',
      status: 'active',
    },
    {
      tnf_id: 'TNF:HARNESS:sys:picoclaw:subject',
      name: 'PicoClaw Subject',
      platform: 'PicoClaw',
      instance: 'subject',
      environment: 'railway',
      status: 'active',
    },
    {
      tnf_id: 'TNF:HARNESS:sys:picoclaw:perplexity',
      name: 'PicoClaw Perplexity',
      platform: 'PicoClaw',
      instance: 'perplexity',
      environment: 'railway',
      status: 'active',
    },

    // ZeroClaw
    {
      tnf_id: 'TNF:HARNESS:sys:zeroclaw:sandbox',
      name: 'ZeroClaw Sandbox',
      platform: 'ZeroClaw',
      instance: 'sandbox',
      environment: 'railway',
      status: 'offline',
    },

    // Claude Code
    {
      tnf_id: 'TNF:HARNESS:sys:claude-code:local',
      name: 'Claude Code Local',
      platform: 'Claude Code',
      instance: 'local',
      environment: 'local',
      status: 'active',
    },

    // Gemini CLI
    {
      tnf_id: 'TNF:HARNESS:ext:gemini-cli:local',
      name: 'Gemini CLI Local',
      platform: 'Gemini CLI',
      instance: 'local',
      environment: 'local',
      status: 'offline',
    },

    // Antigravity
    {
      tnf_id: 'TNF:HARNESS:ext:antigravity:local',
      name: 'Antigravity Local',
      platform: 'Antigravity',
      instance: 'local',
      environment: 'local',
      status: 'active',
    },
  ];

  for (const harness of harnesses) {
    await registerHarness(harness);
  }

  // ============================================================================
  // MCP SERVERS (TNF:MCP:sys:...)
  // ============================================================================
  console.log('\n🔌 MCP Servers...\n');

  const mcps: McpRecord[] = [
    // Google
    {
      tnf_id: 'TNF:MCP:sys:gdrive',
      name: 'Google Drive MCP',
      description: 'Google Drive file operations',
      protocol: 'stdio',
      transport: 'npx',
      command: '@modelcontextprotocol/server-gdrive',
      scope: 'sys',
      status: 'available',
    },
    {
      tnf_id: 'TNF:MCP:sys:gdocs',
      name: 'Google Docs MCP',
      description: 'Google Docs editing operations',
      protocol: 'stdio',
      transport: 'npx',
      command: '@modelcontextprotocol/server-gdocs',
      scope: 'sys',
      status: 'available',
    },
    {
      tnf_id: 'TNF:MCP:sys:youtube',
      name: 'YouTube MCP',
      description: 'YouTube data API',
      protocol: 'stdio',
      transport: 'npx',
      command: '@modelcontextprotocol/server-youtube',
      scope: 'sys',
      status: 'available',
    },

    // Development Tools
    {
      tnf_id: 'TNF:MCP:sys:filesystem',
      name: 'Filesystem MCP',
      description: 'Local filesystem operations',
      protocol: 'stdio',
      transport: 'npx',
      command: '@modelcontextprotocol/server-filesystem',
      scope: 'sys',
      status: 'available',
    },
    {
      tnf_id: 'TNF:MCP:sys:github',
      name: 'GitHub MCP',
      description: 'GitHub API operations',
      protocol: 'stdio',
      transport: 'npx',
      command: '@modelcontextprotocol/server-github',
      scope: 'sys',
      status: 'available',
    },
    {
      tnf_id: 'TNF:MCP:sys:postgres',
      name: 'PostgreSQL MCP',
      description: 'PostgreSQL database operations',
      protocol: 'stdio',
      transport: 'npx',
      command: '@modelcontextprotocol/server-postgres',
      scope: 'sys',
      status: 'available',
    },
    {
      tnf_id: 'TNF:MCP:sys:memory',
      name: 'Memory MCP',
      description: 'Knowledge graph and memory operations',
      protocol: 'stdio',
      transport: 'npx',
      command: '@modelcontextprotocol/server-memory',
      scope: 'sys',
      status: 'available',
    },
    {
      tnf_id: 'TNF:MCP:sys:brave-search',
      name: 'Brave Search MCP',
      description: 'Web search via Brave API',
      protocol: 'stdio',
      transport: 'npx',
      command: '@modelcontextprotocol/server-brave-search',
      scope: 'sys',
      status: 'available',
    },

    // External/Remote MCPs
    {
      tnf_id: 'TNF:MCP:ext:vercel',
      name: 'Vercel MCP',
      description: 'Vercel deployment and project management',
      protocol: 'sse',
      scope: 'ext',
      status: 'available',
    },
    {
      tnf_id: 'TNF:MCP:ext:cloudflare',
      name: 'Cloudflare MCP',
      description: 'Cloudflare Workers and Pages deployment',
      protocol: 'sse',
      scope: 'ext',
      status: 'available',
    },

    // TNF Custom MCPs
    {
      tnf_id: 'TNF:MCP:sys:tnf-relay',
      name: 'TNF Relay MCP',
      description: 'TNF inter-agent communication relay',
      protocol: 'ws',
      scope: 'sys',
      status: 'available',
    },
    {
      tnf_id: 'TNF:MCP:sys:openclaw-gateway',
      name: 'OpenClaw Cloudflare Gateway',
      description: 'Cloudflare Worker gateway for OpenClaw',
      protocol: 'http',
      scope: 'sys',
      status: 'available',
    },
    {
      tnf_id: 'TNF:MCP:sys:shared-state',
      name: 'Shared State Worker',
      description: 'Cloudflare Worker for shared state',
      protocol: 'http',
      scope: 'sys',
      status: 'available',
    },
  ];

  for (const mcp of mcps) {
    await registerMcp(mcp);
  }

  // ============================================================================
  // AGENT DEFINITIONS (TNF:AGENT:sys: & TNF:AGENT:usr:)
  // ============================================================================
  console.log('\n🤖 Agent Definitions...\n');

  // System Agents
  const systemAgents: AgentDefRecord[] = [
    {
      tnf_id: 'TNF:AGENT:sys:antigravity',
      name: 'Antigravity',
      description: 'Main orchestration agent for complex task coordination',
      definition_source: '.antigravity/AGENTS.md',
      agent_type: 'COORDINATOR',
      is_system: true,
      access_level: 'superadmin',
    },
    {
      tnf_id: 'TNF:AGENT:sys:picoclaw-tester',
      name: 'PicoClaw Tester',
      description: 'Testing and validation agent',
      definition_source: 'picoclaw config',
      agent_type: 'ANALYZER',
      is_system: true,
      access_level: 'admin',
    },
    {
      tnf_id: 'TNF:AGENT:sys:picoclaw-subject',
      name: 'PicoClaw Subject',
      description: 'Subject under test agent',
      definition_source: 'picoclaw config',
      agent_type: 'ANALYZER',
      is_system: true,
      access_level: 'admin',
    },
    {
      tnf_id: 'TNF:AGENT:sys:picoclaw-perplexity',
      name: 'PicoClaw Perplexity',
      description: 'Deep research agent',
      definition_source: 'picoclaw config',
      agent_type: 'ANALYZER',
      is_system: true,
      access_level: 'admin',
    },
    {
      tnf_id: 'TNF:AGENT:sys:primitive-master',
      name: 'Primitive Master',
      description: 'LLM leverage and harness custodian',
      definition_source: '.agent/agents/primitive-master.md',
      agent_type: 'COORDINATOR',
      is_system: true,
      access_level: 'admin',
    },
    {
      tnf_id: 'TNF:AGENT:sys:categorization-master',
      name: 'Categorization Master',
      description: 'Taxonomy and registry architect',
      definition_source: '.agent/agents/categorization-master.md',
      agent_type: 'COORDINATOR',
      is_system: true,
      access_level: 'admin',
    },
  ];

  for (const agent of systemAgents) {
    await registerAgentDef(agent);
  }

  // User Agent Templates (from .agent/agents/)
  const userAgents: AgentDefRecord[] = [
    {
      tnf_id: 'TNF:AGENT:usr:orchestrator',
      name: 'Orchestrator',
      description: 'Multi-agent coordination and task orchestration',
      definition_source: '.agent/agents/orchestrator.md',
      agent_type: 'COORDINATOR',
      is_system: false,
      access_level: 'user',
    },
    {
      tnf_id: 'TNF:AGENT:usr:backend-specialist',
      name: 'Backend Specialist',
      description: 'Backend development expert',
      definition_source: '.agent/agents/backend-specialist.md',
      agent_type: 'CODER',
      is_system: false,
      access_level: 'user',
    },
    {
      tnf_id: 'TNF:AGENT:usr:database-architect',
      name: 'Database Architect',
      description: 'Database design and optimization',
      definition_source: '.agent/agents/database-architect.md',
      agent_type: 'CODER',
      is_system: false,
      access_level: 'user',
    },
    {
      tnf_id: 'TNF:AGENT:usr:debugger',
      name: 'Debugger',
      description: 'Bug detection and debugging',
      definition_source: '.agent/agents/debugger.md',
      agent_type: 'ANALYZER',
      is_system: false,
      access_level: 'user',
    },
    {
      tnf_id: 'TNF:AGENT:usr:devops-engineer',
      name: 'DevOps Engineer',
      description: 'Infrastructure and deployment automation',
      definition_source: '.agent/agents/devops-engineer.md',
      agent_type: 'CODER',
      is_system: false,
      access_level: 'user',
    },
    {
      tnf_id: 'TNF:AGENT:usr:documentation-writer',
      name: 'Documentation Writer',
      description: 'Technical documentation creation',
      definition_source: '.agent/agents/documentation-writer.md',
      agent_type: 'COMMUNICATOR',
      is_system: false,
      access_level: 'user',
    },
    {
      tnf_id: 'TNF:AGENT:usr:explorer-agent',
      name: 'Explorer Agent',
      description: 'Project exploration and analysis',
      definition_source: '.agent/agents/explorer-agent.md',
      agent_type: 'ANALYZER',
      is_system: false,
      access_level: 'user',
    },
    {
      tnf_id: 'TNF:AGENT:usr:frontend-specialist',
      name: 'Frontend Specialist',
      description: 'Frontend development expert',
      definition_source: '.agent/agents/frontend-specialist.md',
      agent_type: 'CODER',
      is_system: false,
      access_level: 'user',
    },
    {
      tnf_id: 'TNF:AGENT:usr:game-developer',
      name: 'Game Developer',
      description: 'Game development specialist',
      definition_source: '.agent/agents/game-developer.md',
      agent_type: 'CODER',
      is_system: false,
      access_level: 'user',
    },
    {
      tnf_id: 'TNF:AGENT:usr:mobile-developer',
      name: 'Mobile Developer',
      description: 'Mobile app development',
      definition_source: '.agent/agents/mobile-developer.md',
      agent_type: 'CODER',
      is_system: false,
      access_level: 'user',
    },
    {
      tnf_id: 'TNF:AGENT:usr:penetration-tester',
      name: 'Penetration Tester',
      description: 'Security testing and vulnerability assessment',
      definition_source: '.agent/agents/penetration-tester.md',
      agent_type: 'ANALYZER',
      is_system: false,
      access_level: 'user',
    },
    {
      tnf_id: 'TNF:AGENT:usr:performance-optimizer',
      name: 'Performance Optimizer',
      description: 'Performance analysis and optimization',
      definition_source: '.agent/agents/performance-optimizer.md',
      agent_type: 'ANALYZER',
      is_system: false,
      access_level: 'user',
    },
    {
      tnf_id: 'TNF:AGENT:usr:project-planner',
      name: 'Project Planner',
      description: 'Project planning and task management',
      definition_source: '.agent/agents/project-planner.md',
      agent_type: 'COORDINATOR',
      is_system: false,
      access_level: 'user',
    },
    {
      tnf_id: 'TNF:AGENT:usr:security-auditor',
      name: 'Security Auditor',
      description: 'Security audit and compliance',
      definition_source: '.agent/agents/security-auditor.md',
      agent_type: 'ANALYZER',
      is_system: false,
      access_level: 'user',
    },
    {
      tnf_id: 'TNF:AGENT:usr:seo-specialist',
      name: 'SEO Specialist',
      description: 'Search engine optimization',
      definition_source: '.agent/agents/seo-specialist.md',
      agent_type: 'ANALYZER',
      is_system: false,
      access_level: 'user',
    },
    {
      tnf_id: 'TNF:AGENT:usr:test-engineer',
      name: 'Test Engineer',
      description: 'QA and testing automation',
      definition_source: '.agent/agents/test-engineer.md',
      agent_type: 'ANALYZER',
      is_system: false,
      access_level: 'user',
    },
  ];

  // Dynamically scan for any missing agents in the banks
  const rootDir = process.cwd();
  const tnfBankDir = path.join(rootDir, '.agent', 'agents');
  const claudeBankDir = path.join(rootDir, '.claude', 'agents');

  const scanAndAddAgents = (
    scanDir: string,
    agentBankType: 'usr' | 'claude',
    currentList: AgentDefRecord[]
  ) => {
    if (!fs.existsSync(scanDir)) return;
    const agentFiles = fs.readdirSync(scanDir).filter((f) => f.endsWith('.md'));
    for (const file of agentFiles) {
      const agentTnfId = `TNF:AGENT:${agentBankType}:${file.replace('.md', '')}`;
      if (!currentList.some((a) => a.tnf_id === agentTnfId)) {
        const agentName = file
          .replace('.md', '')
          .split(/[-_]/)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ');
        currentList.push({
          tnf_id: agentTnfId,
          name: agentName,
          description: `${agentName} ${agentBankType === 'claude' ? 'Claude' : 'TNF'} Specialist`,
          definition_source: path.join(scanDir.replace(rootDir, ''), file),
          agent_type: 'OTHER',
          is_system: false,
          access_level: 'user',
        });
      }
    }
  };

  scanAndAddAgents(tnfBankDir, 'usr', userAgents);
  scanAndAddAgents(claudeBankDir, 'claude', userAgents);

  for (const agent of userAgents) {
    await registerAgentDef(agent);
  }

  console.log('\n🎉 All TNF V2 entities registered!\n');

  // Summary
  const llmCount = await sql`SELECT COUNT(*) as cnt FROM tnf_llm_models`;
  const harnessCount = await sql`SELECT COUNT(*) as cnt FROM tnf_harnesses`;
  const mcpCount = await sql`SELECT COUNT(*) as cnt FROM tnf_mcp_servers`;
  const agentCount = await sql`SELECT COUNT(*) as cnt FROM tnf_agent_definitions`;

  console.log('=== Registration Summary ===');
  console.log(`LLM Models: ${llmCount[0].cnt}`);
  console.log(`Harnesses: ${harnessCount[0].cnt}`);
  console.log(`MCP Servers: ${mcpCount[0].cnt}`);
  console.log(`Agent Definitions: ${agentCount[0].cnt}`);
  console.log('============================\n');

  await sql.end();
}

main().catch(console.error);
