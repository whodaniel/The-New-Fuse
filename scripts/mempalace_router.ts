import * as fs from 'fs';
import * as path from 'path';

// --- MEMPALACE SPATIAL ARCHITECTURE ---
// Zero-Cost Write Path: Regex & Heuristics (No LLM calls)
const TNF_ROOT = process.env.TNF_ROOT_DIR
  ? path.resolve(process.env.TNF_ROOT_DIR)
  : path.resolve(__dirname, '..');
const WORKSPACE_ROOT = process.env.TNF_WORKSPACE_DIR
  ? path.resolve(process.env.TNF_WORKSPACE_DIR)
  : path.resolve(TNF_ROOT, '..');
const KB_ROOT = process.env.TNF_KB_DIR
  ? path.resolve(process.env.TNF_KB_DIR)
  : path.join(WORKSPACE_ROOT, 'my-ai-knowledge-base');
const MEMPALACE_ROOT = process.env.TNF_MEMPALACE_ROOT
  ? path.resolve(process.env.TNF_MEMPALACE_ROOT)
  : path.join(KB_ROOT, 'mempalace');

// Define the Wings (High-level projects)
const WINGS = {
  ENGINEERING: 'wing-engineering',
  INTELLIGENCE: 'wing-intelligence',
  GOVERNANCE: 'wing-governance',
};

// Define the Halls (Data Streams)
const HALLS = {
  TRANSCRIPTS: 'hall-video-transcripts',
  SYSTEM_MEMORY: 'hall-system-memory',
  AGENT_DIALOGUE: 'hall-agent-dialogue'
};

interface SpatialVector {
  wing: string;
  hall: string;
  room: string;
}

// Heuristics Engine
function determineSpatialVector(content: string, source: string): SpatialVector {
  const contentLower = content.toLowerCase();
  
  let wing = WINGS.INTELLIGENCE;
  if (/(code|function|export|class|const |import )/.test(contentLower)) {
    wing = WINGS.ENGINEERING;
  } else if (/(policy|guardrail|safety|error|fail|crash)/.test(contentLower)) {
    wing = WINGS.GOVERNANCE;
  }

  let hall = HALLS.SYSTEM_MEMORY;
  if (source.includes('youtube') || source.includes('transcript')) {
    hall = HALLS.TRANSCRIPTS;
  } else if (source.includes('dialogue') || source.includes('agent')) {
    hall = HALLS.AGENT_DIALOGUE;
  }

  // Determine Room based on clusters
  let room = 'room-general';
  if (/mcp|protocol|server/.test(contentLower)) room = 'room-mcp-protocols';
  else if (/gemini|claude|openai|llm/.test(contentLower)) room = 'room-ai-models';
  else if (/react|ui|component|glassmorphism/.test(contentLower)) room = 'room-frontend-ui';
  else if (/llvm|forge|rust|c\+\+/.test(contentLower)) room = 'room-llvm-forge';

  return { wing, hall, room };
}

// Extract Wardrobes (Summaries) & Drawers (Verbatim Code/Quotes) using Regex
function extractDrawers(content: string) {
  const drawers: string[] = [];
  // Regex to extract code blocks verbatim
  const codeRegex = /```[\s\S]*?```/g;
  let match;
  while ((match = codeRegex.exec(content)) !== null) {
    drawers.push(match[0]);
  }
  return drawers;
}

export function routeToMemPalace(id: string, rawContent: string, source: string) {
  const vector = determineSpatialVector(rawContent, source);
  const targetDir = path.join(MEMPALACE_ROOT, vector.wing, vector.hall, vector.room);
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. Store the exact Verbatim Text (The Room)
  const verbatimPath = path.join(targetDir, `verbatim_${id}.txt`);
  fs.writeFileSync(verbatimPath, rawContent, 'utf-8');

  // 2. Store the Extracted Drawers (Zero-Cost Granular Extraction)
  const drawers = extractDrawers(rawContent);
  if (drawers.length > 0) {
    const wardrobeDir = path.join(targetDir, `wardrobe_${id}`);
    if (!fs.existsSync(wardrobeDir)) fs.mkdirSync(wardrobeDir);
    
    drawers.forEach((drawerContent, index) => {
      fs.writeFileSync(path.join(wardrobeDir, `drawer_snippet_${index}.txt`), drawerContent, 'utf-8');
    });
  }

  console.log(`🏰 MemPalace Routed [${id}] -> ${vector.wing} / ${vector.hall} / ${vector.room}`);
}

// Example usage
if (require.main === module) {
  console.log('🏛️ MemPalace Zero-Cost Router initialized.');
}
