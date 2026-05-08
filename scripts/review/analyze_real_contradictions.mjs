import fs from 'fs';

const findSection = (text, keywords) => {
  const lines = text.split('\n');
  return lines.filter(l => keywords.some(k => l.toLowerCase().includes(k))).slice(0, 10).join('\n');
};

const ledger = fs.readFileSync('docs/protocols/AGENT_STATUS_LEDGER.md', 'utf8');
const handoff = fs.readFileSync('docs/protocols/AGENT_TARGETED_HANDOFF_V1.md', 'utf8');
const cron = fs.readFileSync('docs/protocols/tnf-cron-governance-protocol-v0.1.md', 'utf8');
const gov = fs.readFileSync('docs/protocols/TNF_GOVERNANCE_TENETS.md', 'utf8');

console.log('=== AGENT_STATUS_LEDGER ===');
console.log(findSection(ledger, ['emergency','timeout','freeze','stop']));
console.log('');
console.log('=== AGENT_TARGETED_HANDOFF ===');
console.log(findSection(handoff, ['emergency','timeout','freeze','stop']));
console.log('');
console.log('=== CRON GOVERNANCE ===');
console.log(findSection(cron, ['emergency','timeout','freeze','stop','escalate']));
console.log('');
console.log('=== GOVERNANCE TENETS ===');
console.log(findSection(gov, ['emergency','timeout','freeze','stop','escalate']));
