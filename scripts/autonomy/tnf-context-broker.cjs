#!/usr/bin/env node

/**
 * TNF Dynamic Context Broker
 * 
 * Intercepts agent initialization to dynamically compile a JIT context payload
 * based on the requested cluster binding.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const clusterArg = args.find(a => a.startsWith('--cluster='));
const cluster = clusterArg ? clusterArg.split('=')[1].toUpperCase() : 'ALL';

const PROTOCOLS_DIR = path.join(__dirname, '../../docs/protocols');
const OUTPUT_FILE = path.join(__dirname, '../../data/harness/injected-context.md');

// Ensure harness dir exists
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

function scanProtocols() {
  const files = fs.readdirSync(PROTOCOLS_DIR).filter(f => f.endsWith('.md'));
  let compiledContext = `# 🧠 TNF JIT Context Payload (Cluster: ${cluster})\n\n`;
  compiledContext += `> **System Note:** This context was dynamically injected by the Context Broker. Do not search for these specific protocol definitions manually, they are provided below.\n\n`;

  let matchedFiles = 0;

  for (const file of files) {
    const filePath = path.join(PROTOCOLS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for CLUSTER_BINDING tags
    const bindingMatch = content.match(/\[CLUSTER_BINDING:\s*([^\]]+)\]/);
    if (bindingMatch) {
      const bindings = bindingMatch[1].split('|').map(b => b.trim().toUpperCase());
      
      if (bindings.includes('ALL') || bindings.includes(cluster)) {
        compiledContext += `\n---\n## 📄 Source: ${file}\n\n`;
        // Remove standard header tags to save context space
        let cleanContent = content.replace(/^`?\[CLASS:.*$/m, '').trim();
        compiledContext += cleanContent + '\n';
        matchedFiles++;
      }
    }
  }

  if (matchedFiles === 0) {
    compiledContext += `*No specific protocol bindings found for cluster [${cluster}]. Relying on core knowledge.*`;
  }

  
  // [SUPER ADMIN OVERRIDE]: Pierce repository boundary to inject Collective Intelligence
  const os = require('os');
  const lessonsPath = path.join(os.homedir(), '.tnf', 'lessons-learned.md');
  if (fs.existsSync(lessonsPath)) {
    const lessonsContent = fs.readFileSync(lessonsPath, 'utf8');
    const recentLessons = lessonsContent.split('### ').slice(-4).map(s => '### ' + s).join('\n');
    
    compiledContext += `\n\n# 🧠 [COLLECTIVE INTELLIGENCE] Recent System Lessons\n`;
    compiledContext += `*These lessons transcend repository boundaries and must be actively respected by the target cluster.*\n\n`;
    compiledContext += recentLessons + "\n";
  }

  fs.writeFileSync(OUTPUT_FILE, compiledContext, 'utf8');
  console.log(`[Context Broker] Compiled JIT context for ${cluster} (${matchedFiles} protocols bound).`);
  console.log(`[Context Broker] Payload available at: data/harness/injected-context.md`);
}

scanProtocols();
