#!/usr/bin/env node

/**
 * TNF Control Plane Seeder
 * Synchronizes local agent and MCP data to Supabase tnf_* tables.
 */

const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const ROOT = process.cwd();
const AGENTS_DATA_PATH = path.join(ROOT, 'data/agent-registry/master_user_agents.json');
const MCP_DATA_PATH = path.join(ROOT, 'data/mcp_config.json');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set in environment.');
  process.exit(1);
}

const postgres = require('postgres');
const sql = postgres(DATABASE_URL, { max: 1 });

async function seed() {
  console.log('📡 Starting TNF Control Plane Synchronization...');

  try {
    // 1. Seed LLM Models (Basic set)
    const models = [
      {
        tnf_id: 'TNF:LLM:GOOGLE:GEMINI-2-0-FLASH:001',
        name: 'Gemini 2.0 Flash',
        provider: 'google',
        model_id: 'gemini-2.0-flash',
        family: 'gemini',
        is_current: true,
      },
      {
        tnf_id: 'TNF:LLM:GOOGLE:GEMINI-1-5-PRO:001',
        name: 'Gemini 1.5 Pro',
        provider: 'google',
        model_id: 'gemini-1.5-pro',
        family: 'gemini',
        is_current: true,
      },
      {
        tnf_id: 'TNF:LLM:ANTHROPIC:CLAUDE-3-5-SONNET:001',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        model_id: 'claude-3-5-sonnet-20240620',
        family: 'claude',
        is_current: true,
      },
    ];

    console.log(`- Syncing ${models.length} LLM models...`);
    for (const m of models) {
      await sql`
        INSERT INTO tnf_llm_models ${sql(m)}
        ON CONFLICT (tnf_id) DO UPDATE SET
          name = EXCLUDED.name,
          model_id = EXCLUDED.model_id,
          updated_at = NOW()
      `;
    }

    // 2. Seed MCP Servers
    if (fs.existsSync(MCP_DATA_PATH)) {
      const mcpConfig = JSON.parse(fs.readFileSync(MCP_DATA_PATH, 'utf8'));
      const servers = mcpConfig.mcpServers || {};
      const serverNames = Object.keys(servers);

      console.log(`- Syncing ${serverNames.length} MCP servers...`);
      for (const name of serverNames) {
        const def = servers[name];
        const tnf_id = `TNF:MCP:LOCAL:${name.toUpperCase()}:001`;
        
        const record = {
          tnf_id,
          name,
          description: `Local MCP server: ${name}`,
          protocol: 'stdio',
          command: def.command,
          args: def.args || [],
          env: def.env || {},
          status: 'available',
          scope: 'usr'
        };

        await sql`
          INSERT INTO tnf_mcp_servers ${sql(record)}
          ON CONFLICT (tnf_id) DO UPDATE SET
            command = EXCLUDED.command,
            args = EXCLUDED.args,
            updated_at = NOW()
        `;
      }
    }

    // 3. Seed Agent Definitions
    if (fs.existsSync(AGENTS_DATA_PATH)) {
      const agents = JSON.parse(fs.readFileSync(AGENTS_DATA_PATH, 'utf8'));
      console.log(`- Syncing ${agents.length} agent definitions...`);

      for (const agent of agents) {
        const tnf_id = `TNF:AGENT:TNF:${agent.name.toUpperCase()}:001`;
        
        const record = {
          tnf_id,
          name: agent.displayName || agent.name,
          description: agent.description,
          agent_type: agent.agentType?.toUpperCase() || 'GENERIC',
          is_system: agent.name.includes('orchestrator') || agent.name.includes('director'),
          access_level: 'user',
          version: '1.0.0',
          skills: agent.skills || [],
          capabilities: agent.capabilities || [],
          tags: agent.tags || [],
          metadata: {
             source_file: agent.sourceFile,
             tools: agent.tools
          }
        };

        await sql`
          INSERT INTO tnf_agent_definitions ${sql(record)}
          ON CONFLICT (tnf_id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            skills = EXCLUDED.skills,
            capabilities = EXCLUDED.capabilities,
            updated_at = NOW()
        `;
      }
    }

    console.log('✅ TNF Control Plane synchronization complete.');
  } catch (error) {
    console.error('💥 Sync failed:', error);
  } finally {
    await sql.end();
  }
}

seed();
