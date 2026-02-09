#!/usr/bin/env npx ts-node
/**
 * Brand Consistency Agent - Standalone Demo
 *
 * This script demonstrates the self-improving Brand Consistency Agent
 * analyzing components and evolving its detection capabilities.
 *
 * Run with: npx ts-node apps/api/src/scripts/demo-brand-agent.ts
 */

// Simulated Brand Configuration (TNF Design System)
const brandConfig = {
  primaryColor: '#6366f1',      // Indigo
  secondaryColor: '#8b5cf6',    // Purple
  accentColor: '#06b6d4',       // Cyan
  backgroundColor: '#0f172a',   // Slate-900
  textColor: '#f8fafc',         // Slate-50
  fontFamily: "'Inter', sans-serif",
  borderRadius: '0.5rem',
  animationDuration: '200ms',
  spacingUnit: 4
};

// Sample components to analyze
const sampleComponents = [
  {
    path: 'apps/frontend/src/components/ui/Button.tsx',
    code: `
import React from 'react';

export const Button = ({ children, variant = 'primary' }) => {
  const styles = {
    primary: {
      background: '#6366f1',           // Brand color ✓
      color: 'white',
      padding: '12px 24px',            // On 4px grid ✓
      borderRadius: '0.5rem',          // Brand radius ✓
      transition: 'all 200ms ease'     // Brand duration ✓
    }
  };

  return <button style={styles[variant]}>{children}</button>;
};
    `.trim()
  },
  {
    path: 'apps/frontend/src/components/cards/FeatureCard.tsx',
    code: `
import React from 'react';

export const FeatureCard = ({ title, description }) => {
  return (
    <div style={{
      background: '#1e293b',           // Close but not exact brand color
      borderRadius: '8px',             // Should be 0.5rem
      padding: '15px',                 // NOT on 4px grid!
      fontFamily: 'Arial',             // Non-brand font!
      transition: 'all 0.3s ease'      // Non-standard duration!
    }}>
      <h3 style={{
        color: '#e11d48',              // Non-brand color (rose)
        fontSize: '18px'
      }}>
        {title}
      </h3>
      <p style={{ color: '#94a3b8' }}>{description}</p>
    </div>
  );
};
    `.trim()
  },
  {
    path: 'apps/frontend/src/components/layout/Sidebar.tsx',
    code: `
import React from 'react';

export const Sidebar = ({ items }) => {
  return (
    <nav style={{
      background: 'linear-gradient(180deg, #0f172a, #1e293b)',  // Brand gradient ✓
      padding: '16px',                                          // On 4px grid ✓
      borderRadius: '0.5rem'                                    // Brand radius ✓
    }}>
      {items.map(item => (
        <a
          key={item.id}
          style={{
            color: '#f8fafc',                                   // Brand text color ✓
            padding: '8px 12px',                                // On 4px grid ✓
            fontFamily: "'Inter', sans-serif",                  // Brand font ✓
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)' // Brand easing ✓
          }}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
};
    `.trim()
  }
];

// Learning state for the agent
const learningState = {
  totalAnalyses: 0,
  successfulFixes: 0,
  patternsLearned: [] as string[],
  promptEvolutions: 0,
  currentPromptVersion: 1
};

// Core prompt that evolves
let corePrompt = `You are the Brand Consistency Guardian for The New Fuse platform.

BRAND TOKENS:
- Primary: #6366f1 (Indigo)
- Secondary: #8b5cf6 (Purple)
- Accent: #06b6d4 (Cyan)
- Background: #0f172a (Dark Slate)
- Text: #f8fafc (Light)

RULES TO ENFORCE:
1. All colors must match brand palette
2. Spacing must be on 4px grid
3. Transitions must be 200ms
4. Use Inter or Outfit fonts only
5. Border radius should be 0.5rem`;

interface BrandIssue {
  type: 'color' | 'typography' | 'spacing' | 'animation' | 'pattern';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  currentValue: string;
  expectedValue: string;
}

interface ComponentAnalysis {
  componentPath: string;
  componentName: string;
  issues: BrandIssue[];
  consistencyScore: number;
  timestamp: Date;
}

function analyzeComponent(path: string, code: string): ComponentAnalysis {
  const issues: BrandIssue[] = [];

  // Check for non-brand colors
  const hexColors = code.match(/#([0-9a-fA-F]{6})/g) || [];
  const brandColors = [
    brandConfig.primaryColor.toLowerCase(),
    brandConfig.secondaryColor.toLowerCase(),
    brandConfig.accentColor.toLowerCase(),
    brandConfig.backgroundColor.toLowerCase(),
    brandConfig.textColor.toLowerCase(),
    '#ffffff', '#1e293b', '#94a3b8' // Common allowed variations
  ];

  for (const color of hexColors) {
    if (!brandColors.includes(color.toLowerCase())) {
      issues.push({
        type: 'color',
        severity: 'major',
        description: `Non-brand color detected: ${color}`,
        currentValue: color,
        expectedValue: brandConfig.primaryColor
      });
    }
  }

  // Check for non-brand fonts
  const fontMatches = code.match(/fontFamily:\s*['"]([^'"]+)['"]/g) || [];
  for (const match of fontMatches) {
    const font = match.toLowerCase();
    if (!font.includes('inter') && !font.includes('outfit')) {
      issues.push({
        type: 'typography',
        severity: 'minor',
        description: 'Non-brand font detected',
        currentValue: match,
        expectedValue: brandConfig.fontFamily
      });
    }
  }

  // Check for non-4px spacing
  const spacingMatches = code.match(/padding:\s*['"]?(\d+)px/g) || [];
  for (const match of spacingMatches) {
    const value = parseInt(match.match(/(\d+)/)?.[1] || '0');
    if (value % brandConfig.spacingUnit !== 0 && value > 2) {
      issues.push({
        type: 'spacing',
        severity: 'minor',
        description: `Spacing ${value}px not on ${brandConfig.spacingUnit}px grid`,
        currentValue: `${value}px`,
        expectedValue: `${Math.round(value / brandConfig.spacingUnit) * brandConfig.spacingUnit}px`
      });
    }
  }

  // Check for non-standard animation durations
  const durationMatches = code.match(/(?:transition|animation)[^;]*(\d+(?:\.\d+)?)(ms|s)/g) || [];
  for (const match of durationMatches) {
    const durationMatch = match.match(/(\d+(?:\.\d+)?)(ms|s)/);
    if (durationMatch) {
      const duration = durationMatch[2] === 's'
        ? parseFloat(durationMatch[1]) * 1000
        : parseFloat(durationMatch[1]);
      if (duration !== 200) {
        issues.push({
          type: 'animation',
          severity: 'minor',
          description: `Non-standard transition duration: ${duration}ms`,
          currentValue: `${duration}ms`,
          expectedValue: brandConfig.animationDuration
        });
      }
    }
  }

  // Check for non-standard border radius
  const radiusMatches = code.match(/borderRadius:\s*['"]?(\d+)px/g) || [];
  for (const match of radiusMatches) {
    issues.push({
      type: 'pattern',
      severity: 'minor',
      description: 'Border radius should use rem units',
      currentValue: match,
      expectedValue: brandConfig.borderRadius
    });
  }

  // Calculate score
  let deductions = 0;
  for (const issue of issues) {
    deductions += issue.severity === 'critical' ? 15 : issue.severity === 'major' ? 8 : 3;
  }

  learningState.totalAnalyses++;

  return {
    componentPath: path,
    componentName: path.split('/').pop()?.replace(/\.tsx?$/, '') || 'Unknown',
    issues,
    consistencyScore: Math.max(0, 100 - deductions),
    timestamp: new Date()
  };
}

function selfImprove(learnedPattern: string): void {
  if (!learningState.patternsLearned.includes(learnedPattern)) {
    learningState.patternsLearned.push(learnedPattern);
    learningState.successfulFixes++;

    // Evolve prompt every 3 patterns
    if (learningState.patternsLearned.length % 3 === 0) {
      evolvePrompt();
    }
  }
}

function evolvePrompt(): void {
  learningState.promptEvolutions++;
  learningState.currentPromptVersion++;

  const newPatterns = learningState.patternsLearned.slice(-3).map(p => `- ${p}`).join('\n');

  corePrompt = `${corePrompt}

LEARNED PATTERNS (v${learningState.currentPromptVersion}):
${newPatterns}`;

  console.log(`\n🧬 PROMPT EVOLVED TO VERSION ${learningState.currentPromptVersion}`);
}

function generateBrandCSS(): string {
  return `/* TNF Brand CSS Variables */
:root {
  --tnf-primary: ${brandConfig.primaryColor};
  --tnf-secondary: ${brandConfig.secondaryColor};
  --tnf-accent: ${brandConfig.accentColor};
  --tnf-background: ${brandConfig.backgroundColor};
  --tnf-text: ${brandConfig.textColor};
  --tnf-font-family: ${brandConfig.fontFamily};
  --tnf-border-radius: ${brandConfig.borderRadius};
  --tnf-animation-duration: ${brandConfig.animationDuration};
  --tnf-spacing-unit: ${brandConfig.spacingUnit}px;
  --tnf-gradient-primary: linear-gradient(135deg, var(--tnf-primary), var(--tnf-secondary));
}`;
}

// ===== MAIN DEMO =====

console.log(`
╔════════════════════════════════════════════════════════════════╗
║     BRAND CONSISTENCY SELF-IMPROVING AGENT - DEMONSTRATION     ║
║                                                                ║
║     🏰 Orchestrator  💓 Heartbeat  📡 Message Broker           ║
╚════════════════════════════════════════════════════════════════╝
`);

console.log('🤖 Agent: BrandConsistencyGuardian v1.0.0');
console.log('📋 Mission: Maintain and improve brand consistency across TNF platform\n');

console.log('━'.repeat(60));
console.log('PHASE 1: ANALYZING COMPONENTS');
console.log('━'.repeat(60) + '\n');

const analyses: ComponentAnalysis[] = [];

for (const component of sampleComponents) {
  console.log(`📂 Analyzing: ${component.path}`);
  const analysis = analyzeComponent(component.path, component.code);
  analyses.push(analysis);

  const scoreEmoji = analysis.consistencyScore >= 90 ? '✅' : analysis.consistencyScore >= 70 ? '⚠️' : '❌';
  console.log(`   ${scoreEmoji} Consistency Score: ${analysis.consistencyScore}%`);

  if (analysis.issues.length > 0) {
    console.log(`   📍 Issues Found: ${analysis.issues.length}`);
    for (const issue of analysis.issues.slice(0, 3)) {
      console.log(`      • [${issue.severity.toUpperCase()}] ${issue.description}`);
    }
    if (analysis.issues.length > 3) {
      console.log(`      ... and ${analysis.issues.length - 3} more`);
    }
  } else {
    console.log(`   ✨ No issues found - component is brand-consistent!`);
  }
  console.log('');
}

console.log('━'.repeat(60));
console.log('PHASE 2: SELF-IMPROVEMENT');
console.log('━'.repeat(60) + '\n');

// Simulate learning from the analysis
const patternsToLearn = [
  'Detect hardcoded hex colors that arent in brand palette',
  'Flag non-Inter/Outfit font families',
  'Identify spacing values not on 4px grid',
  'Check for non-200ms transition durations',
  'Enforce 0.5rem border radius standard'
];

console.log('🧠 Learning from analysis results...\n');

for (const pattern of patternsToLearn) {
  selfImprove(pattern);
  console.log(`   📚 Learned: "${pattern}"`);
}

console.log('\n');
console.log('━'.repeat(60));
console.log('PHASE 3: AGENT STATE');
console.log('━'.repeat(60) + '\n');

console.log('📊 Learning State:');
console.log(`   • Total Analyses: ${learningState.totalAnalyses}`);
console.log(`   • Successful Fixes: ${learningState.successfulFixes}`);
console.log(`   • Patterns Learned: ${learningState.patternsLearned.length}`);
console.log(`   • Prompt Evolutions: ${learningState.promptEvolutions}`);
console.log(`   • Current Prompt Version: v${learningState.currentPromptVersion}`);

console.log('\n📈 Analysis Summary:');
const avgScore = analyses.reduce((sum, a) => sum + a.consistencyScore, 0) / analyses.length;
const totalIssues = analyses.reduce((sum, a) => sum + a.issues.length, 0);
console.log(`   • Components Analyzed: ${analyses.length}`);
console.log(`   • Average Consistency: ${avgScore.toFixed(1)}%`);
console.log(`   • Total Issues Found: ${totalIssues}`);

console.log('\n');
console.log('━'.repeat(60));
console.log('PHASE 4: GENERATED BRAND CSS');
console.log('━'.repeat(60) + '\n');

console.log(generateBrandCSS());

console.log('\n');
console.log('━'.repeat(60));
console.log('PHASE 5: EVOLVED PROMPT (Excerpt)');
console.log('━'.repeat(60) + '\n');

console.log(corePrompt.split('\n').slice(0, 20).join('\n'));
console.log('...\n');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    DEMONSTRATION COMPLETE                       ║
║                                                                 ║
║  The Brand Consistency Agent has:                               ║
║  ✅ Analyzed ${analyses.length} components for brand consistency                ║
║  ✅ Detected ${totalIssues} brand inconsistencies                              ║
║  ✅ Learned ${learningState.patternsLearned.length} new detection patterns                          ║
║  ✅ Evolved its prompt ${learningState.promptEvolutions} time(s)                                  ║
║  ✅ Generated brand CSS variables                               ║
║                                                                 ║
║  This agent uses the TNF Three Pillars architecture:            ║
║  🏰 Orchestrator: Task management                               ║
║  💓 Heartbeat: Health monitoring                                ║
║  📡 Broker: Inter-agent communication                           ║
╚════════════════════════════════════════════════════════════════╝
`);
