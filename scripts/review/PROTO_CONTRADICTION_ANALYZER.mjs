import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');
const protoDir = path.join(root, 'docs/protocols');
const reportPath = path.join(root, 'reports/reviews/proto_contradictions.json');

const keywords = ['emergency', 'freeze', 'stop', 'timeout', 'rollback', 'escalate', 'hierarchy', 'access'];
const contradictionPairs = [];

const files = fs.readdirSync(protoDir).filter(f => f.endsWith('.md'));
const fileData = files.map(f => {
  const content = fs.readFileSync(path.join(protoDir, f), 'utf-8');
  return { name: f, content };
});

for (let i = 0; i < fileData.length; i++) {
  for (let j = i + 1; j < fileData.length; j++) {
    const a = fileData[i];
    const b = fileData[j];
    const aText = a.content.toLowerCase();
    const bText = b.content.toLowerCase();
    
    const conflicts = [];
    keywords.forEach(kw => {
      if (aText.includes(kw) && bText.includes(kw)) {
        conflicts.push(kw);
      }
    });
    
    if (conflicts.length > 0) {
      contradictionPairs.push({
        pair: [a.name, b.name],
        conflicts,
        severity: conflicts.length > 2 ? 'high' : conflicts.length > 0 ? 'medium' : 'low'
      });
    }
  }
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify({ total_pairs: contradictionPairs.length, pairs: contradictionPairs.slice(0, 20) }, null, 2));

console.log(`Found ${contradictionPairs.length} potential contradiction pairs`);
console.log(`Top 5:
${contradictionPairs.slice(0, 5).map(p => `  ${p.pair[0]} vs ${p.pair[1]}: ${p.conflicts.join(', ')} (${p.severity})`).join('\n')}`);
