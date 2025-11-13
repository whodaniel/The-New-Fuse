"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleCognitiveAgent = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../../services/LoggingService");
let SimpleCognitiveAgent = class SimpleCognitiveAgent {
    logger;
    active_tasks = new Map();
    completed_tasks = new Map();
    constructor(logger) {
        this.logger = logger;
        this.logger.log('SimpleCognitiveAgent initialized', 'SimpleCognitiveAgent');
    }
    /**
     * Process a cognitive task with basic reasoning
     */
    async processCognitiveTask(task) {
        const start_time = Date.now();
        this.logger.log(`Processing cognitive task: ${task.type}, 'SimpleCognitiveAgent');
    
    this.active_tasks.set(task.id, task);
    
    // Simple processing based on task type
    let solution: string;
    let confidence: number;
    
    switch (task.type) {
      case 'problem_solving':`, solution = `Solution for: ${task.description}`);
        confidence = 0.7;
        break;
        'decision_making';
        solution = Decision;
        Proceed;
        with ($) {
            task.description;
        }
        ;
        confidence = 0.8;
        break;
        'planning';
        `
        solution = Plan: Step-by-step approach for ${task.description}`;
        confidence = 0.6;
        break;
        'analysis';
        solution = Analysis;
        Key;
        insights;
        from;
        $;
        {
            task.description;
        }
        ;
        confidence = 0.75;
        `
        break;`;
    }
    default = Generic;
    response;
};
exports.SimpleCognitiveAgent = SimpleCognitiveAgent;
exports.SimpleCognitiveAgent = SimpleCognitiveAgent = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService])
], SimpleCognitiveAgent);
for ($; { task, : .description } `;
        confidence = 0.5;
    }
    
    const result: CognitiveResult = {
      task_id: task.id,
      solution,
      confidence,
      execution_time: Date.now() - start_time
    };
    
    this.completed_tasks.set(task.id, result);
    this.active_tasks.delete(task.id);
    
    this.logger.log(Cognitive task completed: ${task.id}`, 'SimpleCognitiveAgent';)
    ;
return result;
/**
 * Get cognitive statistics
 */
getCognitiveStats();
object;
{
    return {
        active_tasks: this.active_tasks.size,
        completed_tasks: this.completed_tasks.size,
        agent_type: 'simple_cognitive'
    };
}
/**
 * Get completed tasks
 */
getCompletedTasks();
CognitiveResult[];
{
    return Array.from(this.completed_tasks.values());
}
exports.default = SimpleCognitiveAgent;
//# sourceMappingURL=simple_cognitive_agent.js.map