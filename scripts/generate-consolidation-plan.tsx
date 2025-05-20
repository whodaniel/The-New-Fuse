import { writeFileSync } from 'fs';
import { analyzeCodebase } from './analyze-consolidation.js';

interface ConsolidationTask {
  type: 'merge' | 'delete' | 'move' | 'update';
  source: string;
  target?: string;
  priority: 'high' | 'medium' | 'low';
  impact: string[];
  dependencies: string[];
}

async function generateConsolidationPlan(): any {
  const analysis = await analyzeCodebase();
  const tasks: ConsolidationTask[] = [];

  // Identify component consolidation tasks
  for (const [path, component] of analysis.components.entries()) {
    if (analysis.duplicates.has(path)) {
      const originalComponent = findOriginalComponent(component, analysis);
      tasks.push({
        type: 'merge',
        source: path,
        target: originalComponent,
        priority: 'high',
        impact: component.usedBy,
        dependencies: component.dependencies
      });
    }
  }

  // Generate documentation tasks
  const docTasks = generateDocumentationTasks(analysis);
  tasks.push(...docTasks);

  // Generate test coverage tasks
  const testTasks = generateTestTasks(analysis);
  tasks.push(...testTasks);

  return {
    tasks,
    timeline: generateTimeline(tasks),
    riskAssessment: assessRisks(tasks),
    rollbackPlan: generateRollbackPlan(tasks)
  };
}

function generateMarkdownPlan(plan: ReturnType<typeof generateConsolidationPlan>): any {
  return `
# The New Fuse Consolidation Plan

## Overview
Total Components: ${plan.tasks.length}
High Priority Tasks: ${plan.tasks.filter(t => t.priority === 'high').length}
Estimated Timeline: ${plan.timeline.totalDays} days

## Tasks

${plan.tasks.map(task => `
### ${task.type.toUpperCase()}: ${task.source}
- Priority: ${task.priority}
- Target: ${task.target || 'N/A'}
- Impact: ${task.impact.length} components
- Dependencies: ${task.dependencies.length} items
`).join('\n')}

## Risk Assessment
${plan.riskAssessment}

## Rollback Plan
${plan.rollbackPlan}
  `;
}

function findOriginalComponent(
  component: ComponentAnalysis,
  analysis: ReturnType<typeof analyzeCodebase>
): string {
  let mostReferencedPath = component.path;
  let maxReferences = 0;

  for (const [path, comp] of analysis.components.entries()) {
    if (calculateComponentSimilarity(component, comp) > 0.8) {
      const references = comp.usedBy.length;
      if (references > maxReferences) {
        maxReferences = references;
        mostReferencedPath = path;
      }
    }
  }

  return mostReferencedPath;
}

function generateDocumentationTasks(
  analysis: ReturnType<typeof analyzeCodebase>
): ConsolidationTask[] {
  const tasks: ConsolidationTask[] = [];

  for (const [path, component] of analysis.components.entries()) {
    const docPath = path.replace(/\.(tsx?|jsx?)$/, '.md');
    if (!fs.existsSync(docPath)) {
      tasks.push({
        type: 'update',
        source: path,
        target: docPath,
        priority: 'medium',
        impact: ['documentation'],
        dependencies: []
      });
    }
  }

  return tasks;
}

function generateTestTasks(
  analysis: ReturnType<typeof analyzeCodebase>
): ConsolidationTask[] {
  const tasks: ConsolidationTask[] = [];

  for (const [path, component] of analysis.components.entries()) {
    const testPath = path.replace(/\.(tsx?|jsx?)$/, '.test.$1');
    if (!fs.existsSync(testPath)) {
      tasks.push({
        type: 'update',
        source: path,
        target: testPath,
        priority: 'high',
        impact: ['testing'],
        dependencies: []
      });
    }
  }

  return tasks;
}

function generateTimeline(tasks: ConsolidationTask[]): {
  totalDays: number;
  phases: Array<{
    name: string;
    tasks: ConsolidationTask[];
    duration: number;
  }>;
} {
  const phases = [
    {
      name: 'Component Consolidation',
      tasks: tasks.filter(t => t.type === 'merge'),
      duration: 0
    },
    {
      name: 'Documentation Updates',
      tasks: tasks.filter(t => t.impact.includes('documentation')),
      duration: 0
    },
    {
      name: 'Test Coverage',
      tasks: tasks.filter(t => t.impact.includes('testing')),
      duration: 0
    }
  ];

  // Calculate duration for each phase
  phases.forEach(phase => {
    phase.duration = Math.ceil(phase.tasks.length * 0.5); // 0.5 days per task
  });

  return {
    totalDays: phases.reduce((sum, phase) => sum + phase.duration, 0),
    phases
  };
}

function assessRisks(tasks: ConsolidationTask[]): string {
  const risks: string[] = [];

  // Assess component merge risks
  const mergeTasks = tasks.filter(t => t.type === 'merge');
  if (mergeTasks.length > 0) {
    risks.push(`Component merges (${mergeTasks.length} tasks) may cause runtime errors`);
  }

  // Assess documentation risks
  const docTasks = tasks.filter(t => t.impact.includes('documentation'));
  if (docTasks.length > 0) {
    risks.push(`Documentation updates (${docTasks.length} tasks) may become outdated`);
  }

  // Assess test coverage risks
  const testTasks = tasks.filter(t => t.impact.includes('testing'));
  if (testTasks.length > 0) {
    risks.push(`Test coverage (${testTasks.length} tasks) may temporarily decrease`);
  }

  return risks.join('\n');
}

function generateRollbackPlan(tasks: ConsolidationTask[]): string {
  return `
## Rollback Procedures

1. Component Merges
${tasks.filter(t => t.type === 'merge')
  .map(t => `   - Restore ${t.source} from backup`)
  .join('\n')}

2. Documentation Updates
${tasks.filter(t => t.impact.includes('documentation'))
  .map(t => `   - Revert ${t.target} to previous version`)
  .join('\n')}

3. Test Changes
${tasks.filter(t => t.impact.includes('testing'))
  .map(t => `   - Restore ${t.source.replace(/\.tsx?$/, '.test.ts')} from backup`)
  .join('\n')}
`;
}
