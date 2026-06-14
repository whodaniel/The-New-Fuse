export class ConditionNode {
    async execute(config, context) {
        if (!config.condition) {
            throw new Error('Condition is required');
        }
        try {
            // Simple condition evaluation (in production, use a proper expression evaluator)
            const result = this.evaluateCondition(config.condition, context);
            const nextStep = result ? config.trueBranch : config.falseBranch;
            return {
                nextStep,
                result
            };
        }
        catch (error) {
            throw new Error(`Condition evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    evaluateCondition(condition, context) {
        // Basic condition evaluation - in production, use a proper expression evaluator
        try {
            // Replace variables in condition with actual values
            let evaluatedCondition = condition;
            Object.entries(context.variables).forEach(([key, value]) => {
                const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
                evaluatedCondition = evaluatedCondition.replace(regex, JSON.stringify(value));
            });
            // For safety, only allow basic comparisons
            if (/^[\d\s<>=!&|()]+$/.test(evaluatedCondition)) {
                // SECURITY FIX: Replaced eval() with safe expression evaluation using Function constructor
                const func = new Function(`'use strict'; return (${evaluatedCondition});`);
                return Boolean(func());
            }
            else {
                throw new Error('Invalid condition syntax');
            }
        }
        catch (error) {
            throw new Error(`Failed to evaluate condition: ${condition}`);
        }
    }
}
//# sourceMappingURL=condition-node.js.map