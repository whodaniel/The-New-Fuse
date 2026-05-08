#!/usr/bin/env node
/**
 * audit_review.mjs
 * Audit the review progress, check completeness, and flag issues.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');
const reviewDir = path.join(root, 'data/reviews');
const logPath = path.join(reviewDir, 'review_log.jsonl');
const statusPath = path.join(reviewDir, 'node_status.json');
const contradictionsPath = path.join(reviewDir, 'contradictions.json');
const missingPath = path.join(reviewDir, 'missing.json');
const reportDir = path.join(root, 'reports/reviews');

function main() {
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  const contradictions = JSON.parse(fs.readFileSync(contradictionsPath, 'utf-8'));
  const missing = JSON.parse(fs.readFileSync(missingPath, 'utf-8'));

  // Review log stats
  let logCount = 0;
  let lastLogEntry = null;
  if (fs.existsSync(logPath)) {
    const lines = fs.readFileSync(logPath, 'utf-8').trim().split('\n').filter(Boolean);
    logCount = lines.length;
    if (lines.length > 0) {
      lastLogEntry = JSON.parse(lines[lines.length - 1]);
    }
  }

  // Calculate progress
  const nodes = Object.values(status.nodes);
  const unreviewed = nodes.filter(n => n.status === 'UNREVIEWED').length;
  const discovered = nodes.filter(n => n.status === 'DISCOVERED').length;
  const challenged = nodes.filter(n => n.status === 'CHALLENGED').length;
  const synthesized = nodes.filter(n => n.status === 'SYNTHESIZED').length;
  const reconciled = nodes.filter(n => n.status === 'RECONCILED').length;

  const totalReviewed = nodes.filter(n => n.status !== 'UNREVIEWED').length;
  const pctComplete = ((reconciled / status.total_nodes) * 100).toFixed(2);

  // Flag analysis
  const flaggedNodes = nodes.filter(n => n.flags.length > 0);
  const byFlag = {};
  flaggedNodes.forEach(n => {
    n.flags.forEach(f => {
      byFlag[f] = (byFlag[f] || 0) + 1;
    });
  });

  // Build report
  const report = {
    timestamp: new Date().toISOString(),
    version: status.version,
    summary: {
      total_nodes: status.total_nodes,
      reviewed: totalReviewed,
      unreviewed: unreviewed,
      percentage_complete: `${pctComplete}%`,
      log_entries: logCount,
    },
    by_cycle: {
      unreviewed: unreviewed,
      discovery: discovered,
      adversarial: challenged,
      synthesis: synthesized,
      reconciliation: reconciled,
    },
    flags: {
      total_flagged: flaggedNodes.length,
      by_flag: byFlag,
    },
    contradictions: {
      open: contradictions.contradictions.filter(c => c.status === 'open').length,
      resolved: contradictions.contradictions.filter(c => c.status === 'resolved').length,
      total: contradictions.contradictions.length,
    },
    missing_files: missing.missing_files.length,
  };

  // Write report
  const reportPath = path.join(reportDir, 'completion_report.json');
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print report
  console.log('='.repeat(60));
  console.log('  TNF SYSTEMATIC REVIEW AUDIT');
  console.log(`  Generated: ${new Date(report.timestamp).toLocaleString()}`);
  console.log('='.repeat(60));
  console.log(`\n📋 OVERALL PROGRESS`);
  console.log(`   Total nodes:       ${status.total_nodes.toLocaleString()}`);
  console.log(`   Reviewed:           ${totalReviewed.toLocaleString()} (${((totalReviewed / status.total_nodes) * 100).toFixed(2)}%)`);
  console.log(`   Unreviewed:         ${unreviewed.toLocaleString()}`);
  console.log(`   Reconciled:         ${reconciled.toLocaleString()} (${pctComplete}%)`);
  console.log(`   Log entries:        ${logCount.toLocaleString()}`);
  if (lastLogEntry) {
    console.log(`   Last review:         ${lastLogEntry.node_id} (${lastLogEntry.cycle}, ${lastLogEntry.reviewer})`);
  }
  console.log(`\n📊 BY CYCLE`);
  console.log(`   UNREVIEWED:        ${unreviewed.toLocaleString().padStart(6)} (${((unreviewed / status.total_nodes) * 100).toFixed(1)}%)`);
  console.log(`   DISCOVERED:        ${discovered.toLocaleString().padStart(6)} (${((discovered / status.total_nodes) * 100).toFixed(1)}%)`);
  console.log(`   CHALLENGED:        ${challenged.toLocaleString().padStart(6)} (${((challenged / status.total_nodes) * 100).toFixed(1)}%)`);
  console.log(`   SYNTHESIZED:       ${synthesized.toLocaleString().padStart(6)} (${((synthesized / status.total_nodes) * 100).toFixed(1)}%)`);
  console.log(`   RECONCILED:        ${reconciled.toLocaleString().padStart(6)} (${pctComplete}%)`);
  console.log(`\n🏳️  FLAGS (${flaggedNodes.length} nodes flagged)`);
  Object.entries(byFlag).sort((a, b) => b[1] - a[1]).forEach(([flag, count]) => {
    console.log(`   ${flag.padEnd(20)} ${count.toLocaleString().padStart(4)}`);
  });
  console.log(`\n⚠️  CONTRADICTIONS`);
  console.log(`   Open:     ${report.contradictions.open}`);
  console.log(`   Resolved: ${report.contradictions.resolved}`);
  console.log(`   Total:    ${report.contradictions.total}`);
  console.log(`\n❓ MISSING FILES`);
  console.log(`   Referenced but not found: ${report.missing_files}`);
  console.log(`\n📄 Report written to: ${reportPath}`);
  console.log('='.repeat(60));
}

main();
