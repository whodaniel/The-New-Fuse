const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const DATA_PATH =
  process.env.SUPABASE_AGENT_DATA_PATH ||
  path.join(REPO_ROOT, 'data/agent-registry/master_user_agents.json');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in environment.');
  process.exit(1);
}

async function sync() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error('❌ Data file not found:', DATA_PATH);
    return;
  }

  const agents = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  console.log(`📡 Attempting to sync ${agents.length} agents to Supabase...`);

  // We'll try to upsert them one by one or in a batch
  // Note: Using the REST API (PostgREST)
  for (const agent of agents) {
    const payload = {
      dna_id: agent.dna_id,
      username: agent.username,
      display_name: agent.display_name,
      department: agent.department,
      badges: agent.badges,
      avatar_url: agent.avatar,
      status: agent.status,
      capabilities: agent.capabilities
    };

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/agents`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`✅ Synced: ${agent.username}`);
      } else {
        const err = await response.text();
        console.error(`❌ Failed to sync ${agent.username}: ${response.status} ${response.statusText} - ${err}`);
        if (err.includes('relation "public.agents" does not exist')) {
          console.error('🛑 TABLE MISSING: You must create the "agents" table in the Supabase Dashboard.');
          process.exit(1);
        }
      }
    } catch (e) {
      console.error(`💥 Error syncing ${agent.username}:`, e.message);
    }
  }
}

sync();
