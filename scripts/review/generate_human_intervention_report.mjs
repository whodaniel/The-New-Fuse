#!/usr/bin/env node
/**
 * generate_human_intervention_report.mjs
 * Generates a comprehensive markdown report of all human interventions required.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const reviewDir = path.join(root, 'data/reviews');
const gatePath = path.join(reviewDir, 'human_gate_queue.json');
const outputPath = path.join(root, 'docs', 'HUMAN_INTERVENTIONS_v1.0.md');

function main() {
  if (!fs.existsSync(gatePath)) {
    console.log('No human gate items recorded yet.');
    fs.writeFileSync(outputPath, '# Human Interventions Report v1.0\n\nNo items recorded yet.\n');
    return;
  }

  const gate = JSON.parse(fs.readFileSync(gatePath, 'utf-8'));
  const openItems = gate.items.filter(i => i.status === 'open');

  const report = [];
  report.push('# Human Interventions Report v1.0');
  report.push('> Generated: ' + new Date().toISOString());
  report.push(`> Total Items: ${gate.total_items}`);
  report.push(`> Open: ${gate.open_items} | Resolved: ${gate.resolved_items}`);
  report.push('');

  // Summary by severity
  report.push('## Summary by Severity');
  Object.entries(gate.by_severity).forEach(([severity, count]) => {
    if (count > 0) {
      report.push(`- **${severity.toUpperCase()}**: ${count} items`);
    }
  });
  report.push('');

  // Summary by type
  report.push('## Summary by Type');
  Object.entries(gate.by_type).forEach(([type, count]) => {
    if (count > 0) {
      report.push(`- **${type}**: ${count} items`);
    }
  });
  report.push('');

  // Open items detail
  report.push('## Open Items Requiring Human Intervention');
  report.push('');

  // Sort by severity (critical first)
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  openItems.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

  openItems.forEach((item, index) => {
    report.push(`### ${index + 1}. [${item.severity.toUpperCase()}] ${item.node_id} — ${item.type}`);
    report.push(`**Description:** ${item.description}`);
    report.push(`**Recommendation:** ${item.recommendation}`);
    if (item.context && Object.keys(item.context).length > 0) {
      report.push(`**Context:**\n\`\`\`json\n${JSON.stringify(item.context, null, 2)}\n\`\`\``);
    }
    report.push(`**Recorded:** ${item.created_at}`);
    report.push('');
  });

  // Add resolution template
  report.push('## Resolution Log');
  const resolved = gate.items.filter(i => i.status === 'resolved');
  if (resolved.length === 0) {
    report.push('No items resolved yet.');
  } else {
    resolved.forEach(item => {
      report.push(`- **${item.node_id}** (${item.type}): ${item.resolution}`);
    });
  }
  report.push('');

  // Write report
  fs.writeFileSync(outputPath, report.join('\n'));
  console.log(`✅ Human intervention report generated: ${outputPath}`);
  console.log(`   Total items: ${gate.total_items}`);
  console.log(`   Open: ${gate.open_items}`);
  console.log(`   Resolved: ${gate.resolved_items}`);
}

main();
