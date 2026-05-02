const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const AGENTS_DIR = path.join(__dirname, '../.agent/skills/imported-claude-agents');
const OUTPUT_FILE = path.join(__dirname, '../data/agent-registry/master_user_agents.json');

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`🔍 Scanning for dormant agent definitions in: ${AGENTS_DIR}`);

if (!fs.existsSync(AGENTS_DIR)) {
  console.error('❌ Agent directory not found.');
  process.exit(1);
}

const agentFolders = fs.readdirSync(AGENTS_DIR).filter(file => {
  return fs.statSync(path.join(AGENTS_DIR, file)).isDirectory();
});

console.log(`📦 Found ${agentFolders.length} dormant agent definitions. Processing...`);

const userAgents = [];
const departments = ['Frontend', 'Backend', 'Marketing', 'Ops', 'QA', 'Strategy', 'Content'];
const badges = ['Verified', 'Specialist', 'Orchestrator', 'Broker', 'Director'];

agentFolders.forEach((folderName, index) => {
  const agentPath = path.join(AGENTS_DIR, folderName);
  
  // Generate a sophisticated, hard-coded yet mutable DNA-ID
  const hash = crypto.createHash('md5').update(folderName).digest('hex').substring(0, 8).toUpperCase();
  const dnaId = `TNF-AGT-${hash}-V1`;
  
  // Determine Department heuristically based on name
  let department = 'Strategy';
  if (folderName.includes('frontend') || folderName.includes('ui')) department = 'Frontend';
  if (folderName.includes('backend') || folderName.includes('db')) department = 'Backend';
  if (folderName.includes('marketing') || folderName.includes('seo') || folderName.includes('social')) department = 'Marketing';
  if (folderName.includes('content') || folderName.includes('video') || folderName.includes('podcast')) department = 'Content';
  
  // Assign badges
  const assignedBadges = ['Verified'];
  if (folderName.includes('architect') || folderName.includes('orchestrator')) assignedBadges.push('Orchestrator');
  else assignedBadges.push('Specialist');
  
  // Create the User Profile
  const agentProfile = {
    dna_id: dnaId,
    username: folderName.replace(/-/g, '_'),
    display_name: folderName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    type: 'agent_definition', // Distinguishes from a live LLM engine
    department: department,
    badges: assignedBadges,
    avatar: `/assets/agents/avatars/default_${department.toLowerCase()}_avatar.png`,
    status: 'registered',
    capabilities: [
      `${folderName} core logic`,
      "Federation Framework Integration"
    ],
    neo4j_node_label: "AgentUser",
    created_at: new Date().toISOString()
  };
  
  userAgents.push(agentProfile);
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(userAgents, null, 2));

console.log(`✅ Success! Registered ${userAgents.length} agents as Sovereign Users.`);
console.log(`💾 Saved to: ${OUTPUT_FILE}`);
console.log(`🕸️ Ready for Neo4j Graph Ingestion.`);
