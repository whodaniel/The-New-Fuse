#!/usr/bin/env node
/**
 * review_node.mjs
 * Record a review cycle for a single node.
 *
 * Usage:
 *   node scripts/review/review_node.mjs --id "PROTO_14" --cycle discovery \
 *     --intent "governance" --scope "system" --maturity "stable" \
 *     --actionability "monitor" --confidence 0.95 \
 *     --notes "Initial pass identifies policy authority" --reviewer "claude-v1"
 *
 *   node scripts/review/review_node.mjs --id "PROTO_14" --cycle adversarial \
 *     --challenges "Contradicts PROTO_27 on escalation timing" \
 *     --contradictions "PROTO_27" --severity high --reviewer "claude-v2"
 *
 *   node scripts/review/review_node.mjs --id "PROTO_14" --cycle synthesis \
 *     --integrations "PROTO_7,PROTO_27" --assumptions "Assumes Super Director is always reachable" \
 *     --gaps "No fallback when Super Director is unreachable" --reviewer "claude-v3"
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { recordHumanGate } from './human_gate_accumulator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');
const reviewDir = path.join(root, 'data/reviews');
const logPath = path.join(reviewDir, 'review_log.jsonl');
const statusPath = path.join(reviewDir, 'node_status.json');
const contradictionsPath = path.join(reviewDir, 'contradictions.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      const next = args[i + 1];
      flags[key] = next && !next.startsWith('--') ? next : true;
      i++;
    }
  }
  return flags;
}

function generateEventId() {
  return `rev_${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}_${Math.random().toString(36).slice(2, 6)}`;
}

function main() {
  const flags = parseArgs();

  // Validate required flags
  if (!flags.id || !flags.cycle || !flags.reviewer) {
    console.error('❌ Missing required flags: --id, --cycle, --reviewer');
    process.exit(1);
  }

  const validCycles = ['discovery', 'adversarial', 'synthesis', 'reconciliation'];
  if (!validCycles.includes(flags.cycle)) {
    console.error(`❌ Invalid cycle: ${flags.cycle}. Must be one of: ${validCycles.join(', ')}`);
    process.exit(1);
  }

  // Load current status
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  const nodeStatus = status.nodes[flags.id];

  if (!nodeStatus) {
    console.error(`❌ Node ${flags.id} not found in codebase_map.json`);
    process.exit(1);
  }

  // Build review event
  const event = {
    event_id: generateEventId(),
    node_id: flags.id,
    cycle: flags.cycle,
    intent: flags.intent || nodeStatus.cycles_completed.find(c => c.intent)?.intent || null,
    scope: flags.scope || nodeStatus.cycles_completed.find(c => c.scope)?.scope || null,
    maturity: flags.maturity || nodeStatus.cycles_completed.find(c => c.maturity)?.maturity || null,
    actionability: flags.actionability || nodeStatus.cycles_completed.find(c => c.actionability)?.actionability || null,
    confidence: flags.confidence ? parseFloat(flags.confidence) : null,
    notes: flags.notes || null,
    reviewer: flags.reviewer,
    reviewed_at: new Date().toISOString(),
  };

  // Add cycle-specific fields
  if (flags.cycle === 'adversarial') {
    event.challenges = flags.challenges ? flags.challenges.split(';') : [];
    event.contradictions = flags.contradictions ? flags.contradictions.split(',') : [];
    event.severity = flags.severity || 'medium';
  }

  if (flags.cycle === 'synthesis') {
    event.integrations = flags.integrations ? flags.integrations.split(',') : [];
    event.assumptions = flags.assumptions || null;
    event.gaps = flags.gaps ? flags.gaps.split(';') : [];
  }

  if (flags.cycle === 'reconciliation') {
    event.resolution = flags.resolution || 'flagged_for_review';
    event.rationale = flags.rationale || null;
  }

  // Append to immutable log
  fs.appendFileSync(logPath, JSON.stringify(event) + '\n');

  // Update node status
  nodeStatus.current_cycle = flags.cycle;
  nodeStatus.last_reviewed_by = flags.reviewer;
  nodeStatus.last_reviewed_at = event.reviewed_at;
  nodeStatus.cycles_completed.push({
    cycle: flags.cycle,
    confidence: event.confidence,
    reviewer: flags.reviewer,
    reviewed_at: event.reviewed_at,
  });

  // Update status based on completed cycles
  const completed = nodeStatus.cycles_completed.map(c => c.cycle);
  if (completed.includes('reconciliation')) {
    nodeStatus.status = 'RECONCILED';
    status.by_cycle.reconciliation++;
  } else if (completed.includes('synthesis')) {
    nodeStatus.status = 'SYNTHESIZED';
    status.by_cycle.synthesis++;
  } else if (completed.includes('adversarial')) {
    nodeStatus.status = 'CHALLENGED';
    status.by_cycle.adversarial++;
  } else if (completed.includes('discovery')) {
    nodeStatus.status = 'DISCOVERED';
    status.by_cycle.discovery++;
  }

  status.completion.unreviewed = Object.values(status.nodes).filter(n => n.status === 'UNREVIEWED').length;
  status.completion.discovered = Object.values(status.nodes).filter(n => ['DISCOVERED', 'CHALLENGED', 'SYNTHESIZED', 'RECONCILED'].includes(n.status)).length;
  status.completion.challenged = Object.values(status.nodes).filter(n => ['CHALLENGED', 'SYNTHESIZED', 'RECONCILED'].includes(n.status)).length;
  status.completion.synthesized = Object.values(status.nodes).filter(n => ['SYNTHESIZED', 'RECONCILED'].includes(n.status)).length;
  status.completion.reconciled = Object.values(status.nodes).filter(n => n.status === 'RECONCILED').length;

  status.last_review_at = event.reviewed_at;

  // Handle flags
  if (flags.flags) {
    const newFlags = flags.flags.split(',');
    nodeStatus.flags.push(...newFlags);
    newFlags.forEach(f => {
      if (status.flags[f] !== undefined) {
        status.flags[f]++;
      }
    });

    // Auto-record human gate for critical flags
    if (newFlags.includes('contradiction') && flags.cycle === 'adversarial') {
      recordHumanGate({
        node_id: flags.id,
        type: 'contradiction',
        severity: flags.severity || 'medium',
        cycle: flags.cycle,
        description: flags.challenges || `Contradiction detected for ${flags.id}`,
        recommendation: 'Review both contradicted nodes, determine which authority takes precedence, update the subordinate document, or define a tiered resolution. Only humans can resolve contradictions.',
        context: flags.contradictions ? { contradicted_nodes: flags.contradictions.split(',') } : {},
      });
    }
    if (newFlags.includes('sensitive')) {
      recordHumanGate({
        node_id: flags.id,
        type: 'sensitive',
        severity: 'high',
        cycle: flags.cycle,
        description: `Node ${flags.id} flagged as sensitive (locked at ${nodeStatus.requiredRole || 'unknown'} level). Review access control and ensure least-privilege enforcement.`,
        recommendation: 'Verify that role-based access control correctly gates this node. Ensure escalation paths to Super Director are documented and tested.',
        context: { requiredRole: nodeStatus.requiredRole },
      });
    }
  }

  // Handle contradictions
  if (flags.contradictions) {
    const contradictions = JSON.parse(fs.readFileSync(contradictionsPath, 'utf-8'));
    flags.contradictions.split(',').forEach(contraId => {
      nodeStatus.contradictions.push(contraId);
      contradictions.contradictions.push({
        from: flags.id,
        to: contraId.trim(),
        discovered_at: event.reviewed_at,
        severity: flags.severity || 'medium',
        status: 'open',
      });
    });
    fs.writeFileSync(contradictionsPath, JSON.stringify(contradictions, null, 2));
  }

  // Write updated status
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));

  console.log(`✅ Review recorded: ${flags.id}`);
  console.log(`   Cycle: ${flags.cycle} | Reviewer: ${flags.reviewer}`);
  console.log(`   Status: ${nodeStatus.status} | Confidence: ${event.confidence || 'N/A'}`);
  console.log(`   Progress: ${status.completion.reconciled}/${status.total_nodes} reconciled (${((status.completion.reconciled / status.total_nodes) * 100).toFixed(2)}%)`);
}

main();
