/**
 * packages/tnf-cli/src/commands/staffing/index.ts
 *
 * Native TNF CLI commands for staffing coverage analysis and agent gap detection.
 * Implements the Staffing Director Agent's capabilities within the CLI harness.
 */

import type { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getOrCreateCommand } from '../_registry.js';

export interface StaffingGap {
  category: string;
  workspace: string;
  gapType: 'unowned_workflow' | 'missing_role' | 'skill_deficit' | 'dependency_gap';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  suggestedAction: string;
}

export interface RoleDefinition {
  name: string;
  displayName: string;
  description: string;
  responsibilities: string[];
  tools: string[];
  capabilities: string[];
  tags: string[];
  agentType: 'system' | 'worker' | 'orchestrator' | 'broker' | 'participant' | 'local';
  version: string;
}

export interface StaffingReport {
  timestamp: string;
  coverageSummary: {
    totalAgents: number;
    systemAgents: number;
    workerAgents: number;
    governanceAgents: number;
    coverageRate: number;
  };
  gaps: StaffingGap[];
  proposedRoles: RoleDefinition[];
  proposedSkills: Array<{
    name: string;
    description: string;
    sourceAgent: string;
  }>;
  actionPlan: Array<{
    priority: number;
    category: string;
    action: string;
    estimatedEffort: 'trivial' | 'small' | 'medium' | 'large';
  }>;
}

const GOVERNANCE_AGENTS = [
  'autonomy-governor',
  'state-governor',
  'slotmanager-agent',
  'snapshot-dispatcher',
  'staffing-director-agent',
];

const WORKFLOW_CATEGORIES = [
  'content_creation',
  'market_analysis',
  'technical_implements',
  'community_engagement',
  'monetization',
  'governance',
  'monitoring',
];

function scanAgentDirectory(agentsPath: string): Array<{ name: string; type: string; path: string; displayName: string }> {
  const agents: Array<{ name: string; type: string; path: string; displayName: string }> = [];

  try {
    const entries = fs.readdirSync(agentsPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

      const fullPath = path.join(agentsPath, entry.name);
      const content = fs.readFileSync(fullPath, 'utf-8');

      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) continue;

      const nameMatch = fmMatch[1].match(/^name:\s*(.+)$/m);
      const displayNameMatch = fmMatch[1].match(/^displayName:\s*(.+)$/m);

      if (nameMatch) {
        const name = nameMatch[1].trim();
        const displayName = (displayNameMatch?.[1]?.trim()) || name;
        const isGovernance = GOVERNANCE_AGENTS.includes(name) ||
          content.includes(' GovernanceAgent') ||
          content.includes('governor') ||
          content.includes('staffing');

        agents.push({
          name,
          type: isGovernance ? 'governance' : 'worker',
          path: fullPath,
          displayName,
        });
      }
    }
  } catch {
    // ignore
  }

  return agents;
}

function scanCLAUDEAgents(): Array<{ name: string; type: string; path: string; displayName: string }> {
  const claudePath = path.join(process.env.HOME || '', '.claude', 'agents');
  return fs.existsSync(claudePath) ? scanAgentDirectory(claudePath) : [];
}

function scanAgentAgents(): Array<{ name: string; type: string; path: string; displayName: string }> {
  const agentPath = path.join(process.env.HOME || '', '.agent', 'agents');
  return fs.existsSync(agentPath) ? scanAgentDirectory(agentPath) : [];
}

function detectGaps(agents: Array<{ name: string; type: string; displayName: string }>): StaffingGap[] {
  const gaps: StaffingGap[] = [];

  const agentNames = new Set(agents.map(a => a.name));
  const governanceNameSet = new Set(GOVERNANCE_AGENTS);

  for (const gapType of WORKFLOW_CATEGORIES) {
    const knownAgent = `${gapType}-agent`;
    if (!agentNames.has(knownAgent) && !governanceNameSet.has(gapType)) {
      const isCritical = ['governance', 'monetization', 'monitoring'].includes(gapType);

      gaps.push({
        category: gapType,
        workspace: 'core',
        gapType: 'missing_role',
        severity: isCritical ? 'high' : 'medium',
        description: `No dedicated agent for ${gapType.replace('_', ' ')} functionality`,
        impact: isCritical ? 'Operational efficiency may be impacted' : 'Minor coverage gap',
        suggestedAction: `Consider adding a ${gapType}-agent role to the staffing roster`,
      });
    }
  }

  if (!agentNames.has('staffing-director-agent')) {
    gaps.push({
      category: 'governance',
      workspace: 'core',
      gapType: 'missing_role',
      severity: 'high',
      description: 'No staffing-director-agent for role gap detection and coverage planning',
      impact: 'Cannot automatically detect or propose staffing coverage improvements',
      suggestedAction: 'Add staffing-director-agent to .claude/agents/ for autonomous staffing analysis',
    });
  }

  return gaps;
}

function proposeRoles(gaps: StaffingGap[]): RoleDefinition[] {
  const proposed: RoleDefinition[] = [];

  const missingGovernance = gaps.filter(g => g.category === 'governance' && g.severity !== 'low');

  for (const gap of missingGovernance) {
    if (gap.description.includes('staffing')) {
      proposed.push({
        name: 'staffing-director-agent',
        displayName: 'Staffing Director Agent',
        description: 'Owns TNF staffing architecture, role-gap discovery, and new role or skill proposals',
        responsibilities: [
          'Continuously audit agent coverage across operational niches',
          'Identify unowned high-impact workflows and missing role coverage',
          'Design new agent roles with authoritative definitions and capabilities',
          'Create associated skill definitions for proposed roles',
          'Maintain prioritized list of staffing improvements',
        ],
        tools: ['Read', 'Write', 'Glob', 'Grep', 'Bash'],
        capabilities: ['role_analysis', 'skill_proposal', 'gap_detection', 'coverage_planning'],
        tags: ['staffing', 'governance', 'coverage', 'operations'],
        agentType: 'system',
        version: '1.0.0',
      });
    }
  }

  const roleMap: Record<string, Partial<RoleDefinition>> = {
    content_creation: {
      name: 'content-strategist-agent',
      displayName: 'Content Strategist Agent',
      description: 'Manages content calendar, semantic strategy, and repurposing workflows',
      responsibilities: ['Content calendar management', 'Semantic keyword strategy', 'Cross-platform repurposing'],
      tools: ['Read', 'Write', 'Grep', 'Bash'],
      capabilities: ['seo', 'content_strategy', 'repurposing'],
      tags: ['content', 'seo', 'social'],
      agentType: 'worker',
      version: '1.0.0',
    },
    market_analysis: {
      name: 'market-research-agent',
      displayName: 'Market Research Agent',
      description: 'Conducts competitive analysis and audience segmentation research',
      responsibilities: ['Competitive intelligence', 'Audience persona development', 'Market gap identification'],
      tools: ['Read', 'Grep', 'Bash'],
      capabilities: ['research', 'analysis', 'segmentation'],
      tags: ['market', 'research', 'analysis'],
      agentType: 'worker',
      version: '1.0.0',
    },
    monetization: {
      name: 'revenue-architect-agent',
      displayName: 'Revenue Architect Agent',
      description: 'Designs monetization strategies for blog and content operations',
      responsibilities: ['Affiliate strategy', 'Ad network management', 'Digital product design'],
      tools: ['Read', 'Write', 'Grep', 'Bash'],
      capabilities: ['monetization', 'strategy', 'revenue_optimization'],
      tags: ['revenue', 'monetization', 'strategy'],
      agentType: 'worker',
      version: '1.0.0',
    },
  };

  for (const gap of gaps) {
    if (roleMap[gap.category]) {
      const role = roleMap[gap.category];
      const exists = proposed.some(p => p.name === role.name);
      if (!exists) {
        proposed.push({
          name: role.name!,
          displayName: role.displayName!,
          description: role.description!,
          responsibilities: role.responsibilities || [],
          tools: role.tools || [],
          capabilities: role.capabilities || [],
          tags: role.tags || [],
          agentType: role.agentType || 'worker',
          version: role.version || '1.0.0',
        });
      }
    }
  }

  return proposed;
}

function generateActionPlan(agents: Array<{ name: string; type: string }>, gaps: StaffingGap[]): StaffingReport['actionPlan'] {
  const plan: StaffingReport['actionPlan'] = [];
  let priority = 1;

  const criticalGaps = gaps.filter(g => g.severity === 'critical');
  for (const gap of criticalGaps) {
    plan.push({
      priority: priority++,
      category: gap.category,
      action: `Address critical gap: ${gap.description}`,
      estimatedEffort: 'medium',
    });
  }

  const highGaps = gaps.filter(g => g.severity === 'high');
  for (const gap of highGaps) {
    plan.push({
      priority: priority++,
      category: gap.category,
      action: gap.suggestedAction,
      estimatedEffort: 'small',
    });
  }

  const governanceCount = agents.filter(a => a.type === 'governance').length;
  if (governanceCount < 3) {
    plan.push({
      priority: priority++,
      category: 'governance',
      action: 'Increase governance agent coverage for autonomous operation',
      estimatedEffort: 'small',
    });
  }

  return plan;
}

export function registerStaffingCommands(program: Command): Command {
  const staffing = getOrCreateCommand(
    program,
    'staffing',
    'TNF staffing coverage analysis and agent gap detection'
  );

  staffing
    .command('scan')
    .description('Scan for staffing gaps and missing agent coverage')
    .option('--json', 'Output report as structured JSON')
    .option('--workspace <path>', 'Limit scan to workspace', process.cwd())
    .action((opts) => {
      const agents = [
        ...scanCLAUDEAgents(),
        ...scanAgentAgents(),
      ];

      const gaps = detectGaps(agents);
      const proposedRoles = proposeRoles(gaps);
      const actionPlan = generateActionPlan(agents, gaps);

      const coverageRate = agents.length > 0
        ? (GOVERNANCE_AGENTS.filter(g => agents.some(a => a.name === g)).length / GOVERNANCE_AGENTS.length) * 100
        : 0;

      const report: StaffingReport = {
        timestamp: new Date().toISOString(),
        coverageSummary: {
          totalAgents: agents.length,
          systemAgents: GOVERNANCE_AGENTS.length,
          workerAgents: agents.filter(a => a.type !== 'governance').length,
          governanceAgents: agents.filter(a => a.type === 'governance').length,
          coverageRate,
        },
        gaps,
        proposedRoles,
        proposedSkills: proposedRoles.map(r => ({
          name: r.name,
          description: r.description,
          sourceAgent: 'staffing-director-agent',
        })),
        actionPlan,
      };

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      console.log('\n📊 TNF Staffing Coverage Report');
      console.log('='.repeat(50));
      console.log(`\nCoverage Summary:`);
      console.log(`  Total Agents: ${report.coverageSummary.totalAgents}`);
      console.log(`  Governance Agents: ${report.coverageSummary.governanceAgents}/${report.coverageSummary.systemAgents}`);
      console.log(`  Coverage Rate: ${report.coverageSummary.coverageRate.toFixed(1)}%`);
      console.log(`\nGaps Detected: ${gaps.length}`);

      if (gaps.length > 0) {
        console.log('\n🔍 Gap Details:');
        for (const gap of gaps) {
          const icon = gap.severity === 'critical' ? '🔴' : gap.severity === 'high' ? '🟠' : gap.severity === 'medium' ? '🟡' : '🟢';
          console.log(`  ${icon} [${gap.severity.toUpperCase()}] ${gap.description}`);
        }
      }

      console.log(`\nProposed Roles: ${proposedRoles.length}`);
      for (const role of proposedRoles) {
        console.log(`  🏷️  ${role.displayName}: ${role.description}`);
      }

      console.log(`\n📋 Action Plan:`);
      for (const action of actionPlan) {
        console.log(`  🎯 (${action.priority}) ${action.action}`);
      }
      console.log('');
    });

  staffing
    .command('propose')
    .description('Generate proposed new agent roles for missing coverage')
    .option('--category <name>', 'Filter by category')
    .option('--json', 'Output as structured JSON')
    .action((opts) => {
      const roles = proposeRoles([
        { category: 'governance', workspace: 'core', gapType: 'missing_role', severity: 'high',
          description: 'Missing staffing-director-agent', impact: 'Cannot detect staffing gaps', suggestedAction: 'Add staffing-director-agent' },
        { category: 'content_creation', workspace: 'core', gapType: 'missing_role', severity: 'medium',
          description: 'Missing content strategist', impact: 'Limited content planning', suggestedAction: 'Add content-strategist-agent' },
      ]);

      const filtered = opts.category
        ? roles.filter(r => r.name.includes(opts.category) || r.description.toLowerCase().includes(opts.category.toLowerCase()))
        : roles;

      if (opts.json) {
        console.log(JSON.stringify(filtered, null, 2));
        return;
      }

      console.log('\n🚀 Proposed Agent Roles');
      console.log('='.repeat(50));

      for (const role of filtered) {
        console.log(`\n🏷️  ${role.displayName}`);
        console.log(`   Name: ${role.name}`);
        console.log(`   Type: ${role.agentType}`);
        console.log(`   Description: ${role.description}`);
        console.log(`   Tags: ${role.tags.join(', ')}`);
        console.log(`   Capabilities: ${role.capabilities.join(', ')}`);
        console.log(`   Tools: ${role.tools.join(', ')}`);
      }
      console.log('');
    });

  staffing
    .command('report')
    .description('Generate a staffing coverage report for review')
    .option('--output <path>', 'Write report to file')
    .option('--format <format>', 'Output format (json, jsonl)', 'json')
    .action((opts) => {
      const agents = [
        ...scanCLAUDEAgents(),
        ...scanAgentAgents(),
      ];

      const gaps = detectGaps(agents);
      const proposedRoles = proposeRoles(gaps);
      const actionPlan = generateActionPlan(agents, gaps);

      const coverageRate = agents.length > 0
        ? (GOVERNANCE_AGENTS.filter(g => agents.some(a => a.name === g)).length / GOVERNANCE_AGENTS.length) * 100
        : 0;

      const report: StaffingReport = {
        timestamp: new Date().toISOString(),
        coverageSummary: {
          totalAgents: agents.length,
          systemAgents: GOVERNANCE_AGENTS.length,
          workerAgents: agents.filter(a => a.type !== 'governance').length,
          governanceAgents: agents.filter(a => a.type === 'governance').length,
          coverageRate,
        },
        gaps,
        proposedRoles,
        proposedSkills: proposedRoles.map(r => ({
          name: r.name,
          description: r.description,
          sourceAgent: 'staffing-director-agent',
        })),
        actionPlan,
      };

      const jsonOutput = JSON.stringify(report, null, 2);

      if (opts.output) {
        fs.writeFileSync(opts.output, jsonOutput);
        console.log(`✅ Staffing report written to ${opts.output}`);
        return;
      }

      console.log(jsonOutput);
    });

  staffing
    .command('plan')
    .description('Show prioritized staffing action plan')
    .option('--json', 'Output as structured JSON')
    .option('--severity <level>', 'Filter by severity', 'all')
    .action((opts) => {
      const agents = [
        ...scanCLAUDEAgents(),
        ...scanAgentAgents(),
      ];

      const gaps = detectGaps(agents);
      const actionPlan = generateActionPlan(agents, gaps);

      if (opts.severity !== 'all') {
        const filteredGaps = gaps.filter(g => g.severity === opts.severity);
        console.log(`\n📋 Action Plan (Severity: ${opts.severity})`);
        for (const action of actionPlan) {
          const gapDetail = filteredGaps.find(g => g.suggestedAction.includes(action.action.replace('Address critical gap:', '').trim()));
          if (gapDetail) {
            const icon = action.estimatedEffort === 'large' ? '📈' : action.estimatedEffort === 'medium' ? '🔧' : action.estimatedEffort === 'small' ? '📝' : '✨';
            console.log(`  ${icon} (${action.priority}) ${action.action}`);
          }
        }
      } else if (opts.json) {
        console.log(JSON.stringify(actionPlan, null, 2));
      } else {
        console.log('\n📋 TNF Staffing Action Plan');
        console.log('='.repeat(50));

        for (const action of actionPlan) {
          const icon = action.estimatedEffort === 'large' ? '📈' : action.estimatedEffort === 'medium' ? '🔧' : action.estimatedEffort === 'small' ? '📝' : '✨';
          console.log(`  ${icon} (${action.priority}) ${action.action}`);
          console.log(`      Effort: ${action.estimatedEffort}`);
          console.log(`      Category: ${action.category}`);
        }
      }
      console.log('');
    });

  return staffing;
}

function resolveRepoPath(rel: string): string {
  const root = process.env.TNF_REPO_DIR || process.env.TNF_ROOT || process.cwd();
  return path.join(root, rel);
}