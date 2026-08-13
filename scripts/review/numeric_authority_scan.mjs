import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');
const protoDir = path.join(root, 'docs/protocols');

const files = fs.readdirSync(protoDir).filter(f => f.endsWith('.md'));
const results = {};

files.forEach(f => {
  const content = fs.readFileSync(path.join(protoDir, f), 'utf8');
  const text = content.toLowerCase();
  // Extract numbers near key terms
  const numericMatches = text.match(/(\d+\s*(?:minutes?|hours?|days?|\bmin\b|\bhr\b|\bhrs\b))/g) || [];
  const authorityMatches = text.match(/(?:super director|director|admin|developer|super_admin)\.?\s+(?:can|may|must|shall)/gi) || [];
  results[f] = { numeric: numericMatches, authority: authorityMatches };
});

// Find numeric contradictions
console.log('=== NUMERIC THRESHOLDS BY DOCUMENT ===');
Object.entries(results).forEach(([f, data]) => {
  if (data.numeric.length > 0) {
    console.log(`\n${f}:\n  ${data.numeric.join('\n  ')}`);
  }
});

console.log('\n=== AUTHORITY CLAIMS BY DOCUMENT ===');
Object.entries(results).forEach(([f, data]) => {
  if (data.authority.length > 0) {
    console.log(`\n${f}:\n  ${data.authority.map(s => s.substring(0, 100)).join('\n  ')}`);
  }
});
