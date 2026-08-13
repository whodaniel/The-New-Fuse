#!/usr/bin/env node

/**
 * TNF Feature-Complete Control Plane Seeder
 *
 * Deeply synchronizes the TNF ecosystem into Supabase:
 * 1. Discovers and parses 120+ SKILL.md files.
 * 2. Compiles a comprehensive LLM model library.
 * 3. Inventories local and workspace MCP servers.
 * 4. Migrates 115+ agent definitions with rich metadata.
 */

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const { singleInstanceGuard } = require('./lib/tnf-single-instance-guard.cjs');
require('dotenv').config();

const ROOT = process.cwd();
const AGENTS_DATA_PATH = path.join(ROOT, 'data/agent-registry/master_user_agents.json');
const MCP_CONFIG_PATH = path.join(ROOT, 'data/mcp_config.json');
const MCP_SERVERS_DIR = path.join(ROOT, 'apps/mcp-servers');
const SKILLS_DIR = path.join(ROOT, '.agent/skills');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set in environment.');
  process.exit(1);
}

function releaseGuardOnExit(guard) {
  let released = false;
  const release = () => {
    if (released || !guard || typeof guard.release !== 'function') return;
    released = true;
    guard.release();
  };

  process.once('exit', release);
  process.once('SIGINT', () => {
    release();
    process.exit(130);
  });
  process.once('SIGTERM', () => {
    release();
    process.exit(143);
  });
}

const seedGuard = singleInstanceGuard({
  lockName: 'tnf-seed-control-plane',
  staleMs: 10 * 60 * 1000,
});
if (!seedGuard.acquired) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        skipped: 'already-running',
        reason: 'already-running',
        lock: seedGuard.existingLock,
      },
      null,
      2
    )
  );
  process.exit(0);
}
releaseGuardOnExit(seedGuard);

const postgres = require('postgres');
const sql = postgres(DATABASE_URL, { max: 1 });

/**
 * Helper to recursively find SKILL.md files
 */
function findSkills(dir, skills = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findSkills(fullPath, skills);
    } else if (file === 'SKILL.md') {
      skills.push(fullPath);
    }
  }
  return skills;
}

async function seed() {
  console.log('📡 Starting Feature-Complete TNF Control Plane Synchronization...');

  try {
    // 1. Discover Skills
    console.log('🔍 Discovering skills...');
    const skillFiles = findSkills(SKILLS_DIR);
    const skillLibrary = new Map();

    for (const file of skillFiles) {
      const content = fs.readFileSync(file, 'utf8');
      try {
        const parts = content.split('---');
        if (parts.length >= 3) {
          const meta = yaml.load(parts[1]);
          if (meta && meta.name) {
            skillLibrary.set(meta.name, {
              name: meta.name,
              description: meta.description || '',
              path: path.relative(ROOT, file)
            });
          }
        } else {
          // Fallback to directory name
          const name = path.basename(path.dirname(file));
          skillLibrary.set(name, {
            name,
            description: 'Foundational TNF Skill',
            path: path.relative(ROOT, file)
          });
        }
      } catch (e) {
        console.warn(`⚠️ Failed to parse skill at ${file}:`, e.message);
      }
    }
    console.log(`✅ Discovered ${skillLibrary.size} skills.`);

    // 2. Comprehensive LLM Models
    const models = [
      // Google
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', family: 'gemini' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', family: 'gemini' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', family: 'gemini' },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', provider: 'google', family: 'gemini' },
      // Anthropic
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', family: 'claude' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', family: 'claude' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', family: 'claude' },
      // OpenAI
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', family: 'gpt' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', family: 'gpt' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', family: 'gpt' },
      // Specialized/DeepSeek
      { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', family: 'deepseek' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek', family: 'deepseek' },
      // Groq
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B (Groq)', provider: 'groq', family: 'llama' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Groq)', provider: 'groq', family: 'llama' },
      // OpenRouter
      { id: 'openrouter/auto', name: 'OpenRouter Auto', provider: 'openrouter', family: 'universal' },
    ];

    console.log(`- Syncing ${models.length} LLM models...`);
    for (const m of models) {
      const tnf_id = `TNF:LLM:${m.provider.toUpperCase()}:${m.id.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}:001`;
      await sql`
        INSERT INTO tnf_llm_models (tnf_id, name, provider, model_id, family, is_current)
        VALUES (${tnf_id}, ${m.name}, ${m.provider}, ${m.id}, ${m.family}, true)
        ON CONFLICT (tnf_id) DO UPDATE SET
          name = EXCLUDED.name,
          model_id = EXCLUDED.model_id,
          updated_at = NOW()
      `;
    }

    // 3. MCP Servers (Workspace + Config)
    const mcpServers = new Map();

    // From config
    if (fs.existsSync(MCP_CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf8'));
      const servers = config.mcpServers || {};
      for (const [name, def] of Object.entries(servers)) {
        mcpServers.set(name, {
          name,
          command: def.command,
          args: def.args || [],
          env: def.env || {},
          status: 'available'
        });
      }
    }

    // From workspace
    if (fs.existsSync(MCP_SERVERS_DIR)) {
      const dirs = fs.readdirSync(MCP_SERVERS_DIR);
      for (const d of dirs) {
        const fullPath = path.join(MCP_SERVERS_DIR, d);
        if (fs.statSync(fullPath).isDirectory()) {
          mcpServers.set(d, {
            name: d,
            status: 'available',
            metadata: { workspace_path: fullPath }
          });
        }
      }
    }

    console.log(`- Syncing ${mcpServers.size} MCP servers...`);
    for (const [name, server] of mcpServers.entries()) {
      const tnf_id = `TNF:MCP:LOCAL:${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}:001`;
      await sql`
        INSERT INTO tnf_mcp_servers (tnf_id, name, description, status, command, args, env, metadata)
        VALUES (${tnf_id}, ${name}, ${server.description || `Local MCP server: ${name}`}, ${server.status}, ${server.command || null}, ${server.args || []}, ${server.env || {}}, ${server.metadata || {}})
        ON CONFLICT (tnf_id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = NOW()
      `;
    }

    // 4. Agent Definitions
    if (fs.existsSync(AGENTS_DATA_PATH)) {
      const agents = JSON.parse(fs.readFileSync(AGENTS_DATA_PATH, 'utf8'));
      console.log(`- Syncing ${agents.length} agent definitions...`);

      for (const agent of agents) {
        const tnf_id = `TNF:AGENT:TNF:${agent.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}:001`;
        
        // Enrich skills
        const skills = [...(agent.skills || [])];
        if (skillLibrary.has(agent.name)) {
          skills.push(agent.name);
        }

        const record = {
          tnf_id,
          name: agent.displayName || agent.name,
          description: agent.description,
          agent_type: agent.agentType?.toUpperCase() || 'GENERIC',
          is_system: agent.name.includes('orchestrator') || agent.name.includes('director') || agent.name.includes('historian'),
          access_level: 'user',
          version: '1.0.0',
          skills: [...new Set(skills)],
          capabilities: agent.capabilities || [],
          tags: agent.tags || [],
          mcp_ids: agent.tools || [], // Legacy mapping
          metadata: {
             source_file: agent.sourceFile,
             legacy_id: agent.id,
             tags: agent.tags,
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
            mcp_ids = EXCLUDED.mcp_ids,
            metadata = EXCLUDED.metadata,
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
