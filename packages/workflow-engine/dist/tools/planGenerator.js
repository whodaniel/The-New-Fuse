"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanGenerator = exports.WorkflowPlanSchema = void 0;
const zod_1 = require("zod");
exports.WorkflowPlanSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    phases: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        description: zod_1.z.string(),
        tasks: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            title: zod_1.z.string(),
            description: zod_1.z.string().optional(),
            assignee: zod_1.z.string().optional(),
            dependencies: zod_1.z.array(zod_1.z.string()).default([]),
            status: zod_1.z.enum(['pending', 'in_progress', 'completed', 'blocked']).default('pending'),
            acceptance: zod_1.z.string().optional(),
        })),
        gate: zod_1.z.object({
            criteria: zod_1.z.array(zod_1.z.string()),
            approvedBy: zod_1.z.string().optional(),
        }).optional(),
    })),
    status: zod_1.z.enum(['draft', 'active', 'completed', 'cancelled']).default('draft'),
    createdAt: zod_1.z.string().default(() => new Date().toISOString()),
    updatedAt: zod_1.z.string().default(() => new Date().toISOString()),
});
class PlanGenerator {
    generateIterativePlan(params) {
        const planId = crypto.randomUUID();
        const { featureName, description, constraints = [] } = params;
        return exports.WorkflowPlanSchema.parse({
            id: planId,
            title: `Iterative Plan: ${featureName}`,
            description,
            phases: [
                {
                    id: `${planId}-discovery`,
                    name: 'Discovery & Research',
                    description: `Understand requirements and existing code for ${featureName}`,
                    tasks: [
                        { id: `${planId}-d1`, title: 'Audit existing implementation', description: `Search codebase for existing ${featureName} code` },
                        { id: `${planId}-d2`, title: 'Document requirements', description: 'Clarify scope, acceptance criteria, and constraints' },
                        { id: `${planId}-d3`, title: 'Identify integration points', description: 'Map dependencies and affected packages' },
                    ],
                    gate: { criteria: ['Requirements documented', 'Integration points mapped'] },
                },
                {
                    id: `${planId}-implementation`,
                    name: 'Implementation',
                    description: `Build ${featureName} incrementally`,
                    tasks: [
                        { id: `${planId}-i1`, title: 'Implement core logic', description: `Core ${featureName} functionality`, dependencies: [`${planId}-d2`] },
                        { id: `${planId}-i2`, title: 'Add tests', description: 'Unit and integration tests', dependencies: [`${planId}-i1`] },
                        { id: `${planId}-i3`, title: 'Wire into existing system', description: 'Connect to relay, API, or workflow engine', dependencies: [`${planId}-i1`, `${planId}-d3`] },
                    ],
                    gate: { criteria: ['Core logic passes tests', 'Integration verified'] },
                },
                {
                    id: `${planId}-validation`,
                    name: 'Validation & Hardening',
                    description: `Verify ${featureName} meets acceptance criteria`,
                    tasks: [
                        { id: `${planId}-v1`, title: 'End-to-end validation', description: 'Verify full workflow against acceptance criteria', dependencies: [`${planId}-i3`] },
                        { id: `${planId}-v2`, title: 'Security review', description: 'Check for PII leaks, auth gaps, input validation', dependencies: [`${planId}-i3`] },
                        { id: `${planId}-v3`, title: 'Performance check', description: 'Benchmark under load if applicable', dependencies: [`${planId}-i3`] },
                    ],
                    gate: { criteria: ['All acceptance criteria met', 'Security scan clean', 'No regressions'] },
                },
            ],
            constraints,
        });
    }
    generateWorkflowYAML(plan) {
        const lines = [
            `name: ${plan.title}`,
            `id: ${plan.id}`,
            `status: ${plan.status}`,
            `created_at: ${plan.createdAt}`,
            '',
            'phases:',
        ];
        for (const phase of plan.phases) {
            lines.push(`  - id: ${phase.id}`);
            lines.push(`    name: ${phase.name}`);
            lines.push(`    description: "${phase.description}"`);
            lines.push('    tasks:');
            for (const task of phase.tasks) {
                lines.push(`      - id: ${task.id}`);
                lines.push(`        title: "${task.title}"`);
                if (task.description)
                    lines.push(`        description: "${task.description}"`);
                if (task.dependencies.length)
                    lines.push(`        depends_on: [${task.dependencies.join(', ')}]`);
                lines.push(`        status: ${task.status}`);
            }
            if (phase.gate) {
                lines.push('    gate:');
                lines.push(`      criteria: [${phase.gate.criteria.map((c) => `"${c}"`).join(', ')}]`);
            }
            lines.push('');
        }
        return lines.join('\n');
    }
}
exports.PlanGenerator = PlanGenerator;
//# sourceMappingURL=planGenerator.js.map