/**
 * DACC Schema Validation Utilities
 */
import { StreamEventType, ParseStrategy } from './enums';
/**
 * Validate AgentDefinition schema
 */
export function validateAgentDefinition(agent) {
    const errors = [];
    if (!agent || typeof agent !== 'object') {
        return { isValid: false, errors: ['Agent definition must be an object'] };
    }
    // Required fields
    if (!agent.agent_name || typeof agent.agent_name !== 'string') {
        errors.push('agent_name is required and must be a string');
    }
    if (!agent.description || typeof agent.description !== 'string') {
        errors.push('description is required and must be a string');
    }
    if (!agent.persona || typeof agent.persona !== 'string') {
        errors.push('persona is required and must be a string');
    }
    if (!agent.output_schema_code || typeof agent.output_schema_code !== 'string') {
        errors.push('output_schema_code is required and must be a string');
    }
    if (!agent.parsing_grammar || typeof agent.parsing_grammar !== 'string') {
        errors.push('parsing_grammar is required and must be a string');
    }
    // Optional parsing_strategy validation
    if (agent.parsing_strategy && !Object.values(ParseStrategy).includes(agent.parsing_strategy)) {
        errors.push(`parsing_strategy must be one of: ${Object.values(ParseStrategy).join(', ')}`);
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Validate WorkflowDefinition schema
 */
export function validateWorkflowDefinition(workflow) {
    const errors = [];
    if (!workflow || typeof workflow !== 'object') {
        return { isValid: false, errors: ['Workflow definition must be an object'] };
    }
    // Required fields
    if (!workflow.workflow_name || typeof workflow.workflow_name !== 'string') {
        errors.push('workflow_name is required and must be a string');
    }
    if (!workflow.description || typeof workflow.description !== 'string') {
        errors.push('description is required and must be a string');
    }
    if (!workflow.start_step || typeof workflow.start_step !== 'string') {
        errors.push('start_step is required and must be a string');
    }
    if (!Array.isArray(workflow.steps)) {
        errors.push('steps must be an array');
    }
    else {
        // Validate each step
        workflow.steps.forEach((step, index) => {
            const stepErrors = validateWorkflowStep(step);
            if (!stepErrors.isValid) {
                errors.push(`Step ${index}: ${stepErrors.errors.join(', ')}`);
            }
        });
        // Validate start_step exists
        const stepNames = workflow.steps.map((s) => s.step_name);
        if (!stepNames.includes(workflow.start_step)) {
            errors.push(`start_step "${workflow.start_step}" does not exist in steps`);
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Validate WorkflowStep schema
 */
export function validateWorkflowStep(step) {
    const errors = [];
    if (!step || typeof step !== 'object') {
        return { isValid: false, errors: ['Workflow step must be an object'] };
    }
    // Required fields
    if (!step.step_name || typeof step.step_name !== 'string') {
        errors.push('step_name is required and must be a string');
    }
    if (!step.agent_name || typeof step.agent_name !== 'string') {
        errors.push('agent_name is required and must be a string');
    }
    // Optional fields validation
    if (step.input_mapping && typeof step.input_mapping !== 'object') {
        errors.push('input_mapping must be an object');
    }
    if (step.next_steps && !Array.isArray(step.next_steps)) {
        errors.push('next_steps must be an array');
    }
    if (step.default_next_step && typeof step.default_next_step !== 'string') {
        errors.push('default_next_step must be a string');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Validate SystemBlueprint schema
 */
export function validateSystemBlueprint(blueprint) {
    const errors = [];
    if (!blueprint || typeof blueprint !== 'object') {
        return { isValid: false, errors: ['System blueprint must be an object'] };
    }
    // Validate new_agents_to_create
    if (!Array.isArray(blueprint.new_agents_to_create)) {
        errors.push('new_agents_to_create must be an array');
    }
    else {
        blueprint.new_agents_to_create.forEach((agent, index) => {
            const agentErrors = validateAgentDefinition(agent);
            if (!agentErrors.isValid) {
                errors.push(`Agent ${index}: ${agentErrors.errors.join(', ')}`);
            }
        });
    }
    // Validate workflow
    if (!blueprint.workflow) {
        errors.push('workflow is required');
    }
    else {
        const workflowErrors = validateWorkflowDefinition(blueprint.workflow);
        if (!workflowErrors.isValid) {
            errors.push(`Workflow: ${workflowErrors.errors.join(', ')}`);
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Validate StreamPacket schema
 */
export function validateStreamPacket(packet) {
    const errors = [];
    if (!packet || typeof packet !== 'object') {
        return { isValid: false, errors: ['Stream packet must be an object'] };
    }
    // Required fields
    if (!Object.values(StreamEventType).includes(packet.event_type)) {
        errors.push(`event_type must be one of: ${Object.values(StreamEventType).join(', ')}`);
    }
    if (!packet.data || typeof packet.data !== 'object') {
        errors.push('data is required and must be an object');
    }
    if (!packet.step_name || typeof packet.step_name !== 'string') {
        errors.push('step_name is required and must be a string');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Validate that all workflow step references exist
 */
export function validateWorkflowReferences(workflow) {
    const errors = [];
    const warnings = [];
    const stepNames = workflow.steps.map(s => s.step_name);
    workflow.steps.forEach(step => {
        // Check default_next_step references
        if (step.default_next_step && !stepNames.includes(step.default_next_step)) {
            errors.push(`Step "${step.step_name}" references non-existent default_next_step "${step.default_next_step}"`);
        }
        // Check conditional next steps
        if (step.next_steps) {
            step.next_steps.forEach(nextStep => {
                if (!stepNames.includes(nextStep.next_step_name)) {
                    errors.push(`Step "${step.step_name}" references non-existent next_step_name "${nextStep.next_step_name}"`);
                }
            });
        }
        // Warn about steps with no next steps (potential end steps)
        if (!step.default_next_step && (!step.next_steps || step.next_steps.length === 0)) {
            warnings.push(`Step "${step.step_name}" has no next steps - may be an end step`);
        }
    });
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
//# sourceMappingURL=validation.js.map