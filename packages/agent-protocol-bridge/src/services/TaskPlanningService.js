"use strict";
/**
 * TaskPlanningService.ts
 *
 * Traycer-style task planning and plan generation service.
 * Converts user intent into detailed, step-by-step implementation plans.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskPlanningService = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
class TaskPlanningService extends events_1.EventEmitter {
    plans = new Map();
    comments = new Map();
    constructor() {
        super();
    }
    /**
     * Generate a comprehensive plan from user intent
     */
    async generatePlan(userIntent, context, options = {
        analysisDepth: 'comprehensive',
        includeVerification: true,
        includeTesting: true,
        riskTolerance: 'moderate'
    }) {
        const planId = (0, uuid_1.v4)();
        // Create initial plan structure
        const plan = {
            id: planId,
            title: this.generatePlanTitle(userIntent),
            description: userIntent,
            userIntent,
            status: 'planning',
            steps: [],
            context,
            riskLevel: 'medium',
            assignedAgents: [],
            history: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.plans.set(planId, plan);
        this.comments.set(planId, []);
        try {
            // Analyze the user intent and context
            const analysis = await this.analyzeUserIntent(userIntent, context, options);
            // Generate step-by-step plan
            const steps = await this.generatePlanSteps(analysis, context, options);
            // Calculate risk level and estimates
            const riskLevel = this.calculateRiskLevel(steps, context);
            const estimatedDuration = this.calculateEstimatedDuration(steps);
            // Update plan with generated content
            plan.steps = steps;
            plan.riskLevel = riskLevel;
            plan.estimatedDuration = estimatedDuration;
            plan.status = 'plan_generated';
            plan.updatedAt = new Date();
            // Add to history
            this.addHistoryEntry(plan, 'created', 'Plan generated from user intent', { userIntent, stepsCount: steps.length });
            this.emit('planGenerated', plan);
            return plan;
        }
        catch (error) {
            plan.status = 'failed';
            plan.updatedAt = new Date();
            this.addHistoryEntry(plan, 'updated', 'Plan generation failed', { error: error.message });
            throw error;
        }
    }
    /**
     * Update an existing plan with modifications
     */
    async updatePlan(planId, updates) {
        const plan = this.plans.get(planId);
        if (!plan) {
            throw new Error(`Plan not found: ${planId});
    }

    const originalPlan = { ...plan };

    // Apply updates
    Object.assign(plan, updates, {
      updatedAt: new Date(),
      id: planId // Prevent ID from being overwritten
    });

    // Recalculate derived fields if steps were updated
    if (updates.steps) {
      plan.riskLevel = this.calculateRiskLevel(plan.steps, plan.context);
      plan.estimatedDuration = this.calculateEstimatedDuration(plan.steps);
    }

    this.addHistoryEntry(plan, 'updated', 'Plan updated', { changes: this.getChanges(originalPlan, plan) });
    this.emit('planUpdated', plan);

    return plan;
  }

  /**
   * Add a new step to an existing plan
   */
  async addPlanStep(planId: string, step: Omit<PlanStep, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlanStep> {
    const plan = this.plans.get(planId);
    if (!plan) {`);
            throw new Error(`Plan not found: ${planId}`);
        }
        const newStep = {
            ...step,
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        plan.steps.push(newStep);
        plan.updatedAt = new Date();
        // Recalculate estimates
        plan.estimatedDuration = this.calculateEstimatedDuration(plan.steps);
        plan.riskLevel = this.calculateRiskLevel(plan.steps, plan.context);
        this.addHistoryEntry(plan, 'step_added', Added, step, $, { newStep, : .title }, { stepId: newStep.id });
        this.emit('stepAdded', { plan, step: newStep });
        return newStep;
    }
    /**
     * Update a specific step in a plan
     */
    async updatePlanStep(planId, stepId, updates) {
        const plan = this.plans.get(planId);
        if (!plan) {
            `
      throw new Error(Plan not found: ${planId}`;
            ;
        }
        const stepIndex = plan.steps.findIndex(s => s.id === stepId);
        if (stepIndex === -1) {
            throw new Error(Step, not, found, $, { stepId });
        }
        const step = plan.steps[stepIndex];
        const originalStep = { ...step };
        Object.assign(step, updates, {
            updatedAt: new Date(),
            id: stepId
        });
        `
    plan.updatedAt = new Date();`;
        this.addHistoryEntry(plan, 'updated', Updated, step, $, { step, : .title } `, {
      stepId,
      changes: this.getChanges(originalStep, step)
    });

    this.emit('stepUpdated', { plan, step });

    return step;
  }

  /**
   * Mark a step as completed
   */
  async completeStep(planId: string, stepId: string, result?: any): Promise<void> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(Plan not found: ${planId});
    }
`);
        const step = plan.steps.find(s => s.id === stepId);
        `
    if (!step) {
      throw new Error(Step not found: ${stepId}`;
        ;
    }
    step;
    status = 'completed';
    step;
    updatedAt = new Date();
    if(result) {
        step.metadata = { ...step.metadata, result };
    }
    plan;
    updatedAt = new Date();
}
exports.TaskPlanningService = TaskPlanningService;
this.addHistoryEntry(plan, 'step_completed', Completed, step, $, { step, : .title }, { stepId, result });
this.emit('stepCompleted', { plan, step, result });
// Check if all steps are completed
this.checkPlanCompletion(plan);
/**
 * Assign an agent to a plan or specific step
 */
async;
assignAgent(planId, string, agentId, string, stepId ?  : string);
Promise < void  > {} `
    const plan = this.plans.get(planId);`;
if (!plan) {
    throw new Error(Plan, not, found, $, { planId } `);
    }

    if (stepId) {
      // Assign to specific step
      const step = plan.steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error(Step not found: ${stepId}`);
}
step.assignedAgent = agentId;
step.updatedAt = new Date();
this.addHistoryEntry(plan, 'agent_assigned', Assigned, agent, $, { agentId }, to, step, $, { step, : .title }, {
    agentId,
    stepId
});
{
    // Assign to entire plan
    if (!plan.assignedAgents.includes(agentId)) {
        plan.assignedAgents.push(agentId);
    }
    `
      this.addHistoryEntry(plan, 'agent_assigned', Assigned agent ${agentId} to plan`, { agentId };
    ;
}
plan.updatedAt = new Date();
this.emit('agentAssigned', { plan, agentId, stepId });
/**
 * Add a comment to a plan or specific step
 */
async;
addComment(comment, (Omit));
Promise < PlanComment > {
    const: newComment, PlanComment = {
        ...comment,
        id: (0, uuid_1.v4)(),
        createdAt: new Date()
    },
    const: planComments = this.comments.get(comment.planId) || [],
    planComments, : .push(newComment),
    this: .comments.set(comment.planId, planComments),
    const: plan = this.plans.get(comment.planId),
    if(plan) {
        this.addHistoryEntry(plan, 'comment_added', Comment, added, $, { comment, : .type } `, {
        commentId: newComment.id,
        stepId: comment.stepId
      });
    }

    this.emit('commentAdded', newComment);
    return newComment;
  }

  /**
   * Get all comments for a plan
   */
  getComments(planId: string, stepId?: string): PlanComment[] {
    const comments = this.comments.get(planId) || [];

    if (stepId) {
      return comments.filter(c => c.stepId === stepId);
    }

    return comments;
  }

  /**
   * Get a specific plan
   */
  getPlan(planId: string): TaskPlan | undefined {
    return this.plans.get(planId);
  }

  /**
   * Get all plans
   */
  getAllPlans(): TaskPlan[] {
    return Array.from(this.plans.values());
  }

  /**
   * Get plans by status
   */
  getPlansByStatus(status: TaskPlan['status']): TaskPlan[] {
    return Array.from(this.plans.values()).filter(p => p.status === status);
  }

  /**
   * Delete a plan
   */
  async deletePlan(planId: string): Promise<void> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(Plan not found: ${planId});
    }

    this.plans.delete(planId);
    this.comments.delete(planId);

    this.emit('planDeleted', { planId, plan });
  }

  /**
   * Private helper methods
   */
  private async analyzeUserIntent(
    userIntent: string,
    context: PlanContext,
    options: PlanGenerationOptions
  ): Promise<any> {
    // This would typically use AI/LLM to analyze the intent
    // For now, we'll do basic analysis

    const analysis = {
      complexity: this.analyzeComplexity(userIntent, context),
      scope: this.analyzeScope(userIntent, context),
      riskFactors: this.analyzeRiskFactors(userIntent, context),
      requiredCapabilities: this.extractRequiredCapabilities(userIntent),
      affectedFiles: this.identifyAffectedFiles(userIntent, context),
      dependencies: this.identifyDependencies(userIntent, context)
    };

    return analysis;
  }

  private async generatePlanSteps(
    analysis: any,
    context: PlanContext,
    options: PlanGenerationOptions
  ): Promise<PlanStep[]> {
    const steps: PlanStep[] = [];

    // Analysis phase
    if (options.analysisDepth !== 'basic') {
      steps.push({
        id: uuidv4(),
        title: 'Code Analysis',
        description: 'Analyze existing codebase and understand current implementation',
        type: 'analysis',
        status: 'pending',
        priority: 'high',
        estimatedDuration: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Implementation steps based on analysis
    if (analysis.affectedFiles.length > 0) {
      for (const file of analysis.affectedFiles) {
        steps.push({
          id: uuidv4(),`, title, Update, $, { file } `,
          description: Modify ${file} according to requirements`, type, 'file_change', status, 'pending', priority, 'medium', estimatedDuration, 30, fileChanges, [{
                path: file,
                operation: 'modify',
                description: Update, $
            }, { file }, implementation `
          }],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Verification steps
    if (options.includeVerification) {
      steps.push({
        id: uuidv4(),
        title: 'Verify Implementation',
        description: 'Verify that changes work as expected',
        type: 'verification',
        status: 'pending',
        priority: 'high',
        estimatedDuration: 20,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Testing steps
    if (options.includeTesting) {
      steps.push({
        id: uuidv4(),
        title: 'Run Tests',
        description: 'Execute test suite to ensure no regressions',
        type: 'testing',
        status: 'pending',
        priority: 'high',
        estimatedDuration: 25,
        commands: ['npm test', 'pnpm run lint'],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return steps;
  }

  private generatePlanTitle(userIntent: string): string {
    // Extract a concise title from user intent
    const words = userIntent.split(' ').slice(0, 8);
    return words.join(' ') + (userIntent.split(' ').length > 8 ? '...' : '');
  }

  private calculateRiskLevel(steps: PlanStep[], context: PlanContext): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // File change risk
    const fileChangeSteps = steps.filter(s => s.type === 'file_change').length;
    riskScore += fileChangeSteps * 1;

    // Codebase complexity risk
    if (context.codebase?.complexity === 'high') riskScore += 3;
    if (context.codebase?.complexity === 'medium') riskScore += 1;

    // Size risk
    if (context.codebase?.size === 'large') riskScore += 2;
    if (context.codebase?.size === 'medium') riskScore += 1;

    if (riskScore >= 8) return 'high';
    if (riskScore >= 4) return 'medium';
    return 'low';
  }

  private calculateEstimatedDuration(steps: PlanStep[]): number {
    return steps.reduce((total, step) => total + (step.estimatedDuration || 30), 0);
  }

  private analyzeComplexity(userIntent: string, context: PlanContext): 'low' | 'medium' | 'high' {
    // Simple heuristics for complexity analysis
    const complexityIndicators = ['refactor', 'architecture', 'database', 'api', 'integration'];
    const hasComplexTerms = complexityIndicators.some(term =>
      userIntent.toLowerCase().includes(term)
    );

    if (hasComplexTerms || context.files.length > 10) return 'high';
    if (context.files.length > 3) return 'medium';
    return 'low';
  }

  private analyzeScope(userIntent: string, context: PlanContext): string {
    if (context.files.length > 10) return 'large';
    if (context.files.length > 3) return 'medium';
    return 'small';
  }

  private analyzeRiskFactors(userIntent: string, context: PlanContext): string[] {
    const riskFactors = [];

    if (userIntent.toLowerCase().includes('delete')) riskFactors.push('data_loss');
    if (userIntent.toLowerCase().includes('database')) riskFactors.push('database_changes');
    if (userIntent.toLowerCase().includes('api')) riskFactors.push('breaking_changes');
    if (context.codebase?.complexity === 'high') riskFactors.push('code_complexity');

    return riskFactors;
  }

  private extractRequiredCapabilities(userIntent: string): string[] {
    const capabilities = [];

    if (userIntent.toLowerCase().includes('test')) capabilities.push('testing');
    if (userIntent.toLowerCase().includes('deploy')) capabilities.push('deployment');
    if (userIntent.toLowerCase().includes('api')) capabilities.push('api_development');
    if (userIntent.toLowerCase().includes('ui')) capabilities.push('frontend_development');

    return capabilities;
  }

  private identifyAffectedFiles(userIntent: string, context: PlanContext): string[] {
    // Simple pattern matching for file identification
    // In a real implementation, this would use more sophisticated analysis
    return context.files.filter(file =>
      userIntent.toLowerCase().includes(file.toLowerCase().split('/').pop()?.split('.')[0] || '')
    );
  }

  private identifyDependencies(userIntent: string, context: PlanContext): string[] {
    // Identify potential dependencies based on intent and context
    const dependencies = [];

    if (userIntent.toLowerCase().includes('test')) dependencies.push('implementation');
    if (userIntent.toLowerCase().includes('deploy')) dependencies.push('testing');

    return dependencies;
  }

  private addHistoryEntry(plan: TaskPlan, action: PlanHistoryEntry['action'], description: string, data?: any): void {
    const entry: PlanHistoryEntry = {
      id: uuidv4(),
      action,
      description,
      data,
      timestamp: new Date()
    };

    plan.history.push(entry);
  }

  private getChanges(original: any, updated: any): Record<string, any> {
    const changes: Record<string, any> = {};

    for (const key in updated) {
      if (original[key] !== updated[key]) {
        changes[key] = { from: original[key], to: updated[key] };
      }
    }

    return changes;
  }

  private checkPlanCompletion(plan: TaskPlan): void {
    const allCompleted = plan.steps.every(step =>
      step.status === 'completed' || step.status === 'skipped'
    );

    if (allCompleted && plan.status !== 'completed') {
      plan.status = 'completed';
      plan.completedAt = new Date();
      plan.updatedAt = new Date();

      // Calculate actual duration
      if (plan.createdAt && plan.completedAt) {
        plan.actualDuration = Math.round(
          (plan.completedAt.getTime() - plan.createdAt.getTime()) / (1000 * 60)
        );
      }

      this.addHistoryEntry(plan, 'updated', 'Plan completed', {
        completedSteps: plan.steps.length,
        actualDuration: plan.actualDuration
      });

      this.emit('planCompleted', plan);
    }
  }
}]);
    }
};
//# sourceMappingURL=TaskPlanningService.js.map