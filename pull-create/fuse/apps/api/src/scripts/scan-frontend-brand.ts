#!/usr/bin/env npx tsx
/**
 * Brand Consistency Agent - Real Frontend Component Scanner
 *
 * This script scans actual frontend components and sends them to the
 * Brand Consistency Agent API for analysis.
 */

import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'http://localhost:3001/api/agents/brand-consistency';
const FRONTEND_DIR = path.join(process.cwd(), 'apps/frontend/src/components');

interface ComponentFile {
  path: string;
  code: string;
}

interface AnalysisResult {
  componentPath: string;
  componentName: string;
  consistencyScore: number;
  issues: Array<{
    type: string;
    severity: string;
    description: string;
  }>;
}

async function scanComponents(): Promise<ComponentFile[]> {
  const components: ComponentFile[] = [];

  // Specific components to analyze
  const targetFiles = [
    'apps/frontend/src/components/AppStack_Card.tsx',
    'apps/frontend/src/components/AgentChatRoom.tsx',
    'apps/frontend/src/components/Analytics.tsx',
    'apps/frontend/src/components/ActivityFeed.tsx',
    'apps/frontend/src/components/AgentMarketplace.tsx',
    'apps/frontend/src/pages/dashboard.tsx',
    'apps/frontend/src/pages/login.tsx',
    'apps/frontend/src/pages/register.tsx'
  ];

  for (const filePath of targetFiles) {
    const fullPath = path.join(process.cwd(), filePath);

    if (fs.existsSync(fullPath)) {
      const code = fs.readFileSync(fullPath, 'utf-8');
      components.push({
        path: filePath,
        code: code.substring(0, 10000) // Limit to first 10KB
      });
    }
  }

  return components;
}

async function analyzeComponent(component: ComponentFile): Promise<AnalysisResult | null> {
  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        componentPath: component.path,
        componentCode: component.code
      })
    });

    if (!response.ok) {
      console.error(`  ❌ Failed to analyze: ${response.status}`);
      return null;
    }

    return await response.json() as AnalysisResult;
  } catch (error) {
    console.error(`  ❌ Error: ${error}`);
    return null;
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║      BRAND CONSISTENCY AGENT - REAL FRONTEND ANALYSIS          ║
║                                                                ║
║      Scanning actual TNF frontend components                    ║
╚════════════════════════════════════════════════════════════════╝
`);

  // Check API health
  console.log('🔌 Checking API connection...');
  try {
    const infoResponse = await fetch(`${API_BASE}/info`);
    if (!infoResponse.ok) {
      console.error('❌ API not available. Start with: cd apps/api && node dist/main.js');
      process.exit(1);
    }
    const info = await infoResponse.json() as any;
    console.log(`✅ Connected to ${info.name} v${info.version}\n`);
  } catch {
    console.error('❌ Cannot connect to API at http://localhost:3001');
    console.log('   Make sure the API is running: cd apps/api && node dist/main.js\n');
    process.exit(1);
  }

  // Scan components
  console.log('📂 Scanning frontend components...');
  const components = await scanComponents();
  console.log(`   Found ${components.length} components to analyze\n`);

  // Analyze each component
  console.log('━'.repeat(60));
  console.log('ANALYSIS RESULTS');
  console.log('━'.repeat(60) + '\n');

  const results: AnalysisResult[] = [];

  for (const component of components) {
    const shortPath = component.path.split('/').slice(-2).join('/');
    console.log(`📄 ${shortPath}`);

    const analysis = await analyzeComponent(component);

    if (analysis) {
      results.push(analysis);

      const emoji = analysis.consistencyScore >= 90 ? '✅' :
                    analysis.consistencyScore >= 70 ? '⚠️' : '❌';
      console.log(`   ${emoji} Score: ${analysis.consistencyScore}%`);

      if (analysis.issues.length > 0) {
        console.log(`   📍 Issues: ${analysis.issues.length}`);
        for (const issue of analysis.issues.slice(0, 3)) {
          const severityIcon = issue.severity === 'critical' ? '🔴' :
                               issue.severity === 'major' ? '🟠' : '🟡';
          console.log(`      ${severityIcon} ${issue.description.substring(0, 50)}`);
        }
        if (analysis.issues.length > 3) {
          console.log(`      ... and ${analysis.issues.length - 3} more`);
        }
      } else {
        console.log(`   ✨ Fully brand-consistent!`);
      }
    }
    console.log('');
  }

  // Summary
  console.log('━'.repeat(60));
  console.log('SUMMARY');
  console.log('━'.repeat(60) + '\n');

  if (results.length > 0) {
    const avgScore = results.reduce((sum, r) => sum + r.consistencyScore, 0) / results.length;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const criticalIssues = results.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'critical').length, 0);
    const majorIssues = results.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'major').length, 0);

    console.log(`📊 Components Analyzed: ${results.length}`);
    console.log(`📈 Average Consistency: ${avgScore.toFixed(1)}%`);
    console.log(`📍 Total Issues: ${totalIssues}`);
    console.log(`   🔴 Critical: ${criticalIssues}`);
    console.log(`   🟠 Major: ${majorIssues}`);
    console.log(`   🟡 Minor: ${totalIssues - criticalIssues - majorIssues}`);

    // Breakdown by type
    console.log('\n📋 Issues by Type:');
    const byType: Record<string, number> = {};
    for (const r of results) {
      for (const issue of r.issues) {
        byType[issue.type] = (byType[issue.type] || 0) + 1;
      }
    }
    for (const [type, count] of Object.entries(byType)) {
      console.log(`   • ${type}: ${count}`);
    }

    // Least consistent components
    const sorted = [...results].sort((a, b) => a.consistencyScore - b.consistencyScore);
    console.log('\n🔍 Components Needing Attention:');
    for (const r of sorted.slice(0, 5)) {
      if (r.consistencyScore < 90) {
        const shortName = r.componentPath.split('/').pop();
        console.log(`   • ${shortName}: ${r.consistencyScore}% (${r.issues.length} issues)`);
      }
    }
  }

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    SCAN COMPLETE                                ║
║                                                                 ║
║  The Brand Consistency Agent has analyzed real frontend code.   ║
║  Use the learned patterns to improve design system adherence.   ║
╚════════════════════════════════════════════════════════════════╝
`);
}

main().catch(console.error);
