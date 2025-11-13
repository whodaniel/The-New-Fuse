// Hierarchical command exports
export * from './base.js';
export * from './dev.js';
export * from './run.js';
export * from './agent.js';
export * from './workflow.js';
export * from './infra.js';
export * from './deploy.js';
export * from './monitor.js';
export * from './security.js';
export * from './scale.js';
export * from './ops.js';
export * from './mcp.js';
// Registration functions for easy importing
import { registerDevCommands } from './dev.js';
import { registerRunCommands } from './run.js';
import { registerAgentCommands } from './agent.js';
import { registerWorkflowCommands } from './workflow.js';
import { registerInfraCommands } from './infra.js';
import { registerDeployCommands } from './deploy.js';
import { registerMonitorCommands } from './monitor.js';
import { registerSecurityCommands } from './security.js';
import { registerScaleCommands } from './scale.js';
import { registerOpsCommands } from './ops.js';
import { registerMCPCommands } from './mcp.js';
/**
 * Register all hierarchical commands with the main CLI program
 */
export function registerHierarchicalCommands(program) {
    console.log('Registering hierarchical commands...');
    // Register all ten category commands
    const devCommand = registerDevCommands(program);
    const runCommand = registerRunCommands(program);
    const agentCommand = registerAgentCommands(program);
    const workflowCommand = registerWorkflowCommands(program);
    const infraCommand = registerInfraCommands(program);
    const deployCommand = registerDeployCommands(program);
    const monitorCommand = registerMonitorCommands(program);
    const securityCommand = registerSecurityCommands(program);
    const scaleCommand = registerScaleCommands(program);
    const opsCommand = registerOpsCommands(program);
    const mcpCommand = registerMCPCommands(program);
    program.addCommand(devCommand);
    program.addCommand(runCommand);
    program.addCommand(agentCommand);
    program.addCommand(workflowCommand);
    program.addCommand(infraCommand);
    program.addCommand(deployCommand);
    program.addCommand(monitorCommand);
    program.addCommand(securityCommand);
    program.addCommand(scaleCommand);
    program.addCommand(opsCommand);
    program.addCommand(mcpCommand);
    console.log('Hierarchical commands registered successfully');
}
/**
 * Get all available hierarchical command categories
 */
export function getHierarchicalCategories() {
    return ['dev', 'run', 'agent', 'workflow', 'infra', 'deploy', 'monitor', 'security', 'scale', 'ops'];
}
/**
 * Get available subcommands for a specific category
 */
export function getCategorySubcommands(category) {
    const subcommands = {
        dev: ['build', 'test', 'lint', 'type-check', 'serve', 'clean', 'init'],
        run: ['start', 'stop', 'restart', 'status', 'logs', 'health'],
        agent: ['list', 'run', 'create', 'update', 'delete', 'status', 'logs', 'config', 'federate'],
        workflow: ['list', 'create', 'run', 'stop', 'status', 'logs', 'update', 'delete', 'template'],
        infra: ['status', 'provision', 'teardown', 'scale', 'backup', 'restore', 'monitor', 'config'],
        deploy: ['package', 'publish', 'rollback', 'promote', 'status', 'logs', 'config', 'validate'],
        monitor: ['status', 'metrics', 'alerts', 'logs', 'traces', 'dashboard', 'config', 'health'],
        security: ['audit', 'scan', 'policy', 'access', 'encrypt', 'decrypt', 'keys', 'compliance', 'incident'],
        scale: ['status', 'auto', 'manual', 'policy', 'loadbalancer', 'thresholds', 'history', 'simulate'],
        ops: ['backup', 'restore', 'maintenance', 'migration', 'cleanup', 'reports', 'alerts', 'dashboard']
    };
    return subcommands[category] || [];
}
//# sourceMappingURL=index.js.map